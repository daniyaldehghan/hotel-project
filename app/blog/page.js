import Navbar from "@/components/Navbar";
import BlogList from "@/components/BlogList";
import Footer from "@/components/Footer";

export const metadata = { title: "وبلاگ — سرا", description: "راهنمای سفر و نکات رزرو هتل" };

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <header className="bg-gradient-to-br from-night via-night2 to-[#5B1FA8] pb-12 pt-12 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <h1 className="text-[clamp(30px,5vw,52px)] font-black">وبلاگ سرا</h1>
          <p className="mt-1 max-w-xl text-white/80">راهنمای شهرها، نکات رزرو و ایده‌هایی برای سفر بعدی.</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10"><BlogList /></main>
      <Footer />
    </>
  );
}
