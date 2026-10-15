"use client";
import { useHotels } from "./HotelsProvider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import HotelCard from "./HotelCard";
import { useFavorites } from "./FavoritesProvider";
import { useCurrency } from "./CurrencyProvider";
import { applyFilters, describeFilters } from "@/lib/assistant";
import { slugOf } from "@/lib/cities";
import { fa } from "@/lib/fa";

const SUGGEST = [
  "هتل ۴ ستاره در اصفهان با استخر تا ۸۰ دلار",
  "ارزان‌ترین هتل استانبول با صبحانه",
  "هتل لوکس دبی با اسپا و امتیاز بالای ۹",
  "هتل با پارکینگ در باکو زیر ۱۰۰ دلار",
];
const WELCOME = { role: "bot", text: "سلام! بگو دنبال چه هتلی هستی؛ شهر، بودجه، ستاره و امکانات را با زبان خودت بنویس." };

export default function AssistantClient({ hotels: base }) {
  const hotels = useHotels(base);
  const { favs, toggle } = useFavorites();
  const { fmt } = useCurrency();
  const [msgs, setMsgs] = useState([WELCOME]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (msgs.length > 1 || busy) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const ask = async (q) => {
    const m = q.trim();
    if (!m || busy) return;
    setText("");
    setMsgs((x) => [...x, { role: "user", text: m }]);
    setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: m }) });
      if (!r.ok) throw new Error("request failed");
      const d = await r.json();
      const found = applyFilters(hotels, d.filters);
      const fallback = found.length ? `${fa(found.length)} هتل پیدا کردم؛ بهترین‌ها را ببین.` : "😕 متأسفانه هتلی با این شرایط پیدا نکردم. شرط‌ها را کمی ساده‌تر کن یا از دکمه‌ی گفتگو (پایین صفحه) بپرس.";
      setMsgs((x) => [...x, { role: "bot", text: d.reply || fallback, filters: d.filters, results: found.slice(0, 6), total: found.length, source: d.source }]);
    } catch {
      setMsgs((x) => [...x, { role: "bot", text: "مشکلی پیش آمد. دوباره امتحان کن." }]);
    }
    setBusy(false);
  };

  return (
    <>
      <header className="bg-gradient-to-br from-night via-night2 to-[#5B1FA8] pb-12 pt-12 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <h1 className="text-[clamp(30px,5vw,52px)] font-black">دستیار سفر</h1>
          <p className="mt-1 max-w-xl text-white/80">هتل دلخواهت را توصیف کن؛ دستیار فیلترها را می‌سازد و بهترین نتیجه‌ها را نشان می‌دهد.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <div role="log" aria-live="polite" className="space-y-5">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-start" : "flex flex-col items-end gap-3"}>
              <div className={`max-w-[88%] rounded-3xl px-5 py-3 leading-8 sm:max-w-[75%] ${m.role === "user" ? "bg-gradient-to-br from-coral to-violet text-white" : "border border-line bg-card"}`}>
                {m.text}
                {m.filters && describeFilters(m.filters, fmt).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {describeFilters(m.filters, fmt).map((c) => <span key={c} className="rounded-full bg-violet/10 px-2.5 text-xs font-bold text-violet dark:text-aqua">{c}</span>)}
                  </div>
                )}
                {m.source && <p className="mt-1 text-[11px] text-mut">{m.source === "ai" ? "تحلیل با هوش مصنوعی" : "تحلیل ساده"}</p>}
              </div>
              {m.results?.length > 0 && (
                <div className="w-full">
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                    {m.results.map((h) => <HotelCard key={h.id} hotel={h} fav={favs.has(h.id)} onFav={() => toggle(h.id)} />)}
                  </div>
                  {m.total > m.results.length && (
                    <Link href={m.filters.city ? `/city/${slugOf(m.filters.city)}` : "/hotels"} className="mt-4 inline-block text-sm font-bold text-violet dark:text-aqua">
                      دیدن همه‌ی {fa(m.total)} هتل ←
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
          {busy && <p className="text-sm text-mut" aria-live="polite">دستیار در حال جست‌وجو است…</p>}
          <div ref={endRef} />
        </div>

        {msgs.length === 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {SUGGEST.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-line bg-card px-4 py-2 text-start text-sm hover:border-violet">{s}</button>)}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="sticky bottom-3 mt-8 flex gap-2 rounded-2xl border border-line bg-card p-2 shadow-lg">
          <label htmlFor="ask" className="sr-only">پیام به دستیار</label>
          <input id="ask" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="مثلاً: هتل ۴ ستاره در تبریز تا ۶۰ دلار"
            className="min-w-0 flex-1 bg-transparent px-3 outline-none" />
          <button type="submit" disabled={busy || !text.trim()} className="rounded-xl bg-gradient-to-br from-coral to-violet px-6 py-2.5 font-extrabold text-white disabled:opacity-50">ارسال</button>
        </form>
        <p className="mt-3 text-center text-xs text-mut">نتیجه‌ها از هتل‌های سایت می‌آیند.</p>
      </main>
    </>
  );
}
