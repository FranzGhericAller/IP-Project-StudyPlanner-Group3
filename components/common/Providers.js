"use client";

import { SessionProvider } from "next-auth/react";

// lets client components use useSession() to get the logged in user
export default function Providers({ session, children }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
