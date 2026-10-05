import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import ConnectDB from "@/utils/ConnectDB";
import User from "@/models/User";
import { diffProfile, validateProfile } from "@/lib/profile";
import { makeLimiter } from "@/lib/rateLimit";
import { vrifyPassword } from "@/utils/auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  تنظیمات حساب کاربر (فقط کاربر واردشده؛ هر کس فقط حساب خودش را می‌بیند و ویرایش می‌کند)
  ────────────────────────────────────────────────────────────
  GET    /api/account   → { profile: { name, email, phone } }
  PATCH  /api/account   { name?, email?, phone?, currentPassword? }
         - تغییر ایمیل «رمز عبور فعلی» می‌خواهد (ایمیل همان نام کاربری ورود است)
         - phone اختیاری است؛ رشته‌ی خالی = پاک کردن شماره
*/

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const passLimited = makeLimiter("account-pass", 10 * 60 * 1000, 5); // حدس‌زدن رمز: هر کاربر در ۱۰ دقیقه ۵ تلاش
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const shape = (u) => ({ name: u.name || "", email: u.email || "", phone: u.phone || "" });

// کاربر فعلی از روی نشست: اول با id (پایدار)، برای نشست‌های قدیمی که id ندارند با ایمیل
async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return {};
  await ConnectDB();
  const id = session.user.id;
  const q = id && isValidObjectId(id) ? User.findById(id) : session.user.email ? User.findOne({ email: session.user.email }) : null;
  const user = q ? await q.select("name email phone password").lean() : null;
  return { session, user };
}

export async function GET() {
  try {
    const { session, user } = await currentUser();
    if (!session) return json({ error: "ابتدا وارد حساب شو." }, 401);
    if (!user) return json({ error: "حساب پیدا نشد." }, 404);
    return json({ profile: shape(user) });
  } catch (e) {
    console.error("account GET error:", e?.message);
    return json({ error: "خطا در خواندن اطلاعات حساب." }, 500);
  }
}

export async function PATCH(req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  if (!body || typeof body !== "object") return json({ error: "درخواست نامعتبر است." }, 400);

  // فقط این سه فیلد قابل ویرایش‌اند (نقش، رمز و غیره هرگز از این مسیر عوض نمی‌شود)
  const raw = {};
  for (const k of ["name", "email", "phone"]) if (k in body) raw[k] = body[k];
  const { ok, errors, data } = validateProfile(raw);
  if (!ok) return json({ error: "اطلاعات فرم را بررسی کن.", errors }, 422);

  try {
    const { session, user } = await currentUser();
    if (!session) return json({ error: "ابتدا وارد حساب شو." }, 401);
    if (!user) return json({ error: "حساب پیدا نشد." }, 404);

    const { set, emailChanged } = diffProfile(user, data);
    if (Object.keys(set).length === 0) return json({ ok: true, profile: shape(user), emailChanged: false });

    if (emailChanged) {
      if (passLimited(String(user._id))) return json({ error: "تلاش‌ها زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن." }, 429);
      if (!user.password) return json({ error: "برای این حساب امکان تغییر ایمیل نیست.", errors: { email: "برای این حساب امکان تغییر ایمیل نیست." } }, 422);
      const pass = typeof body.currentPassword === "string" ? body.currentPassword : "";
      if (!pass || !(await vrifyPassword(pass, user.password))) {
        return json({ error: "رمز عبور فعلی درست نیست.", errors: { currentPassword: "رمز عبور فعلی درست نیست." } }, 422);
      }
      const taken = await User.exists({ _id: { $ne: user._id }, email: new RegExp(`^${escapeRe(data.email)}$`, "i") });
      if (taken) return json({ error: "این ایمیل قبلاً ثبت شده.", errors: { email: "این ایمیل قبلاً برای حساب دیگری ثبت شده." } }, 409);
    }

    const updated = await User.findByIdAndUpdate(user._id, { $set: set }, { new: true }).select("name email phone").lean();
    return json({
      ok: true,
      profile: shape(updated),
      emailChanged,
      // نشست‌های قدیمی (قبل از این به‌روزرسانی) id ندارند و بعد از تغییر ایمیل باید دوباره وارد شوند
      relogin: emailChanged && !session.user.id,
    });
  } catch (e) {
    console.error("account PATCH error:", e?.message);
    return json({ error: "مشکلی در سرور رخ داده است. کمی بعد دوباره امتحان کن." }, 500);
  }
}
