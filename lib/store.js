// تغییرات ادمین (افزودن/ویرایش/حذف هتل و دسته‌بندی) روی همین مرورگر (localStorage) ذخیره می‌شود.
// داده‌ی اصلی در data/hotels.js دست‌نخورده می‌ماند و تغییرات روی آن «اعمال» می‌شود.
export const KEY = "sara:admin:v1";
export const EMPTY = { added: [], removed: [], edits: {}, cats: null, tagMap: {}, seq: 1001 };

export const ALL_AMENITIES = [
  "وای‌فای", "صبحانه", "استخر", "پارکینگ", "اسپا", "سالن ورزش", "ترانسفر فرودگاه", "رستوران",
  "کافه", "میز پذیرش ۲۴ ساعته", "سرویس اتاق ۲۴ ساعته", "تهویه مطبوع", "اتاق خانوادگی",
  "دسترسی با ویلچر", "خشکشویی", "سالن همایش",
];

export function loadOverrides() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || "null");
    return r && typeof r === "object" ? { ...EMPTY, ...r } : EMPTY;
  } catch { return EMPTY; }
}
export function saveOverrides(o) {
  try { localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch { return false; }
}
export const clearOverrides = () => { try { localStorage.removeItem(KEY); } catch {} };

export const minRoomPrice = (rooms) => Math.min(...rooms.map((r) => Number(r.price) || 0));

export function mergeHotels(base, ov) {
  const removed = new Set(ov.removed);
  const tag = (t) => (t in ov.tagMap ? ov.tagMap[t] : t);
  return [...base, ...ov.added]
    .filter((h) => !removed.has(h.id))
    .map((h) => {
      const e = ov.edits[h.id];
      const m = e ? { ...h, ...e } : h;
      return { ...m, tag: tag(m.tag) };
    });
}

export function deriveCategories(base, ov, merged) {
  const start = ov.cats ?? [...new Set(base.map((h) => h.tag).filter(Boolean))];
  return [...new Set([...start, ...merged.map((h) => h.tag).filter(Boolean)])];
}

// ---------- داده‌ی نمونه برای نمودارها ----------
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const iso = (t) => new Date(t).toISOString();
const day = (t) => iso(t).slice(0, 10);

export function seedBookings(hotels, n = 70) {
  const pool = hotels.filter((h) => h.rooms?.length);
  if (!pool.length) return [];
  const w = pool.map((h) => Math.sqrt(h.reviews || 1) + (h.rating || 5));
  const total = w.reduce((s, x) => s + x, 0);
  const pick = () => { let r = Math.random() * total; for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; } return pool[0]; };
  const now = Date.now();
  return Array.from({ length: n }, () => {
    const h = pick();
    const room = h.rooms[rnd(0, h.rooms.length - 1)];
    const nights = [1, 2, 2, 3, 3, 3, 4, 5, 7][rnd(0, 8)];
    const rooms = Math.random() < 0.85 ? 1 : 2;
    const created = now - Math.pow(Math.random(), 1.5) * 90 * 864e5;
    const checkIn = created + rnd(2, 45) * 864e5;
    const base = room.price * nights * rooms;
    return {
      code: "SR-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      hotelId: h.id, hotelName: h.name, city: h.city, room: room.name, rooms,
      guests: rooms * rnd(1, 2), checkIn: day(checkIn), checkOut: day(checkIn + nights * 864e5), nights,
      totalUsd: Math.round(base * (1 + Math.random() * 0.15) * 1.1 * 100) / 100,
      pay: Math.random() < 0.65 ? "online" : "hotel",
      status: Math.random() < 0.13 ? "cancelled" : "confirmed",
      createdAt: iso(created), demo: true,
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
