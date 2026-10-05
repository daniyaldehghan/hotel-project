import { CITIES } from "./cities";
import { CURRENCIES } from "./currency";
import { fa } from "./fa";

export const AMENITY_NAMES = ["وای‌فای", "صبحانه", "استخر", "پارکینگ", "اسپا", "سالن ورزش", "ترانسفر فرودگاه"];
export const SORTS = { rate: "بهترین امتیاز", low: "ارزان‌ترین", high: "گران‌ترین", rev: "پرنظرترین" };

const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};

// خروجی هر منبعی (هوش مصنوعی یا تحلیل ساده) قبل از استفاده پاک‌سازی می‌شود.
export function sanitizeFilters(raw = {}) {
  return {
    city: CITIES.find((c) => c.name === raw.city)?.name ?? null,
    maxPrice: num(raw.maxPrice, 10, 2000),
    minStars: [3, 4, 5].includes(Number(raw.minStars)) ? Number(raw.minStars) : null,
    minRating: num(raw.minRating, 7, 9.7),
    amenities: Array.isArray(raw.amenities) ? [...new Set(raw.amenities.filter((a) => AMENITY_NAMES.includes(a)))] : [],
    sort: SORTS[raw.sort] ? raw.sort : "rate",
  };
}

export function applyFilters(hotels, f) {
  const by = { rate: (a, b) => b.rating - a.rating, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, rev: (a, b) => b.reviews - a.reviews };
  return hotels
    .filter((h) => (!f.city || h.city === f.city) && (!f.maxPrice || h.price <= f.maxPrice) && (!f.minStars || h.stars >= f.minStars) &&
      (!f.minRating || h.rating >= f.minRating) && f.amenities.every((a) => h.amenities.includes(a)))
    .sort(by[f.sort]);
}

export function describeFilters(f, fmt) {
  const out = [];
  if (f.city) out.push(f.city);
  if (f.maxPrice) out.push(`تا ${fmt(f.maxPrice)}`);
  if (f.minStars) out.push(`${fa(f.minStars)} ستاره به بالا`);
  if (f.minRating) out.push(`امتیاز ${fa(f.minRating)}+`);
  out.push(...f.amenities);
  if (f.sort !== "rate") out.push(SORTS[f.sort]);
  return out;
}

const toLatin = (s) => s.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٬,]/g, "");
const UNITS = { "دلار": "USD", "$": "USD", usd: "USD", "یورو": "EUR", "لیر": "TRY", "درهم": "AED", "تومان": "IRT" };
const KEYWORDS = { "وای‌فای": /وای\s*‌?فای|اینترنت/, "صبحانه": /صبحانه/, "استخر": /استخر/, "پارکینگ": /پارکینگ/, "اسپا": /اسپا/, "سالن ورزش": /ورزش|باشگاه/, "ترانسفر فرودگاه": /ترانسفر|فرودگاه/ };

// تحلیل ساده بدون هوش مصنوعی؛ وقتی کلید API نیست یا درخواست ناموفق است استفاده می‌شود.
export function localParse(text) {
  const t = toLatin(text);
  const raw = { amenities: [], sort: "rate" };
  raw.city = CITIES.find((c) => t.includes(c.name))?.name;

  const p = t.match(/(\d+(?:\.\d+)?)\s*(میلیون)?\s*(دلار|\$|usd|یورو|لیر|درهم|تومان)/i) || t.match(/(\$)\s*(\d+)/);
  if (p) {
    const isPrefix = p[1] === "$";
    const value = Number(isPrefix ? p[2] : p[1]) * (!isPrefix && p[2] ? 1e6 : 1);
    const cur = UNITS[(isPrefix ? "$" : p[3]).toLowerCase()];
    raw.maxPrice = value / CURRENCIES[cur].rate;
  }
  const w = { "سه": 3, "چهار": 4, "پنج": 5 };
  const s = t.match(/(\d)\s*ستاره/) || t.match(/(سه|چهار|پنج)\s*ستاره/);
  if (s) raw.minStars = w[s[1]] ?? s[1];
  const r = t.match(/امتیاز[^\d]{0,14}(\d(?:\.\d)?)/);
  if (r) raw.minRating = r[1];
  else if (/امتیاز\s*(بالا|عالی)/.test(t)) raw.minRating = 9;
  for (const [name, re] of Object.entries(KEYWORDS)) if (re.test(t)) raw.amenities.push(name);
  if (/ارزان|اقتصادی/.test(t)) raw.sort = "low";
  else if (/لوکس|گران/.test(t)) { raw.sort = "high"; raw.minStars ??= 5; }
  else if (/پرنظر|محبوب/.test(t)) raw.sort = "rev";
  return sanitizeFilters(raw);
}
