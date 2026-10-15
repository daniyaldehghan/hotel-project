"use client";
import { useEffect, useState } from "react";

// ساعتی که هر ثانیه می‌زند. offset = (ساعت سرور − ساعت مرورگر)، تا با دستکاری ساعت کاربر تایمر تغییر نکند.
export function useNow(offset = 0) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const tick = () => setNow(Date.now() + offset);
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [offset]);
  return now;
}

export function countdownParts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
