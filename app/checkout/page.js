import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import CheckoutClient from "@/components/CheckoutClient";
import Footer from "@/components/Footer";
import { HOTELS } from "@/data/hotels";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Toaster } from "react-hot-toast";

export const metadata = { title: "تکمیل رزرو — سفرینو" };

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");
  // alert("ابتدا وارد شوید");
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <p className="px-5 py-24 text-center text-mut">در حال بارگذاری…</p>
        }
      >
        <CheckoutClient hotels={HOTELS} />
      </Suspense>
      <Footer />
    </>
  );
}
