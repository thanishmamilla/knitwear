import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/auditLogger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { approved = true, approverName = "Karthik Raja (Senior Merchandiser)" } = body;

    const warning = await prisma.warning.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!warning) {
      return NextResponse.json({ error: "Warning not found" }, { status: 404 });
    }

    const updated = await prisma.warning.update({
      where: { id },
      data: {
        isApprovedForBuyer: approved,
        approvedBy: approved ? approverName : null,
        approvedAt: approved ? new Date() : null,
      },
    });

    // Record in audit log
    await recordAuditLog({
      orderId: warning.orderId,
      field: "Buyer Warning Visibility",
      oldValue: warning.isApprovedForBuyer ? "Visible to Buyer" : "Internal Only",
      newValue: approved ? "Approved & Published to Buyer Portal" : "Revoked from Buyer Portal",
      changedBy: approverName,
      reason: approved
        ? "Merchandiser verified production delay risk and authorized buyer communication"
        : "Merchandiser revoked buyer visibility for internal remediation",
    });

    return NextResponse.json({ success: true, warning: updated });
  } catch (error) {
    console.error("Warning approval error:", error);
    return NextResponse.json({ error: "Failed to update warning approval" }, { status: 500 });
  }
}

