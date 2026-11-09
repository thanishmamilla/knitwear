import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processSupervisorNoteWithAI } from "@/lib/aiService";
import { calculateRunRate } from "@/lib/runRateEngine";
import { recordAuditLog } from "@/lib/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      unitId,
      stage,
      quantityCompleted,
      photoUrl,
      voiceUrl,
      rawNote,
      language = "ta",
      supervisorName = "Floor Supervisor",
      source = "ONLINE",
    } = body;

    if (!orderId || !stage || quantityCompleted === undefined) {
      return NextResponse.json({ error: "orderId, stage, and quantityCompleted are required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        unit: true,
        milestones: true,
        dailyUpdates: { take: 7, orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const resolvedUnitId = unitId || order.unitId;
    const completedQty = Number(quantityCompleted);

    // 1. Create Daily Update record
    const dailyUpdate = await prisma.dailyUpdate.create({
      data: {
        orderId,
        unitId: resolvedUnitId,
        stage,
        quantityCompleted: completedQty,
        photoUrl: photoUrl || null,
        voiceUrl: voiceUrl || null,
        rawNote: rawNote || "",
        language,
        supervisorName,
        source,
      },
    });

    // 2. Run AI processing on supervisor floor note (Tamil or English)
    let aiResult = null;
    if (rawNote && rawNote.trim()) {
      aiResult = await processSupervisorNoteWithAI(rawNote);
      await prisma.aIAnalysis.create({
        data: {
          dailyUpdateId: dailyUpdate.id,
          originalNote: aiResult.originalNote,
          translation: aiResult.translation,
          predictedCategory: aiResult.predictedCategory,
          confidence: aiResult.confidence,
          finalCategory: aiResult.finalCategory,
        },
      });
    }

    // 3. Update Order Produced Quantity and Current Stage
    const newTotalProduced = order.currentProducedQty + completedQty;
    const updatedStage = stage || order.currentStage;

    // 4. Update Milestone for this stage
    const matchingMilestone = order.milestones.find((m) => m.stage.toLowerCase() === stage.toLowerCase());
    if (matchingMilestone) {
      const milestoneCompleted = newTotalProduced >= order.totalQuantity;
      await prisma.milestone.update({
        where: { id: matchingMilestone.id },
        data: {
          progressQty: Math.min(order.totalQuantity, matchingMilestone.progressQty + completedQty),
          status: milestoneCompleted ? "COMPLETED" : "IN_PROGRESS",
          completedDate: milestoneCompleted ? new Date() : matchingMilestone.completedDate,
        },
      });
    }

    // 5. Evaluate Run-Rate Risk Engine
    const recentOutputs = [
      completedQty,
      ...order.dailyUpdates.map((u) => u.quantityCompleted),
    ].slice(0, 7);

    const refDate = new Date("2026-11-09T10:00:00Z");
    const runRate = calculateRunRate({
      totalQty: order.totalQuantity,
      producedQty: newTotalProduced,
      exFactoryDate: order.exFactoryDate,
      referenceDate: refDate,
      recentDailyOutputs: recentOutputs,
    });

    // Update order with new produced count and calculated riskStatus
    await prisma.order.update({
      where: { id: orderId },
      data: {
        currentProducedQty: newTotalProduced,
        currentStage: updatedStage,
        riskStatus: runRate.riskStatus,
      },
    });

    // 6. Generate Risk Warning if AMBER or RED
    // CRITICAL: isApprovedForBuyer defaults to false!
    let generatedWarning = null;
    if (runRate.riskStatus === "AMBER" || runRate.riskStatus === "RED") {
      const category = aiResult ? aiResult.finalCategory : "Other";
      const warningMessage =
        runRate.riskStatus === "RED"
          ? `CRITICAL DELAY: Production throughput (${runRate.actualRate} pcs/day) is under 80% of required speed (${runRate.requiredRate} pcs/day). Projected slip of ${runRate.projectedDelayDays} days.`
          : `CAUTION: Output rate (${runRate.actualRate} pcs/day) is pacing at ${runRate.ratioPercentage}% of required rate. Projected slip of ${runRate.projectedDelayDays} days.`;

      generatedWarning = await prisma.warning.create({
        data: {
          orderId,
          severity: runRate.riskStatus,
          message: warningMessage,
          reasonCategory: category,
          remainingQty: runRate.remainingQty,
          daysLeft: runRate.daysLeft,
          requiredRate: runRate.requiredRate,
          actualRate: runRate.actualRate,
          difference: runRate.difference,
          projectedDelayDays: runRate.projectedDelayDays,
          isApprovedForBuyer: false, // Must be approved by merchandiser before buyer can see
        },
      });

      // Audit log the status change
      await recordAuditLog({
        orderId,
        field: "riskStatus",
        oldValue: order.riskStatus,
        newValue: runRate.riskStatus,
        changedBy: `${supervisorName} (Floor Update)`,
        reason: `Daily output of ${completedQty} pcs in ${stage} placed order at ${runRate.riskStatus} risk`,
      });
    }

    return NextResponse.json({
      success: true,
      dailyUpdate,
      aiAnalysis: aiResult,
      runRate,
      warning: generatedWarning,
    });
  } catch (error) {
    console.error("Create daily update error:", error);
    return NextResponse.json({ error: "Failed to record daily update" }, { status: 500 });
  }
}

