"use client";
import { useEffect, useState } from "react";
import { CHAT_EVENT, CHAT_KEY, MISS_KEY, loadMisses, loadThreads } from "@/lib/chat";

// گفتگوها + جستجوهای بی‌نتیجه؛ با تغییر در همین تب یا تب‌های دیگر به‌روز می‌شود
export function useChatData() {
  const [d, setD] = useState({ threads: [], misses: [] });
  useEffect(() => {
    const load = () => setD({ threads: loadThreads(), misses: loadMisses() });
    const onStorage = (e) => { if (e.key === null || e.key === CHAT_KEY || e.key === MISS_KEY) load(); };
    load();
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHAT_EVENT, load);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(CHAT_EVENT, load); };
  }, []);
  return d;
}
