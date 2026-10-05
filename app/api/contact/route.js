import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ConnectDB from "@/utils/ConnectDB";
import Contact from "@/models/Contact";
import { STATUSES, normalizeReply, REPLY_LIMITS, validateContact } from "@/lib/contact";
import { verifyCaptcha } from "@/lib/captcha";
import { ipOf, makeLimiter } from "@/lib/rateLimit";
import { authOptions } from "../auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  API تماس با ما
  ────────────────────────────────────────────────────────────
  POST   /api/contact                ثبت پیام جدید (عمومی؛ کپچا لازم است)
  GET    /api/contact?status=&page=  لیست پیام‌ها + شمارنده‌ها (فقط ادمین)
  PATCH  /api/contact                { ticket, reply?, status? } جواب دادن / عوض کردن وضعیت (فقط ادمین)
  ─ پیگیری و سؤال بعدیِ کاربر: /api/contact/track
*/

const limited = makeLimiter("contact", 10 * 60 * 1000, 5); // هر IP در ۱۰ دقیقه حداکثر ۵ پیام

// کد پیگیری تصادفی و غیرقابل حدس: TK-XXXXXX
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newTicket = () => "TK-" + Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join("");

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const isAdmin = async () => (await getServerSession(authOptions))?.user?.role === "ADMIN";

const adminShape = (m) => ({
  ticket: m.ticket, name: m.name, email: m.email, subject: m.subject, message: m.message,
  status: m.status, createdAt: m.createdAt, updatedAt: m.updatedAt,
  replies: (m.replies || []).map((r) => ({ from: r.from, text: r.text, at: r.at })),
});

// ───────── ثبت پیام (عمومی) ─────────
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  if (!body || typeof body !== "object") return json({ error: "درخواست نامعتبر است." }, 400);

  // فیلد مخفی «website»: آدم نمی‌بیند، ربات‌ها پر می‌کنند. موفق نشان می‌دهیم ولی ذخیره نمی‌کنیم.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true, ticket: newTicket() }, 201);

  const { ok, errors, data } = validateContact(body);
  if (typeof body.captchaAnswer !== "string" || !body.captchaAnswer.trim()) errors.captcha = "کد داخل تصویر را وارد کن.";
  if (!ok || errors.captcha) return json({ error: "اطلاعات فرم را بررسی کن.", errors }, 422); // کپچا اینجا هنوز مصرف نشده

  if (limited(ipOf(req))) return json({ error: "تعداد پیام‌ها زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن." }, 429);

  if (!process.env.MONGODB_URI) {
    console.error("contact: MONGODB_URI در فایل .env تنظیم نشده است.");
    return json({ error: "سرور هنوز به پایگاه‌داده وصل نیست." }, 503);
  }

  try {
    await ConnectDB();
    if (!(await verifyCaptcha(body.captchaId, body.captchaAnswer))) {
      return json({ error: "کد امنیتی درست نبود.", errors: { captcha: "کد امنیتی درست نبود؛ با تصویر جدید دوباره امتحان کن." }, captcha: "refresh" }, 422);
    }
    // احتمال برخورد کد پیگیری عملاً صفر است؛ اگر شد یک بار دیگر تلاش می‌کنیم.
    for (let i = 0; i < 3; i++) {
      try {
        const doc = await Contact.create({ ...data, ticket: newTicket() });
        return json({ ok: true, ticket: doc.ticket }, 201);
      } catch (e) {
        if (e?.code !== 11000) throw e;
      }
    }
    return json({ error: "ثبت پیام انجام نشد، دوباره امتحان کن." }, 500);
  } catch (e) {
    console.error("contact POST error:", e?.message);
    return json({ error: "مشکلی در سرور رخ داده است. کمی بعد دوباره امتحان کن." }, 500);
  }
}

// ───────── خواندن پیام‌ها (فقط ادمین) ─────────
export async function GET(req) {
  if (!(await isAdmin())) return json({ error: "دسترسی نداری." }, 403);
  try {
    await ConnectDB();
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");
    const page = Math.max(1, parseInt(sp.get("page")) || 1), size = 20;
    const filter = STATUSES.includes(status) ? { status } : {};
    const [items, total, grouped] = await Promise.all([
      Contact.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * size).limit(size).lean(),
      Contact.countDocuments(filter),
      Contact.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);
    const counts = { new: 0, read: 0, replied: 0, done: 0 };
    for (const g of grouped) if (g._id in counts) counts[g._id] = g.n;
    return json({ items: items.map(adminShape), total, page, pages: Math.ceil(total / size), counts });
  } catch (e) {
    console.error("contact GET error:", e?.message);
    return json({ error: "خطا در خواندن پیام‌ها." }, 500);
  }
}

// ───────── جواب دادن و تغییر وضعیت (فقط ادمین) ─────────
export async function PATCH(req) {
  if (!(await isAdmin())) return json({ error: "دسترسی نداری." }, 403);
  let body;
  try { body = await req.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  const ticket = typeof body?.ticket === "string" ? body.ticket : "";
  const reply = body?.reply == null ? "" : normalizeReply(body.reply);
  if (!ticket) return json({ error: "درخواست نامعتبر است." }, 422);
  if (body?.reply != null && reply.length < REPLY_LIMITS.minText) return json({ error: "متن پاسخ خیلی کوتاه است." }, 422);
  if (body?.status != null && !STATUSES.includes(body.status)) return json({ error: "وضعیت نامعتبر است." }, 422);
  if (!reply && body?.status == null) return json({ error: "درخواست نامعتبر است." }, 422);

  // جواب ادمین، وضعیت را «پاسخ داده شد» می‌کند، مگر خودش وضعیت دیگری مشخص کرده باشد (مثلاً «بسته»).
  const status = body?.status ?? (reply ? "replied" : undefined);
  const update = {};
  if (status) update.$set = { status };
  if (reply) update.$push = { replies: { from: "admin", text: reply, at: new Date() } };
  try {
    await ConnectDB();
    const doc = await Contact.findOneAndUpdate({ ticket }, update, { new: true }).lean();
    if (!doc) return json({ error: "پیام پیدا نشد." }, 404);
    return json({ ok: true, item: adminShape(doc) });
  } catch (e) {
    console.error("contact PATCH error:", e?.message);
    return json({ error: "خطا در به‌روزرسانی." }, 500);
  }
}
