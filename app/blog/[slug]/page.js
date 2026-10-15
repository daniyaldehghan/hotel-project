import Navbar from "@/components/Navbar";
import PostView from "@/components/PostView";
import Footer from "@/components/Footer";
import { POSTS, postBySlug } from "@/data/posts";

// مقاله‌های اصلی از قبل ساخته می‌شوند؛ مقاله‌های افزوده‌شده‌ی ادمین (ذخیره در مرورگر) در کلاینت نمایش داده می‌شوند.
export const generateStaticParams = () => POSTS.map((p) => ({ slug: p.slug }));
export function generateMetadata({ params }) {
  const p = postBySlug(params.slug);
  return p ? { title: `${p.title} — سرا`, description: p.excerpt } : { title: "مقاله — سرا" };
}

export default function PostPage({ params }) {
  return (
    <>
      <Navbar />
      <PostView slug={params.slug} />
      <Footer />
    </>
  );
}
