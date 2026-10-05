import ConnectDB from "@/utils/ConnectDB";
import Booking from "@/models/Booking";
import { validateBooking } from "@/lib/bookingRules";
import { adminShape, getSession, isAdminSession, json, newCode, readBody } from "@/lib/bookingServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  ابزارهای مدیریتی رزروها (فقط ادمین)
  POST   /api/bookings/admin   { items: [...] }   ساخت رزرو نمونه برای نمودارها (حداکثر ۲۰۰ تا، با demo=true)
  DELETE /api/bookings/admin?scope=demo|all       حذف رزروهای نمونه یا همه‌ی رزروها
*/

export async function POST(req) {
  if (!isAdminSession(await getSession())) return json({ error: "دسترسی نداری." }, 403);
  const body = await readBody(req);
  if (!Array.isArray(body?.items) || !body.items.length) return json({ error: "درخواست نامعتبر است." }, 422);
  const docs = [];
  for (const raw of body.items.slice(0, 200)) {
    const { ok, data } = validateBooking(raw, { allowPast: true });
    if (!ok) continue;
    const created = new Date(raw.createdAt);
    const createdAt = Number.isNaN(created.getTime()) || created > new Date() ? new Date() : created;
    const status = raw.status === "cancelled" ? "cancelled" : "confirmed";
    docs.push({ ...data, code: newCode(), status, demo: true, createdAt, updatedAt: createdAt });
  }
  if (!docs.length) return json({ error: "رزرو معتبری در درخواست نبود." }, 422);
  try {
    await ConnectDB();
    const saved = await Booking.insertMany(docs, { ordered: false });
    return json({ ok: true, count: saved.length, items: saved.map((d) => adminShape(d.toObject())) }, 201);
  } catch (e) {
    console.error("bookings admin POST error:", e?.message);
    return json({ error: "ساخت رزروهای نمونه انجام نشد." }, 500);
  }
}

export async function DELETE(req) {
  if (!isAdminSession(await getSession())) return json({ error: "دسترسی نداری." }, 403);
  const scope = new URL(req.url).searchParams.get("scope");
  if (!["demo", "all"].includes(scope)) return json({ error: "درخواست نامعتبر است." }, 422);
  try {
    await ConnectDB();
    const r = await Booking.deleteMany(scope === "demo" ? { demo: true } : {});
    return json({ ok: true, deleted: r.deletedCount });
  } catch (e) {
    console.error("bookings admin DELETE error:", e?.message);
    return json({ error: "خطا در حذف رزروها." }, 500);
  }
}
