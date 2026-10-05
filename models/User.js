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
  createdAt: {
    type: Date,
    default: () => Date.now(),
    immutable: true,
  },
});
const User = models.User || model("User", userschema);
export default User;
