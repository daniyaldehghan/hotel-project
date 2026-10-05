import { model, models, Schema } from "mongoose";

// نظرهای کاربران درباره‌ی سایت (بخش «مسافرها چه می‌گویند»)
// pending  = منتظر بررسی مدیر (در سایت نمایش داده نمی‌شود)
// approved = تأییدشده (در سایت نمایش داده می‌شود)
// نظر ردشده اصلاً ذخیره نمی‌ماند؛ از دیتابیس پاک می‌شود.
const reviewSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    trip: { type: String, trim: true, maxlength: 80, default: "" }, // مثلاً «سفر به استانبول»
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 600 },
    status: { type: String, enum: ["pending", "approved"], default: "pending" },
    userEmail: { type: String, trim: true, lowercase: true, default: "" }, // فقط اگر کاربر وارد شده باشد؛ به عموم نشان داده نمی‌شود
    approvedAt: { type: Date },
  },
  { timestamps: true }
);
reviewSchema.index({ status: 1, createdAt: -1 });

const Review = models.Review || model("Review", reviewSchema);
export default Review;
