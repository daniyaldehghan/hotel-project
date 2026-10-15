import ConnectDB from "@/utils/ConnectDB";
import Booking from "@/models/Booking";
import { normalizeCode } from "@/lib/bookingRules";
import { ipOf, makeLimiter } from "@/lib/rateLimit";
import { json, publicShape, readBody } from "@/lib/bookingServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  پیگیری رزرو با کد پیگیری (عمومی)
  POST /api/bookings/track   { code }  → وضعیت و مشخصات رزرو
  ایمیل، تلفن و توضیحات مهمان هرگز برگردانده نمی‌شود؛ فقط کسی که کد را دارد وضعیت را می‌بیند.
*/
const lookupLimited = makeLimiter("booking-track", 10 * 60 * 1000, 20); // جلوی حدس‌زدن کدها

export async function POST(req) {
  const body = await readBody(req);
  if (!body) return json({ error: "درخواست نامعتبر است." }, 400);
  const code = normalizeCode(body.code);
  if (!code) return json({ error: "کد پیگیری درست نیست. شکلش مثل SR-7K2QX9 است." }, 422);
  if (lookupLimited(ipOf(req))) return json({ error: "تعداد جست‌وجو زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن." }, 429);
  try {
    await ConnectDB();
    const doc = await Booking.findOne({ code }).lean();
    if (!doc) return json({ error: "رزروی با این کد پیدا نشد. کد را دوباره بررسی کن." }, 404);
    return json({ ok: true, booking: publicShape(doc) });
  } catch (e) {
    console.error("booking track error:", e?.message);
    return json({ error: "مشکلی در سرور رخ داده است. کمی بعد دوباره امتحان کن." }, 500);
  }
}
