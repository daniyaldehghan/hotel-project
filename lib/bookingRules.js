// قوانین رزرو؛ هم مرورگر و هم سرور از همین فایل استفاده می‌کنند.
export const STATUSES = ["confirmed", "cancelled", "voided"];
// متنی که کاربر می‌بیند
export const STATUS_LABELS = { confirmed: "فعال", cancelled: "لغو شده", voided: "باطل شده" };
export const STATUS_HINTS = {
  confirmed: "رزرو شما ثبت و فعال است.",
  cancelled: "این رزرو لغو شده است.",
  voided: "این کد پیگیری توسط مدیریت باطل شده و دیگر معتبر نیست.",
};
export const LIMITS = { maxRooms: 5, perRoom: 4, maxNights: 60, maxTotalUsd: 200000 };

const clean = (v) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim() : "");
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (s) => DATE.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime()) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const nightsOf = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 864e5);
const toEn = (s) => s.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

// کد پیگیری را به شکل استاندارد درمی‌آورد: «sr-7k2qx9» یا «7K2QX9» → «SR-7K2QX9». نامعتبر → رشته‌ی خالی
export function normalizeCode(v) {
  let t = clean(v).toUpperCase().replace(/[\s_–—]+/g, "-");
  if (/^[A-Z2-9]{6}$/.test(t)) t = "SR-" + t;
  if (/^SR[A-Z2-9]{6}$/.test(t)) t = "SR-" + t.slice(2);
  return /^SR-[A-Z2-9]{6}$/.test(t) ? t : "";
}

// اعتبارسنجی رزرو جدید. خروجی: { ok, errors, data }
// allowPast فقط برای رزروهای نمونه‌ی ادمین است.
export function validateBooking(raw = {}, { allowPast = false } = {}) {
  const errors = {};
  const g = raw.guest && typeof raw.guest === "object" ? raw.guest : {};
  const int = (v) => (Number.isInteger(Number(v)) ? Number(v) : NaN);
  const data = {
    hotelId: int(raw.hotelId),
    hotelName: clean(raw.hotelName).slice(0, 120),
    city: clean(raw.city).slice(0, 80),
    room: clean(raw.room).slice(0, 120),
    rooms: int(raw.rooms),
    guests: int(raw.guests),
    checkIn: clean(raw.checkIn),
    checkOut: clean(raw.checkOut),
    totalUsd: Math.round(Number(raw.totalUsd) * 100) / 100,
    pay: raw.pay === "hotel" ? "hotel" : "online",
    guestName: clean(`${clean(g.first)} ${clean(g.last)}`).slice(0, 120),
    guestEmail: clean(g.email).toLowerCase().slice(0, 120),
    guestPhone: toEn(clean(g.phone)).replace(/[^\d+]/g, "").slice(0, 30),
    note: clean(g.note).slice(0, 500),
  };
  if (!Number.isInteger(data.hotelId) || data.hotelId < 1) errors.hotel = "هتل نامعتبر است.";
  if (!data.hotelName || !data.room) errors.room = "اتاق نامعتبر است.";
  if (!(data.rooms >= 1 && data.rooms <= LIMITS.maxRooms)) errors.rooms = "تعداد اتاق نامعتبر است.";
  if (!(data.guests >= data.rooms && data.guests <= data.rooms * LIMITS.perRoom)) errors.guests = "تعداد مهمان نامعتبر است.";
  if (!isDate(data.checkIn) || !isDate(data.checkOut)) errors.dates = "تاریخ نامعتبر است.";
  else {
    data.nights = nightsOf(data.checkIn, data.checkOut);
    if (data.nights < 1 || data.nights > LIMITS.maxNights) errors.dates = "بازه‌ی تاریخ نامعتبر است.";
    else if (!allowPast && data.checkIn < new Date(Date.now() - 864e5).toISOString().slice(0, 10)) errors.dates = "تاریخ ورود گذشته است.";
  }
  if (!Number.isFinite(data.totalUsd) || data.totalUsd <= 0 || data.totalUsd > LIMITS.maxTotalUsd) errors.total = "مبلغ نامعتبر است.";
  if (!allowPast) {
    if (!data.guestName) errors.guest = "نام مهمان را وارد کن.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail)) errors.email = "ایمیل معتبر وارد کن.";
    if (!/^\+?\d{10,13}$/.test(data.guestPhone)) errors.phone = "شماره تلفن معتبر وارد کن.";
  }
  return { ok: Object.keys(errors).length === 0, errors, data };
}
