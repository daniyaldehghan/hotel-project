import { model, models, Schema } from "mongoose";

// مشترک‌های خبرنامه (بخش «پیشنهادهای ویژه را زودتر ببین»)
const subscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
    // active = عضو | unsubscribed = لغو کرده (دیگر ایمیل نمی‌گیرد؛ ردیف برای جلوگیری از ارسال مجدد می‌ماند)
    status: { type: String, enum: ["active", "unsubscribed"], default: "active", index: true },
    token: { type: String, required: true, unique: true }, // برای لینک لغو عضویت (مخصوص هر مشترک، غیرقابل حدس)
    userId: { type: String, default: "" }, // اگر هنگام عضویت وارد حساب بوده
    unsubscribedAt: { type: Date },
  },
  { timestamps: true }
);
subscriberSchema.index({ createdAt: -1 });

const Subscriber = models.Subscriber || model("Subscriber", subscriberSchema);
export default Subscriber;
