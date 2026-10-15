/*
  ساخت (یا به‌روزرسانی) حساب ادمین در مونگو
  ────────────────────────────────────────────────────────────
  اجرا:   npm run create-admin
  دلخواه: node scripts/create-admin.js you@example.com yourPassword
  - MONGODB_URI از فایل .env خوانده می‌شود.
  - اگر ایمیل قبلاً ثبت شده باشد، فقط نقش ADMIN و رمز جدید روی همان حساب گذاشته می‌شود.
  - رمز با bcrypt هش می‌شود (همان روشی که ثبت‌نام سایت استفاده می‌کند).
*/
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { hash } = require("bcryptjs");
const { getServerSession } = require("next-auth");

const session =await getServerSession();
console.log(session);
// .env را بدون وابستگی اضافه می‌خوانیم
for (const f of [".env", ".env.local"]) {
  const p = path.join(__dirname, "..", f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const email = (process.argv[2] || "daniyaldehghani.2023@gmail.com")
  .trim()
  .toLowerCase();
const password = process.argv[3] || "123";

(async () => {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI در .env پیدا نشد.");
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  const users = mongoose.connection.collection("users");
  const res = await users.updateOne(
    { email },
    {
      $set: {
        role: "ADMIN",
        password: await hash(password, 12),
        isGuest: false,
      },
      $unset: { expiresAt: "" },
      $setOnInsert: { name: "مدیر", phone: "", createdAt: new Date() },
    },
    { upsert: true }
  );
  console.log(
    res.upsertedCount
      ? `ادمین ساخته شد: ${email}`
      : `حساب موجود به ادمین تبدیل شد و رمزش عوض شد: ${email}`
  );
  await mongoose.disconnect();
})().catch((e) => {
  console.error("خطا:", e.message);
  process.exit(1);
});
