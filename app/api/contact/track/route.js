import { NextResponse } from "next/server";
import ConnectDB from "@/utils/ConnectDB";
import Contact from "@/models/Contact";
import { REPLY_LIMITS, normalizeReply, normalizeTicket } from "@/lib/contact";
import { ipOf, makeLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  پیگیری پیام با کد پیگیری (عمومی)
  ────────────────────────────────────────────────────────────
  POST /api/contact/track   { ticket }                 → گفتگوی کامل (پیام اول + جواب‌ها)
  PUT  /api/contact/track   { ticket, text, website }  → سؤال/پیام بعدیِ کاربر در همان گفتگو
  ایمیل و اطلاعات داخلی هرگز برگردانده نمی‌شود؛ فقط کسی که کد پیگیری را دارد گفتگو را می‌بیند.
*/

const lookupLimited = makeLimiter("track-lookup", 10 * 60 * 1000, 20); // جلوی حدس‌زدن کدها
const replyLimited = makeLimiter("track-reply", 10 * 60 * 1000, 8);
const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

function threadOf(m) {
  return {
    ticket: m.ticket,
    subject: m.subject,
    status: m.status,
    name: String(m.name || "").split(/\s+/)[0], // فقط نام کوچک
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    messages: [
      { from: "user", text: m.message, at: m.createdAt },
      ...(m.replies || []).map((r) => ({ from: r.from, text: r.text, at: r.at })),
    ],
  };
}

async function readBody(req) {
  try { const b = await req.json(); return b && typeof b === "object" ? b : null; } catch { return null; }
}

// ───────── دیدن گفتگو ─────────
export async function POST(req) {
  const body = await readBody(req);
  if (!body) return json({ error: "درخواست نامعتبر است." }, 400);
  const ticket = normalizeTicket(body.ticket);
  if (!ticket) return json({ error: "کد پیگیری درست نیست. شکلش مثل TK-7K2QX9 است." }, 422);
  if (lookupLimited(ipOf(req))) return json({ error: "تعداد جست‌وجو زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن." }, 429);
  try {
    await ConnectDB();
    const doc = await Contact.findOne({ ticket }).lean();
    if (!doc) return json({ error: "پیامی با این کد پیدا نشد. کد را دوباره بررسی کن." }, 404);
    return json({ ok: true, thread: threadOf(doc) });
  } catch (e) {
    console.error("track POST error:", e?.message);
    return json({ error: "مشکلی در سرور رخ داده است. کمی بعد دوباره امتحان کن." }, 500);
  }
}

// ───────── سؤال بعدیِ کاربر ─────────
export async function PUT(req) {
  const body = await readBody(req);
  if (!body) return json({ error: "درخواست نامعتبر است." }, 400);
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true }, 201); // تله‌ی ربات

  const ticket = normalizeTicket(body.ticket);
  const text = normalizeReply(body.text);
  if (!ticket) return json({ error: "کد پیگیری درست نیست." }, 422);
  if (text.length < REPLY_LIMITS.minText) return json({ error: "متن پیام خیلی کوتاه است." }, 422);
  if (replyLimited(ipOf(req))) return json({ error: "تعداد پیام‌ها زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن." }, 429);

  try {
    await ConnectDB();
    // اضافه شدن پیام و بازشدن دوباره‌ی گفتگو (وضعیت → «new» تا ادمین ببیند). سقف تعداد پیام‌ها هم همین‌جا اتمیک چک می‌شود.
    const doc = await Contact.findOneAndUpdate(
      { ticket, $expr: { $lt: [{ $size: { $ifNull: ["$replies", []] } }, REPLY_LIMITS.maxReplies] } },
      { $push: { replies: { from: "user", text, at: new Date() } }, $set: { status: "new" } },
      { new: true }
    ).lean();
    if (!doc) {
      const exists = await Contact.exists({ ticket });
      return exists
        ? json({ error: "تعداد پیام‌های این گفتگو به سقف رسیده. لطفاً یک پیام جدید از فرم تماس بفرست." }, 429)
        : json({ error: "پیامی با این کد پیدا نشد." }, 404);
    }
    return json({ ok: true, thread: threadOf(doc) }, 201);
  } catch (e) {
    console.error("track PUT error:", e?.message);
    return json({ error: "مشکلی در سرور رخ داده است. کمی بعد دوباره امتحان کن." }, 500);
  }
}
