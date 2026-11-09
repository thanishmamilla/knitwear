import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const envUrl = process.env.DATABASE_URL || "file:./dev.db";
  let url = envUrl;

  if (url.startsWith("file:")) {
    const rawPath = url.replace("file:", "");
    const resolvedPath = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(process.cwd(), rawPath);
    url = `file:${resolvedPath.replace(/\\/g, "/")}`;
  }

  const adapter = new PrismaLibSql({
    url,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
