import ConnectDB from "@/utils/ConnectDB";
import Booking from "@/models/Booking";
import { normalizeCode } from "@/lib/bookingRules";
import { adminShape, getSession, isAdminSession, json, readBody } from "@/lib/bookingServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  باطل‌کردن رزرو با کد پیگیری (فقط ادمین)
  GET  /api/bookings/void?code=SR-...   دیدن مشخصات رزرو قبل از باطل‌کردن
  POST /api/bookings/void   { code }    کد را باطل می‌کند. باطل‌شدن نهایی است و برگشت ندارد؛
                                        کاربر در «پیگیری رزرو» وضعیت «باطل شده» را می‌بیند.
*/

export async function GET(req) {
  if (!isAdminSession(await getSession())) return json({ error: "دسترسی نداری." }, 403);
  const code = normalizeCode(new URL(req.url).searchParams.get("code"));
  if (!code) return json({ error: "کد پیگیری درست نیست. شکلش مثل SR-7K2QX9 است." }, 422);
  try {
    await ConnectDB();
    const doc = await Booking.findOne({ code }).lean();
    if (!doc) return json({ error: "رزروی با این کد پیدا نشد." }, 404);
    return json({ ok: true, item: adminShape(doc) });
  } catch (e) {
    console.error("booking void GET error:", e?.message);
    return json({ error: "خطا در جست‌وجو." }, 500);
  }
}

export async function POST(req) {
  const session = await getSession();
  if (!isAdminSession(session)) return json({ error: "دسترسی نداری." }, 403);
  const body = await readBody(req);
  const code = normalizeCode(body?.code);
  if (!code) return json({ error: "کد پیگیری درست نیست. شکلش مثل SR-7K2QX9 است." }, 422);
  try {
    await ConnectDB();
    // اتمیک: فقط رزروی که هنوز فعال است باطل می‌شود؛ دو ادمین هم‌زمان نمی‌توانند دوبار باطلش کنند
    const now = new Date();
    const doc = await Booking.findOneAndUpdate(
      { code, status: "confirmed" },
      { $set: { status: "voided", voidedAt: now, updatedAt: now, voidedBy: session.user.email || "" } },
      { new: true }
    ).lean();
    if (doc) return json({ ok: true, item: adminShape(doc) });

    const cur = await Booking.findOne({ code }).select("status").lean();
    if (!cur) return json({ error: "رزروی با این کد پیدا نشد." }, 404);
    return json({ error: cur.status === "voided" ? "این کد قبلاً باطل شده است." : "این رزرو قبلاً لغو شده و معتبر نیست." }, 409);
  } catch (e) {
    console.error("booking void POST error:", e?.message);
    return json({ error: "خطا در باطل‌کردن رزرو." }, 500);
  }
}
