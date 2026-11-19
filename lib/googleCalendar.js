import { google } from "googleapis";
import { prisma } from "@/lib/db";

// returns { auth, account } or null if the user never connected Google
export async function getGoogleAuth(userId) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.refresh_token) return null;

  const oauth = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );
  oauth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // googleapis refreshes expired tokens by itself; save the new one
  oauth.on("tokens", async (t) => {
    if (!t.access_token) return;
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: t.access_token,
        expires_at: t.expiry_date ? Math.floor(t.expiry_date / 1000) : undefined,
      },
    });
  });

  return { auth: oauth, account };
}

export async function getCalendarClient(userId) {
  const g = await getGoogleAuth(userId);
  return g ? google.calendar({ version: "v3", auth: g.auth }) : null;
}

// returns null if not connected OR the user signed in before we asked for the Tasks scope
export async function getTasksClient(userId) {
  const g = await getGoogleAuth(userId);
  if (!g || !g.account.scope?.includes("auth/tasks")) return null;
  return google.tasks({ version: "v1", auth: g.auth });
}