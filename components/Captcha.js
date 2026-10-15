"use client";
import { useCallback, useEffect, useState } from "react";

// هوک کپچا: تصویر را از /api/captcha می‌گیرد. بعد از هر ارسال (موفق یا ناموفق) باید reload() صدا زده شود
// چون هر تصویر فقط یک بار قابل استفاده است.
// lazy: true → تصویر خودکار نمی‌آید و با اولین reload() گرفته می‌شود (برای فرم‌های صفحه‌ی اول که همه نمی‌بینند/پرشان نمی‌کنند)
export function useCaptcha({ lazy = false } = {}) {
  const [cap, setCap] = useState({ id: "", image: "" });
  const [loading, setLoading] = useState(!lazy);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true); setFailed(false);
    try {
      const res = await fetch("/api/captcha", { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.id) throw new Error();
      setCap({ id: d.id, image: d.image });
    } catch {
      setCap({ id: "", image: "" }); setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!lazy) reload(); }, [reload, lazy]);
  return { ...cap, loading, failed, reload };
}

export default function CaptchaField({ cap, value, onChange, error }) {
  return (
    <div>
      <div className={`rounded-[14px] border bg-card px-3.5 py-2 ${error ? "border-coral" : "border-line focus-within:border-violet"}`}>
        <label htmlFor="captcha" className="block text-xs text-mut">کد امنیتی (حروف و عددهای داخل تصویر را بنویس)</label>
        <div className="mt-1 flex items-center gap-3">
          <input id="captcha" value={value} onChange={(e) => onChange(e.target.value)} dir="ltr" maxLength={8} autoComplete="off" autoCapitalize="characters" spellCheck={false}
            className="w-full min-w-0 bg-transparent font-mono text-lg font-bold uppercase tracking-widest outline-none" />
          <div className="flex shrink-0 items-center gap-2">
            {cap.image && !cap.loading ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cap.image} alt="تصویر کد امنیتی" width={168} height={58} className="h-[46px] w-auto rounded-lg" />
            ) : (
              <div className="grid h-[46px] w-[132px] place-items-center rounded-lg bg-line text-xs text-mut">{cap.failed ? "بارگذاری نشد" : "…"}</div>
            )}
            <button type="button" onClick={cap.reload} disabled={cap.loading} aria-label="تصویر جدید" title="تصویر جدید"
              className="h-9 w-9 shrink-0 rounded-full border border-line text-lg transition hover:border-violet disabled:opacity-50">↻</button>
          </div>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}
