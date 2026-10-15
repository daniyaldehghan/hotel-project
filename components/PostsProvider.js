"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { POSTS } from "@/data/posts";
import { BLOG_KEY, EMPTY_BLOG, categoriesOf, clearBlog, loadBlog, mergePosts, sanitizeBlog, saveBlog } from "@/lib/blog";

const Ctx = createContext(null);
const FALLBACK = { posts: POSTS, categories: categoriesOf(POSTS), ready: false };
// لیست مقاله‌ها با اعمال تغییرات ادمین (قبل از mount همان داده‌ی اصلی؛ پس رندر سرور و کلاینت یکی است)
export const usePosts = () => useContext(Ctx) || FALLBACK;

export default function PostsProvider({ children }) {
  const [ov, setOv] = useState(EMPTY_BLOG);
  const [ready, setReady] = useState(false);
  const ref = useRef(EMPTY_BLOG);

  useEffect(() => {
    const load = () => { const o = loadBlog(); ref.current = o; setOv(o); };
    load(); setReady(true);
    const onStorage = (e) => { if (e.key === BLOG_KEY || e.key === null) load(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // هر تغییر را روی نسخه‌ی فعلی اعمال و ذخیره می‌کند؛ اگر حافظه‌ی مرورگر پر باشد false برمی‌گرداند
  const update = useCallback((fn) => {
    const n = fn(ref.current);
    ref.current = n; setOv(n);
    return saveBlog(n);
  }, []);

  const posts = useMemo(() => mergePosts(POSTS, ov), [ov]);
  const categories = useMemo(() => categoriesOf(posts), [posts]);
  const removedPosts = useMemo(() => POSTS.filter((p) => ov.removed.includes(p.slug)), [ov]);

  const api = useMemo(() => ({
    addPost: (post) => update((o) => ({ ...o, added: [...o.added, post] })),
    updatePost: (slug, patch) => update((o) => (o.added.some((p) => p.slug === slug)
      ? { ...o, added: o.added.map((p) => (p.slug === slug ? { ...p, ...patch } : p)) }
      : { ...o, edits: { ...o.edits, [slug]: { ...o.edits[slug], ...patch } } })),
    removePost: (slug) => update((o) => ({
      ...o,
      added: o.added.filter((p) => p.slug !== slug),
      removed: POSTS.some((p) => p.slug === slug) ? [...new Set([...o.removed, slug])] : o.removed,
    })),
    restorePosts: (slugs) => update((o) => ({ ...o, removed: slugs ? o.removed.filter((s) => !slugs.includes(s)) : [] })),
    importBlog: (obj) => update(() => sanitizeBlog(obj)),
    resetBlog() { clearBlog(); ref.current = EMPTY_BLOG; setOv(EMPTY_BLOG); },
    getBlog: () => ref.current,
  }), [update]);

  const value = useMemo(() => ({ posts, categories, removedPosts, ov, ready, ...api }), [posts, categories, removedPosts, ov, ready, api]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
