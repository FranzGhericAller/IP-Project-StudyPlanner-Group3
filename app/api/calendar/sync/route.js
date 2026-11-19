import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncUserCalendar } from "@/lib/syncCalendar";
import { syncUserTasks } from "@/lib/syncTasks";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const [user, state, account] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { autoSync: true, autoSyncMinutes: true },
    }),
    prisma.syncState.findFirst({ where: { userId, calendarId: "primary" } }),
    prisma.account.findFirst({
      where: { userId, provider: "google" },
      select: { id: true, scope: true },
    }),
  ]);

  return Response.json({
    connected: !!account,
    tasksConnected: !!account?.scope?.includes("auth/tasks"),
    lastSyncedAt: state?.lastSyncedAt ?? null,
    autoSync: user?.autoSync ?? true,
    autoSyncMinutes: user?.autoSyncMinutes ?? 15,
  });
}

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ message: "Unauthorized" }, { status: 401 });

  try {
    let tasksFailed = false;

    // events and tasks sync at the same time; a Tasks problem won't break the calendar sync
    const [ev, tk] = await Promise.all([
      syncUserCalendar(userId),
      syncUserTasks(userId).catch((err) => {
        console.error("Task sync failed:", err);
        tasksFailed = true;
        return { changed: 0, needsReconnect: false };
      }),
    ]);

    if (!ev.connected) {
      return Response.json({ message: "Sign in with Google to sync your calendar." }, { status: 400 });
    }

    return Response.json({
      ok: true,
      count: ev.changed + tk.changed,
      lastSyncedAt: ev.lastSyncedAt,
      needsReconnect: tk.needsReconnect,
      tasksFailed,
    });
  } catch {
    return Response.json({ message: "Could not sync with Google." }, { status: 500 });
  }
}