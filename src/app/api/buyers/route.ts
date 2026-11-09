import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const buyers = await prisma.buyer.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ buyers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch buyers" }, { status: 500 });
  }
}

