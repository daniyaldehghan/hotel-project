import AdminClient from "@/components/AdminClient";
import User from "@/models/User";
import ConnectDB from "@/utils/ConnectDB";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export const metadata = {
  title: "پنل مدیریت — سرا",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await ConnectDB();
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");
  // با id پیدا می‌کنیم تا اگر ایمیل ادمین عوض شد هم کار کند؛ نشست‌های قدیمی بدون id با ایمیل
  const id = session.user.id;
  const user = await (id && isValidObjectId(id) ? User.findById(id) : User.findOne({ email: session.user.email }))
    .select("role")
    .lean();
  if (!user || user.role === "USER") redirect("/not-found");
  return <AdminClient />;
}
