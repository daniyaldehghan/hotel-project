import { Vazirmatn } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ThemeProvider from "@/components/ThemeProvider";
import CurrencyProvider from "@/components/CurrencyProvider";
import CompareBar from "@/components/CompareBar";
import FavoritesProvider from "@/components/FavoritesProvider";
import HotelsProvider from "@/components/HotelsProvider";
import PostsProvider from "@/components/PostsProvider";
import LazyOverlays from "@/components/LazyOverlays";
import NextAuthProvider from "@/providers/NextAuthProvider";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "800", "900"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata = {
  title: "سرا — رزرو هتل",
  description: "رزرو هتل با لغو رایگان و قیمت نهایی از همان اول",
};

export const viewport = { themeColor: "#150A33", colorScheme: "light dark" };

// قبل از اولین رسم صفحه اجرا می‌شود تا تم درست از همان ابتدا اعمال شود (بدون سوسو)
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("sara-theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(_){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="overflow-x-hidden bg-bg font-sans leading-relaxed text-ink antialiased">
        <ThemeProvider>
        <AuthProvider>
          <NextAuthProvider>
            <CurrencyProvider>
              <HotelsProvider>
                <PostsProvider>
                  <FavoritesProvider>
                    {children}
                    <CompareBar />
                    <LazyOverlays />
                  </FavoritesProvider>
                </PostsProvider>
              </HotelsProvider>
            </CurrencyProvider>
          </NextAuthProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
