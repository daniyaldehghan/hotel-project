"use client";
import Link from "next/link";
import { useHotels } from "./HotelsProvider";
import Section from "./Section";
import Price from "./Price";
import { slugOf } from "@/lib/cities";
import { THEMES } from "./HotelArt";
import { fa } from "@/lib/fa";

export default function Destinations({ hotels: base }) {
  const hotels = useHotels(base);
  const cities = [...new Set(hotels.map((h) => h.city))].map((c) => {
    const l = hotels.filter((h) => h.city === c);
    return { c, n: l.length, from: Math.min(...l.map((h) => h.price)) };
  });
  return (
    <Section id="destinations" title="مقصدهای محبوب" sub="شهرهایی که این ماه بیشترین رزرو را داشتند.">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cities.map(({ c, n, from }, i) => (
          <Link
            key={c}
            href={`/city/${slugOf(c)}`}
            style={{ backgroundImage: `linear-gradient(145deg, ${THEMES[c][0]}, ${THEMES[c][1]})` }}
            className={`relative flex flex-col justify-end overflow-hidden rounded-3xl p-4 text-white transition hover:-translate-y-1 ${i === 0 || i === 9 ? "col-span-2 h-56 md:h-64" : "h-36 md:h-64"}`}
          >
            <div className="absolute -top-8 end-4 h-24 w-24 rounded-full bg-white/25" />
            <b className="relative text-xl">{c}</b>
            <span className="relative text-sm opacity-90">{fa(n)} هتل · از <Price usd={from} /></span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
