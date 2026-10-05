import Navbar from "@/components/Navbar";
import UnsubscribeClient from "@/components/UnsubscribeClient";
import Footer from "@/components/Footer";

export const metadata = { title: "لغو عضویت خبرنامه — سرا", robots: { index: false, follow: false } };

export default function UnsubscribePage({ searchParams }) {
  const token = typeof searchParams?.token === "string" ? searchParams.token.slice(0, 64) : "";
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[50vh] max-w-xl px-5 py-16">
        <UnsubscribeClient token={token} />
      </main>
      <Footer />
    </>
  );
}
