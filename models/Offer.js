import { model, models, Schema } from "mongoose";

// پیشنهادهای ویژه‌ی زمان‌دار؛ ادمین می‌سازد و بعد از endsAt دیگر نمی‌شود با تخفیفش رزرو کرد.
const offerSchema = new Schema(
  {
    hotelId: { type: Number, required: true, index: true },
    title: { type: String, default: "", maxlength: 80 },
    discountPct: { type: Number, required: true, min: 1, max: 70 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true, index: true },
    // کلید دستی ادمین: خاموش = از سایت جمع می‌شود و رزرو هم بسته می‌شود، بدون اینکه حذف شود
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Offer = models.Offer || model("Offer", offerSchema);
export default Offer;
