// رزروها در مونگو ذخیره می‌شوند؛ این فایل فقط کلاینتِ API است (قبلاً localStorage بود).
async function api(url, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method, cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("اتصال به سرور برقرار نشد. اینترنتت را بررسی کن.");
  }
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(d.error || "خطایی رخ داد، دوباره امتحان کن."); e.status = res.status; e.errors = d.errors; throw e; }
  return d;
}

// ── کاربر ──
export const createBooking = (payload) => api("/api/bookings", { method: "POST", body: payload }).then((d) => d.booking);
export const fetchMyBookings = () => api("/api/bookings").then((d) => d.items);
export const cancelBooking = (code) => api("/api/bookings", { method: "PATCH", body: { code, status: "cancelled" } }).then((d) => d.item);
export const trackBooking = (code) => api("/api/bookings/track", { method: "POST", body: { code } }).then((d) => d.booking);

// ── ادمین ──
export const fetchAllBookings = () => api("/api/bookings?scope=all").then((d) => d.items);
export const setBookingStatus = (code, status) => api("/api/bookings", { method: "PATCH", body: { code, status } }).then((d) => d.item);
export const deleteBooking = (code) => api(`/api/bookings?code=${encodeURIComponent(code)}`, { method: "DELETE" });
export const lookupBookingForVoid = (code) => api(`/api/bookings/void?code=${encodeURIComponent(code)}`).then((d) => d.item);
export const voidBooking = (code) => api("/api/bookings/void", { method: "POST", body: { code } }).then((d) => d.item);
export const addBookings = (items) => api("/api/bookings/admin", { method: "POST", body: { items } });
export const removeDemoBookings = () => api("/api/bookings/admin?scope=demo", { method: "DELETE" });
export const clearBookings = () => api("/api/bookings/admin?scope=all", { method: "DELETE" });
