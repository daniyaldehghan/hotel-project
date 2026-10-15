"use client";
import { useEffect, useRef } from "react";
import { logMiss } from "@/lib/chat";

// هر جای سایت می‌تواند دستیار چت را (با متن آماده) باز کند
export const askAssistant = (text) => { try { window.dispatchEvent(new CustomEvent("sara:chat", { detail: { text } })); } catch {} };

export default function NoResults({ query = "", title = "متأسفانه چیزی پیدا نشد", note, suggestions = [], onPick, onReset, resetLabel = "پاک کردن جستجو", emoji = "😕", compact = false, ask }) {
  const q = query.trim();
  const last = useRef("");
  // جستجوی بی‌نتیجه (بعد از مکث تایپ) برای آمار ادمین ثبت می‌شود
  useEffect(() => {
    if (!q || q === last.current) return;
    const t = setTimeout(() => { last.current = q; logMiss(q, "search"); }, 1200);
    return () => clearTimeout(t);
  }, [q]);
  const text = ask ?? (q || "هتلی با این فیلترها پیدا نشد، کمک می‌کنی؟");

  if (compact) {
    return (
      <span role="status" className="flex shrink-0 items-center gap-2 text-sm text-mut">
        <span aria-hidden="true" className="text-lg">{emoji}</span>
        {title}{q && <> برای «<b className="text-ink">{q}</b>»</>}
        <button onClick={() => askAssistant(text)} className="font-bold text-violet underline dark:text-aqua">از دستیار بپرس</button>
      </span>
    );
  }
  return (
    <div role="status" className="col-span-full rounded-3xl border-2 border-dashed border-line p-8 text-center sm:p-12">
      <div className="sara-bounce mx-auto mb-3 w-fit text-5xl" aria-hidden="true">{emoji}</div>
      <p className="text-lg font-extrabold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-mut">
        {q && <>برای «<b className="text-ink">{q}</b>» نتیجه‌ای نداریم. </>}{note}
      </p>
      {suggestions.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm text-mut">شاید اینها را بخواهی:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => <button key={s} onClick={() => onPick?.(s)} className="rounded-full border border-line bg-card px-4 py-1.5 text-sm hover:border-violet">{s}</button>)}
          </div>
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={() => askAssistant(text)} className="rounded-[14px] bg-gradient-to-br from-coral to-violet px-6 py-2.5 font-extrabold text-white">💬 از دستیار بپرس</button>
        {onReset && <button onClick={onReset} className="rounded-[14px] border border-line px-6 py-2.5 font-bold">{resetLabel}</button>}
      </div>
    </div>
  );
}
