import Link from "next/link";

export default function PostCard({ post: p, big = false }) {
  return (
    <article className={`group overflow-hidden rounded-3xl border border-line bg-card transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(108,59,255,.18)] ${big ? "md:grid md:grid-cols-2" : ""}`}>
      <Link href={`/blog/${p.slug}`} className={`block overflow-hidden ${big ? "h-56 md:h-full" : "h-44"}`} tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.photo || `/hotels/${p.cover}.svg`} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
      </Link>
      <div className="flex flex-col gap-2 p-5 sm:p-6">
        <span className="w-fit rounded-full bg-violet/10 px-3 py-0.5 text-xs font-bold text-violet dark:text-aqua">{p.category}</span>
        <h2 className={`font-extrabold leading-snug ${big ? "text-2xl" : "text-lg"}`}><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2>
        <p className="text-sm leading-7 text-mut">{p.excerpt}</p>
        <p className="mt-auto pt-2 text-xs text-mut">{p.date} · {p.read} دقیقه مطالعه</p>
      </div>
    </article>
  );
}
