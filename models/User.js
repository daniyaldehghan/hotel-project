import { model, models, Schema } from "mongoose";
const userschema = new Schema({
  email: {
    type: String,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  role: {
    type: String,
    default: "USER",
  },
  password: {
    type: String,
    require: true,
  },
  // شماره‌ی تماس؛ اختیاری (کاربر از «تنظیمات» پنل کاربری اضافه یا پاکش می‌کند)
  phone: {
    type: String,
    default: "",
  },
  // حساب مهمان: بدون ایمیل و رمز؛ مونگو بعد از expiresAt خودش آن را پاک می‌کند (TTL). برای کاربران عادی این دو فیلد خالی است.
  isGuest: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 },
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
    immutable: true,
  },
});
const User = models.User || model("User", userschema);
export default User;
