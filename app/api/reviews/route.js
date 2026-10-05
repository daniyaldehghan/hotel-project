import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import ConnectDB from "@/utils/ConnectDB";
import Review from "@/models/Review";
import { validateReview } from "@/lib/review";
import { authOptions } from "../auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  API نظرات کاربران
  ────────────────────────────────────────────────────────────
  POST   /api/reviews                  ثبت نظر جدید (عمومی)  → وضعیت «pending»
  GET    /api/reviews?limit=6          نظرهای تأییدشده برای نمایش در سایت (عمومی)
  GET    /api/reviews?status=pending   لیست برای پنل مدیریت (فقط ادمین)  | status = pending یا approved یا all
  PATCH  /api/reviews                  { id }  تأیید نظر (فقط ادمین)
  DELETE /api/reviews?id=...           رد / حذف نظر (فقط ادمین) → از دیتابیس پاک می‌شود
*/

// ── محدودیت ارسال: هر IP در ۱۰ دقیقه حداکثر ۳ نظر (در حافظه‌ی سرور؛ برای جلوگیری از اسپم ساده) ──
const WINDOW = 10 * 60 * 1000, MAX = 3;
const hits = (globalThis._reviewHits ||= new Map());
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  if (list.length >= MAX) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW)) hits.delete(k);
  return false;
}
const ipOf = (req) => (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function adminSession() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN" ? session : null;
}

// آنچه به عموم نشان داده می‌شود (ایمیل و اطلاعات داخلی هرگز بیرون نمی‌رود)
const publicShape = (r) => ({ id: String(r._id), name: r.name, trip: r.trip || "", rating: r.rating, text: r.text, createdAt: r.createdAt });
const adminShape = (r) => ({ ...publicShape(r), status: r.status, userEmail: r.userEmail || "" });

// ───────── ثبت نظر (عمومی) ─────────
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  if (!body || typeof body !== "object") return json({ error: "درخواست نامعتبر است." }, 400);

  // فیلد مخفی «website»: آدم نمی‌بیند، ربات‌ها پر می‌کنند. موفق نشان می‌دهیم ولی ذخیره نمی‌کنیم.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true }, 201);

  const { ok, errors, data } = validateReview(body);
  if (!ok) return json({ error: "اطلاعات فرم را بررسی کن.", errors }, 422);

  if (limited(ipOf(req))) return json({ error: "تعداد نظرها زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن." }, 429);

  if (!process.env.MONGODB_URI) {
    console.error("reviews: MONGODB_URI در فایل .env تنظیم نشده است.");
    return json({ error: "سرور هنوز به پایگاه‌داده وصل نیست." }, 503);
  }

  try {
    await ConnectDB();
    const session = await getServerSession(authOptions); // اگر کاربر وارد شده باشد ایمیلش برای پیگیری ذخیره می‌شود
    await Review.create({ ...data, status: "pending", userEmail: session?.user?.email || "" });
    return json({ ok: true }, 201);
  } catch (e) {
    console.error("reviews POST error:", e?.message);
    return json({ error: "مشکلی در سرور رخ داده است. کمی بعد دوباره امتحان کن." }, 500);
  }
}

// ───────── خواندن نظرها ─────────
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status");

  try {
    // پنل مدیریت
    if (status) {
      if (!(await adminSession())) return json({ error: "دسترسی نداری." }, 403);
      await ConnectDB();
      const filter = ["pending", "approved"].includes(status) ? { status } : {};
      const [items, pending, approved] = await Promise.all([
        Review.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
        Review.countDocuments({ status: "pending" }),
        Review.countDocuments({ status: "approved" }),
      ]);
      return json({ items: items.map(adminShape), counts: { pending, approved } });
    }

    // سایت: فقط تأییدشده‌ها
    await ConnectDB();
    const limit = Math.min(24, Math.max(1, parseInt(sp.get("limit")) || 6));
    const items = await Review.find({ status: "approved" }).sort({ createdAt: -1 }).limit(limit).lean();
    return json({ items: items.map(publicShape) });
  } catch (e) {
    console.error("reviews GET error:", e?.message);
    return json({ error: "خطا در خواندن نظرها." }, 500);
  }
}

// ───────── تأیید نظر (فقط ادمین) ─────────
export async function PATCH(req) {
  if (!(await adminSession())) return json({ error: "دسترسی نداری." }, 403);
  let body;
  try { body = await req.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  const id = typeof body?.id === "string" ? body.id : "";
  if (!isValidObjectId(id)) return json({ error: "درخواست نامعتبر است." }, 422);
  try {
    await ConnectDB();
    const doc = await Review.findByIdAndUpdate(id, { status: "approved", approvedAt: new Date() }, { new: true }).lean();
    if (!doc) return json({ error: "نظر پیدا نشد (شاید قبلاً حذف شده)." }, 404);
    return json({ ok: true, item: adminShape(doc) });
  } catch (e) {
    console.error("reviews PATCH error:", e?.message);
    return json({ error: "خطا در تأیید نظر." }, 500);
  }
}

// ───────── رد / حذف نظر (فقط ادمین) ─────────
export async function DELETE(req) {
  if (!(await adminSession())) return json({ error: "دسترسی نداری." }, 403);
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!isValidObjectId(id)) return json({ error: "درخواست نامعتبر است." }, 422);
  try {
    await ConnectDB();
    const doc = await Review.findByIdAndDelete(id).lean();
    if (!doc) return json({ error: "نظر پیدا نشد (شاید قبلاً حذف شده)." }, 404);
    return json({ ok: true });
  } catch (e) {
    console.error("reviews DELETE error:", e?.message);
    return json({ error: "خطا در حذف نظر." }, 500);
  }
}
