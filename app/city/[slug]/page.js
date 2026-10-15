import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import CityExplorer from "@/components/CityExplorer";
import Footer from "@/components/Footer";
import { HOTELS } from "@/data/hotels";
import { CITIES, bySlug } from "@/lib/cities";

export const dynamicParams = false;
export const generateStaticParams = () => CITIES.map((c) => ({ slug: c.slug }));
export function generateMetadata({ params }) {
  const c = bySlug(params.slug);
  return { title: c ? `هتل‌های ${c.name} — سرا` : "سرا" };
}

export default function CityPage({ params }) {
  if (!bySlug(params.slug)) notFound();
  return (
    <>
      <Navbar />
      <CityExplorer hotels={HOTELS} initial={params.slug} />
      <Footer />
    </>
  );
}
