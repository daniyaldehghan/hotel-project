"use client";
import { useId, useState } from "react";
import { fa } from "@/lib/fa";

export const PALETTE = ["#6C3BFF", "#FF5E7A", "#22E3D2", "#FFC83D", "#2A6BFF", "#FF8A5C", "#22C79A", "#9B2DFF"];
const faNum = (n) => fa(Math.round(n).toLocaleString("en-US")).replace(/,/g, "٬");

export function Spark({ data, color = "#6C3BFF", w = 90, h = 28 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), r = max - min || 1;
  const pts = data.map((v, i) => `${((i * w) / (data.length - 1)).toFixed(1)},${(h - 3 - ((v - min) / r) * (h - 6)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="shrink-0" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// نمودار ناحیه‌ای با راهنمای شناور؛ data: [{ label, v }]
export function AreaChart({ data, fmt = faNum, color = "#6C3BFF", height = 230 }) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState(null);
  const W = 640, H = height, P = { l: 6, r: 6, t: 16, b: 26 };
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.v));
  const step = n > 1 ? (W - P.l - P.r) / (n - 1) : 0;
  const x = (i) => P.l + i * step;
  const y = (v) => P.t + (H - P.t - P.b) * (1 - v / max);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H - P.b} L${x(0).toFixed(1)},${H - P.b} Z`;
  const ticks = [...new Set([0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(p * (n - 1))))];
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, step ? Math.round((px - P.l) / step) : 0)));
  };
  const hd = hover != null ? data[hover] : null;
  return (
    <div className="relative" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full touch-pan-y" onPointerMove={move} onPointerLeave={() => setHover(null)} role="img" aria-label="نمودار روند">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".38" /><stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const gy = P.t + ((H - P.t - P.b) * i) / 3;
          return <line key={i} x1={P.l} x2={W - P.r} y1={gy} y2={gy} stroke="currentColor" strokeOpacity=".09" strokeDasharray="3 4" />;
        })}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {ticks.map((i) => <text key={i} x={x(i)} y={H - 7} fontSize="11" textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fill="currentColor" opacity=".55">{data[i]?.label}</text>)}
        {hd && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke={color} strokeOpacity=".5" />
            <circle cx={x(hover)} cy={y(hd.v)} r="5" fill={color} stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>
      {hd && (
        <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-night px-3 py-1.5 text-center text-xs text-white shadow-lg dark:border dark:border-white/15" style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}>
          <b className="block text-sm">{fmt(hd.v)}</b>{hd.label}
        </div>
      )}
    </div>
  );
}

export function Donut({ items, center, sub, size = 140 }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label="نمودار دایره‌ای">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="4" />
          {total > 0 && items.map((it, i) => {
            const p = (it.value / total) * 100;
            const el = <circle key={it.label} cx="18" cy="18" r="15.9155" fill="none" stroke={it.color || PALETTE[i % PALETTE.length]} strokeWidth="4" strokeDasharray={`${p} ${100 - p}`} strokeDashoffset={-acc} />;
            acc += p;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center"><b className="text-xl leading-tight">{center}</b>{sub && <span className="text-[11px] text-mut">{sub}</span>}</div>
      </div>
      <ul className="min-w-[120px] flex-1 space-y-1.5 text-sm">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: it.color || PALETTE[i % PALETTE.length] }} />{it.label}</span>
            <span className="text-mut">{faNum(it.value)}{total ? ` · ${fa(Math.round((it.value / total) * 100))}٪` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBar({ items, fmt = faNum, empty = "داده‌ای نیست" }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-sm text-mut">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={it.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{it.label}</span>
            <b className="shrink-0">{fmt(it.value)}{it.note && <span className="ms-2 text-xs font-normal text-mut">{it.note}</span>}</b>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(it.value / max) * 100}%`, background: it.color || PALETTE[i % PALETTE.length] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Columns({ items, color = "#6C3BFF", fmt = faNum }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex h-48 items-end gap-2" dir="ltr">
      {items.map((it) => (
        <div key={it.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[11px] text-mut">{fmt(it.value)}</span>
          <div className="w-full rounded-t-lg transition-all duration-500" style={{ height: `${(it.value / max) * 78}%`, minHeight: it.value ? 4 : 0, background: color }} />
          <span className="text-xs">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
