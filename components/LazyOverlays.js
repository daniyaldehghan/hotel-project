"use client";
import dynamic from "next/dynamic";

// چت و مودال جزئیات هتل فقط بعد از لود اولیه‌ی صفحه بارگذاری می‌شوند، تا صفحه سریع‌تر بالا بیاید.
const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });
const HotelModalHost = dynamic(() => import("./HotelModalHost"), { ssr: false });

export default function LazyOverlays() {
  return (
    <>
      <HotelModalHost />
      <ChatWidget />
    </>
  );
}
