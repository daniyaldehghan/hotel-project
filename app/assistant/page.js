import Navbar from "@/components/Navbar";
import AssistantClient from "@/components/AssistantClient";
import Footer from "@/components/Footer";
import { HOTELS } from "@/data/hotels";

export const metadata = { title: "دستیار سفر — سرا" };

export default function AssistantPage() {
  return (
    <>
      <Navbar />
      <AssistantClient hotels={HOTELS} />
      <Footer />
    </>
  );
}
