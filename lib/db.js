import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";

// Prisma client using the MariaDB adapter (works w/ MySQL and XAMPP)
function createClient() {
  // we only keep one DATABASE_URL in .env, so split it into parts here
  const url = new URL(process.env.DATABASE_URL);

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
  });

  return new PrismaClient({ adapter });
}

// in dev, hot reload re-runs this file. reuse the same client so we
// don't open a new connection pool every time we save a file
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
