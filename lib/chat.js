// گفتگوها و جستجوهای بی‌نتیجه روی همین مرورگر (localStorage) ذخیره می‌شوند.
// بین تب‌های همین مرورگر زنده همگام می‌شود (ویزیتور در یک تب، ادمین در تب دیگر)؛ برای چند دستگاه باید بک‌اند اضافه شود.
export const CHAT_KEY = "sara:chat:v1";
export const ME_KEY = "sara:chat:me";
export const MISS_KEY = "sara:misses";
export const SOUND_KEY = "sara:chat:sound";
export const CHAT_EVENT = "sara:chat:changed";
const MAX_THREADS = 60, MAX_MSGS = 150;

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const emit = () => { try { window.dispatchEvent(new Event(CHAT_EVENT)); } catch {} };
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const loadThreads = () => { const d = read(CHAT_KEY, { threads: [] }); return Array.isArray(d.threads) ? d.threads : []; };
function saveThreads(list) {
  const threads = [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_THREADS);
  write(CHAT_KEY, { threads }); emit();
}
function mutate(id, fn) {
  const list = loadThreads();
  const i = list.findIndex((t) => t.id === id);
  if (i < 0) return null;
  list[i] = fn({ ...list[i] });
  saveThreads(list);
  return list[i];
}

export const myThreadId = () => read(ME_KEY, null);
export function ensureThread(name) {
  const list = loadThreads();
  const cur = myThreadId();
  if (cur && list.some((t) => t.id === cur)) {
    if (name) { const t = list.find((x) => x.id === cur); if (t.name !== name) mutate(cur, (x) => ({ ...x, name })); }
    return cur;
  }
  const id = uid(), now = Date.now();
  write(ME_KEY, id);
  saveThreads([{ id, name: name || "مهمان", createdAt: now, updatedAt: now, adminUnread: 0, userUnread: 0, status: "open", messages: [] }, ...list]);
  return id;
}
// msg: { from: "user"|"bot"|"admin", text, hotelIds?, chips?, link? }
export const addMessage = (id, msg) => mutate(id, (t) => {
  const m = { id: uid(), at: Date.now(), ...msg };
  t.messages = [...t.messages, m].slice(-MAX_MSGS);
  t.updatedAt = m.at;
  if (msg.from === "user") { t.adminUnread = (t.adminUnread || 0) + 1; t.status = "open"; }
  else { t.userUnread = (t.userUnread || 0) + 1; if (msg.from === "admin") t.status = "open"; }
  return t;
});
export const markRead = (id, who) => mutate(id, (t) => ({ ...t, [who === "admin" ? "adminUnread" : "userUnread"]: 0 }));
export const setStatus = (id, status) => mutate(id, (t) => ({ ...t, status }));
export const removeThread = (id) => saveThreads(loadThreads().filter((t) => t.id !== id));

// «بی‌پاسخ»: بعد از آخرین پیام کاربر، پشتیبان انسانی چیزی ننوشته
export function needsReply(t) {
  if (t.status === "closed") return false;
  const last = t.messages.map((m) => m.from).lastIndexOf("user");
  return last >= 0 && !t.messages.slice(last + 1).some((m) => m.from === "admin");
}
export const lastUserText = (t) => t.messages.filter((m) => m.from === "user").at(-1)?.text || "";

export const timeLabel = (at) => {
  const d = new Date(at);
  const same = d.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat("fa-IR-u-ca-gregory", same ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

// ---- جستجوهای بی‌نتیجه ----
export const loadMisses = () => { const l = read(MISS_KEY, []); return Array.isArray(l) ? l : []; };
export function logMiss(q, kind = "search") {
  const s = String(q || "").trim().slice(0, 80);
  if (!s) return;
  write(MISS_KEY, [{ q: s, kind, at: Date.now() }, ...loadMisses()].slice(0, 300)); emit();
}
export const clearMisses = () => { write(MISS_KEY, []); emit(); };

export function clearChat() { try { localStorage.removeItem(CHAT_KEY); localStorage.removeItem(ME_KEY); } catch {} emit(); }

export function seedChat() {
  const now = Date.now(), m = (from, text, ago, extra = {}) => ({ id: uid(), from, text, at: now - ago * 6e4, ...extra });
  const mk = (name, msgs, adminUnread) => ({ id: uid(), name, demo: true, createdAt: msgs[0].at, updatedAt: msgs.at(-1).at, adminUnread, userUnread: 0, status: "open", messages: msgs });
  saveThreads([
    mk("سارا (نمونه)", [m("user", "سلام، تاریخ رزرو SR-AB12CD رو می‌تونم عوض کنم؟", 4)], 1),
    mk("پیمان (نمونه)", [m("user", "پاریس هتل دارید؟", 22), m("bot", "😕 متأسفانه برای «پاریس» هتلی نداریم؛ مقصدهای فعلی ما را ببین.", 22)], 1),
    mk("مهمان نمونه", [m("user", "هتل نزدیک بازار تبریز دارید؟", 95), m("bot", "🎉 چند هتل پیدا کردم؛ بهترین‌ها را ببین.", 95), m("admin", "سلام! بله، در صفحه‌ی تبریز چند گزینه‌ی نزدیک بازار هست.", 90), m("user", "ممنون 🙏", 88)], 0),
  ].concat(loadThreads()));
  logMiss("پاریس", "chat"); logMiss("هتل در رم", "search"); logMiss("پاریس", "search");
}
