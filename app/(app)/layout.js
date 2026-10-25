import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Providers from "@/components/Providers";

export default async function AppLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <Providers session={session}>{children}</Providers>;
}