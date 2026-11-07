import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Providers from "@/components/common/Providers";

// wraps all pages in (app). not logged in = go to /login
export default async function AppLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <Providers session={session}>{children}</Providers>;
}
