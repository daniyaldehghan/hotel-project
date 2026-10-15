// قوانین خبرنامه؛ هم مرورگر و هم سرور از همین فایل استفاده می‌کنند.
export const EMAIL_MAX = 120;
const clean = (v) => (typeof v === "string" ? v.replace(/[\u0000-\u001F\u007F]/g, "").trim() : "");
export const normalizeEmail = (v) => clean(v).toLowerCase().slice(0, EMAIL_MAX);
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export const isToken = (v) => typeof v === "string" && /^[a-f0-9]{32}$/.test(v);
