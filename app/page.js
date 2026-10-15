import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HotelBrowser from "@/components/HotelBrowser";
import Destinations from "@/components/Destinations";
import Deal from "@/components/Deal";
import HowItWorks from "@/components/HowItWorks";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import Faq from "@/components/Faq";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import AssistantCta from "@/components/AssistantCta";
import LatestPosts from "@/components/LatestPosts";
import { HOTELS } from "@/data/hotels";
import BestHotels from "@/components/BestHotel";
import OfferSlider from "@/components/OfferSlider";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <HotelBrowser
        hotels={HOTELS}
        intro={
          <>
            <BestHotels hotels={HOTELS} />
            <Destinations hotels={HOTELS} />
            <OfferSlider hotels={HOTELS} />
          </>
        }
      />

      <Deal />
      <HowItWorks />
      <Stats />
      <AssistantCta />
      <Testimonials />
      <LatestPosts />
      <Faq />
      <Newsletter />
      <Footer />
    </>
  );
}
