import { model, models, Schema } from "mongoose";

// پیام‌های فرم «تماس با ما»
const contactSchema = new Schema(
  {
    ticket: { type: String, required: true, unique: true }, // کد پیگیری مثل TK-7K2QX9
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    subject: { type: String, required: true },
    message: { type: String, required: true, maxlength: 2000 },
    // new = منتظر بررسی ادمین | read = ادمین دیده | replied = ادمین جواب داده | done = بسته شده
    status: { type: String, enum: ["new", "read", "replied", "done"], default: "new", index: true },
    // گفتگوی بعد از پیام اول: جواب ادمین و سؤال‌های بعدی کاربر
    replies: {
      type: [
        new Schema(
          {
            from: { type: String, enum: ["admin", "user"], required: true },
            text: { type: String, required: true, maxlength: 2000 },
            at: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true } // createdAt و updatedAt خودکار
);
contactSchema.index({ createdAt: -1 });

const Contact = models.Contact || model("Contact", contactSchema);
export default Contact;
