import { NextResponse } from "next/server";
import ConnectDB from "@/utils/ConnectDB";
import { createCaptcha } from "@/lib/captcha";
import { ipOf, makeLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limited = makeLimiter("captcha", 10 * 60 * 1000, 40); // هر IP در ۱۰ دقیقه حداکثر ۴۰ تصویر

// GET /api/captcha → { id, image }
export async function GET(req) {
  const headers = { "Cache-Control": "no-store" };
  if (limited(ipOf(req))) return NextResponse.json({ error: "درخواست زیاد بود. کمی صبر کن." }, { status: 429, headers });
  try {
    await ConnectDB();
    return NextResponse.json(await createCaptcha(), { headers });
  } catch (e) {
    console.error("captcha error:", e?.message);
    return NextResponse.json({ error: "کد امنیتی ساخته نشد." }, { status: 500, headers });
  }
}
