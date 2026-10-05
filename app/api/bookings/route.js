import ConnectDB from "@/utils/ConnectDB";
import Booking from "@/models/Booking";
import { validateBooking, normalizeCode } from "@/lib/bookingRules";
import { addDaysIso, todayIso } from "@/lib/trips";
import { ipOf, makeLimiter } from "@/lib/rateLimit";
import { adminShape, baseShape, checkAgainstCatalog, getSession, isAdminSession, json, newCode, ownerFilter, readBody } from "@/lib/bookingServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  API رزروها (مونگو)
  ────────────────────────────────────────────────────────────
  POST   /api/bookings               ثبت رزرو جدید (عمومی؛ اگر کاربر وارد شده باشد به حسابش وصل می‌شود)
  GET    /api/bookings               رزروهای خودِ کاربر وارد‌شده
  GET    /api/bookings?scope=all     همه‌ی رزروها با اطلاعات مهمان (فقط ادمین)
  PATCH  /api/bookings               { code, status }  کاربر: لغو رزرو خودش (تا ۴۸ ساعت قبل از ورود) | ادمین: لغو/فعال‌سازی
  DELETE /api/bookings?code=SR-...   حذف قطعی (فقط ادمین)
  ─ پیگیری با کد: /api/bookings/track   ─ باطل‌کردن با کد: /api/bookings/void   ─ ابزار نمونه/پاک‌سازی: /api/bookings/admin
*/

const createLimited = makeLimiter("booking-create", 10 * 60 * 1000, 10); // هر IP در ۱۰ دقیقه حداکثر ۱۰ رزرو

// ───────── ثبت رزرو ─────────
export async function POST(req) {
  const body = await readBody(req);
  if (!body) return json({ error: "درخواست نامعتبر است." }, 400);
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true, booking: { code: newCode() } }, 201); // تله‌ی ربات

  const { ok, errors, data } = validateBooking(body);
  if (!ok) return json({ error: "اطلاعات رزرو را بررسی کن.", errors }, 422);
  const cat = checkAgainstCatalog(data);
  if (!cat.ok) return json({ error: cat.error }, 422);
  if (createLimited(ipOf(req))) return json({ error: "تعداد رزروها زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن." }, 429);

  try {
    await ConnectDB();
    const session = await getSession();
    const owner = { userId: session?.user?.id ? String(session.user.id) : "", userEmail: (session?.user?.email || "").toLowerCase() };
    for (let i = 0; i < 3; i++) { // احتمال برخورد کد عملاً صفر است؛ اگر شد دوباره تلاش می‌کنیم
      try {
        const doc = await Booking.create({ ...cat.data, ...owner, code: newCode(), status: "confirmed", demo: false });
        return json({ ok: true, booking: baseShape(doc) }, 201);
      } catch (e) { if (e?.code !== 11000) throw e; }
    }
    return json({ error: "ثبت رزرو انجام نشد، دوباره امتحان کن." }, 500);
  } catch (e) {
    console.error("bookings POST error:", e?.message);
    return json({ error: "مشکلی در سرور رخ داده است. کمی بعد دوباره امتحان کن." }, 500);
  }
}

// ───────── خواندن رزروها ─────────
export async function GET(req) {
  const session = await getSession();
  if (!session?.user) return json({ error: "ابتدا وارد حسابت شو." }, 401);
  const scope = new URL(req.url).searchParams.get("scope");
  try {
    await ConnectDB();
    if (scope === "all") {
      if (!isAdminSession(session)) return json({ error: "دسترسی نداری." }, 403);
      const items = await Booking.find({}).sort({ createdAt: -1 }).limit(5000).lean();
      return json({ items: items.map(adminShape) });
    }
    const filter = ownerFilter(session);
    if (!filter) return json({ items: [] });
    const items = await Booking.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    return json({ items: items.map(baseShape) });
  } catch (e) {
    console.error("bookings GET error:", e?.message);
    return json({ error: "خطا در خواندن رزروها." }, 500);
  }
}

// ───────── لغو / تغییر وضعیت ─────────
export async function PATCH(req) {
  const session = await getSession();
  if (!session?.user) return json({ error: "ابتدا وارد حسابت شو." }, 401);
  const body = await readBody(req);
  const code = normalizeCode(body?.code);
  const status = body?.status;
  if (!code || !["cancelled", "confirmed"].includes(status)) return json({ error: "درخواست نامعتبر است." }, 422);
  const admin = isAdminSession(session);

  try {
    await ConnectDB();
    const doc = await Booking.findOne({ code }).lean();
    if (!doc) return json({ error: "رزرو پیدا نشد." }, 404);
    if (doc.status === "voided") return json({ error: "این کد باطل شده و دیگر قابل تغییر نیست." }, 409);

    if (!admin) {
      const f = ownerFilter(session);
      const mine = f && (f.$or.some((c) => (c.userId && c.userId === doc.userId) || (c.userEmail && c.userEmail === doc.userEmail)));
      if (!mine) return json({ error: "دسترسی نداری." }, 403);
      if (status !== "cancelled") return json({ error: "دسترسی نداری." }, 403);
      if (doc.status === "cancelled") return json({ ok: true, item: baseShape(doc) });
      if (todayIso() > addDaysIso(doc.checkIn, -2)) return json({ error: "مهلت لغو رایگان تمام شده؛ با پشتیبانی تماس بگیر." }, 409);
    }

    const set = { status, updatedAt: new Date() };
    if (status === "cancelled") set.cancelledAt = new Date();
    const upd = await Booking.findOneAndUpdate({ code, status: { $ne: "voided" } }, { $set: set }, { new: true }).lean();
    if (!upd) return json({ error: "این کد باطل شده و دیگر قابل تغییر نیست." }, 409);
    return json({ ok: true, item: admin ? adminShape(upd) : baseShape(upd) });
  } catch (e) {
    console.error("bookings PATCH error:", e?.message);
    return json({ error: "خطا در به‌روزرسانی رزرو." }, 500);
  }
}

// ───────── حذف قطعی (فقط ادمین) ─────────
export async function DELETE(req) {
  if (!isAdminSession(await getSession())) return json({ error: "دسترسی نداری." }, 403);
  const code = normalizeCode(new URL(req.url).searchParams.get("code"));
  if (!code) return json({ error: "درخواست نامعتبر است." }, 422);
  try {
    await ConnectDB();
    const r = await Booking.deleteOne({ code });
    return r.deletedCount ? json({ ok: true }) : json({ error: "رزرو پیدا نشد." }, 404);
  } catch (e) {
    console.error("bookings DELETE error:", e?.message);
    return json({ error: "خطا در حذف رزرو." }, 500);
  }
}
