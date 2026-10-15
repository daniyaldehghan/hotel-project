"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// تم: "light" | "dark" | "system" (پیش‌فرض = همان تنظیم دستگاه)
const KEY = "sara-theme";
const Ctx = createContext({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
  toggle: () => {},
});
export const useTheme = () => useContext(Ctx);

const systemDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;
const resolve = (t) => (t === "system" ? (systemDark() ? "dark" : "light") : t);

function apply(resolved) {
  const el = document.documentElement;
  el.classList.toggle("dark", resolved === "dark");
  el.style.colorScheme = resolved;
}

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");
  const [resolved, setResolved] = useState("light");

  // خواندن انتخاب ذخیره‌شده (اسکریپت داخل <head> کلاس را از قبل گذاشته؛ اینجا فقط state هماهنگ می‌شود)
  useEffect(() => {
    let t = "system";
    try {
      const s = localStorage.getItem(KEY);
      if (s === "light" || s === "dark") t = s;
    } catch {}
    setThemeState(t);
    setResolved(resolve(t));
  }, []);

  // اگر کاربر انتخاب دستی نکرده باشد، با تغییر تم سیستم‌عامل همراه می‌شود
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => {
      const r = mq.matches ? "dark" : "light";
      setResolved(r);
      apply(r);
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [theme]);

  // همگام بودن بین تب‌های باز
  useEffect(() => {
    const on = (e) => {
      if (e.key !== KEY) return;
      const t =
        e.newValue === "light" || e.newValue === "dark" ? e.newValue : "system";
      setThemeState(t);
      const r = resolve(t);
      setResolved(r);
      apply(r);
    };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    try {
      if (t === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, t);
    } catch {}
    const r = resolve(t);
    setResolved(r);
    apply(r);
  }, []);

  const toggle = useCallback(
    () => setTheme(resolved === "dark" ? "light" : "dark"),
    [resolved, setTheme]
  );

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
