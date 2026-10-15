// محدودکننده‌ی ساده‌ی درخواست بر اساس IP (در حافظه‌ی سرور؛ برای جلوگیری از اسپم و حدس‌زدن کد)
// استفاده:  const limited = makeLimiter("نام", 10 * 60 * 1000, 5);   if (limited(ipOf(req))) ...
export function makeLimiter(name, windowMs, max) {
  const hits = (globalThis[`_rl_${name}`] ||= new Map());
  return (key) => {
    const now = Date.now();
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) { hits.set(key, list); return true; }
    list.push(now); hits.set(key, list);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    return false;
  };
}

export const ipOf = (req) =>
  (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
