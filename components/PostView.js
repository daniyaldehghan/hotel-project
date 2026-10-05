"use client";
import Link from "next/link";
import PostCard from "./PostCard";
import { usePosts } from "./PostsProvider";
import { paragraphs } from "@/lib/blog";
import { bySlug } from "@/lib/cities";

export default function PostView({ slug }) {
  const { posts, ready } = usePosts();
  const p = posts.find((x) => x.slug === slug);

  if (!p) {
    // مقاله‌های افزوده‌شده‌ی ادمین فقط در مرورگر ذخیره‌اند؛ تا خواندن حافظه صبر می‌کنیم
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        {!ready ? <p className="text-mut">در حال بارگذاری…</p> : (
          <>
            <h1 className="text-2xl font-black">این مقاله پیدا نشد</h1>
            <p className="mt-2 text-mut">ممکن است حذف شده یا آدرس درست نباشد.</p>
            <Link href="/blog" className="mt-5 inline-block font-bold text-violet dark:text-aqua">بازگشت به وبلاگ ←</Link>
          </>
        )}
      </div>
    );
  }

  const city = p.city ? bySlug(p.city) : null;
  const related = posts.filter((x) => x.slug !== p.slug).sort((a) => (a.category === p.category ? -1 : 1)).slice(0, 3);
  return (
    <>
      <article className="mx-auto max-w-3xl px-5 py-10">
        <nav aria-label="مسیر صفحه" className="mb-4 text-sm text-mut"><Link href="/">خانه</Link> › <Link href="/blog">وبلاگ</Link></nav>
        <span className="rounded-full bg-violet/10 px-3 py-0.5 text-xs font-bold text-violet dark:text-aqua">{p.category}</span>
        <h1 className="mb-3 mt-3 text-[clamp(28px,5vw,44px)] font-black leading-tight">{p.title}</h1>
        <p className="mb-6 text-sm text-mut">{p.date} · {p.read} دقیقه مطالعه</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.photo || `/hotels/${p.cover}.svg`} alt="" className="mb-8 aspect-[16/9] w-full rounded-3xl object-cover" />
        <p className="mb-8 text-lg leading-9 text-mut">{p.excerpt}</p>
        {p.body.map((b, i) => (
          <section key={i} className="mb-7">
            {b.h && <h2 className="mb-2 text-xl font-extrabold">{b.h}</h2>}
            {paragraphs(b.p).map((t, j) => <p key={j} className="mb-3 leading-9">{t}</p>)}
          </section>
        ))}
        {city && (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-violet to-coral p-6 text-white">
            <div><b className="text-lg">آماده‌ی سفر به {city.name} هستی؟</b><p className="text-sm text-white/85">هتل‌های {city.name} را ببین و مقایسه کن.</p></div>
            <Link href={`/city/${city.slug}`} className="rounded-[14px] bg-white px-6 py-2.5 font-extrabold text-night">دیدن هتل‌ها</Link>
          </div>
        )}
      </article>
      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-6">
          <h2 className="mb-4 text-2xl font-extrabold">مقاله‌های مرتبط</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <PostCard key={r.slug} post={r} />)}</div>
        </section>
      )}
    </>
  );
}
