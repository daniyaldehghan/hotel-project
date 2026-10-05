import Link from "next/link";
import { CITIES } from "@/lib/cities";

const COLS = [
  ["سرا", [["وبلاگ", "/blog"], ["تماس با ما", "/contact"], ["دستیار سفر", "/assistant"], ["ورود و ثبت‌نام", "/login"]]],
  ["پشتیبانی", [["سؤالات متداول", "/#faq"], ["قوانین لغو", "/blog/free-cancellation-guide"], ["رزروهای من", "/bookings"], ["مقایسه هتل‌ها", "/compare"]]],
  ["مقصدها", CITIES.slice(0, 4).map((c) => [c.name, `/city/${c.slug}`])],
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 text-2xl font-black">
            <i className="h-7 w-7 rounded-[50%_50%_50%_4px] bg-gradient-to-br from-sun to-coral" />سفرینو
          </div>
          <p className="mt-3 max-w-xs text-sm text-mut">رزرو هتل با قیمت شفاف، لغو رایگان و پشتیبانی فارسی.</p>
        </div>
        {COLS.map(([t, items]) => (
          <div key={t}>
            <b className="text-sm">{t}</b>
            <ul className="mt-3 space-y-2 text-sm text-mut">
              {items.map(([label, href]) => <li key={href}><Link href={href} className="hover:text-ink">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-line px-5 py-5 text-center text-xs text-mut">© سفرینو — نمونه طراحی رزرو هتل .</p>
    </footer>
  );
}
