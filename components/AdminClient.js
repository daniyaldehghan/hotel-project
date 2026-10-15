"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import { useAdmin } from "./HotelsProvider";
import Dashboard from "./admin/Dashboard";

// پنل‌های دیگر فقط وقتی تبشان باز شد بارگذاری می‌شوند (قبلاً همه با هم لود می‌شدند)
const Loading = () => <p className="text-mut">در حال بارگذاری…</p>;
const lazy = (f) => dynamic(f, { loading: Loading });
const HotelsPanel = lazy(() => import("./admin/HotelsPanel"));
const CategoriesPanel = lazy(() => import("./admin/CategoriesPanel"));
const BookingsPanel = lazy(() => import("./admin/BookingsPanel"));
const SettingsPanel = lazy(() => import("./admin/SettingsPanel"));
const BlogPanel = lazy(() => import("./admin/BlogPanel"));
const ChatPanel = lazy(() => import("./admin/ChatPanel"));
const ReviewsPanel = lazy(() => import("./admin/ReviewsPanel"));
const NewsletterPanel = lazy(() => import("./admin/NewsletterPanel"));
const MessagesPanel = lazy(() => import("./admin/MessagesPanel"));
const OffersPanel = lazy(() => import("./admin/OffersPanel"));
import ChatBell from "./admin/ChatBell";
import { useChatData } from "./useChat";
import { addBookings, fetchAllBookings } from "@/lib/bookings";
import { seedBookings } from "@/lib/store";
import { fa } from "@/lib/fa";
import LogoutButton from "./LogoutButtom";

const TABS = [
  ["dash", "📊 داشبورد"],
  ["hotels", "🏨 هتل‌ها"],
  ["cats", "🏷️ دسته‌بندی‌ها"],
  ["bookings", "🧾 رزروها"],
  ["offers", "🔥 پیشنهاد ویژه"],
  ["blog", "📝 وبلاگ"],
  ["chat", "💬 گفتگوها"],
  ["messages", "📨 پیام‌ها"],
  ["reviews", "⭐ نظرات"],
  ["newsletter", "📬 خبرنامه"],
  ["settings", "⚙️ تنظیمات"],
];

export default function AdminClient() {
  const { hotels, ready } = useAdmin();
  const [tab, setTab] = useState("dash");
  const [bookings, setBookings] = useState(null);
  const [toast, setToast] = useState("");
  const [activeThread, setActiveThread] = useState(null);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [newMessages, setNewMessages] = useState(0);
  const chat = useChatData();
  const unread = chat.threads.reduce((s, t) => s + (t.adminUnread || 0), 0);
  const openThread = (id) => {
    setActiveThread(id || null);
    setTab("chat");
  };

  // رزروها از سرور (مونگو) خوانده می‌شوند و هر ۳۰ ثانیه (وقتی تب دیده می‌شود) تازه می‌شوند
  const refresh = useCallback(
    () =>
      fetchAllBookings()
        .then(setBookings)
        .catch(() => setBookings((b) => b ?? [])),
    []
  );
  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30000);
    return () => clearInterval(t);
  }, [refresh]);
  // تعداد نظرهای در انتظار تأیید برای نشانِ روی تب «نظرات»
  useEffect(() => {
    fetch("/api/reviews?status=pending", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPendingReviews(d.counts?.pending || 0))
      .catch(() => {});
  }, []);
  // پیام‌های «تماس با ما»ی خوانده‌نشده برای نشانِ روی تب «پیام‌ها»
  useEffect(() => {
    fetch("/api/contact?status=new", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setNewMessages(d.counts?.new || 0))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const logout = () => signOut({ callbackUrl: "/" });
  const seed = async () => {
    try {
      await addBookings(seedBookings(hotels, 70));
      await refresh();
      setToast("۷۰ رزرو نمونه ساخته شد.");
    } catch (e) {
      setToast(e.message);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-night text-white dark:border-b dark:border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-2.5 whitespace-nowrap text-lg font-black sm:text-xl">
            <i className="h-7 w-7 rounded-[50%_50%_50%_4px] bg-gradient-to-br from-sun to-coral" />
            <span>
              <span className="hidden sm:inline">پنل </span>مدیریت سفرینو
            </span>
            <span className="hidden rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold sm:inline">
              {fa(hotels.length)} هتل · {fa(bookings?.length ?? 0)} رزرو
            </span>
          </div>
          <div className="flex  items-center gap-2 text-sm">
            <div className=" hidden lg:block">
              <ThemeToggle />
            </div>
            <ChatBell threads={chat.threads} onOpen={openThread} />
            <Link
              href="/"
              className="whitespace-nowrap rounded-full border border-white/30 px-3 py-1.5 hover:bg-white/10 sm:px-4"
            >
              <span className="hidden sm:inline">مشاهده‌ی </span>سایت ↗
            </Link>
            <Link
              href="/account"
              aria-label="پنل کاربری"
              className="whitespace-nowrap rounded-full border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10 sm:px-4"
            >
              <span aria-hidden="true">👤</span>
              <span className="hidden sm:inline"> پنل من</span>
            </Link>
            <div className="">
              {/* <LogoutButton /> */}
            </div>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5"
          role="tablist"
          aria-label="بخش‌های پنل"
        >
          {TABS.map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`shrink-0 border-b-[3px] px-4 py-3 text-sm font-semibold transition ${
                tab === k
                  ? "border-coral text-white"
                  : "border-transparent text-white/65 hover:text-white"
              }`}
            >
              {l}
              {k === "messages" && newMessages > 0 && (
                <span className="ms-1.5 rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">
                  {fa(newMessages)}
                </span>
              )}
              {k === "reviews" && pendingReviews > 0 && (
                <span className="ms-1.5 rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">
                  {fa(pendingReviews)}
                </span>
              )}
              {k === "chat" && unread > 0 && (
                <span className="ms-1.5 rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">
                  {fa(unread)}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-6">
        {!ready ? (
          <p className="text-mut">در حال بارگذاری…</p>
        ) : (
          <>
            {tab === "dash" && (
              <Dashboard
                bookings={bookings}
                go={setTab}
                onSeed={seed}
                chat={chat}
                openThread={openThread}
              />
            )}
            {tab === "hotels" && (
              <HotelsPanel bookings={bookings} notify={setToast} />
            )}
            {tab === "cats" && <CategoriesPanel notify={setToast} />}
            {tab === "bookings" && (
              <BookingsPanel
                bookings={bookings}
                refresh={refresh}
                notify={setToast}
              />
            )}
            {tab === "offers" && <OffersPanel notify={setToast} />}
            {tab === "blog" && <BlogPanel notify={setToast} />}
            {tab === "chat" && (
              <ChatPanel
                threads={chat.threads}
                activeId={activeThread}
                setActiveId={setActiveThread}
                notify={setToast}
              />
            )}
            {tab === "messages" && (
              <MessagesPanel notify={setToast} onCount={setNewMessages} />
            )}
            {tab === "reviews" && (
              <ReviewsPanel notify={setToast} onCount={setPendingReviews} />
            )}
            {tab === "newsletter" && <NewsletterPanel notify={setToast} />}
            {tab === "settings" && (
              <SettingsPanel
                bookings={bookings}
                refresh={refresh}
                notify={setToast}
                logout={logout}
              />
            )}
          </>
        )}
      </main>

      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-x-4 bottom-5 z-[80] mx-auto max-w-md rounded-2xl bg-ink px-5 py-3.5 text-center font-semibold text-bg transition-transform duration-200 ${
          toast ? "translate-y-0" : "translate-y-[160%]"
        }`}
      >
        {toast}
      </div>
    </>
  );
}
