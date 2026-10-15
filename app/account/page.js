import Navbar from "@/components/Navbar";
import AccountClient from "@/components/AccountClient";
import Footer from "@/components/Footer";
import { HOTELS } from "@/data/hotels";
import ConnectDB from "@/utils/ConnectDB";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

export const metadata = {
  title: " سفرینو | پنل کاربری",
  description: "سایت رزرو هتل",
};

export default async function AccountPage() {
  await ConnectDB();
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");
  // با id پیدا می‌کنیم (اگر کاربر ایمیلش را عوض کرده باشد هم کار کند)؛ نشست‌های قدیمی بدون id با ایمیل
  const id = session.user.id;
  const user = await (id && isValidObjectId(id) ? User.findById(id) : User.findOne({ email: session.user.email }))
    .select("name email phone")
    .lean();
  if (!user) redirect("/");
  return (
    <>
      <Navbar />
      <AccountClient
        hotels={HOTELS}
        profile={{ name: user.name || "", email: user.email || "", phone: user.phone || "" }}
      />
      <Footer />
    </>
  );
}
