export default function Deal() {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-5">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-coral via-[#E0449B] to-violet p-8 text-white md:p-12">
        <div className="absolute -start-10 -top-10 h-64 w-64 blob blob-sun opacity-60" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-[30px] font-black leading-tight">۲۰٪ تخفیف برای اولین رزرو</h2>
            <p className="mt-2 max-w-md opacity-90">کد را هنگام پرداخت وارد کن. تا پایان ماه برای همه‌ی هتل‌ها معتبر است.</p>
          </div>
          <div className="rounded-2xl border-2 border-dashed border-white/70 px-7 py-3 text-center">
            <span className="block text-xs opacity-80">کد تخفیف</span>
            <b className="text-2xl tracking-widest" dir="ltr">SARA20</b>
          </div>
        </div>
      </div>
    </section>
  );
}
