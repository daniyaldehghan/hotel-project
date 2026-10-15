// قوانین پیشنهاد ویژه؛ هم مرورگر و هم سرور از همین فایل استفاده می‌کنند.
export const OFFER_LIMITS = { minPct: 1, maxPct: 70, maxDays: 365, hideAfterMs: 48 * 36e5 }; // پیشنهاد تمام‌شده تا ۴۸ ساعت در سایت دیده می‌شود

// scheduled = هنوز شروع نشده | live = فعال | ended = زمانش تمام شده | paused = ادمین خاموشش کرده
export function offerState(o, now = Date.now()) {
  if (!o.active) return "paused";
  if (now < new Date(o.startsAt).getTime()) return "scheduled";
  if (now >= new Date(o.endsAt).getTime()) return "ended";
  return "live";
}
export const isLive = (o, now = Date.now()) => offerState(o, now) === "live";

const clean = (v) => (typeof v === "string" ? v.replace(/[\u0000-\u001F\u007F]/g, "").trim() : "");

// خروجی: { ok, errors, data }  (data.startsAt و data.endsAt از نوع Date هستند)
export function validateOffer(raw = {}, { requireFuture = false } = {}) {
  const errors = {};
  const hotelId = Number(raw.hotelId);
  const discountPct = Number(raw.discountPct);
  const startsAt = new Date(raw.startsAt || NaN);
  const endsAt = new Date(raw.endsAt || NaN);
  const data = {
    hotelId, discountPct, startsAt, endsAt,
    title: clean(raw.title).slice(0, 80),
    active: typeof raw.active === "boolean" ? raw.active : true,
  };
  if (!Number.isInteger(hotelId) || hotelId < 1) errors.hotelId = "هتل را انتخاب کن.";
  if (!Number.isInteger(discountPct) || discountPct < OFFER_LIMITS.minPct || discountPct > OFFER_LIMITS.maxPct)
    errors.discountPct = `درصد تخفیف باید عدد صحیح بین ${OFFER_LIMITS.minPct} تا ${OFFER_LIMITS.maxPct} باشد.`;
  if (Number.isNaN(startsAt.getTime())) errors.startsAt = "زمان شروع نامعتبر است.";
  if (Number.isNaN(endsAt.getTime())) errors.endsAt = "زمان پایان نامعتبر است.";
  if (!errors.startsAt && !errors.endsAt) {
    if (endsAt <= startsAt) errors.endsAt = "زمان پایان باید بعد از شروع باشد.";
    else if (endsAt - startsAt > OFFER_LIMITS.maxDays * 864e5) errors.endsAt = `بازه‌ی پیشنهاد حداکثر ${OFFER_LIMITS.maxDays} روز است.`;
    else if (requireFuture && endsAt.getTime() <= Date.now()) errors.endsAt = "زمان پایان باید در آینده باشد.";
  }
  return { ok: Object.keys(errors).length === 0, errors, data };
}
