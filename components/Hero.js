import Image from "next/image";

const TRUST = [
  "لغو رایگان تا ۴۸ ساعت قبل",
  "قیمت نهایی از همان اول",
  "پشتیبانی فارسی ۲۴ ساعته",
];

export default function Hero() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-night via-night2 to-[#5B1FA8] pb-60 max-sm:pb-2  text-white ">
      <Image
        src="/headerpage.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={70}
        className="object-cover  "
      />
      <div className="relative mx-auto max-w-6xl px-8 pt-5 lg:pt-32">
        <p className="mb-4 inline-block rounded-full  border border-white/25 bg-white/10 px-4 py-1 text-sm">
          ۲۰٪ تخفیف اولین رزرو با کد{" "}
          <span className="text-sun font-bold">SARA20</span>
        </p>
        <h1 className="mb-4 text-[clamp(40px,8vw,84px)] font-black leading-[1.15] tracking-tight">
          شبِ بعدی‌ات
          <br />
          کجا باشه؟
        </h1>
        <p className="max-w-md text-[17px] opacity-90">
          ۱۱۰ هتل تأییدشده در ۱۰ شهر؛ مقایسه کن، رزرو کن و بدون نگرانی سفر برو.
        </p>
        <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="text-aqua">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
