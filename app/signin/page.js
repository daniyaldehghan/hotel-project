import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Signin from "@/components/Signin";

export default async function SigninPage() {
  const session = await getServerSession(authOptions);
  if (session && !session.user?.isGuest) redirect("/");
  return <Signin />;
}
