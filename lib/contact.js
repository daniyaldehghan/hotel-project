// قوانین فرم «تماس با ما»؛ هم مرورگر و هم سرور از همین فایل استفاده می‌کنند تا همیشه یکی باشند.
export const SUBJECTS = ["رزرو هتل", "لغو یا تغییر رزرو", "پرداخت و فاکتور", "همکاری", "پیشنهاد و انتقاد", "سایر"];
export const LIMITS = { name: 80, email: 120, message: 2000, minMessage: 10 };

// حذف کاراکترهای کنترلی نامرئی و فاصله‌های اضافه
const clean = (v) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim() : "");

export function normalizeContact(raw = {}) {
  return {
    name: clean(raw.name).slice(0, LIMITS.name),
    email: clean(raw.email).toLowerCase().slice(0, LIMITS.email),
    subject: clean(raw.subject),
    message: clean(raw.message).slice(0, LIMITS.message),
  };
}

// خروجی: { ok, errors, data }
export function validateContact(raw) {
  const data = normalizeContact(raw);
  const errors = {};
  if (!data.name) errors.name = "نام را وارد کن.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "ایمیل معتبر وارد کن.";
  if (!SUBJECTS.includes(data.subject)) errors.subject = "موضوع نامعتبر است.";
  if (data.message.length < LIMITS.minMessage) errors.message = "پیام حداقل ۱۰ کاراکتر باشد.";
  return { ok: Object.keys(errors).length === 0, errors, data };
}

// ───────── پیگیری و گفتگو ─────────
export const STATUSES = ["new", "read", "replied", "done"];
// متنی که کاربر می‌بیند
export const STATUS_LABELS = { new: "در انتظار بررسی", read: "در حال بررسی", replied: "پاسخ داده شد", done: "بسته شد" };
export const REPLY_LIMITS = { text: 2000, minText: 2, maxReplies: 40 };

export const cleanText = clean;

// کد پیگیری را به شکل استاندارد درمی‌آورد: «tk-7k2qx9» یا «7K2QX9» → «TK-7K2QX9». اگر معتبر نباشد رشته‌ی خالی برمی‌گرداند.
export function normalizeTicket(v) {
  let t = clean(v).toUpperCase().replace(/[\s_–—]+/g, "-");
  if (/^[A-Z2-9]{6}$/.test(t)) t = "TK-" + t;
  if (/^TK[A-Z2-9]{6}$/.test(t)) t = "TK-" + t.slice(2);
  return /^TK-[A-Z2-9]{6}$/.test(t) ? t : "";
}

export const normalizeReply = (v) => clean(v).slice(0, REPLY_LIMITS.text);
