// تغییرات وبلاگ (افزودن/ویرایش/حذف مقاله) روی همین مرورگر (localStorage) ذخیره می‌شود.
// data/posts.js دست‌نخورده می‌ماند و تغییرات روی آن «اعمال» می‌شود (مثل lib/store.js برای هتل‌ها).
export const BLOG_KEY = "sara:blog:v1";
export const EMPTY_BLOG = { added: [], removed: [], edits: {} };

const isPost = (p) => p && typeof p.slug === "string" && typeof p.title === "string" && Array.isArray(p.body);

// هر ورودی (localStorage یا فایل پشتیبان) را به ساختار درست تبدیل می‌کند
export function sanitizeBlog(o) {
  const ok = o && typeof o === "object";
  return {
    added: ok && Array.isArray(o.added) ? o.added.filter(isPost) : [],
    removed: ok && Array.isArray(o.removed) ? o.removed.filter((s) => typeof s === "string") : [],
    edits: ok && o.edits && typeof o.edits === "object" && !Array.isArray(o.edits) ? o.edits : {},
  };
}

export function loadBlog() {
  try { return sanitizeBlog(JSON.parse(localStorage.getItem(BLOG_KEY) || "null")); } catch { return EMPTY_BLOG; }
}
export function saveBlog(o) {
  try { localStorage.setItem(BLOG_KEY, JSON.stringify(o)); return true; } catch { return false; }
}
export const clearBlog = () => { try { localStorage.removeItem(BLOG_KEY); } catch {} };

// مقاله‌های افزوده‌شده (تازه‌ترین اول) + مقاله‌های اصلی، بدون حذف‌شده‌ها و با اعمال ویرایش‌ها
export function mergePosts(base, ov) {
  const removed = new Set(ov.removed);
  const added = [...ov.added].sort((a, b) => (b.created || 0) - (a.created || 0));
  return [...added, ...base]
    .filter((p) => !removed.has(p.slug))
    .map((p) => (ov.edits[p.slug] ? { ...p, ...ov.edits[p.slug] } : p))
    .filter((p) => Array.isArray(p.body));
}

export const categoriesOf = (posts) => [...new Set(posts.map((p) => p.category).filter(Boolean))];

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const newSlug = () => `post-${Date.now().toString(36)}`;
export const persianDate = (t) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" }).format(t);
export const readMinutes = (body) => Math.max(1, Math.round(body.map((b) => `${b.h || ""} ${b.p || ""}`).join(" ").split(/\s+/).filter(Boolean).length / 160));
export const paragraphs = (text) => String(text || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
