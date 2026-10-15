"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import ThemeToggle from "./ThemeToggle";
import { signIn } from "next-auth/react";

const PERKS = [
  ["♥", "هایت روی همه‌ی دستگاه‌ها ذخیره می‌شوند"],
  ["⚡", "رزرو سریع‌تر با اطلاعات ذخیره‌شده"],
  ["%", "۲۰٪ تخفیف اولین رزرو با کد SARA20"],
];
export default function Signin() {
  const [loading, isloading] = useState(false);
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const router = useRouter();
  const submitHandler = async (e) => {
    e.preventDefault();
    isloading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    isloading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("با موفقیت به حساب کاربری وارد شدید.");
      router.push("/");
    }
  };

  const guestHandler = async () => {
    setGuestLoading(true);
    const res = await signIn("guest", { redirect: false });
    setGuestLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("به‌عنوان مهمان وارد شدید.");
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="grid min-h-screen   lg:grid-cols-[1.05fr_1fr]">
      {/* پنل تصویری */}
      <aside className="relative  hidden  overflow-hidden bg-gradient-to-br from-night via-night2 to-[#5B1FA8] p-12 text-white lg:flex lg:flex-col lg:gap-10 lg:jsustify-between">
        <div className="absolute -left-24 -top-24 h-[34rem] w-[34rem] blob blob-coral opacity-50" />
        <div className="absolute -bottom-32 right-10 h-[34rem] w-[34rem] blob blob-violet opacity-60" />
        <div className="absolute right-0 top-1/3 h-96 w-96 blob blob-aqua opacity-30" />
        <Link
          href="/"
          className="relative flex items-center gap-2.5 text-2xl font-black"
        >
          <i className="h-7 w-7 rounded-[50%_50%_50%_4px] bg-gradient-to-br from-sun to-coral" />
          سفرینو
        </Link>

        <div className="relative my-8 h-72" aria-hidden="true">
          {/* eslint-disable @next/next/no-img-element */}
          <img
            src="/hotels/3.svg"
            alt=""
            className="absolute start-0 top-8 w-64 -rotate-6 rounded-3xl border-4 border-white/20 shadow-2xl"
          />
          <img
            src="/hotels/14.svg"
            alt=""
            className="absolute start-40 top-0 w-64 rotate-3 rounded-3xl border-4 border-white/20 shadow-2xl"
          />
          <img
            src="/hotels/25.svg"
            alt=""
            className="absolute start-20 top-32 w-64 rotate-1 rounded-3xl border-4 border-white/20 shadow-2xl"
          />
        </div>

        <div className="relative">
          <h2 className="mb-5 text-4xl font-black leading-tight">
            سفر بعدی‌ات
            <br />
            از همین‌جا شروع می‌شود
          </h2>
          <ul className="space-y-3">
            {PERKS.map(([i, t]) => (
              <li key={t} className="flex items-center gap-3 text-white/90">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-sm">
                  {i}
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex flex-col px-5 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-black lg:invisible"
          >
            <i className="h-6 w-6 rounded-[50%_50%_50%_4px] bg-gradient-to-br from-sun to-coral" />
            سفرینو
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-mut hover:text-ink font-bold"
            >
              بازگشت به سایت ←
            </Link>
            <ThemeToggle variant="page" />
          </div>
        </div>
        <div className="min-h-screen max-sm:mt-5   text-ink flex justify-center  ">
          <div className="max-w-screen-xl  m-0 sm:m-10  shadow sm:rounded-lg flex justify-center flex-1">
            <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-5">
              <div className="mt-1 flex flex-col items-center">
                <div className="w-full flex-1 mt-2">
                  <div className="my-12 border-b text-center">
                    <div className="leading-none px-2 inline-block text-sm text-mut tracking-wide font-medium bg-bg transform translate-y-1/2">
                      خوش برگشتی!
                    </div>
                  </div>
                  <div className="mb-2s  ">
                    <p className="text-sm text-gray-500">
                      رمز پنل ادمین برای تست:
                    </p>
                    <span className="text-gray-500">
                      ایمیل:daniyaldehghani.2023@gmail.com
                    </span>
                  </div>
                  <span className="text-gray-500">رمز:123</span>
                  <p className="text-sm font-semibold mb-2 mt-2 text-center">
                    با وارد کردن اطلاعات خود به حسابتان وارید شوید.
                  </p>
                  <div className="mx-auto max-w-xs">
                    <input
                      className="w-full px-8 py-4 rounded-lg font-medium bg-card text-ink border border-line placeholder:text-mut text-sm focus:outline-none focus:border-violet"
                      type="email"
                      placeholder="ایمیل"
                      value={email}
                      onChange={(e) => setemail(e.target.value)}
                    />
                    <input
                      className="w-full px-8 py-4 rounded-lg font-medium bg-card text-ink border border-line placeholder:text-mut text-sm focus:outline-none focus:border-violet mt-5"
                      type="password"
                      placeholder="رمز عبور"
                      value={password}
                      onChange={(e) => setpassword(e.target.value)}
                    />

                    {loading ? (
                      <p className="mt-5 text-center text-sm text-mut">
                        در حال ورود…
                      </p>
                    ) : (
                      <button
                        type="submit"
                        onClick={submitHandler}
                        className="mt-5 cursor-pointer tracking-wide font-semibold bg-gradient-to-br from-coral to-violet text-white w-full py-4 rounded-lg hover:opacity-90 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none"
                      >
                        <span className=""> ورود</span>
                      </button>
                    )}
                    <div className="my-5 flex items-center gap-3 text-xs text-mut">
                      <span className="h-px flex-1 bg-line" />
                      یا
                      <span className="h-px flex-1 bg-line" />
                    </div>
                    <button
                      type="button"
                      onClick={guestHandler}
                      disabled={loading || guestLoading}
                      className="w-full rounded-lg border border-line bg-card py-4 font-semibold transition hover:border-violet disabled:opacity-50"
                    >
                      {guestLoading ? "در حال ورود…" : "ورود به‌عنوان مهمان"}
                    </button>
                    <p className="mt-2 text-center text-[11px] text-mut">
                      بدون ثبت‌نام رزرو کن؛ رزروهایت تا ۳۰ روز در همین مرورگر
                      می‌ماند و همیشه با کد پیگیری قابل پیگیری است.
                    </p>
                    <p className="mt-6 text-xs text-mut text-center">
                      حساب کاربری ندارید؟
                      <Link
                        href="/signup"
                        className="border-b border-mut  mr-2"
                      >
                        ثبت نام
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Toaster
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                fontFamily: "inherit",
              },
            }}
          />
        </div>
      </main>
    </div>
  );
}
