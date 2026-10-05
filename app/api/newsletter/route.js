import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import ConnectDB from "@/utils/ConnectDB";
import Subscriber from "@/models/Subscriber";
import { isEmail, normalizeEmail } from "@/lib/newsletter";
import { verifyCaptcha } from "@/lib/captcha";
import { ipOf, makeLimiter } from "@/lib/rateLimit";
import { authOptions } from "../auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  API خبرنامه («پیشنهادهای ویژه را زودتر ببین»)
  ────────────────────────────────────────────────────────────
  POST   /api/newsletter                   عضویت (عمومی؛ کپچا لازم است)
  GET    /api/newsletter?q=&page=          لیست مشترک‌ها + شمارنده‌ها (فقط ادمین)
  DELETE /api/newsletter?id=...            حذف مشترک از دیتابیس (فقط ادمین)
  ─ لغو عضویت با لینک مخصوص هر مشترک: /api/newsletter/unsubscribe
*/

const limited = makeLimiter("newsletter", 10 * 60 * 1000, 5); // هر IP در ۱۰ دقیقه حداکثر ۵ عضویت
const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const isAdmin = async () => (await getServerSession(authOptions))?.user?.role === "ADMIN";
const adminShape = (s) => ({ id: String(s._id), email: s.email, status: s.status, createdAt: s.createdAt, unsubscribedAt: s.unsubscribedAt || null });

// ───────── عضویت (عمومی) ─────────
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  if (!body || typeof body !== "object") return json({ error: "درخواست نامعتبر است." }, 400);

  // فیلد مخفی «website»: آدم نمی‌بیند، ربات‌ها پر می‌کنند. موفق نشان می‌دهیم ولی ذخیره نمی‌کنیم.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true }, 201);

  const email = normalizeEmail(body.email);
  const errors = {};
  if (!isEmail(email)) errors.email = "ایمیل معتبر وارد کن.";
  if (typeof body.captchaAnswer !== "string" || !body.captchaAnswer.trim()) errors.captcha = "کد داخل تصویر را وارد کن.";
  if (Object.keys(errors).length) return json({ error: "اطلاعات فرم را بررسی کن.", errors }, 422); // کپچا هنوز مصرف نشده

  if (limited(ipOf(req))) return json({ error: "تعداد درخواست‌ها زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن." }, 429);

  if (!process.env.MONGODB_URI) {
    console.error("newsletter: MONGODB_URI در فایل .env تنظیم نشده است.");
    return json({ error: "سرور هنوز به پایگاه‌داده وصل نیست." }, 503);
  }

  try {
    await ConnectDB();
    if (!(await verifyCaptcha(body.captchaId, body.captchaAnswer))) {
      return json({ error: "کد امنیتی درست نبود.", errors: { captcha: "کد امنیتی درست نبود؛ با تصویر جدید دوباره امتحان کن." }, captcha: "refresh" }, 422);
    }
    const session = await getServerSession(authOptions);
    // اتمیک: اگر ایمیل هست دوباره فعالش می‌کنیم، وگرنه می‌سازیم. جواب برای «تازه» و «تکراری» یکی است
    // تا کسی نتواند از روی پاسخ بفهمد یک ایمیل قبلاً عضو بوده یا نه.
    await Subscriber.updateOne(
      { email },
      { $set: { status: "active" }, $unset: { unsubscribedAt: "" }, $setOnInsert: { token: randomBytes(16).toString("hex"), userId: session?.user?.id ? String(session.user.id) : "" } },
      { upsert: true }
    );
    return json({ ok: true }, 201);
  } catch (e) {
    if (e?.code === 11000) return json({ ok: true }, 201); // دو درخواست هم‌زمان با یک ایمیل
    console.error("newsletter POST error:", e?.message);
    return json({ error: "مشکلی در سرور رخ داده است. کمی بعد دوباره امتحان کن." }, 500);
  }
}

// ───────── لیست مشترک‌ها (فقط ادمین) ─────────
export async function GET(req) {
  if (!(await isAdmin())) return json({ error: "دسترسی نداری." }, 403);
  try {
    await ConnectDB();
    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, parseInt(sp.get("page")) || 1), size = 25;
    const status = sp.get("status");
    const q = normalizeEmail(sp.get("q") || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = {};
    if (["active", "unsubscribed"].includes(status)) filter.status = status;
    if (q) filter.email = { $regex: q };
    const wantAll = sp.get("export") === "1"; // برای خروجی CSV: همه‌ی مشترک‌های فعال (تا ۲۰ هزار)
    const [items, total, active, unsubscribed] = await Promise.all([
      wantAll
        ? Subscriber.find({ status: "active" }).sort({ createdAt: -1 }).limit(20000).lean()
        : Subscriber.find(filter).sort({ createdAt: -1 }).skip((page - 1) * size).limit(size).lean(),
      Subscriber.countDocuments(filter),
      Subscriber.countDocuments({ status: "active" }),
      Subscriber.countDocuments({ status: "unsubscribed" }),
    ]);
    return json({ items: items.map(adminShape), total, page, pages: Math.ceil(total / size), counts: { active, unsubscribed } });
  } catch (e) {
    console.error("newsletter GET error:", e?.message);
    return json({ error: "خطا در خواندن مشترک‌ها." }, 500);
  }
}

// ───────── حذف مشترک (فقط ادمین) ─────────
export async function DELETE(req) {
  if (!(await isAdmin())) return json({ error: "دسترسی نداری." }, 403);
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!isValidObjectId(id)) return json({ error: "درخواست نامعتبر است." }, 422);
  try {
    await ConnectDB();
    const r = await Subscriber.deleteOne({ _id: id });
    return r.deletedCount ? json({ ok: true }) : json({ error: "مشترک پیدا نشد (شاید قبلاً حذف شده)." }, 404);
  } catch (e) {
    console.error("newsletter DELETE error:", e?.message);
    return json({ error: "خطا در حذف مشترک." }, 500);
  }
}
