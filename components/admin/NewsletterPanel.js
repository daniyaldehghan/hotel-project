"use client";
import { useCallback, useEffect, useState } from "react";
import { Badge, Btn, Card, inputCls } from "./ui";
import { downloadFile, csvOf } from "./BookingsPanel";
import { fa } from "@/lib/fa";

const FILTERS = [["", "همه"], ["active", "فعال"], ["unsubscribed", "لغوشده"]];
const when = (d) => fa(new Date(d).toLocaleDateString("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" }));

// مشترک‌های خبرنامه از /api/newsletter؛ جستجو، خروجی CSV (فقط فعال‌ها) و حذف
export default function NewsletterPanel({ notify }) {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState(""); // مقدار جستجوی اعمال‌شده (بعد از مکث تایپ)
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => { const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);

  const load = useCallback(async () => {
    setError("");
    try {
      const sp = new URLSearchParams({ page: String(page) });
      if (status) sp.set("status", status);
      if (query) sp.set("q", query);
      const res = await fetch(`/api/newsletter?${sp}`, { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "خطا در گرفتن مشترک‌ها.");
      setData(d);
    } catch (e) {
      setData((x) => x || { items: [], counts: { active: 0, unsubscribed: 0 }, pages: 1, total: 0 });
      setError(e.message || "اتصال به سرور برقرار نشد.");
    }
  }, [status, query, page]);
  useEffect(() => { load(); }, [load]);

  const remove = async (s) => {
    if (busy || !confirm(`${s.email} از دیتابیس حذف شود؟`)) return;
    setBusy(s.id);
    try {
      const res = await fetch(`/api/newsletter?id=${encodeURIComponent(s.id)}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "حذف نشد.");
      notify("مشترک حذف شد.");
      await load();
    } catch (e) { notify(e.message); }
    setBusy("");
  };

  const exportCsv = async () => {
    try {
      const res = await fetch("/api/newsletter?export=1", { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "خروجی ساخته نشد.");
      downloadFile("newsletter-subscribers.csv", csvOf([["ایمیل", "تاریخ عضویت"], ...d.items.map((s) => [s.email, s.createdAt.slice(0, 10)])]));
    } catch (e) { notify(e.message); }
  };

  const counts = data?.counts || { active: 0, unsubscribed: 0 };
  return (
    <Card
      title="مشترک‌های خبرنامه"
      action={<Btn onClick={exportCsv} disabled={!counts.active}>خروجی CSV (فعال‌ها)</Btn>}
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1"><span className="mb-1 block text-xs font-semibold text-mut">جستجوی ایمیل</span>
          <input className={inputCls} dir="ltr" value={q} onChange={(e) => setQ(e.target.value)} placeholder="name@example.com" /></label>
        <div className="flex gap-1.5" role="tablist" aria-label="فیلتر وضعیت">
          {FILTERS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={status === k} onClick={() => { setStatus(k); setPage(1); }}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${status === k ? "border-violet bg-violet/10 text-violet dark:text-aqua" : "border-line hover:border-violet"}`}>
              {l}{k === "active" && <span className="ms-1 text-xs text-mut">({fa(counts.active)})</span>}{k === "unsubscribed" && <span className="ms-1 text-xs text-mut">({fa(counts.unsubscribed)})</span>}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-coral/40 bg-coral/10 p-4 text-sm text-coral">{error} <Btn className="ms-2 !py-1" onClick={load}>تلاش دوباره</Btn></div>
      ) : data === null ? (
        <p className="text-mut">در حال بارگذاری…</p>
      ) : data.items.length === 0 ? (
        <p className="py-8 text-center text-mut">{query || status ? "مشترکی پیدا نشد." : "هنوز کسی عضو نشده."}</p>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {data.items.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <b dir="ltr" className="block truncate">{s.email}</b>
                  <span className="text-xs text-mut">عضویت: {when(s.createdAt)}{s.unsubscribedAt && <> · لغو: {when(s.unsubscribedAt)}</>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={s.status === "active" ? "ok" : "mut"}>{s.status === "active" ? "فعال" : "لغوشده"}</Badge>
                  <Btn disabled={!!busy} onClick={() => remove(s)} className="!px-3 !py-1 text-coral">{busy === s.id ? "…" : "حذف"}</Btn>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between text-sm text-mut">
            <span>{fa(data.total)} مشترک · صفحه‌ی {fa(data.page || 1)} از {fa(Math.max(1, data.pages))}</span>
            <div className="flex gap-2"><Btn disabled={page <= 1} onClick={() => setPage(page - 1)} className="!py-1.5">قبلی</Btn><Btn disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="!py-1.5">بعدی</Btn></div>
          </div>
        </>
      )}
    </Card>
  );
}
