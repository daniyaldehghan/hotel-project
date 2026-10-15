import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Signup from "@/components/signup";

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session && !session.user?.isGuest) redirect("/");
  return <Signup />;
}
