// کپچای تصویری خودمیزبان: بدون سرویس خارجی و بدون کلید API؛ فقط به همان مونگوی پروژه نیاز دارد.
// فقط روی سرور استفاده شود.
import { createHash, randomBytes, randomInt } from "crypto";
import Captcha from "@/models/Captcha";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون حروف مشابه (O/0، I/1)
const LEN = 5, MAX_AGE = 5 * 60 * 1000;

const hashOf = (id, answer) =>
  createHash("sha256").update(`${id}:${String(answer).trim().toUpperCase()}:${process.env.NEXTAUTH_SECRET || ""}`).digest("hex");

const rnd = (a, b) => a + Math.random() * (b - a);
const COLORS = ["#3b1d8f", "#c2185b", "#0b7a75", "#8a4b00", "#1b4fa8", "#5b1fa8"];

// تصویر SVG با حروف کج و نویز (برای ربات‌های ساده خوانا نیست)
function drawSvg(code) {
  const W = 168, H = 58;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="10" fill="#f4f0ff"/>`;
  for (let i = 0; i < 7; i++) {
    out += `<path d="M${rnd(0, W / 3).toFixed(1)} ${rnd(0, H).toFixed(1)} Q${rnd(W / 3, (2 * W) / 3).toFixed(1)} ${rnd(0, H).toFixed(1)} ${rnd((2 * W) / 3, W).toFixed(1)} ${rnd(0, H).toFixed(1)}" stroke="${COLORS[randomInt(COLORS.length)]}" stroke-opacity=".45" stroke-width="${rnd(1, 2).toFixed(1)}" fill="none"/>`;
  }
  for (let i = 0; i < 40; i++) out += `<circle cx="${rnd(0, W).toFixed(1)}" cy="${rnd(0, H).toFixed(1)}" r="${rnd(0.6, 1.6).toFixed(1)}" fill="${COLORS[randomInt(COLORS.length)]}" fill-opacity=".5"/>`;
  [...code].forEach((ch, i) => {
    const x = 18 + i * 28 + rnd(-3, 3), y = 38 + rnd(-5, 5), r = rnd(-22, 22), size = rnd(28, 34);
    out += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size.toFixed(0)}" font-weight="800" font-family="Verdana,Arial,sans-serif" fill="${COLORS[randomInt(COLORS.length)]}" transform="rotate(${r.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${ch}</text>`;
  });
  out += `<path d="M0 ${rnd(18, 40).toFixed(1)} C ${W / 3} ${rnd(0, H).toFixed(1)}, ${(2 * W) / 3} ${rnd(0, H).toFixed(1)}, ${W} ${rnd(18, 40).toFixed(1)}" stroke="#222" stroke-opacity=".55" stroke-width="1.6" fill="none"/></svg>`;
  return out;
}

// ساخت کپچای جدید → { id, image }   (image یک data-URI است و مستقیم در <img src> می‌رود)
export async function createCaptcha() {
  const code = Array.from({ length: LEN }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  const id = randomBytes(16).toString("hex");
  await Captcha.create({ _id: id, hash: hashOf(id, code) });
  return { id, image: "data:image/svg+xml;base64," + Buffer.from(drawSvg(code)).toString("base64") };
}

// بررسی پاسخ. هر کپچا یک بار مصرف است: چه درست چه غلط، بعد از اولین بررسی پاک می‌شود
// (پس ربات نمی‌تواند روی یک تصویر چندین بار حدس بزند).
export async function verifyCaptcha(id, answer) {
  if (typeof id !== "string" || !/^[a-f0-9]{32}$/.test(id) || typeof answer !== "string" || !answer.trim()) return false;
  const doc = await Captcha.findOneAndDelete({ _id: id }).lean();
  if (!doc || Date.now() - new Date(doc.createdAt).getTime() > MAX_AGE) return false;
  return doc.hash === hashOf(id, answer);
}
