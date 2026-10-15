// کلاینت API پیشنهادهای ویژه
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

export const fetchOffers = () => api("/api/offers"); // { items, now }
export const fetchAllOffers = () => api("/api/offers?scope=all"); // فقط ادمین
export const createOffer = (b) => api("/api/offers", { method: "POST", body: b }).then((d) => d.item);
export const updateOffer = (id, b) => api("/api/offers", { method: "PATCH", body: { id, ...b } }).then((d) => d.item);
export const deleteOffer = (id) => api(`/api/offers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
