import { countdownParts } from "./useNow";
import { fa } from "@/lib/fa";

const pad = (n) => fa(String(n).padStart(2, "0"));

export default function OfferCountdown({ ms }) {
  const p = countdownParts(ms);
  const items = [["روز", p.d], ["ساعت", p.h], ["دقیقه", p.m], ["ثانیه", p.s]];
  return (
    <div className="flex gap-2" role="timer">
      {items.map(([label, v]) => (
        <div key={label} className="min-w-[58px] rounded-xl bg-night px-2 py-1.5 text-center text-white dark:bg-white/10">
          <b className="block text-xl leading-tight tabular-nums">{pad(v)}</b>
          <span className="text-[11px] opacity-75">{label}</span>
        </div>
      ))}
    </div>
  );
}
