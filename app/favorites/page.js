import Navbar from "@/components/Navbar";
import FavoritesList from "@/components/FavoritesList";
import Footer from "@/components/Footer";
import { HOTELS } from "@/data/hotels";

export const metadata = { title: "علاقه‌مندی‌ها — سرا" };

export default function FavoritesPage() {
  return (
    <>
      <Navbar />
      <FavoritesList hotels={HOTELS} />
      <Footer />
    </>
  );
}
