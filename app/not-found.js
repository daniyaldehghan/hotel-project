import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "صفحه پیدا نشد — سرا" };

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-5 py-28 text-center">
        <p className="bg-gradient-to-br from-coral to-violet bg-clip-text text-7xl font-black text-transparent">۴۰۴</p>
        <h1 className="mt-2 text-2xl font-extrabold">این صفحه پیدا نشد</h1>
        <p className="mb-6 mt-1 text-mut">شاید آدرس اشتباه است یا صفحه جابه‌جا شده.</p>
        <Link href="/" className="inline-block rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white">بازگشت به صفحه اول</Link>
      </main>
      <Footer />
    </>
  );
}
