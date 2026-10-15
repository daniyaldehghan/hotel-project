"use client";
import { useMemo } from "react";
import { LEVELS, checkPassword } from "@/lib/passwordStrength";

const COLOR = { weak: "bg-coral", medium: "bg-sun", strong: "bg-[#22C79A]" };
const TEXT = { weak: "text-coral", medium: "text-[#b8860b] dark:text-sun", strong: "text-[#128a6a] dark:text-[#22E3D2]" };

export default function PasswordStrength({ password, email, name }) {
  const r = useMemo(() => checkPassword(password, { email, name }), [password, email, name]);
  if (!r.level) return null;
  const { label, bars } = LEVELS[r.level];

  return (
    <div className="mt-3 text-xs" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= bars ? COLOR[r.level] : "bg-line"}`} />
          ))}
        </div>
        <b className={TEXT[r.level]}>رمز {label}</b>
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-0.5 text-mut">
        {r.checks.map((c) => (
          <li key={c.label} className={c.ok ? "text-[#128a6a] dark:text-[#22E3D2]" : ""}>
            <span aria-hidden="true">{c.ok ? "✓" : "○"}</span> {c.label}
          </li>
        ))}
      </ul>
      {r.level !== "strong" && r.tips.length > 0 && (
        <div className="mt-2 rounded-lg border border-line bg-card px-3 py-2 text-mut">
          <b className="mb-0.5 block text-ink">راهنما</b>
          {r.tips.map((t) => <p key={t}>• {t}</p>)}
        </div>
      )}
    </div>
  );
}
