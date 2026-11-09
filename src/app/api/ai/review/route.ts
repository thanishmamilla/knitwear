import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aiAnalysisId, finalCategory, reviewerName = "Karthik Raja" } = body;

    if (!aiAnalysisId || !finalCategory) {
      return NextResponse.json(
        { error: "aiAnalysisId and finalCategory are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.aIAnalysis.findUnique({
      where: { id: aiAnalysisId },
      include: {
        dailyUpdate: {
          include: { order: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "AI analysis not found" }, { status: 404 });
    }

    const isOverridden = existing.predictedCategory !== finalCategory;

    const updated = await prisma.aIAnalysis.update({
      where: { id: aiAnalysisId },
      data: {
        finalCategory,
        reviewedBy: reviewerName,
        reviewedAt: new Date(),
        isOverridden,
      },
    });

    // If overridden, log in audit history
    if (isOverridden && existing.dailyUpdate?.orderId) {
      await recordAuditLog({
        orderId: existing.dailyUpdate.orderId,
        field: "AI Category Review",
        oldValue: existing.predictedCategory,
        newValue: finalCategory,
        changedBy: reviewerName,
        reason: "Merchandiser manual review and category correction",
      });
    }

    return NextResponse.json({ success: true, aiAnalysis: updated });
  } catch (error) {
    console.error("AI review error:", error);
    return NextResponse.json({ error: "Failed to review AI category" }, { status: 500 });
  }
}

