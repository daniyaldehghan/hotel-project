"use client";
import { useState } from "react";
import { SLUG_RE, newSlug } from "@/lib/blog";
import { resizeImage } from "@/lib/image";
import { Btn, Field, Modal, inputCls } from "./ui";

const blank = (category) => ({ title: "", slug: newSlug(), category, city: "", excerpt: "", photo: "", sections: [{ h: "", p: "" }] });
const fromPost = (p) => ({
  title: p.title, slug: p.slug, category: p.category || "", city: p.city || "", excerpt: p.excerpt || "", photo: p.photo || "",
  sections: p.body.length ? p.body.map((b) => ({ h: b.h || "", p: b.p || "" })) : [{ h: "", p: "" }],
});

export default function PostForm({ post, cities, categories, takenSlugs, onSave, onClose }) {
  const [f, setF] = useState(() => (post ? fromPost(post) : blank(categories[0] || "")));
  const [err, setErr] = useState({});
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setSec = (i, k, v) => set("sections", f.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= f.sections.length) return;
    const a = [...f.sections]; [a[i], a[j]] = [a[j], a[i]];
    set("sections", a);
  };

  const onFile = async (file) => {
    if (!file) return;
    try { set("photo", await resizeImage(file)); setErr((e) => ({ ...e, photo: "" })); }
    catch { setErr((e) => ({ ...e, photo: "فایل تصویر معتبر نیست." })); }
  };

  const submit = () => {
    const e = {};
    const slug = f.slug.trim().toLowerCase();
    if (!f.title.trim()) e.title = "عنوان را بنویس.";
    if (!post) {
      if (!SLUG_RE.test(slug)) e.slug = "فقط حروف انگلیسی کوچک، عدد و خط تیره (مثل my-first-post).";
      else if (takenSlugs.has(slug)) e.slug = "این آدرس قبلاً استفاده شده.";
    }
    if (!f.category.trim()) e.category = "دسته‌بندی را بنویس یا انتخاب کن.";
    if (!f.excerpt.trim()) e.excerpt = "یک خلاصه‌ی کوتاه بنویس.";
    const body = f.sections.map((s) => ({ h: s.h.trim(), p: s.p.trim() })).filter((s) => s.h || s.p);
    if (!body.length || body.some((s) => !s.p)) e.body = "حداقل یک بخش لازم است و هر بخش باید متن داشته باشد.";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ slug, title: f.title.trim(), category: f.category.trim(), city: f.city || null, excerpt: f.excerpt.trim(), photo: f.photo, body });
  };

  return (
    <Modal title={post ? `ویرایش «${post.title}»` : "مقاله‌ی جدید"} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="عنوان *" error={err.title} className="sm:col-span-2"><input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="دسته‌بندی *" error={err.category} hint="از دسته‌های موجود انتخاب کن یا دسته‌ی تازه بنویس.">
            <input className={inputCls} list="blog-cats" value={f.category} onChange={(e) => set("category", e.target.value)} />
            <datalist id="blog-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="شهر مرتبط (اختیاری)" hint="اگر شهر بگذاری، پایین مقاله دکمه‌ی دیدن هتل‌های آن شهر نمایش داده می‌شود.">
            <select className={inputCls} value={f.city} onChange={(e) => set("city", e.target.value)}>
              <option value="">بدون شهر</option>{cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="خلاصه *" error={err.excerpt} className="sm:col-span-2" hint="در کارت مقاله و بالای صفحه‌ی مقاله نشان داده می‌شود."><textarea rows={2} className={inputCls} value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></Field>
          {!post && (
            <Field label="آدرس مقاله (انگلیسی)" error={err.slug} className="sm:col-span-2" hint="بعد از انتشار قابل تغییر نیست.">
              <input dir="ltr" className={inputCls} value={f.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">متن مقاله</legend>
          <div className="space-y-3">
            {f.sections.map((s, i) => (
              <div key={i} className="rounded-2xl border border-line p-3">
                <div className="mb-2 flex gap-2">
                  <input aria-label={`تیتر بخش ${i + 1}`} placeholder="تیتر بخش (اختیاری)" className={inputCls} value={s.h} onChange={(e) => setSec(i, "h", e.target.value)} />
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="انتقال به بالا" className="w-10 shrink-0 rounded-xl border border-line disabled:opacity-30">↑</button>
                  <button type="button" disabled={i === f.sections.length - 1} onClick={() => move(i, 1)} aria-label="انتقال به پایین" className="w-10 shrink-0 rounded-xl border border-line disabled:opacity-30">↓</button>
                  <button type="button" disabled={f.sections.length < 2} onClick={() => set("sections", f.sections.filter((_, j) => j !== i))} aria-label="حذف بخش" className="w-10 shrink-0 rounded-xl border border-line text-coral disabled:opacity-30">✕</button>
                </div>
                <textarea aria-label={`متن بخش ${i + 1}`} rows={5} placeholder="متن بخش… (برای پاراگراف جدید یک خط خالی بگذار)" className={inputCls} value={s.p} onChange={(e) => setSec(i, "p", e.target.value)} />
              </div>
            ))}
          </div>
          {err.body && <p className="mt-1 text-xs text-coral">{err.body}</p>}
          <Btn onClick={() => set("sections", [...f.sections, { h: "", p: "" }])} className="mt-2 !py-1.5">+ بخش جدید</Btn>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">عکس شاخص</legend>
          <div className="flex flex-wrap items-center gap-3">
            {f.photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.photo} alt="پیش‌نمایش" className="h-20 w-32 rounded-xl object-cover" />}
            <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm" aria-label="انتخاب عکس" />
            {f.photo && <Btn onClick={() => set("photo", "")} className="!py-1.5">حذف عکس</Btn>}
          </div>
          {err.photo && <p className="mt-1 text-xs text-coral">{err.photo}</p>}
          <p className="mt-1 text-[11px] text-mut">عکس کوچک می‌شود و روی مرورگر ذخیره می‌گردد. بدون عکس، یک تصویر رنگی پیش‌فرض نمایش داده می‌شود.</p>
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Btn onClick={onClose}>انصراف</Btn>
          <Btn kind="primary" onClick={submit}>{post ? "ذخیره‌ی تغییرات" : "انتشار مقاله"}</Btn>
        </div>
      </div>
    </Modal>
  );
}
