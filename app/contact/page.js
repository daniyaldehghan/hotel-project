import Navbar from "@/components/Navbar";
import ContactClient from "@/components/ContactClient";
import Footer from "@/components/Footer";

export const metadata = { title: "ارتباط با ما — سرا" };

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <ContactClient />
      <Footer />
    </>
  );
}
