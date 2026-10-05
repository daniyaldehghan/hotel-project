"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "./FavoritesProvider";
import { fa } from "@/lib/fa";

export default function CompareBar() {
  const { cmp, clearCmp } = useFavorites();
  const path = usePathname();
  if (!cmp.length || path === "/compare" || path?.startsWith("/admin")) return null;
  const ok = cmp.length >= 2;
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl bg-night px-4 py-3 text-white shadow-2xl dark:border dark:border-white/15">
      <p className="text-sm"><b>{fa(cmp.length)}</b> هتل برای مقایسه{!ok && <span className="text-white/70"> (حداقل ۲ هتل)</span>}</p>
      <div className="flex items-center gap-2">
        <button onClick={clearCmp} className="px-2 text-sm text-white/80 hover:text-white">پاک کردن</button>
        <Link href="/compare" aria-disabled={!ok} tabIndex={ok ? 0 : -1}
          className={`rounded-xl bg-gradient-to-br from-coral to-violet px-5 py-2 text-sm font-extrabold ${ok ? "" : "pointer-events-none opacity-50"}`}>مقایسه</Link>
      </div>
    </div>
  );
}
