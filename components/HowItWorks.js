import Section from "./Section";

const STEPS = [
  { t: "جستجو کن", d: "شهر، تاریخ و تعداد مسافر را وارد کن و هتل‌ها را با قیمت نهایی ببین." },
  { t: "مقایسه و انتخاب", d: "امتیاز، امکانات و نظر مسافران قبلی را کنار هم بگذار و بهترین را انتخاب کن." },
  { t: "رزرو و سفر", d: "تأیید رزرو همان لحظه می‌رسد. تا ۴۸ ساعت قبل از ورود، لغو رایگان است." },
];

export default function HowItWorks() {
  return (
    <Section id="how" title="رزرو در سه قدم" sub="بدون ثبت‌نام اجباری و بدون هزینه‌ی پنهان.">
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.t} className="rounded-3xl border border-line bg-card p-6">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet to-coral text-lg font-black text-white">{i + 1}</span>
            <b className="text-lg">{s.t}</b>
            <p className="mt-1 text-[15px] text-mut">{s.d}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
