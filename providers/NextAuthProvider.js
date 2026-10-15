"use client";
import { SessionProvider } from "next-auth/react";

// refetchOnWindowFocus خاموش است تا با هر برگشتن به تب، درخواست اضافه به سرور نرود
export default function NextAuthProvider({ children }) {
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}
