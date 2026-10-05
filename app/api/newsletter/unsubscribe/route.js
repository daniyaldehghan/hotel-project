import { NextResponse } from "next/server";
import ConnectDB from "@/utils/ConnectDB";
import Subscriber from "@/models/Subscriber";
import { isToken } from "@/lib/newsletter";
import { ipOf, makeLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  لغو عضویت خبرنامه با لینک مخصوص هر مشترک
  POST /api/newsletter/unsubscribe   { token }
  token در هر ایمیل خبرنامه داخل لینک /unsubscribe?token=... گذاشته می‌شود؛ ایمیل مشترک هرگز برگردانده نمی‌شود.
*/
const limited = makeLimiter("newsletter-unsub", 10 * 60 * 1000, 20);
const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  if (!isToken(body?.token)) return json({ error: "لینک لغو عضویت معتبر نیست." }, 422);
  if (limited(ipOf(req))) return json({ error: "درخواست‌ها زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن." }, 429);
  try {
    await ConnectDB();
    const r = await Subscriber.updateOne({ token: body.token }, { $set: { status: "unsubscribed", unsubscribedAt: new Date() } });
    if (!r.matchedCount) return json({ error: "این لینک معتبر نیست یا عضویت قبلاً حذف شده است." }, 404);
    return json({ ok: true });
  } catch (e) {
    console.error("newsletter unsubscribe error:", e?.message);
    return json({ error: "مشکلی در سرور رخ داده است. کمی بعد دوباره امتحان کن." }, 500);
  }
}
