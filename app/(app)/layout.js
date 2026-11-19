import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Providers from "@/components/common/Providers";
import StudyTimerProvider from "@/components/study/StudyTimerProvider";
import StudyTimerBar from "@/components/study/StudyTimerBar";

// wraps all pages in (app). not logged in = go to /login.
// the timer provider lives here so a running timer follows you from page to page
export default async function AppLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <Providers session={session}>
      <StudyTimerProvider>
        {children}
        <StudyTimerBar />
      </StudyTimerProvider>
    </Providers>
  );
}