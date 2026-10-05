// ابزارهای سمت سرورِ رزروها (فقط در API استفاده شود)
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { HOTELS } from "@/data/hotels";
import { TAX_RATE, COUPONS } from "@/lib/pricing";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون حروف مشابه (O/0، I/1)
// کد پیگیری تصادفی و غیرقابل حدس: SR-XXXXXX
export const newCode = () => "SR-" + Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join("");

export const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export const readBody = async (req) => { try { const b = await req.json(); return b && typeof b === "object" ? b : null; } catch { return null; } };

export const getSession = () => getServerSession(authOptions);
export const isAdminSession = (s) => s?.user?.role === "ADMIN";

// فیلتر «رزروهای خودِ کاربر»: با شناسه‌ی حساب یا ایمیل نشست
export function ownerFilter(session) {
  const id = session?.user?.id, email = (session?.user?.email || "").toLowerCase();
  const or = [];
  if (id) or.push({ userId: String(id) });
  if (email) or.push({ userEmail: email });
  return or.length ? { $or: or } : null;
}

const iso = (d) => (d ? new Date(d).toISOString() : undefined);
export const baseShape = (b) => ({
  code: b.code, hotelId: b.hotelId, hotelName: b.hotelName, city: b.city, room: b.room, rooms: b.rooms,
  guests: b.guests, checkIn: b.checkIn, checkOut: b.checkOut, nights: b.nights, totalUsd: b.totalUsd,
  pay: b.pay, status: b.status, demo: !!b.demo, createdAt: iso(b.createdAt), voidedAt: iso(b.voidedAt),
});
export const adminShape = (b) => ({
  ...baseShape(b), guestName: b.guestName, guestEmail: b.guestEmail, guestPhone: b.guestPhone, note: b.note,
  userEmail: b.userEmail, voidedBy: b.voidedBy, cancelledAt: iso(b.cancelledAt),
});
// آنچه در پیگیری عمومی دیده می‌شود: ایمیل، تلفن و توضیحات هرگز بیرون نمی‌رود
export const publicShape = (b) => {
  const { hotelId, demo, ...rest } = baseShape(b);
  return { ...rest, firstName: String(b.guestName || "").split(/\s+/)[0] };
};

// برای هتل‌های اصلی سایت (data/hotels.js) اسم و شهر را از سرور می‌گیریم و جلوی مبلغ‌های غیرمنطقی را می‌گیریم.
// هتل‌هایی که ادمین فقط روی مرورگر خودش ساخته در سرور نیستند و همان مقدار ارسالی را می‌پذیرند.
export function checkAgainstCatalog(data) {
  const hotel = HOTELS.find((h) => h.id === data.hotelId);
  if (!hotel) return { ok: true, data };
  const room = hotel.rooms?.find((r) => r.name === data.room);
  if (!room) return { ok: false, error: "اتاق انتخاب‌شده برای این هتل وجود ندارد." };
  const maxDiscount = Math.max(0, ...Object.values(COUPONS).map((c) => c.pct));
  const min = room.price * data.nights * data.rooms * (1 - maxDiscount) * (1 + TAX_RATE);
  if (data.totalUsd < min * 0.99) return { ok: false, error: "مبلغ رزرو درست نیست؛ صفحه را دوباره باز کن." };
  return { ok: true, data: { ...data, hotelName: hotel.name, city: hotel.city } };
}
