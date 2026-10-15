"use client";
import { useCallback, useEffect, useState } from "react";
import { Badge, Btn, Card } from "./ui";
import { fa } from "@/lib/fa";

const FILTERS = [["pending", "در انتظار تأیید"], ["approved", "تأییدشده"]];
const when = (d) => fa(new Date(d).toLocaleDateString("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" }));

// نظرها را از /api/reviews می‌گیرد؛ تأیید = نمایش در سایت، رد = حذف کامل از دیتابیس
export default function ReviewsPanel({ notify, onCount }) {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState(null);
  const [counts, setCounts] = useState({ pending: 0, approved: 0 });
  const [busy, setBusy] = useState(""); // id نظری که در حال پردازش است
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/reviews?status=${status}`, { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "خطا در گرفتن نظرها.");
      setItems(d.items);
      setCounts(d.counts);
      onCount?.(d.counts.pending);
    } catch (e) {
      setItems([]);
      setError(e.message || "اتصال به سرور برقرار نشد.");
    }
  }, [status, onCount]);

  useEffect(() => { setItems(null); load(); }, [load]);

  const act = async (id, kind) => {
    if (busy) return;
    setBusy(id);
    try {
      const res = await fetch(kind === "approve" ? "/api/reviews" : `/api/reviews?id=${encodeURIComponent(id)}`, {
        method: kind === "approve" ? "PATCH" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: kind === "approve" ? JSON.stringify({ id }) : undefined,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "انجام نشد.");
      notify(kind === "approve" ? "نظر تأیید شد و در سایت نمایش داده می‌شود." : "نظر حذف شد.");
      await load();
    } catch (e) {
      notify(e.message || "اتصال به سرور برقرار نشد.");
    } finally {
      setBusy("");
    }
  };

  const reject = (r) => {
    const msg = r.status === "pending" ? "این نظر رد و برای همیشه پاک شود؟" : "این نظر از سایت و دیتابیس حذف شود؟";
    if (confirm(msg)) act(r.id, "delete");
  };

  return (
    <Card
      title="نظرات کاربران"
      action={
        <div className="flex gap-1.5" role="tablist" aria-label="فیلتر نظرها">
          {FILTERS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={status === k} onClick={() => setStatus(k)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${status === k ? "border-violet bg-violet/10 text-violet dark:text-aqua" : "border-line hover:border-violet"}`}>
              {l} <span className="text-xs text-mut">({fa(counts[k])})</span>
            </button>
          ))}
        </div>
      }
    >
      {error ? (
        <div role="alert" className="rounded-xl border border-coral/40 bg-coral/10 p-4 text-sm text-coral">
          {error} <Btn className="ms-2 !py-1" onClick={load}>تلاش دوباره</Btn>
        </div>
      ) : items === null ? (
        <p className="text-mut">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-mut">{status === "pending" ? "نظر جدیدی برای بررسی نیست. 🎉" : "هنوز نظری تأیید نشده."}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
              <div className="min-w-0 flex-1 basis-72">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{r.name}</b>
                  <span className="text-sun" aria-label={`${fa(r.rating)} ستاره`}>{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></span>
                  <Badge tone={r.status === "approved" ? "ok" : "info"}>{r.status === "approved" ? "تأییدشده" : "جدید"}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-mut">
                  {r.trip && <>{r.trip} · </>}{when(r.createdAt)}{r.userEmail && <> · <span dir="ltr">{r.userEmail}</span></>}
                </p>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-7">{r.text}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {r.status === "pending" && <Btn kind="primary" disabled={!!busy} onClick={() => act(r.id, "approve")}>{busy === r.id ? "…" : "✓ تأیید"}</Btn>}
                <Btn disabled={!!busy} onClick={() => reject(r)} className="text-coral">{r.status === "pending" ? "✕ رد" : "حذف"}</Btn>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
