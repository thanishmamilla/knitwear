import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processSupervisorNoteWithAI } from "@/lib/aiService";
import { calculateRunRate } from "@/lib/runRateEngine";
import { recordAuditLog } from "@/lib/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body; // Array of offline updates

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    const syncedResults: any[] = [];

    for (const item of items) {
      const {
        clientSyncId,
        orderId,
        stage,
        quantityCompleted,
        photoUrl,
        voiceUrl,
        rawNote,
        language = "ta",
        supervisorName = "Floor Supervisor",
      } = item;

      // Check if already synced via clientSyncId
      if (clientSyncId) {
        const existingSync = await prisma.offlineSync.findUnique({
          where: { clientSyncId },
        });
        if (existingSync) {
          syncedResults.push({ clientSyncId, status: "ALREADY_SYNCED" });
          continue;
        }
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { unit: true, milestones: true, dailyUpdates: { take: 7 } },
      });

      if (!order) {
        syncedResults.push({ clientSyncId, status: "ORDER_NOT_FOUND" });
        continue;
      }

      const completedQty = Number(quantityCompleted);

      // Create DailyUpdate with source OFFLINE_SYNC
      const updateRecord = await prisma.dailyUpdate.create({
        data: {
          orderId,
          unitId: order.unitId,
          stage,
          quantityCompleted: completedQty,
          photoUrl: photoUrl || null,
          voiceUrl: voiceUrl || null,
          rawNote: rawNote || "",
          language,
          supervisorName,
          source: "OFFLINE_SYNC",
        },
      });

      // AI Analysis
      let aiResult = null;
      if (rawNote && rawNote.trim()) {
        aiResult = await processSupervisorNoteWithAI(rawNote);
        await prisma.aIAnalysis.create({
          data: {
            dailyUpdateId: updateRecord.id,
            originalNote: aiResult.originalNote,
            translation: aiResult.translation,
            predictedCategory: aiResult.predictedCategory,
            confidence: aiResult.confidence,
            finalCategory: aiResult.finalCategory,
          },
        });
      }

      // Update Order
      const newProduced = order.currentProducedQty + completedQty;
      const refDate = new Date("2026-11-09T10:00:00Z");
      const runRate = calculateRunRate({
        totalQty: order.totalQuantity,
        producedQty: newProduced,
        exFactoryDate: order.exFactoryDate,
        referenceDate: refDate,
        recentDailyOutputs: [completedQty, ...order.dailyUpdates.map((u) => u.quantityCompleted)],
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          currentProducedQty: newProduced,
          currentStage: stage,
          riskStatus: runRate.riskStatus,
        },
      });

      // Warning if delayed
      if (runRate.riskStatus === "AMBER" || runRate.riskStatus === "RED") {
        await prisma.warning.create({
          data: {
            orderId,
            severity: runRate.riskStatus,
            message: `Offline sync update: ${runRate.riskStatus} alert for ${order.poNumber}. Run rate is ${runRate.ratioPercentage}% of required.`,
            reasonCategory: aiResult ? aiResult.finalCategory : "Other",
            remainingQty: runRate.remainingQty,
            daysLeft: runRate.daysLeft,
            requiredRate: runRate.requiredRate,
            actualRate: runRate.actualRate,
            difference: runRate.difference,
            projectedDelayDays: runRate.projectedDelayDays,
            isApprovedForBuyer: false,
          },
        });
      }

      // Record offline sync log
      if (clientSyncId) {
        await prisma.offlineSync.create({
          data: {
            clientSyncId,
            payloadJson: JSON.stringify(item),
            status: "SUCCESS",
          },
        });
      }

      syncedResults.push({ clientSyncId, status: "SYNCED", updateId: updateRecord.id });
    }

    return NextResponse.json({ success: true, count: syncedResults.length, results: syncedResults });
  } catch (error) {
    console.error("Batch sync error:", error);
    return NextResponse.json({ error: "Failed to batch sync updates" }, { status: 500 });
  }
}

