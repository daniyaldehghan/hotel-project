import ConnectDB from "@/utils/ConnectDB";
import Offer from "@/models/Offer";
import { isValidObjectId } from "mongoose";
import { getSession, isAdminSession, json, readBody } from "@/lib/bookingServer";
import { OFFER_LIMITS, offerState, validateOffer } from "@/lib/offerRules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  API پیشنهادهای ویژه (مونگو)
  ────────────────────────────────────────────────────────────
  GET    /api/offers              عمومی: پیشنهادهای روشن (فعال + تمام‌شده‌ی ۴۸ ساعت اخیر) و ساعت سرور (now)
  GET    /api/offers?scope=all    همه‌ی پیشنهادها (فقط ادمین)
  POST   /api/offers              ساخت پیشنهاد (فقط ادمین)
  PATCH  /api/offers              { id, ...فیلدهای تغییرکرده }  ویرایش / تمدید / خاموش و روشن (فقط ادمین)
  DELETE /api/offers?id=...       حذف قطعی (فقط ادمین)
*/

const iso = (d) => new Date(d).toISOString();
const shape = (o, now) => ({
  id: String(o._id), hotelId: o.hotelId, title: o.title || "", discountPct: o.discountPct,
  startsAt: iso(o.startsAt), endsAt: iso(o.endsAt), active: !!o.active, state: offerState(o, now),
});
const FIELDS = ["hotelId", "title", "discountPct", "startsAt", "endsAt", "active"];

export async function GET(req) {
  const now = Date.now();
  const all = new URL(req.url).searchParams.get("scope") === "all";
  try {
    if (all && !isAdminSession(await getSession())) return json({ error: "دسترسی نداری." }, 403);
    await ConnectDB();
    const filter = all ? {} : {
      active: true,
      startsAt: { $lte: new Date(now) },
      endsAt: { $gt: new Date(now - OFFER_LIMITS.hideAfterMs) },
    };
    const docs = await Offer.find(filter).sort(all ? { createdAt: -1 } : { endsAt: 1 }).limit(200).lean();
    let items = docs.map((o) => shape(o, now));
    if (!all) {
      // فعال‌ها اول (نزدیک‌ترین پایان اول)، بعد تمام‌شده‌ها
      items = [...items.filter((o) => o.state === "live"), ...items.filter((o) => o.state !== "live")]
        .map(({ active, ...o }) => o);
    }
    return json({ items, now });
  } catch (e) {
    console.error("offers GET error:", e?.message);
    return json({ error: "خطا در خواندن پیشنهادها." }, 500);
  }
}

export async function POST(req) {
  if (!isAdminSession(await getSession())) return json({ error: "دسترسی نداری." }, 403);
  const body = await readBody(req);
  if (!body) return json({ error: "درخواست نامعتبر است." }, 400);
  const { ok, errors, data } = validateOffer(body, { requireFuture: true });
  if (!ok) return json({ error: Object.values(errors)[0], errors }, 422);
  try {
    await ConnectDB();
    const doc = await Offer.create(data);
    return json({ ok: true, item: shape(doc.toObject(), Date.now()) }, 201);
  } catch (e) {
    console.error("offers POST error:", e?.message);
    return json({ error: "ساخت پیشنهاد انجام نشد." }, 500);
  }
}

export async function PATCH(req) {
  if (!isAdminSession(await getSession())) return json({ error: "دسترسی نداری." }, 403);
  const body = await readBody(req);
  if (!body || !isValidObjectId(body.id)) return json({ error: "درخواست نامعتبر است." }, 422);
  try {
    await ConnectDB();
    const doc = await Offer.findById(body.id).lean();
    if (!doc) return json({ error: "پیشنهاد پیدا نشد." }, 404);
    const patch = Object.fromEntries(FIELDS.filter((k) => k in body).map((k) => [k, body[k]]));
    const merged = { hotelId: doc.hotelId, title: doc.title, discountPct: doc.discountPct, startsAt: doc.startsAt, endsAt: doc.endsAt, active: doc.active, ...patch };
    const { ok, errors, data } = validateOffer(merged, { requireFuture: "endsAt" in patch });
    if (!ok) return json({ error: Object.values(errors)[0], errors }, 422);
    const upd = await Offer.findByIdAndUpdate(body.id, { $set: data }, { new: true }).lean();
    return json({ ok: true, item: shape(upd, Date.now()) });
  } catch (e) {
    console.error("offers PATCH error:", e?.message);
    return json({ error: "ویرایش پیشنهاد انجام نشد." }, 500);
  }
}

export async function DELETE(req) {
  if (!isAdminSession(await getSession())) return json({ error: "دسترسی نداری." }, 403);
  const id = new URL(req.url).searchParams.get("id");
  if (!isValidObjectId(id)) return json({ error: "درخواست نامعتبر است." }, 422);
  try {
    await ConnectDB();
    const r = await Offer.deleteOne({ _id: id });
    return r.deletedCount ? json({ ok: true }) : json({ error: "پیشنهاد پیدا نشد." }, 404);
  } catch (e) {
    console.error("offers DELETE error:", e?.message);
    return json({ error: "حذف پیشنهاد انجام نشد." }, 500);
  }
}
