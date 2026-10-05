import Navbar from "@/components/Navbar";
import TrackBookingClient from "@/components/TrackBookingClient";
import Footer from "@/components/Footer";

export const metadata = { title: "پیگیری رزرو — سرا" };

export default function TrackPage({ searchParams }) {
  const code = typeof searchParams?.code === "string" ? searchParams.code.slice(0, 20) : "";
  return (
    <>
      <Navbar />
      <header className="bg-gradient-to-br from-night via-night2 to-[#5B1FA8] pb-12 pt-12 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <h1 className="text-[clamp(30px,5vw,48px)] font-black">پیگیری رزرو</h1>
          <p className="mt-1 text-white/80">با کد پیگیری، وضعیت رزرو را ببین؛ بدون نیاز به ورود.</p>
        </div>
      </header>
      <main className="mx-auto min-h-[50vh] max-w-2xl px-5 py-8">
        <TrackBookingClient initialCode={code} />
      </main>
      <Footer />
    </>
  );
}
