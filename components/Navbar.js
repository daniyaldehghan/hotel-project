"use client";
import { useState } from "react";
import Link from "next/link";
import { useFavorites } from "./FavoritesProvider";
import CurrencySelect from "./CurrencySelect";
import ThemeToggle from "./ThemeToggle";
import { fa } from "@/lib/fa";
import { useSession } from "next-auth/react";

const LINKS = [
  { h: "/#destinations", t: "مقصدها" },
  { h: "/hotels", t: "همه هتل‌ها" },
  { h: "/compare", t: "مقایسه", cmp: true },
  { h: "/assistant", t: "دستیار سفر" },
  { h: "/blog", t: "وبلاگ" },
  { h: "/contact", t: "تماس با ما" },
];
const MORE = [
  { h: "/account", t: "👤 پنل من" },
  { h: "/bookings", t: "رزروهای من" },
  { h: "/track", t: "پیگیری رزرو" },
  { h: "/#how", t: "نحوه رزرو" },
  { h: "/#faq", t: "سؤالات متداول" },
  { h: "/", t: "صفحه اصلی" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { cmp } = useFavorites();
  const close = () => setOpen(false);
  const { data } = useSession();

  return (
    <div className="sticky top-0 z-40 bg-night/95 text-white dark:border-b dark:border-white/10">
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5"
        aria-label="منوی اصلی"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 text-2xl font-black"
        >
          <i className="h-7 w-7 rounded-[50%_50%_50%_4px] bg-gradient-to-br from-sun to-coral" />
          سفرینو
        </Link>

        <div className="hidden items-center gap-4 text-sm lg:flex xl:gap-5">
          {LINKS.map((l) => (
            <Link
              key={l.h}
              href={l.h}
              className="whitespace-nowrap opacity-85 hover:opacity-100"
            >
              {l.t}
              {l.cmp && cmp.length > 0 && (
                <span className="ms-1.5 rounded-full bg-violet px-1.5 text-[11px] font-bold">
                  {fa(cmp.length)}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <CurrencySelect className="hidden lg:block" />

          <>
            {data ? (
              <Link
                href="/account"
                aria-label="پنل کاربری"
                className="whitespace-nowrap rounded-full border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10 sm:px-4"
              >
                <span aria-hidden="true">👤</span>
                <span className="hidden sm:inline"> پنل من</span>
              </Link>
            ) : (
              <Link
                href="/signin"
                className="rounded-full bg-gradient-to-br from-coral to-violet px-4 py-1.5 text-sm font-bold"
              >
                ورود
              </Link>
            )}
            {data?.user?.isGuest && (
              <Link
                href="/signup"
                className="whitespace-nowrap rounded-full bg-gradient-to-br from-coral to-violet px-3 py-1.5 text-sm font-bold sm:px-4"
              >
                ثبت‌نام
              </Link>
            )}
            {data?.user?.role === "ADMIN" ? (
              <Link
                href="/admin"
                aria-label="پنل کاربری"
                className="whitespace-nowrap rounded-full border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10 sm:px-4"
              >
                <span aria-hidden="true">⚙</span>
                <span className="hidden sm:inline"> پنل مدیریت</span>
              </Link>
            ) : null}
          </>
          <div className=" ">
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="منو"
              className="  grid h-10 w-10 place-items-center rounded-lg border border-white/25 lg:hidden"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div className=" fixed z-50 bg-night w-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 px-5 pb-5 lg:hidden">
          <div className="grid grid-cols-2 gap-x-4">
            {[...LINKS, ...MORE].map((l) => (
              <Link key={l.h} href={l.h} onClick={close} className="py-2.5">
                {l.t}
                {l.cmp && cmp.length > 0 && (
                  <span className="ms-1.5 rounded-full bg-violet px-1.5 text-[11px] font-bold">
                    {fa(cmp.length)}
                  </span>
                )}
              </Link>
            ))}
          </div>
          <div className="mt-2">
            <CurrencySelect />
          </div>
        </div>
      )}
    </div>
  );
}
