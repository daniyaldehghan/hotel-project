export const TAX_RATE = 0.1;
export const COUPONS = { SARA20: { pct: 0.2, label: "۲۰٪ تخفیف اولین رزرو" } };

// unit: night | person-night | person | room | booking | percent
export const ADDONS = [
  { id: "breakfast", label: "صبحانه", desc: "هر صبح برای همه‌ی مهمان‌ها", price: 8, unit: "person-night", includedBy: "صبحانه" },
  { id: "parking", label: "پارکینگ", desc: "پارکینگ اختصاصی هتل", price: 6, unit: "night", includedBy: "پارکینگ" },
  { id: "transfer", label: "ترانسفر فرودگاه (رفت و برگشت)", desc: "خودروی اختصاصی تا درب هتل", price: 40, unit: "booking", includedBy: "ترانسفر فرودگاه" },
  { id: "spa", label: "ورود به اسپا", desc: "یک جلسه برای هر نفر", price: 30, unit: "person", requires: "اسپا" },
  { id: "late", label: "تأخیر در خروج تا ساعت ۱۶", desc: "برای هر اتاق", price: 15, unit: "room" },
  { id: "bed", label: "تخت اضافه", desc: "برای هر شب اقامت", price: 18, unit: "night" },
  { id: "flex", label: "تغییر تاریخ رایگان", desc: "۴٪ مبلغ اتاق؛ تا ۲۴ ساعت قبل از ورود", pct: 0.04, unit: "percent" },
];

export const nightsBetween = (a, b) => {
  const d = (new Date(b) - new Date(a)) / 864e5;
  return Number.isFinite(d) ? Math.max(0, Math.round(d)) : 0;
};

export function addonState(a, hotel) {
  return {
    included: !!a.includedBy && hotel.amenities.includes(a.includedBy),
    unavailable: !!a.requires && !hotel.amenities.includes(a.requires),
  };
}

export function calcTotals({ hotel, room, nights, rooms, guests, selected, coupon }) {
  const roomTotal = room.price * nights * rooms;
  const qtyOf = { night: nights, "person-night": guests * nights, person: guests, room: rooms, booking: 1 };
  const lines = [];
  for (const a of ADDONS) {
    if (!selected.includes(a.id)) continue;
    const st = addonState(a, hotel);
    if (st.included || st.unavailable) continue;
    if (a.unit === "percent") lines.push({ id: a.id, label: a.label, pct: a.pct, amount: roomTotal * a.pct });
    else lines.push({ id: a.id, label: a.label, qty: qtyOf[a.unit], unitPrice: a.price, amount: qtyOf[a.unit] * a.price });
  }
  const addons = lines.reduce((s, l) => s + l.amount, 0);
  const subtotal = roomTotal + addons;
  const discount = coupon ? roomTotal * coupon.pct : 0;
  const tax = (subtotal - discount) * TAX_RATE;
  return { roomTotal, lines, addons, subtotal, discount, tax, total: subtotal - discount + tax };
}
