"use client";
// import { FiLogOut } from "react-icons/fi";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
function LogoutButton() {
  const router = useRouter();
  const logoutHandler = async () => {
    await signOut({
      redirect: false,
    });

    router.refresh();
  };
  return (
    <button
      onClick={logoutHandler}
      className="flsex texts-rights itessms-center gasp-1  max-lg:text-sm  text-white cursor-pointer border-2 lg:p-2 bg-red-700 rounded-lg"
    >
      {/* <FiLogOut /> */}
      <span className="hidden lg:block p-2">خروج از حساب کاربری</span>
      <span className=" hidden max-lg:block p-1">خروج از حساب</span>
    </button>
  );
}

export default LogoutButton;
