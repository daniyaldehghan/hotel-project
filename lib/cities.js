export const CITIES = [
  { slug: "baku", name: "باکو", blurb: "شهر باد و آتش؛ بولوار کنار دریای خزر و شهر قدیمی." },
  { slug: "istanbul", name: "استانبول", blurb: "شهری میان دو قاره؛ بازار، بسفر و کافه‌های تاریخی." },
  { slug: "tehran", name: "تهران", blurb: "پایتخت؛ موزه‌ها، باغ‌ها و منظره‌ی البرز." },
  { slug: "dubai", name: "دبی", blurb: "برج‌ها، ساحل و خرید؛ مناسب سفر لوکس و خانوادگی." },
  { slug: "tbilisi", name: "تفلیس", blurb: "کوچه‌های سنگ‌فرش، حمام‌های آب‌گرم و غذاهای محلی." },
  { slug: "antalya", name: "آنتالیا", blurb: "ساحل مدیترانه، شهر قدیمی و هتل‌های ریزورتی." },
  { slug: "shiraz", name: "شیراز", blurb: "شهر باغ و شعر؛ حافظیه و سعدیه و تخت جمشید در نزدیکی." },
  { slug: "yerevan", name: "ایروان", blurb: "شهر صورتی؛ میدان جمهوری، کافه‌ها و چشم‌انداز آرارات." },
  { slug: "isfahan", name: "اصفهان", blurb: "نصف جهان؛ میدان نقش جهان، سی‌وسه‌پل و بازار قیصریه." },
  { slug: "tabriz", name: "تبریز", blurb: "بازار تاریخی ثبت جهانی، ائل‌گلی و غذاهای سنتی." },
];
export const bySlug = (s) => CITIES.find((c) => c.slug === s);
export const slugOf = (name) => CITIES.find((c) => c.name === name)?.slug;
