"use client";
import { useRef } from "react";
import { useAdmin } from "../HotelsProvider";
import { usePosts } from "../PostsProvider";
import { Btn, Card } from "./ui";
import { downloadFile, csvOf } from "./BookingsPanel";
import { addBookings, clearBookings, removeDemoBookings } from "@/lib/bookings";
import { seedBookings } from "@/lib/store";
import { fa } from "@/lib/fa";
import { clearChat, clearMisses, seedChat } from "@/lib/chat";
import { useChatData } from "../useChat";

function Row({ title, desc, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-0">
      <div className="max-w-xl">
        <b>{title}</b>
        <p className="text-sm text-mut">{desc}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function SettingsPanel({ bookings, refresh, notify, logout }) {
  const { hotels, ov, getOverrides, importOverrides, resetAll } = useAdmin();
  const file = useRef(null);
  const chat = useChatData();
  const blog = usePosts();
  const blogChanges =
    blog.ov.added.length +
    blog.ov.removed.length +
    Object.keys(blog.ov.edits).length;
  const demo = (bookings || []).filter((b) => b.demo).length;
  const changes =
    ov.added.length +
    ov.removed.length +
    Object.keys(ov.edits).length +
    Object.keys(ov.tagMap).length;

  const run = async (fn, okMsg) => {
    try {
      await fn();
      await refresh();
      notify(okMsg);
    } catch (e) {
      notify(e.message);
    }
  };

  const importJson = async (f) => {
    if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      if (
        !Array.isArray(o.added) ||
        !Array.isArray(o.removed) ||
        typeof o.edits !== "object"
      )
        throw new Error("bad");
      const { blog: posts, ...hotelData } = o; // پشتیبان‌های قدیمی بخش وبلاگ ندارند و وبلاگ فعلی را دست نمی‌زنند
      const ok =
        importOverrides(hotelData) &&
        (posts === undefined || blog.importBlog(posts));
      notify(ok ? "تغییرات بازیابی شد." : "حافظه‌ی مرورگر پر است.");
    } catch {
      notify("فایل پشتیبان معتبر نیست.");
    }
    if (file.current) file.current.value = "";
  };

  return (
    <Card title="تنظیمات و ابزارها">
      <Row
        title="گفتگوها و جستجوهای بی‌نتیجه"
        desc={`${fa(chat.threads.length)} گفتگو و ${fa(
          chat.misses.length
        )} جستجوی بی‌نتیجه ثبت شده. گفتگوی نمونه برای دیدن صندوق پیام‌ها ساخته می‌شود.`}
      >
        <Btn
          className="text-coral"
          disabled={!chat.threads.length && !chat.misses.length}
          onClick={() => {
            if (confirm("همه‌ی گفتگوها و جستجوهای بی‌نتیجه پاک شود؟")) {
              clearChat();
              clearMisses();
              notify("گفتگوها پاک شد.");
            }
          }}
        >
          پاک کردن
        </Btn>
      </Row>
      <Row
        title="پشتیبان‌گیری از تغییرات هتل‌ها و وبلاگ"
        desc={`${fa(changes)} تغییر هتل و ${fa(
          blogChanges
        )} تغییر مقاله (افزودن، حذف، ویرایش، دسته‌بندی) ذخیره شده. با فایل پشتیبان می‌توانی روی مرورگر دیگر همان وضعیت را برگردانی.`}
      >
        <Btn
          onClick={() =>
            downloadFile(
              "sara-admin-backup.json",
              JSON.stringify(
                { ...getOverrides(), blog: blog.getBlog() },
                null,
                2
              ),
              "application/json"
            )
          }
        >
          دانلود پشتیبان
        </Btn>
        <Btn onClick={() => file.current?.click()}>بازیابی از فایل</Btn>
        <input
          ref={file}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => importJson(e.target.files?.[0])}
        />
      </Row>
      <Row title="خروجی هتل‌ها (CSV)" desc="لیست کامل هتل‌های فعلی برای اکسل.">
        <Btn
          onClick={() =>
            downloadFile(
              "hotels.csv",
              csvOf([
                [
                  "شماره",
                  "نام",
                  "شهر",
                  "دسته",
                  "ستاره",
                  "قیمت از (USD)",
                  "امتیاز",
                  "نظرها",
                  "امکانات",
                ],
                ...hotels.map((h) => [
                  h.id,
                  h.name,
                  h.city,
                  h.tag,
                  h.stars,
                  h.price,
                  h.rating,
                  h.reviews,
                  h.amenities.join("، "),
                ]),
              ])
            )
          }
        >
          دانلود CSV
        </Btn>
      </Row>
      <Row
        title="پاک کردن همه‌ی رزروها"
        desc="تمام رزروهای دیتابیس (واقعی و نمونه) حذف می‌شود و کدهای پیگیری‌شان دیگر پیدا نمی‌شود."
      >
        <Btn
          kind="danger"
          disabled={!bookings?.length}
          onClick={() => {
            if (
              confirm("همه‌ی رزروها از دیتابیس حذف شود؟ این کار برگشت ندارد.")
            )
              run(clearBookings, "رزروها پاک شد.");
          }}
        >
          پاک کردن
        </Btn>
      </Row>
      <Row title="خروج از پنل" desc="نشست مدیر در همین تب بسته می‌شود.">
        <Btn onClick={logout}>خروج</Btn>
      </Row>
    </Card>
  );
}
