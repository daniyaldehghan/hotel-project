"use client";
import { useEffect } from "react";
import { fa } from "@/lib/fa";
import { Spark } from "./Charts";

export const num = (n) => fa(Math.round(n || 0).toLocaleString("en-US")).replace(/,/g, "٬");
export const dayLabel = (k) => fa(k.slice(5).replace("-", "/"));
export const inputCls = "w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-violet";

export function Card({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-line bg-card p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-extrabold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const KINDS = {
  primary: "bg-gradient-to-br from-coral to-violet text-white font-extrabold",
  ghost: "border border-line bg-card hover:border-violet",
  danger: "bg-coral text-white font-bold",
  soft: "bg-violet/10 text-violet dark:text-aqua font-semibold",
};
export function Btn({ kind = "ghost", className = "", ...p }) {
  return <button type="button" {...p} className={`rounded-xl px-4 py-2 text-sm transition disabled:opacity-40 ${KINDS[kind]} ${className}`} />;
}

export function Field({ label, hint, error, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-mut">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-mut">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-coral">{error}</span>}
    </label>
  );
}

export function Modal({ title, onClose, wide, children }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-night/75 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-card text-ink shadow-2xl sm:rounded-3xl ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="بستن" className="h-9 w-9 rounded-full border border-line">✕</button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function Stat({ label, value, delta, spark, color }) {
  const up = delta > 0;
  return (
    <div className="rounded-3xl border border-line bg-card p-5">
      <p className="text-xs font-semibold text-mut">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <b className="text-2xl leading-tight">{value}</b>
        <Spark data={spark} color={color} />
      </div>
      <p className="mt-1 min-h-[1.25rem] text-xs">
        {delta == null ? <span className="text-mut">—</span> : (
          <span className={delta === 0 ? "text-mut" : up ? "text-[#17a589]" : "text-coral"} dir="ltr">
            {up ? "▲" : delta < 0 ? "▼" : ""} {fa(Math.abs(Math.round(delta)))}٪ <span className="text-mut">نسبت به دوره‌ی قبل</span>
          </span>
        )}
      </p>
    </div>
  );
}

export function Badge({ tone = "mut", children }) {
  const t = { mut: "bg-line text-mut", ok: "bg-[#22C79A]/15 text-[#128a6a] dark:text-[#22E3D2]", bad: "bg-coral/15 text-coral", info: "bg-violet/15 text-violet dark:text-aqua" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${t}`}>{children}</span>;
}
