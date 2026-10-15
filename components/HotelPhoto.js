"use client";
import { useState } from "react";
import HotelArt from "./HotelArt";

// عکس هتل: اول hotel.photo (آپلود ادمین)، بعد hotel.image (فایل داخل public/hotels)، و اگر لود نشد تصویرسازی رنگی.
// (قبلاً برای هر هتل اول /hotels/<id>.jpg درخواست می‌شد که وجود نداشت و ۱۱۰ تا ۴۰۴ می‌ساخت.)
export default function HotelPhoto({ hotel, priority = false }) {
  const src = hotel.photo || hotel.image || `/hotels/${hotel.id}.svg`;
  const [failed, setFailed] = useState(false);
  if (failed) return <HotelArt hotel={hotel} />;
  return (
    <div className="relative h-full w-full bg-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={hotel.name}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
