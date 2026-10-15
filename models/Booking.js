import { model, models, Schema } from "mongoose";

// رزروها؛ قبلاً فقط در localStorage مرورگر بودند و حالا در مونگو ذخیره می‌شوند.
const bookingSchema = new Schema({
  code: { type: String, required: true, unique: true }, // کد پیگیری مثل SR-7K2QX9
  // صاحب رزرو (اگر هنگام رزرو وارد حساب بوده)؛ مهمان‌ها فقط با کد پیگیری رزروشان را می‌بینند
  userId: { type: String, default: "", index: true },
  userEmail: { type: String, default: "", lowercase: true, index: true },
  // مشخصات مهمان (فقط برای ادمین؛ در پیگیری عمومی نمایش داده نمی‌شود)
  guestName: { type: String, default: "", maxlength: 120 },
  guestEmail: { type: String, default: "", lowercase: true, maxlength: 120 },
  guestPhone: { type: String, default: "", maxlength: 30 },
  note: { type: String, default: "", maxlength: 500 },

  hotelId: { type: Number, required: true, index: true },
  hotelName: { type: String, required: true },
  city: { type: String, default: "" },
  room: { type: String, required: true },
  rooms: { type: Number, required: true, min: 1, max: 5 },
  guests: { type: Number, required: true, min: 1, max: 20 },
  checkIn: { type: String, required: true },  // YYYY-MM-DD
  checkOut: { type: String, required: true }, // YYYY-MM-DD
  nights: { type: Number, required: true, min: 1 },
  totalUsd: { type: Number, required: true, min: 0 },
  pay: { type: String, enum: ["online", "hotel"], default: "online" },

  // confirmed = فعال | cancelled = لغو شده (قابل برگشت توسط ادمین) | voided = باطل شده توسط ادمین (نهایی)
  status: { type: String, enum: ["confirmed", "cancelled", "voided"], default: "confirmed", index: true },
  cancelledAt: { type: Date },
  voidedAt: { type: Date },
  voidedBy: { type: String, default: "" }, // ایمیل ادمینی که کد را باطل کرد

  // اگر با پیشنهاد ویژه رزرو شده، شناسه‌ی آن پیشنهاد
  offerId: { type: String, default: "" },

  demo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

const Booking = models.Booking || model("Booking", bookingSchema);
export default Booking;
