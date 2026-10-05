"use client";
import { useState } from "react";
import PostCard from "./PostCard";
import { usePosts } from "./PostsProvider";

export default function BlogList() {
  const { posts, categories } = usePosts();
  const [selected, setCat] = useState("all");
  const cat = selected === "all" || categories.includes(selected) ? selected : "all"; // اگر دسته حذف شد به «همه» برمی‌گردد
  const list = cat === "all" ? posts : posts.filter((p) => p.category === cat);
  const [first, ...rest] = list;
  const chip = (on) => `shrink-0 rounded-full border px-4 py-1.5 text-sm ${on ? "border-violet bg-violet text-white" : "border-line bg-card"}`;
  return (
    <>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="دسته‌بندی مقاله‌ها">
        <button onClick={() => setCat("all")} aria-pressed={cat === "all"} className={chip(cat === "all")}>همه</button>
        {categories.map((c) => <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={chip(cat === c)}>{c}</button>)}
      </div>
      {!first && <p className="rounded-3xl border border-line bg-card p-10 text-center text-mut">هنوز مقاله‌ای منتشر نشده.</p>}
      {first && <PostCard post={first} big />}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => <PostCard key={p.slug} post={p} />)}
      </div>
    </>
  );
}
