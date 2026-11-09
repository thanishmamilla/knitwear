import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const envUrl = process.env.DATABASE_URL || "file:./dev.db";
  let url = envUrl;

  if (url.startsWith("file:")) {
    const rawPath = url.replace("file:", "");
    // Check multiple candidate locations for dev.db in serverless/Vercel environments
    const cwd = process.cwd();
    const candidates = [
      path.resolve(cwd, rawPath),
      path.resolve(cwd, "dev.db"),
      path.resolve(cwd, "prisma", "dev.db"),
      path.resolve(__dirname, "..", "..", "dev.db"),
      path.resolve(__dirname, "..", "..", "prisma", "dev.db"),
    ];

    let foundPath = candidates[0];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        foundPath = cand;
        break;
      }
    }

    url = `file:${foundPath.replace(/\\/g, "/")}`;
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
