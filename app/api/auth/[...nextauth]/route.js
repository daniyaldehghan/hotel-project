import clientPromise from "@/lib/mongodb";
import User from "@/models/User";
import { vrifyPassword } from "@/utils/auth";
import ConnectDB from "@/utils/ConnectDB";
import { makeLimiter } from "@/lib/rateLimit";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import nextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
// نقش کاربر مهمان؛ مهمان فقط یک کاربر عادی است و به پنل ادمین دسترسی ندارد.
const GUEST_ROLE = "USER";
const GUEST_DAYS = 30; // هم‌اندازه‌ی عمر پیش‌فرض نشست (JWT)
const guestLimited = makeLimiter("guest-login", 10 * 60 * 1000, 5); // هر IP در ۱۰ دقیقه حداکثر ۵ حساب مهمان
export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const { email, password } = credentials;
        // console.log(email);
        try {
          await ConnectDB();
        } catch (err) {
          throw new Error("مشکلی در سرور رخ داده است.");
        }
        if (!email || !password) {
          throw new Error("ایمیل یا پسورد را وارد کنید.");
        }
        const user = await User.findOne({ email });
        if (!user) throw new Error("ابتدا حساب کاربری ایجاد کنید.");
        const isvalid = await vrifyPassword(password, user.password);
        if (!isvalid) throw new Error("ایمیل یا پسورد معتبر وارد کنید.");
        const Role = user.role;
        // id هم برگردانده می‌شود تا هویت نشست به ایمیل وابسته نباشد (ایمیل را کاربر از «تنظیمات» می‌تواند عوض کند)
        return { id: String(user._id), email: user.email, name: user.name, role: user.role };
        
      },
      
    }),
    // ورود به‌عنوان مهمان: ورودی از کاربر نمی‌گیرد و نقش از ثابت GUEST_ROLE (سمت سرور) تعیین می‌شود.
    CredentialsProvider({
      id: "guest",
      name: "guest",
      credentials: {},
      async authorize(_credentials, req) {
        const h = req?.headers || {};
        const ip = String(h["x-forwarded-for"] || h["x-real-ip"] || "unknown").split(",")[0].trim();
        if (guestLimited(ip)) throw new Error("تعداد ورودهای مهمان زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کن.");
        try {
          await ConnectDB();
          const g = await User.create({
            name: "مهمان",
            role: GUEST_ROLE,
            isGuest: true,
            expiresAt: new Date(Date.now() + GUEST_DAYS * 864e5),
          });
          return { id: String(g._id), name: g.name, role: GUEST_ROLE, isGuest: true };
        } catch (err) {
          throw new Error("مشکلی در سرور رخ داده است.");
        }
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.uid = user.id;
        token.guest = !!user.isGuest;
      }
      // بعد از ویرایش پروفایل، مرورگر update() را صدا می‌زند. اطلاعات نشست را از خود دیتابیس می‌خوانیم،
      // نه از چیزی که مرورگر فرستاده، پس کسی نمی‌تواند ایمیل یا نقش جعلی در نشست بگذارد.
      if (trigger === "update") {
        try {
          await ConnectDB();
          const q = token.uid ? User.findById(token.uid) : User.findOne({ email: token.email });
          const u = await q.select("email name role").lean();
          if (u) {
            token.email = u.email;
            token.name = u.name;
            token.role = u.role;
            token.uid = String(u._id);
          }
        } catch {}
      }

      return token;
    },

    async session({ session, token }) {
      session.user.role = token.role;
      session.user.isGuest = !!token.guest;
      if (token.uid) session.user.id = token.uid;

      return session;
    },}
};
const handler = nextAuth(authOptions);
export { handler as GET, handler as POST };
