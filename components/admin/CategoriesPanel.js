"use client";
import { useState } from "react";
import { useAdmin } from "../HotelsProvider";
import { Btn, Card, inputCls } from "./ui";
import { fa } from "@/lib/fa";

export default function CategoriesPanel({ notify }) {
  const { hotels, categories, addCategory, renameCategory, deleteCategory } = useAdmin();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null); // { old, val }
  const [deleting, setDeleting] = useState(null); // { name, target }
  const count = (c) => hotels.filter((h) => h.tag === c).length;
  const ok = (r, m) => notify(r ? m : "حافظه‌ی مرورگر پر است.");

  const add = () => {
    const t = name.trim();
    if (!t) return;
    if (categories.includes(t)) return notify("این دسته از قبل هست.");
    ok(addCategory(t), `دسته‌ی «${t}» اضافه شد.`); setName("");
  };
  const rename = () => {
    const t = editing.val.trim();
    if (!t || t === editing.old) return setEditing(null);
    if (categories.includes(t) && !confirm(`دسته‌ی «${t}» از قبل هست. دو دسته ادغام شوند؟`)) return;
    ok(renameCategory(editing.old, t), "نام دسته عوض شد.");
    setEditing(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card title={`دسته‌بندی‌ها (${fa(categories.length)})`}>
        <ul className="divide-y divide-line">
          {categories.map((c) => (
            <li key={c} className="flex flex-wrap items-center justify-between gap-3 py-3">
              {editing?.old === c ? (
                <div className="flex flex-1 gap-2">
                  <input autoFocus className={inputCls} value={editing.val} onChange={(e) => setEditing({ ...editing, val: e.target.value })} onKeyDown={(e) => e.key === "Enter" && rename()} />
                  <Btn kind="primary" onClick={rename}>ذخیره</Btn><Btn onClick={() => setEditing(null)}>لغو</Btn>
                </div>
              ) : deleting?.name === c ? (
                <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
                  <span>{fa(count(c))} هتل به این دسته منتقل شود:</span>
                  <select className={`${inputCls} !w-auto`} value={deleting.target} onChange={(e) => setDeleting({ ...deleting, target: e.target.value })}>
                    {categories.filter((x) => x !== c).map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <Btn kind="danger" onClick={() => { ok(deleteCategory(c, deleting.target), "دسته حذف شد."); setDeleting(null); }}>حذف دسته</Btn>
                  <Btn onClick={() => setDeleting(null)}>لغو</Btn>
                </div>
              ) : (
                <>
                  <div><b>{c}</b> <span className="text-sm text-mut">· {fa(count(c))} هتل</span></div>
                  <div className="flex gap-1.5">
                    <Btn onClick={() => setEditing({ old: c, val: c })} className="!px-3 !py-1">تغییر نام</Btn>
                    <Btn disabled={categories.length < 2} onClick={() => setDeleting({ name: c, target: categories.find((x) => x !== c) })} className="!px-3 !py-1 text-coral">حذف</Btn>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="دسته‌ی جدید" className="h-fit">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="مثلاً ویژه‌ی ماه عسل" aria-label="نام دسته" />
        <Btn kind="primary" className="mt-3 w-full" onClick={add}>افزودن دسته</Btn>
        <p className="mt-3 text-xs leading-6 text-mut">دسته‌ها در فرم هتل قابل انتخاب‌اند و در صفحه‌ی «هتل‌ها» و شهرها به‌صورت فیلتر به کاربر نشان داده می‌شوند. با حذف یک دسته، هتل‌های آن به دسته‌ی دلخواه منتقل می‌شوند.</p>
      </Card>
    </div>
  );
}
