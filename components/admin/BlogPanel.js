"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePosts } from "../PostsProvider";
import PostForm from "./PostForm";
import { Badge, Btn, Card, Modal, inputCls } from "./ui";
import { POSTS } from "@/data/posts";
import { CITIES, bySlug } from "@/lib/cities";
import { persianDate, readMinutes } from "@/lib/blog";
import { fa } from "@/lib/fa";

export default function BlogPanel({ notify }) {
  const { posts, categories, removedPosts, ov, addPost, updatePost, removePost, restorePosts } = usePosts();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [form, setForm] = useState(null); // "new" | post
  const [asking, setAsking] = useState(null); // slug
  const [showRemoved, setShowRemoved] = useState(false);

  const list = useMemo(() => {
    const s = q.trim();
    return posts.filter((p) => (!s || p.title.includes(s)) && (!cat || p.category === cat));
  }, [posts, q, cat]);
  // آدرس همه‌ی مقاله‌ها (حتی حذف‌شده‌ها) تا آدرس تکراری ساخته نشود
  const takenSlugs = useMemo(() => new Set([...POSTS.map((p) => p.slug), ...ov.added.map((p) => p.slug)]), [ov]);
  const done = (ok, msg) => notify(ok ? msg : "حافظه‌ی مرورگر پر است؛ عکس سنگین‌تر را کوچک‌تر کن.");

  const save = (d) => {
    const read = readMinutes(d.body);
    if (form === "new") {
      const now = Date.now();
      done(addPost({ ...d, cover: 1 + (now % 110), date: persianDate(now), read, created: now }), "مقاله منتشر شد و همین الان در وبلاگ دیده می‌شود.");
    } else {
      const { slug, ...patch } = d; // آدرس بعد از انتشار ثابت می‌ماند
      done(updatePost(form.slug, { ...patch, read }), "تغییرات ذخیره شد.");
    }
    setForm(null);
  };
  const del = (slug) => { done(removePost(slug), "مقاله حذف شد."); setAsking(null); };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[180px] flex-1"><span className="mb-1 block text-xs font-semibold text-mut">جستجو در عنوان</span>
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثلاً اصفهان" /></label>
          <label><span className="mb-1 block text-xs font-semibold text-mut">دسته‌بندی</span>
            <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">همه</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <Btn kind="primary" onClick={() => setForm("new")}>+ مقاله‌ی جدید</Btn>
        </div>
        {removedPosts.length > 0 && (
          <p className="mt-3 text-sm text-mut">{fa(removedPosts.length)} مقاله‌ی حذف‌شده دارید. <button onClick={() => setShowRemoved(true)} className="font-bold text-violet underline dark:text-aqua">مشاهده و بازیابی</button></p>
        )}
      </Card>

      <div className="overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-start text-xs text-mut">
            <tr>{["مقاله", "دسته", "شهر", "تاریخ", ""].map((h, i) => <th key={i} className="p-3 text-start font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.slug} className="border-b border-line last:border-0 hover:bg-bg">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photo || `/hotels/${p.cover}.svg`} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                    <div>
                      <b className="block">{p.title}</b>
                      <span className="text-xs text-mut">{fa(p.read)} دقیقه مطالعه</span>
                      {ov.added.some((x) => x.slug === p.slug) ? <> <Badge tone="ok">جدید</Badge></> : ov.edits[p.slug] ? <> <Badge tone="info">ویرایش‌شده</Badge></> : null}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-mut">{p.category}</td>
                <td className="p-3">{(p.city && bySlug(p.city)?.name) || <span className="text-mut">—</span>}</td>
                <td className="p-3 text-mut">{p.date}</td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {asking === p.slug ? (
                      <><span className="self-center text-xs">حذف شود؟</span><Btn kind="danger" onClick={() => del(p.slug)} className="!px-3 !py-1">بله</Btn><Btn onClick={() => setAsking(null)} className="!px-3 !py-1">نه</Btn></>
                    ) : (
                      <>
                        <Link href={`/blog/${p.slug}`} target="_blank" className="rounded-xl border border-line bg-card px-3 py-1 text-sm hover:border-violet">مشاهده ↗</Link>
                        <Btn onClick={() => setForm(p)} className="!px-3 !py-1">ویرایش</Btn>
                        <Btn onClick={() => setAsking(p.slug)} className="!px-3 !py-1 text-coral">حذف</Btn>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={5} className="p-10 text-center text-mut">مقاله‌ای پیدا نشد.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-mut">{fa(list.length)} مقاله</p>

      {form && <PostForm post={form === "new" ? null : form} cities={CITIES} categories={categories} takenSlugs={takenSlugs} onSave={save} onClose={() => setForm(null)} />}

      {showRemoved && (
        <Modal title="مقاله‌های حذف‌شده" onClose={() => setShowRemoved(false)}>
          {removedPosts.length === 0 ? <p className="text-mut">مقاله‌ی حذف‌شده‌ای نیست.</p> : (
            <>
              <ul className="divide-y divide-line">
                {removedPosts.map((p) => (
                  <li key={p.slug} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span><b>{p.title}</b> <span className="text-mut">· {p.category}</span></span>
                    <Btn onClick={() => done(restorePosts([p.slug]), "مقاله بازیابی شد.")} className="!py-1">بازیابی</Btn>
                  </li>
                ))}
              </ul>
              <Btn kind="primary" className="mt-4" onClick={() => { done(restorePosts(), "همه‌ی مقاله‌ها بازیابی شدند."); setShowRemoved(false); }}>بازیابی همه</Btn>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
