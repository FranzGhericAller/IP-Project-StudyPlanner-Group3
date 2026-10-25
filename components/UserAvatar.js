"use client";

import { useSession } from "next-auth/react";

// Pass a size class written out in full, e.g. size="h-12 w-12".
export default function UserAvatar({ size = "h-8 w-8" }) {
  const { data: session } = useSession();
  const user = session?.user;
  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  if (user?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name ?? "Profile"}
        referrerPolicy="no-referrer"
        className={`${size} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-violet-300 flex items-center justify-center text-sm font-medium`}
    >
      {initial}
    </div>
  );
}