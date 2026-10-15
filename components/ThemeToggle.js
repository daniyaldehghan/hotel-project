"use client";
import { useTheme } from "./ThemeProvider";

// دکمه‌ی تغییر تم. آیکن با CSS (کلاس dark) عوض می‌شود، پس موقع لود هیچ پرش یا خطای hydration ندارد.
// variant="bar"  → روی نوار تیره‌ی بالای سایت و پنل مدیریت
// variant="page" → روی زمینه‌ی خود صفحه (ورود / ثبت‌نام)
export default function ThemeToggle({ variant = "bar", className = "" }) {
  const { toggle } = useTheme();
  const look =
    variant === "bar"
      ? "border-white/30 text-white hover:bg-white/10"
      : "border-line bg-card text-ink hover:border-violet";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تغییر حالت روشن / تاریک"
      title="تغییر حالت روشن / تاریک"
      className={`relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border transition ${look} ${className}`}
    >
      {/* ماه (در حالت روشن دیده می‌شود) */}
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="block transition-transform duration-500 dark:hidden">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      {/* خورشید (در حالت تاریک دیده می‌شود) */}
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="hidden transition-transform duration-500 dark:block">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
