// محاسبه‌ی آمار سفرهای کاربر از روی رزروها (همه‌ی تاریخ‌ها به‌صورت YYYY-MM-DD)
import { fa } from "./fa";

const DAY = 864e5;
export const todayIso = () => new Date().toISOString().slice(0, 10);
export const addDays = (s, n) => { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const addDaysIso = addDays;
export const daysUntil = (iso) => Math.round((new Date(`${iso}T00:00:00Z`) - new Date(`${todayIso()}T00:00:00Z`)) / DAY);
export const kindOf = (b, today = todayIso()) => (b.status === "cancelled" || b.status === "voided" ? "cancelled" : b.checkOut < today ? "past" : "upcoming");
export const freeCancelUntil = (b) => addDays(b.checkIn, -2);

export const countdown = (b) => {
  const d = daysUntil(b.checkIn);
  if (d > 1) return `${fa(d)} روز دیگر`;
  if (d === 1) return "فردا";
  if (d === 0) return "امروز";
  return "در حال اقامت 🏨";
};

// سطح مسافر بر اساس تعداد شب‌های رزروشده (فقط نمایشی؛ مزیت مالی ندارد)
export const LEVELS = [
  { name: "مسافر تازه‌کار", emoji: "🌱", min: 0 },
  { name: "مسافر پرسفر", emoji: "🧳", min: 5 },
  { name: "ماجراجو", emoji: "🧭", min: 15 },
  { name: "جهانگرد", emoji: "🌍", min: 30 },
];
export function levelOf(nights) {
  let i = 0;
  LEVELS.forEach((l, k) => { if (nights >= l.min) i = k; });
  const cur = LEVELS[i], next = LEVELS[i + 1] || null;
  return { cur, next, left: next ? next.min - nights : 0, pct: next ? Math.round(((nights - cur.min) / (next.min - cur.min)) * 100) : 100 };
}

export function summarize(list = []) {
  const today = todayIso();
  const upcoming = [], past = [], cancelled = [];
  list.forEach((b) => ({ upcoming, past, cancelled }[kindOf(b, today)].push(b)));
  upcoming.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  past.sort((a, b) => b.checkOut.localeCompare(a.checkOut));
  const active = [...upcoming, ...past];
  const spent = active.reduce((s, b) => s + (b.totalUsd || 0), 0);
  const nights = active.reduce((s, b) => s + (b.nights || 0), 0);

  const mf = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { month: "short" });
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
    return { key: d.toISOString().slice(0, 7), label: mf.format(d), value: 0 };
  });
  active.forEach((b) => { const m = months.find((x) => x.key === (b.createdAt || "").slice(0, 7)); if (m) m.value += b.totalUsd || 0; });

  const byCity = new Map();
  active.forEach((b) => byCity.set(b.city, (byCity.get(b.city) || 0) + 1));
  return {
    upcoming, past, cancelled, active, spent, nights, months, total: list.length,
    next: upcoming[0] || null,
    hotelsCount: new Set(active.map((b) => b.hotelId)).size,
    cities: [...byCity].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })),
  };
}
