import Navbar from "@/components/Navbar";
import BookingsClient from "@/components/BookingsClient";
import Footer from "@/components/Footer";
import { HOTELS } from "@/data/hotels";

export const metadata = { title: "رزروهای من — سرا" };

export default function BookingsPage() {
  return (
    <>
      <Navbar />
      <BookingsClient hotels={HOTELS} />
      <Footer />
    </>
  );
}
