import Navbar from "@/components/Navbar";
import CityExplorer from "@/components/CityExplorer";
import Footer from "@/components/Footer";
import { HOTELS } from "@/data/hotels";

export const metadata = { title: "همه‌ی هتل‌ها — سرا" };

export default function HotelsPage() {
  return (
    <>
      <Navbar />
      <CityExplorer hotels={HOTELS} initial="all" />
      <Footer />
    </>
  );
}
