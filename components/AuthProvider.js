"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);
const KEY = "sara:user";
export const useAuth = () => useContext(Ctx);

// نمونه‌ی نمایشی: فقط نام و ایمیل نگه داشته می‌شود، رمز عبور هرگز ذخیره نمی‌شود.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const login = useCallback((u, remember = true) => {
    try {
      localStorage.removeItem(KEY); sessionStorage.removeItem(KEY);
      (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(u));
    } catch {}
    setUser(u);
  }, []);
  const logout = useCallback(() => {
    try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch {}
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}
