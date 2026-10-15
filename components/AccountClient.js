"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useFavorites } from "./FavoritesProvider";
import { useHotels } from "./HotelsProvider";
import { useChatData } from "./useChat";
import { fetchMyBookings } from "@/lib/bookings";
import { myThreadId } from "@/lib/chat";
import { levelOf, summarize } from "@/lib/trips";
import { fa } from "@/lib/fa";
import Overview from "./account/Overview";
import MyBookings from "./account/MyBookings";
import Saved from "./account/Saved";
import Messages from "./account/Messages";
import Settings from "./account/Settings";
import { useSession } from "next-auth/react";
import LogoutButton from "./LogoutButtom";

export default function AccountClient({
  hotels: base,
  profile: initialProfile,
  emails,
}) {
  const hotels = useHotels(base);
  const { user, ready, login } = useAuth();
  const { favs } = useFavorites();
  const { threads } = useChatData();
  const [bookings, setBookings] = useState(null);
  const [tab, setTabState] = useState("overview");
  const [meId, setMeId] = useState(null);
  const [profile, setProfile] = useState(
    initialProfile || { name: emails || "", email: "", phone: "" }
  ); // نام و ایمیل و شماره از دیتابیس؛ بعد از ذخیره در «تنظیمات» همین‌جا به‌روز می‌شود
  const { data } = useSession();
  const refresh = useCallback(
    () =>
      fetchMyBookings()
        .then(setBookings)
        .catch(() => setBookings((b) => b ?? [])),
    []
  );
  useEffect(() => {
    refresh();
    const h = window.location.hash.slice(1);
    if (["overview", "bookings", "saved", "messages", "settings"].includes(h))
      setTabState(h);
    // رزروها از سرور می‌آیند؛ وقتی کاربر به تب برمی‌گردد دوباره خوانده می‌شوند
    const on = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [refresh]);
  useEffect(() => setMeId(myThreadId()), [threads]);

  const setTab = (t) => {
    setTabState(t);
    try {
      history.replaceState(null, "", `#${t}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  };

  const sum = summarize(bookings || []);
  const lv = levelOf(sum.nights);
  const thread = threads.find((t) => t.id === meId);
  const unread = thread?.userUnread || 0;
  const TABS = [
    ["overview", "🏠 نمای کلی"],
    [
      "bookings",
      `🧳 رزروها${sum.upcoming.length ? ` (${fa(sum.upcoming.length)})` : ""}`,
    ],
    ["saved", `♥ علاقه‌مندی‌ها${favs.size ? ` (${fa(favs.size)})` : ""}`],
    ["messages", "💬 پیام‌ها"],
    ["settings", "⚙️ تنظیمات"],
  ];

  return (
    <>
      <header className="bg-gradient-to-br from-night via-night2 to-[#5B1FA8] pb-10 pt-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sun to-coral text-3xl font-black text-night">
            {/* {(user.first || "؟").trim()[0]} */}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(24px,4vw,38px)] font-black">
              سلام، {profile.name || ""} 👋
            </h1>
            <p className="truncate text-white/75" dir="auto">
              {/* {user.email} */}
            </p>
          </div>
          <div className="w-full rounded-2xl bg-white/10 p-4 sm:w-72">
            <div className="flex items-center justify-between text-sm">
              <b>
                {lv.cur.emoji} {lv.cur.name}
              </b>
              <span className="text-white/70">{fa(sum.nights)} شب</span>
            </div>
            <div
              className="my-2 h-2 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuenow={lv.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="پیشرفت سطح مسافر"
            >
              <div
                className="h-full rounded-full bg-gradient-to-l from-sun to-coral transition-all duration-500"
                style={{ width: `${lv.pct}%` }}
              />
            </div>
            <p className="text-xs text-white/70">
              {lv.next
                ? `${fa(lv.left)} شب دیگر تا «${lv.next.name}» ${lv.next.emoji}`
                : "به بالاترین سطح رسیده‌ای 🎉"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[60vh] max-w-6xl px-5 py-6">
        <div
          className="sticky top-16 z-30 -mx-5 mb-6 overflow-x-auto bg-bg/95 px-5 py-2"
          style={{
            backgroundColor: "color-mix(in srgb, var(--bg) 92%, transparent)",
          }}
        >
          <div
            className="flex gap-2"
            role="tablist"
            aria-label="بخش‌های پنل کاربری"
          >
            {TABS.map(([k, l]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`shrink-0 rounded-full border px-5 py-2 text-sm font-semibold ${
                  tab === k
                    ? "border-violet bg-violet text-white"
                    : "border-line bg-card"
                }`}
              >
                {l}
                {k === "messages" && unread > 0 && (
                  <span className="ms-1.5 rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">
                    {fa(unread)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {bookings === null ? (
          <p className="text-mut">در حال بارگذاری…</p>
        ) : (
          <>
            {tab === "overview" && (
              <Overview
                user={user}
                hotels={hotels}
                sum={sum}
                go={setTab}
                unread={unread}
              />
            )}
            {tab === "bookings" && (
              <MyBookings hotels={hotels} sum={sum} refresh={refresh} />
            )}
            {tab === "saved" && <Saved hotels={hotels} />}
            {tab === "messages" && <Messages thread={thread} />}
            {tab === "settings" && (
              <Settings profile={profile} onSaved={setProfile} />
            )}
          </>
        )}
      </main>
    </>
  );
}
