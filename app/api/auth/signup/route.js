import User from "@/models/User";
import { hashdPassword } from "@/utils/auth";
import ConnectDB from "@/utils/ConnectDB";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await ConnectDB();
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "لطفا اطلاعات معتبر وارد کنید" },
        { status: 422 }
      );
    }
    const user = await User.findOne({ email });
    if (user) {
      return NextResponse.json(
        { error: "این حساب کاربری وجود دارد" },
        { status: 422 }
      );
    }
    const hashedPassword = await hashdPassword(password);
    const newUser = await User.create({
      email,
      name,
      password: hashedPassword,
    });
    return NextResponse.json(
      { success: "حساب کاربری ایجاد شد" },
      { status: 201 }
    );
  } catch (error) {
    console.error("signup error:", error?.message);
    return NextResponse.json(
      { error: "مشکلی در سرور رخ داده است!" },
      { status: 500 }
    );
  }
}
