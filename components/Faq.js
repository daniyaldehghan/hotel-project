import Section from "./Section";

const Q = [
  ["لغو رزرو چطور انجام می‌شود؟", "تا ۴۸ ساعت قبل از زمان ورود می‌توانی بدون هزینه لغو کنی. مبلغ به همان روش پرداخت برمی‌گردد."],
  ["قیمت‌ها شامل مالیات هستند؟", "بله. قیمتی که در کارت هتل می‌بینی قیمت نهایی است و هزینه‌ی پنهانی اضافه نمی‌شود."],
  ["می‌توانم تاریخ رزرو را تغییر دهم؟", "تا ۴۸ ساعت قبل از ورود، از بخش رزروهای من تاریخ را عوض کن. اگر اتاق خالی باشد، همان قیمت حفظ می‌شود."],
  ["کد تخفیف را کجا وارد کنم؟", "در مرحله‌ی پرداخت، کد SARA20 را وارد کن تا ۲۰٪ تخفیف اولین رزرو اعمال شود."],
  ["با پشتیبانی چطور تماس بگیرم؟", "از چت داخل سایت یا تلفن، هر ساعت از شبانه‌روز در دسترس هستیم."],
];

export default function Faq() {
  return (
    <Section id="faq" title="سؤالات متداول" narrow>
      <div className="divide-y divide-line rounded-3xl border border-line bg-card">
        {Q.map(([q, a]) => (
          <details key={q} className="group px-6 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
              {q}
              <span className="text-xl text-violet transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-[15px] leading-8 text-mut">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
