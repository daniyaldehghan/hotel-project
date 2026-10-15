// سنجش قدرت رمز عبور (فقط راهنمای کاربر در مرورگر؛ ذخیره یا ارسال نمی‌شود)
const COMMON = new Set([
  "123", "1234", "12345", "123456", "1234567", "12345678", "123456789", "1234567890", "0123456789", "000000", "111111", "121212", "654321",
  "password", "password1", "passw0rd", "qwerty", "qwerty123", "qwertyuiop", "abc123", "abcd1234", "iloveyou", "admin", "admin123", "welcome",
  "letmein", "monkey", "dragon", "sara", "sara123", "salam", "salam123", "سلام", "رمزعبور", "پسورد",
]);

const SEQ = ["0123456789", "abcdefghijklmnopqrstuvwxyz", "qwertyuiop", "asdfghjkl", "zxcvbnm", "۰۱۲۳۴۵۶۷۸۹"];
const hasSequence = (s, n = 4) => {
  const t = s.toLowerCase();
  return SEQ.some((seq) => {
    const rev = [...seq].reverse().join("");
    for (let i = 0; i + n <= t.length; i++) { const part = t.slice(i, i + n); if (seq.includes(part) || rev.includes(part)) return true; }
    return false;
  });
};
const toEn = (s) => s.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

export const LEVELS = {
  weak: { label: "ضعیف", bars: 1 },
  medium: { label: "متوسط", bars: 2 },
  strong: { label: "قوی", bars: 3 },
};

// خروجی: { level: "" | "weak" | "medium" | "strong", checks: [{ ok, label }], tips: [string] }
export function checkPassword(pw = "", { email = "", name = "" } = {}) {
  if (!pw) return { level: "", checks: [], tips: [] };

  const len = [...pw].length;
  const has = {
    letter: /\p{L}/u.test(pw), upper: /\p{Lu}/u.test(pw), lower: /\p{Ll}/u.test(pw),
    digit: /[\p{Nd}]/u.test(pw), symbol: /[^\p{L}\p{N}\s]/u.test(pw),
  };
  const plain = toEn(pw).toLowerCase();
  const local = email.split("@")[0].toLowerCase();
  const nm = name.trim().toLowerCase();
  const common = COMMON.has(plain) || COMMON.has(plain.replace(/\d+$/, "")) || /^(.)\1+$/.test(pw);
  const personal = (local.length >= 3 && plain.includes(local)) || (nm.length >= 3 && plain.includes(nm));
  const simple = /(.)\1{2,}/u.test(pw) || hasSequence(pw);

  const checks = [
    { ok: len >= 8, label: "حداقل ۸ کاراکتر" },
    { ok: has.letter && has.digit, label: "ترکیب حرف و عدد" },
    { ok: (has.upper && has.lower) || (has.letter && !has.upper && !has.lower), label: "حروف بزرگ و کوچک انگلیسی" },
    { ok: has.symbol, label: "یک نماد مثل @ ، # یا !" },
    { ok: len >= 12, label: "۱۲ کاراکتر یا بیشتر" },
  ];
  // اگر رمز فقط حروف فارسی (بدون بزرگ/کوچک) دارد، شرط «بزرگ و کوچک» برایش لازم نیست
  const points = (len >= 8) + (len >= 12) + (has.letter && has.digit) + (has.upper && has.lower) + has.symbol;

  let level = "weak";
  if (len >= 8 && !common) {
    if (points >= 4 && len >= 10 && !personal && !simple) level = "strong";
    else if (points >= 2) level = "medium";
  }

  const tips = [];
  if (common) tips.push("این رمز خیلی رایج است و به‌راحتی حدس زده می‌شود؛ یک رمز منحصربه‌فرد انتخاب کن.");
  if (len < 8) tips.push("رمز کوتاه است؛ حداقل ۸ کاراکتر بگذار.");
  if (personal) tips.push("نام یا ایمیلت را داخل رمز استفاده نکن.");
  if (simple) tips.push("تکرار یا ترتیب ساده مثل aaa یا 1234 را نگذار.");
  if (!(has.letter && has.digit)) tips.push("هم حرف و هم عدد داشته باشد.");
  if (has.letter && (has.upper || has.lower) && !(has.upper && has.lower)) tips.push("حروف بزرگ و کوچک انگلیسی را ترکیب کن.");
  if (!has.symbol) tips.push("یک نماد مثل @ یا # اضافه کن.");
  if (len >= 8 && len < 12 && level !== "strong") tips.push("رمز بلندتر (۱۲ کاراکتر یا بیشتر) امن‌تر است.");
  return { level, checks, tips: tips.slice(0, 2) };
}
