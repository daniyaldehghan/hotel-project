import { model, models, Schema } from "mongoose";

// کپچاهای صادرشده؛ هر کدام فقط یک بار قابل استفاده است و بعد از ۵ دقیقه خودکار پاک می‌شود (TTL).
// خودِ پاسخ ذخیره نمی‌شود، فقط هش آن.
const captchaSchema = new Schema({
  _id: { type: String }, // شناسه‌ی تصادفی
  hash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

const Captcha = models.Captcha || model("Captcha", captchaSchema);
export default Captcha;
