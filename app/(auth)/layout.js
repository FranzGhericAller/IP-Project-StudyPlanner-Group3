import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// wraps /login and /register. already logged in = skip to the dashboard
export default async function AuthGroupLayout({ children }) {
  const session = await auth();
  if (session?.user) redirect("/");

  return children;
}
