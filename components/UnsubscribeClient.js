"use client";
import { useState } from "react";
import Link from "next/link";
import { isToken } from "@/lib/newsletter";

// لغو عضویت خبرنامه با لینک ایمیل (?token=...)
export default function UnsubscribeClient({ token = "" }) {
  const [state, setState] = useState("idle"); // idle | busy | done | error
  const [msg, setMsg] = useState("");
  const valid = isToken(token);

  const go = async () => {
    setState("busy"); setMsg("");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setState("done");
      else { setState("error"); setMsg(d.error || "انجام نشد، دوباره امتحان کن."); }
    } catch { setState("error"); setMsg("اتصال به سرور برقرار نشد."); }
  };

  return (
    <div className="rounded-3xl border border-line bg-card p-8 text-center">
      {state === "done" ? (
        <>
          <h1 className="text-2xl font-extrabold">عضویتت لغو شد</h1>
          <p className="mt-2 text-mut">دیگر ایمیلی از خبرنامه‌ی سرا نمی‌گیری. هر وقت خواستی می‌توانی دوباره عضو شوی.</p>
        </>
      ) : !valid ? (
        <>
          <h1 className="text-2xl font-extrabold">لینک معتبر نیست</h1>
          <p className="mt-2 text-mut">لینک لغو عضویت را از آخرین ایمیل خبرنامه دوباره باز کن.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold">لغو عضویت در خبرنامه</h1>
          <p className="mt-2 text-mut">مطمئنی می‌خواهی دیگر پیشنهادهای ویژه را ایمیل نگیری؟</p>
          {state === "error" && <p role="alert" className="mt-3 text-sm text-coral">{msg}</p>}
          <button onClick={go} disabled={state === "busy"} className="mt-5 rounded-[14px] bg-coral px-8 py-3 font-extrabold text-white disabled:opacity-60">{state === "busy" ? "…" : "بله، لغو کن"}</button>
        </>
      )}
      <div className="mt-6"><Link href="/" className="text-sm underline text-mut">بازگشت به صفحه اول</Link></div>
    </div>
  );
}
