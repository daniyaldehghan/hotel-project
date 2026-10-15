// قوانین «تنظیمات حساب»؛ هم مرورگر و هم سرور از همین فایل استفاده می‌کنند تا همیشه یکی باشند.
export const PROFILE_LIMITS = { name: 60, minName: 2, email: 120 };

// حذف کاراکترهای کنترلی نامرئی و فاصله‌های اضافه
const clean = (v) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim() : "");

// عددهای فارسی و عربی → انگلیسی
const toEn = (s) => s.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

// شماره را یک‌شکل می‌کند: «+98 912 123 4567»، «۰۹۱۲-۱۲۳-۴۵۶۷» و «9121234567» همه → 09121234567.
// شماره‌ی خارجی با «+» نگه داشته می‌شود («0044…» → «+44…»). خالی = بدون شماره.
export function normalizePhone(raw) {
  let p = toEn(clean(raw)).replace(/[\s\-().]/g, "");
  if (!p) return "";
  if (p.startsWith("00")) p = "+" + p.slice(2);
  const m = p.match(/^(?:\+?98|0)?(9\d{9})$/);
  return m ? "0" + m[1] : p;
}
const phoneOk = (p) => /^\+?\d{7,15}$/.test(p);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// فقط فیلدهایی که در raw آمده‌اند بررسی می‌شوند. خروجی: { ok, errors, data }
export function validateProfile(raw = {}) {
  const data = {}, errors = {};
  if ("name" in raw) {
    const n = clean(raw.name).slice(0, PROFILE_LIMITS.name);
    if (n.length < PROFILE_LIMITS.minName) errors.name = "نام را وارد کن (حداقل ۲ حرف).";
    else data.name = n;
  }
  if ("email" in raw) {
    const e = clean(raw.email).toLowerCase();
    if (e.length > PROFILE_LIMITS.email || !EMAIL_RE.test(e)) errors.email = "ایمیل معتبر وارد کن.";
    else data.email = e;
  }
  if ("phone" in raw) {
    const p = normalizePhone(raw.phone);
    if (p && !phoneOk(p)) errors.phone = "شماره‌ی تماس معتبر نیست. مثل ۰۹۱۲۱۲۳۴۵۶۷";
    else data.phone = p;
  }
  return { ok: Object.keys(errors).length === 0, errors, data };
}

// چه چیزهایی واقعاً عوض شده؟  user = سند فعلی در دیتابیس، data = خروجی validateProfile
// (اگر ایمیل فقط از نظر بزرگ/کوچک بودن حروف فرق دارد، «تغییر» حساب نمی‌شود تا ورود کاربر به‌هم نخورد.)
export function diffProfile(user, data) {
  const set = {};
  if (data.name !== undefined && data.name !== (user.name || "")) set.name = data.name;
  const emailChanged = data.email !== undefined && data.email !== String(user.email || "").toLowerCase();
  if (emailChanged) set.email = data.email;
  if (data.phone !== undefined && data.phone !== (user.phone || "")) set.phone = data.phone;
  return { set, emailChanged };
}
