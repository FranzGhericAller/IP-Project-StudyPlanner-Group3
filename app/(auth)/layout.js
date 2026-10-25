import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AuthGroupLayout({ children }) {
  const session = await auth();
  if (session?.user) redirect("/");

  return children;
}