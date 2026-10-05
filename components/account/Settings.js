"use client";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Card } from "../admin/ui";
import { PROFILE_LIMITS, validateProfile } from "@/lib/profile";
import LogoutButton from "../LogoutButtom";

// همان ظاهر ورودی‌های فرم ثبت‌نام
const input =
  "w-full px-8 py-4 rounded-lg font-medium bg-card text-ink border placeholder:text-mut text-sm focus:outline-none focus:border-violet";

function Row({ id, label, hint, error, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-mut"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-coral">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-mut">{hint}</p>
      )}
    </div>
  );
}

// ویرایش نام، ایمیل و شماره‌ی تماس (اختیاری) از طریق /api/account
export default function Settings({ profile, onSaved }) {
  const { update } = useSession();
  const [f, setF] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    currentPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setMsg(null);
  };

  const emailChanged =
    f.email.trim().toLowerCase() !== profile.email.toLowerCase();
  const dirty =
    f.name.trim() !== profile.name ||
    emailChanged ||
    f.phone.trim() !== profile.phone;
  const cls = (k) => `${input} ${errors[k] ? "border-coral" : "border-line"}`;

  const save = async (e) => {
    e.preventDefault();
    if (busy || !dirty) return;
    setMsg(null);
    const v = validateProfile({ name: f.name, email: f.email, phone: f.phone });
    const errs = { ...v.errors };
    if (emailChanged && !f.currentPassword)
      errs.currentPassword = "برای تغییر ایمیل، رمز عبور فعلی‌ات را وارد کن.";
    setErrors(errs);
    if (!v.ok || errs.currentPassword) return;

    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v.data,
          currentPassword: emailChanged ? f.currentPassword : undefined,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) {
        setErrors(out.errors || {});
        setMsg({
          ok: false,
          text: out.error || "ذخیره نشد، دوباره امتحان کن.",
        });
        return;
      }
      if (out.emailChanged && out.relogin) {
        // نشست قدیمی: با ایمیل جدید دوباره وارد شو
        await signOut({ callbackUrl: "/signin" });
        return;
      }
      if (out.emailChanged) await update({ refresh: true }); // نشست با ایمیل جدید هماهنگ شود تا کاربر از حساب بیرون نیفتد
      onSaved(out.profile);
      setF({ ...out.profile, currentPassword: "" });
      setErrors({});
      setMsg({
        ok: true,
        text: out.emailChanged
          ? "تغییرات ذخیره شد. از این به بعد با ایمیل جدید وارد می‌شوی."
          : "تغییرات ذخیره شد.",
      });
    } catch {
      setMsg({
        ok: false,
        text: "اتصال به سرور برقرار نشد. اینترنتت را بررسی کن و دوباره امتحان کن.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="⚙️ تنظیمات حساب">
      <form
        onSubmit={save}
        noValidate
        className="mx-auto max-w-md space-y-5 py-2"
      >
        <Row id="s-name" label="نام" error={errors.name}>
          <input
            id="s-name"
            type="text"
            autoComplete="name"
            maxLength={PROFILE_LIMITS.name}
            value={f.name}
            onChange={set("name")}
            className={cls("name")}
          />
        </Row>

        <Row
          id="s-email"
          label="ایمیل"
          error={errors.email}
          hint="ایمیل همان نام کاربری ورود توست."
        >
          <input
            id="s-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            maxLength={PROFILE_LIMITS.email}
            value={f.email}
            onChange={set("email")}
            className={cls("email")}
          />
        </Row>

        {emailChanged && (
          <Row
            id="s-pass"
            label="رمز عبور فعلی"
            error={errors.currentPassword}
            hint="برای امنیت، تغییر ایمیل با رمز عبور تأیید می‌شود."
          >
            <input
              id="s-pass"
              type="password"
              autoComplete="current-password"
              value={f.currentPassword}
              onChange={set("currentPassword")}
              className={cls("currentPassword")}
            />
          </Row>
        )}

        <Row
          id="s-phone"
          label="شماره‌ی تماس (اختیاری)"
          error={errors.phone}
          hint="اگر نمی‌خواهی ثبت شود خالی بگذار. هر وقت خواستی پاکش کن."
        >
          <input
            id="s-phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            maxLength={20}
            placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
            value={f.phone}
            onChange={set("phone")}
            className={cls("phone")}
          />
        </Row>

        {msg && (
          <p
            role={msg.ok ? "status" : "alert"}
            className={`rounded-xl border px-3 py-2 text-sm ${
              msg.ok
                ? "border-[#22C79A]/40 bg-[#22C79A]/10 text-[#128a6a] dark:text-[#22E3D2]"
                : "border-coral/40 bg-coral/10 text-coral"
            }`}
          >
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !dirty}
          className="w-full rounded-lg bg-gradient-to-br from-coral to-violet py-4 font-semibold tracking-wide text-white transition-all duration-300 focus:outline-none disabled:opacity-50"
        >
          {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </button>
        <LogoutButton />
      </form>
    </Card>
  );
}
