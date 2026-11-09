import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const emailCookie = req.cookies.get("threadflow_user_email")?.value;
    const defaultEmail = emailCookie || "merch@threadflow.app";

    let user = await prisma.user.findUnique({
      where: { email: defaultEmail },
      include: { buyer: true },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: "MERCHANDISER" },
        include: { buyer: true },
      });
    }

    const allUsers = await prisma.user.findMany({
      include: { buyer: true },
      orderBy: { role: "asc" },
    });

    return NextResponse.json({
      currentUser: user,
      availableUsers: allUsers,
    });
  } catch (error) {
    console.error("Auth session error:", error);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { buyer: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const res = NextResponse.json({ success: true, user });
    res.cookies.set("threadflow_user_email", user.email, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (error) {
    console.error("Switch user error:", error);
    return NextResponse.json({ error: "Failed to switch user" }, { status: 500 });
  }
}

