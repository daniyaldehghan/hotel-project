"use client";
import { useHotels } from "./HotelsProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HotelPhoto from "./HotelPhoto";
import { useFavorites } from "./FavoritesProvider";
import { useCurrency } from "./CurrencyProvider";
import { fa } from "@/lib/fa";

const minPrice = (h) => Math.min(...h.rooms.map((r) => r.price));

export default function CompareClient({ hotels: base }) {
  const hotels = useHotels(base);
  const { cmp, toggleCmp, clearCmp, ready } = useFavorites();
  const { fmt } = useCurrency();
  const router = useRouter();
  const list = cmp.map((id) => hotels.find((h) => h.id === id)).filter(Boolean);
  const allAmenities = [...new Set(list.flatMap((h) => h.amenities))];

  const rows = [
    { l: "شهر", v: (h) => h.city },
    {
      l: "قیمت از (هر شب)",
      v: (h) => fmt(minPrice(h)),
      s: minPrice,
      best: "min",
    },
    { l: "امتیاز", v: (h) => fa(h.rating), s: (h) => h.rating, best: "max" },
    {
      l: "ستاره",
      v: (h) => "★".repeat(h.stars),
      s: (h) => h.stars,
      best: "max",
    },
    {
      l: "تعداد نظر",
      v: (h) => fa(h.reviews),
      s: (h) => h.reviews,
      best: "max",
    },
    {
      l: "فاصله تا مرکز",
      v: (h) => `${fa(h.distance).replace(".", "٫")} کیلومتر`,
      s: (h) => h.distance,
      best: "min",
    },
    { l: "ورود / خروج", v: (h) => `${h.checkIn} / ${h.checkOut}` },
    { l: "نوع اتاق", v: (h) => `${fa(h.rooms.length)} نوع` },
  ];
  const bestOf = (r) => {
    if (!r.best || list.length < 2) return null;
    const vals = list.map(r.s);
    return r.best === "min" ? Math.min(...vals) : Math.max(...vals);
  };

  return (
    <>
      <header className="bg-gradient-to-br from-night via-night2 to-[#5B1FA8] pb-12 pt-12 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <h1 className="text-[clamp(30px,5vw,48px)] font-black">
            مقایسه هتل‌ها
          </h1>
          <p className="mt-1 text-white/80">
            تا ۳ هتل را کنار هم ببین و بهترین را انتخاب کن.
          </p>
        </div>
      </header>

      <main className="mx-auto min-h-[50vh] max-w-6xl px-5 py-8">
        {!ready ? (
          <p className="text-mut">در حال بارگذاری…</p>
        ) : list.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line p-10 text-center sm:p-12">
            <p className="text-lg font-bold">
              هنوز هتلی برای مقایسه انتخاب نکرده‌ای
            </p>
            <p className="mb-5 mt-1 text-mut">
              روی دکمه‌ی «+ مقایسه» توی کارت هتل بزن.
            </p>
            <Link
              href="/hotels"
              className="inline-block rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white"
            >
              دیدن هتل‌ها
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-mut">
                {fa(list.length)} هتل انتخاب شده
                {list.length < 2 && " — یک هتل دیگر اضافه کن"}
              </p>
              <div className="flex gap-2">
                {list.length < 3 && (
                  <Link
                    href="/hotels"
                    className="rounded-full border border-line px-4 py-1.5 text-sm"
                  >
                    + افزودن هتل
                  </Link>
                )}
                <button
                  onClick={clearCmp}
                  className="rounded-full border border-line px-4 py-1.5 text-sm text-mut hover:text-coral"
                >
                  پاک کردن همه
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-line bg-card">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky start-0 z-10 w-32 bg-card p-4" />
                    {list.map((h) => (
                      <th
                        key={h.id}
                        className="min-w-[200px] p-4 text-start align-top font-normal"
                      >
                        <div className="mb-3 max-lg:w-20 max-lg:h-20 lg:h-28 overflow-hidden rounded-2xl">
                          <HotelPhoto hotel={h} />
                        </div>
                        <b className="block text-base">{h.name}</b>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() =>
                              router.push(`/checkout?hotel=${h.id}`)
                            }
                            className="rounded-[10px] bg-ink px-4 py-1.5 text-xs font-bold text-bg hover:bg-coral hover:text-white"
                          >
                            رزرو
                          </button>
                          <button
                            onClick={() => toggleCmp(h.id)}
                            className="rounded-[10px] border border-line px-3 py-1.5 text-xs text-mut hover:text-coral"
                          >
                            حذف
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const best = bestOf(r);
                    return (
                      <tr key={r.l} className="border-t border-line">
                        <th
                          scope="row"
                          className="sticky start-0 z-10 bg-card p-4 text-start font-semibold text-mut"
                        >
                          {r.l}
                        </th>
                        {list.map((h) => (
                          <td key={h.id} className="p-4">
                            {r.v(h)}
                            {best !== null && r.s(h) === best && (
                              <span className="ms-2 rounded bg-violet/10 px-1.5 text-xs text-violet dark:text-aqua">
                                بهترین
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {allAmenities.map((a) => (
                    <tr key={a} className="border-t border-line">
                      <th
                        scope="row"
                        className="sticky start-0 z-10 bg-card p-4 text-start font-semibold text-mut"
                      >
                        {a}
                      </th>
                      {list.map((h) => (
                        <td key={h.id} className="p-4">
                          {h.amenities.includes(a) ? (
                            <span
                              className="text-violet dark:text-aqua"
                              aria-label="دارد"
                            >
                              ✓
                            </span>
                          ) : (
                            <span className="text-mut" aria-label="ندارد">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
