import clientPromise from "@/lib/mongodb";
import User from "@/models/User";
import { vrifyPassword } from "@/utils/auth";
import ConnectDB from "@/utils/ConnectDB";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import nextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
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
      if (token.uid) session.user.id = token.uid;

      return session;
    },}
};
const handler = nextAuth(authOptions);
export { handler as GET, handler as POST };
