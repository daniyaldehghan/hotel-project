import Navbar from "@/components/Navbar";
import CompareClient from "@/components/CompareClient";
import Footer from "@/components/Footer";
import { HOTELS } from "@/data/hotels";

export const metadata = { title: "مقایسه هتل‌ها — سرا" };

export default function ComparePage() {
  return (
    <>
      <Navbar />
      <CompareClient hotels={HOTELS} />
      <Footer />
    </>
  );
}
