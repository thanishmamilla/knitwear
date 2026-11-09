import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ units });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

