// قوانین فرم «ثبت نظر»؛ هم مرورگر و هم سرور از همین فایل استفاده می‌کنند تا همیشه یکی باشند.
export const LIMITS = { name: 60, minName: 2, trip: 80, text: 600, minText: 10 };

// حذف کاراکترهای کنترلی نامرئی و فاصله‌های اضافه
const clean = (v) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim() : "");

export function normalizeReview(raw = {}) {
  const rating = Math.round(Number(raw.rating));
  return {
    name: clean(raw.name).slice(0, LIMITS.name),
    trip: clean(raw.trip).slice(0, LIMITS.trip),
    rating: Number.isFinite(rating) ? rating : 0,
    text: clean(raw.text).slice(0, LIMITS.text),
  };
}

// خروجی: { ok, errors, data }
export function validateReview(raw) {
  const data = normalizeReview(raw);
  const errors = {};
  if (data.name.length < LIMITS.minName) errors.name = "نام را وارد کن.";
  if (!(data.rating >= 1 && data.rating <= 5)) errors.rating = "امتیاز را انتخاب کن.";
  if (data.text.length < LIMITS.minText) errors.text = "نظر حداقل ۱۰ کاراکتر باشد.";
  return { ok: Object.keys(errors).length === 0, errors, data };
}
