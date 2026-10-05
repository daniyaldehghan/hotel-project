import Link from "next/link";

export default function AssistantCta() {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-5">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-[28px] border border-line bg-card p-6 sm:p-8">
        <div className="max-w-xl">
          <h2 className="text-2xl font-extrabold">نمی‌دانی کجا بروی؟ از دستیار سفر بپرس</h2>
          <p className="mt-1 text-mut">مثلاً بنویس «هتل ۴ ستاره در اصفهان با استخر تا ۸۰ دلار» و فیلترها خودکار ساخته می‌شوند.</p>
        </div>
        <Link href="/assistant" className="rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white">شروع گفتگو</Link>
      </div>
    </section>
  );
}
