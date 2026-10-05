"use client";
import { useState } from "react";
import CaptchaField, { useCaptcha } from "./Captcha";
import { isEmail, normalizeEmail } from "@/lib/newsletter";

// عضویت در خبرنامه: ذخیره در مونگو، با کپچای تصویری. تصویر کپچا فقط وقتی کاربر روی ایمیل کلیک کرد گرفته می‌شود.
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [answer, setAnswer] = useState("");
  const [website, setWebsite] = useState(""); // تله‌ی ربات: آدم نمی‌بیند
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const captcha = useCaptcha({ lazy: true });

  const show = () => {
    if (!open) {
      setOpen(true);
      captcha.reload();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    show();
    const errs = {};
    const mail = normalizeEmail(email);
    if (!isEmail(mail)) errs.email = "ایمیل معتبر وارد کن.";
    if (!answer.trim()) errs.captcha = "کد داخل تصویر را وارد کن.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mail,
          website,
          captchaId: captcha.id,
          captchaAnswer: answer,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        return;
      }
      setErrors({
        ...(d.errors || {}),
        form: d.errors ? "" : d.error || "ثبت نشد، دوباره امتحان کن.",
      });
    } catch {
      setErrors({ form: "اتصال به سرور برقرار نشد. اینترنتت را بررسی کن." });
    } finally {
      setBusy(false);
      if (!done) {
        setAnswer("");
        captcha.reload();
      } // هر کپچا فقط یک بار قابل استفاده است
    }
  };

  return (
    <section className="mx-auto mt-20 max-w-6xl px-5">
      <div className="rounded-[28px] bg-gradient-to-br from-night to-night2 p-8 text-white md:p-12">
        <h2 className="text-[28px] font-extrabold">
          پیشنهادهای ویژه را زودتر ببین
        </h2>
        <p className="mb-6 mt-1 text-white/80">
          هفته‌ای یک ایمیل، فقط با بهترین تخفیف‌ها. هر وقت خواستی لغو کن.
        </p>
        {done ? (
          <p role="status" className="font-bold text-aqua">
            ثبت شد. از این به بعد پیشنهادهای ویژه را زودتر برایت می‌فرستیم.
          </p>
        ) : (
          <form
            onSubmit={submit}
            noValidate
            className="max-w-lg space-y-3 text-ink"
          >
            {/* فیلد مخفی ضد ربات */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                insetInlineStart: "-9999px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label>
                وب‌سایت
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="nl" className="sr-only">
                  ایمیل
                </label>
                <input
                  id="nl"
                  type="email"
                  dir="ltr"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={show}
                  className={`min-h-[52px] w-full  focus:outline-none rounded-[14px] border bg-white/10 px-4 text-white placeholder:text-white/50 ${
                    errors.email ? "border-coral" : "border-white/25"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-coral">{errors.email}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[52px] rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 font-extrabold text-white disabled:opacity-60"
              >
                {busy ? "…" : "عضویت"}
              </button>
            </div>
            {open && (
              <CaptchaField
                cap={captcha}
                value={answer}
                onChange={(v) => {
                  setAnswer(v);
                  if (errors.captcha) setErrors((x) => ({ ...x, captcha: "" }));
                }}
                error={errors.captcha}
              />
            )}
            {errors.form && (
              <p role="alert" className="text-sm text-coral">
                {errors.form}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
