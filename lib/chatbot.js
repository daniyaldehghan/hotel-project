import { CITIES, slugOf } from "./cities";
import { applyFilters, describeFilters, localParse } from "./assistant";
import { TAX_RATE } from "./pricing";
import { fa } from "./fa";

export const QUICK = ["هتل ارزان در استانبول", "هتل ۴ ستاره با استخر در باکو", "چطور رزرو را لغو کنم؟", "کد تخفیف دارید؟", "صحبت با پشتیبان"];
const cityChips = (n = 4) => CITIES.slice(0, n).map((c) => `هتل در ${c.name}`);
const hasIntent = (f) => !!(f.city || f.maxPrice || f.minStars || f.minRating || f.amenities.length || f.sort !== "rate");
const HOTEL_WORDS = /هتل|اتاق|اقامت|رزرو|سوئیت|مسافرخونه|مسافرخانه|جای\s*خواب|ویلا/;
const STOP = new Set(["یک", "این", "آن", "همه", "مرکز", "نزدیک", "کنار", "حدود", "بین", "حد", "شهر", "ایران", "اروپا", "جهان", "دنیا", "هتل", "اتاق", "چه", "چی", "کجا", "کدوم", "همین", "ماه", "هفته", "روز", "شب", "سفر"]);

const FAQ = [
  [/^(سلام|درود|هلو|hi|hello|وقت بخیر|صبح بخیر|عصر بخیر)/i, () => ({ text: "سلام 👋 خوش اومدی! بگو دنبال چه هتلی هستی؛ شهر، بودجه و امکانات رو بنویس.", chips: QUICK.slice(0, 3) })],
  [/ممنون|مرسی|سپاس|thanks|thank you/i, () => ({ text: "خواهش می‌کنم 😊 اگه سؤال دیگه‌ای داری بپرس." })],
  [/لغو|کنسل|استرداد/, () => ({ text: "لغو رایگان تا ۴۸ ساعت قبل از ورود ممکنه؛ از بخش «رزروهای من» روی «لغو رایگان» بزن. بعد از اون باید با پشتیبان صحبت کنی.", link: { href: "/bookings", label: "رزروهای من" } })],
  [/تخفیف|کوپن|کد\s*(تخفیف|هدیه)|SARA/i, () => ({ text: "کد SARA20 برای اولین رزرو ۲۰٪ تخفیف روی مبلغ اتاق می‌ده؛ توی صفحه‌ی پرداخت واردش کن." })],
  [/پرداخت|کارت بانکی/, () => ({ text: "توی صفحه‌ی پرداخت می‌تونی «پرداخت آنلاین» یا «پرداخت در هتل» رو انتخاب کنی." })],
  [/مالیات/, () => ({ text: `مالیات ${fa(Math.round(TAX_RATE * 100))}٪ هست و قبل از پرداخت نهایی توی خلاصه‌ی قیمت نشون داده می‌شه.` })],
  [/ساعت\s*(ورود|خروج)|چک\s*اوت|چک\s*این|تحویل\s*اتاق/, () => ({ text: "ساعت ورود و خروج هر هتل توی صفحه‌ی جزئیاتش نوشته شده؛ روی کارت هتل بزن تا ببینی." })],
  [/مقایسه/, () => ({ text: "روی کارت هتل‌ها «+ مقایسه» رو بزن و بعد وارد بخش مقایسه شو؛ تا ۳ هتل رو کنار هم می‌بینی.", link: { href: "/compare", label: "مقایسه هتل‌ها" } })],
  [/پشتیبان|ادمین|اپراتور|انسان|مشاور/, () => ({ text: "پیامت برای تیم پشتیبانی ثبت شد 🔔 به محض پاسخ، همین‌جا نشونت می‌دم." })],
];

async function parse(text, local) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text }), signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error("bad");
    const d = await r.json();
    return { filters: d.filters, reply: typeof d.reply === "string" ? d.reply : "" }; // سرور قبلاً پاک‌سازی کرده؛ دوباره sanitize نمی‌کنیم (null را به عدد تبدیل می‌کند)
  } catch { return { filters: local, reply: "" }; }
}

const unknownDest = (t) => {
  const m = t.match(/(?:^|\s)(?:در|توی|تو|به)\s+([\u0600-\u06FF\u200c]{2,})/);
  const c = m?.[1];
  return c && !STOP.has(c) && !hasIntent(localParse(c)) ? c : null;
};
const short = (t) => (t.length > 40 ? `${t.slice(0, 40)}…` : t);

export function irrelevant(t) {
  return {
    miss: true,
    text: `😕 متأسفانه برای «${short(t)}» چیزی پیدا نکردم. من درباره‌ی هتل، قیمت، رزرو و لغو می‌تونم کمک کنم؛ مثلاً بنویس «هتل ۴ ستاره در اصفهان با استخر». اگه سؤالت چیز دیگه‌ایه، پیامت برای پشتیبان ثبت شد و همین‌جا جواب می‌گیری.`,
    chips: cityChips(3),
  };
}

// خروجی: { text, hotelIds?, chips?, link?, miss? } ؛ miss = چیزی پیدا نشد یا بی‌ربط بود
export async function botReply(text, hotels, fmt) {
  const t = text.trim();
  const local = localParse(t);
  const strong = hasIntent(local);
  if (!strong) for (const [re, fn] of FAQ) if (re.test(t)) return fn();
  if (!strong && !HOTEL_WORDS.test(t)) return irrelevant(t);

  const { filters, reply } = await parse(t, local);
  if (!filters.city) {
    const dest = unknownDest(t);
    if (dest) return { miss: true, text: `😕 متأسفانه برای «${dest}» هتلی نداریم. مقصدهای فعلی ما رو ببین:`, chips: cityChips(4) };
  }
  if (!hasIntent(filters)) return { text: "برای کدوم شهر یا با چه بودجه‌ای دنبال هتل می‌گردی؟ مثلاً «هتل ۴ ستاره در باکو زیر ۱۰۰ دلار».", chips: cityChips(4) };

  const found = applyFilters(hotels, filters);
  const tags = describeFilters(filters, fmt);
  if (!found.length) {
    return { miss: true, text: `😕 متأسفانه هتلی با این شرایط پیدا نکردم${tags.length ? `: ${tags.join("، ")}` : ""}. شرط‌ها رو کمی ساده‌تر کن.`, chips: [...(filters.city ? [`هتل در ${filters.city}`] : []), "ارزان‌ترین هتل‌ها"] };
  }
  const slug = filters.city ? slugOf(filters.city) : null;
  return {
    text: `${reply ? `${reply} ` : ""}🎉 ${fa(found.length)} هتل پیدا کردم${tags.length ? ` (${tags.join("، ")})` : ""}؛ بهترین‌ها:`,
    hotelIds: found.slice(0, 3).map((h) => h.id),
    link: { href: slug ? `/city/${slug}` : "/hotels", label: "دیدن همه‌ی نتیجه‌ها" },
  };
}
