"use client";
import Link from "next/link";
import Section from "./Section";
import PostCard from "./PostCard";
import { usePosts } from "./PostsProvider";

export default function LatestPosts() {
  const { posts } = usePosts();
  if (!posts.length) return null;
  return (
    <Section title="تازه‌ترین مقاله‌ها" sub="راهنمای شهرها و نکات رزرو از وبلاگ سرا.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.slice(0, 3).map((p) => <PostCard key={p.slug} post={p} />)}</div>
      <div className="mt-6 text-center"><Link href="/blog" className="font-bold text-violet dark:text-aqua">همه‌ی مقاله‌ها ←</Link></div>
    </Section>
  );
}
