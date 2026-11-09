import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateRunRate } from "@/lib/runRateEngine";
import { recordAuditLog } from "@/lib/auditLogger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const emailCookie = req.cookies.get("threadflow_user_email")?.value;
    const userEmail = emailCookie || "merch@threadflow.app";

    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { buyer: true },
    });

    const isBuyer = currentUser?.role === "BUYER";

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: true,
        unit: true,
        sizeBreakdowns: true,
        milestones: {
          orderBy: { sequence: "asc" },
        },
        warnings: {
          where: isBuyer ? { isApprovedForBuyer: true } : undefined,
          orderBy: { createdAt: "desc" },
        },
        dailyUpdates: {
          orderBy: { createdAt: "desc" },
          include: {
            aiAnalysis: !isBuyer,
          },
        },
        auditLogs: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // STRICT RBAC: Buyer cannot view another buyer's order
    if (isBuyer && currentUser?.buyerId && order.buyerId !== currentUser.buyerId) {
      return NextResponse.json(
        { error: "Access Denied: You do not have permission to view this order." },
        { status: 403 }
      );
    }

    const refDate = new Date("2026-11-09T10:00:00Z");

    const recentOutputs = order.dailyUpdates
      .filter((u) => u.stage === order.currentStage)
      .map((u) => u.quantityCompleted);

    const fallbackRate =
      recentOutputs.length > 0 ? undefined : Math.round(order.totalQuantity / 25);

    const runRate = calculateRunRate({
      totalQty: order.totalQuantity,
      producedQty: order.currentProducedQty,
      exFactoryDate: order.exFactoryDate,
      referenceDate: refDate,
      recentDailyOutputs: recentOutputs,
      fallbackActualRate: fallbackRate,
    });

    // Sanitization for buyer view
    const sanitizedUpdates = isBuyer
      ? order.dailyUpdates.map((u) => ({
          id: u.id,
          stage: u.stage,
          quantityCompleted: u.quantityCompleted,
          photoUrl: u.photoUrl,
          createdAt: u.createdAt,
        }))
      : order.dailyUpdates;

    return NextResponse.json({
      order: {
        ...order,
        dailyUpdates: sanitizedUpdates,
        auditLogs: isBuyer ? [] : order.auditLogs,
        runRate,
      },
      runRate,
      currentUser,
    });
  } catch (error) {
    console.error("Fetch order detail error:", error);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { exFactoryDate, currentStage, currentProducedQty, reason, changedBy } = body;

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { milestones: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Handle Ex-Factory Date update with mandatory compliance audit log AND TNA milestone recalculation
    if (exFactoryDate && new Date(exFactoryDate).getTime() !== new Date(existing.exFactoryDate).getTime()) {
      const oldStr = new Date(existing.exFactoryDate).toISOString().split("T")[0];
      const newStr = new Date(exFactoryDate).toISOString().split("T")[0];
      const newExDate = new Date(exFactoryDate);

      updateData.exFactoryDate = newExDate;

      // Record audit log for date change
      await recordAuditLog({
        orderId: id,
        field: "exFactoryDate",
        oldValue: oldStr,
        newValue: newStr,
        changedBy: changedBy || "Merchandiser",
        reason: reason || "Buyer requested amendment / production rescheduling",
      });

      // Recalculate TNA milestone schedules working backward from the new Ex-Factory Date
      const milestoneDaysBefore: Record<string, number> = {
        Packing: 1,
        Finishing: 3,
        Washing: 6,
        Stitching: 10,
        Printing: 18,
        Cutting: 24,
      };

      for (const m of existing.milestones) {
        // Only adjust pending or in-progress milestones (preserve completed historical milestone dates)
        if (m.status !== "COMPLETED") {
          const daysBefore = milestoneDaysBefore[m.stage] || 1;
          const adjustedTarget = new Date(newExDate);
          adjustedTarget.setDate(adjustedTarget.getDate() - daysBefore);

          await prisma.milestone.update({
            where: { id: m.id },
            data: { targetDate: adjustedTarget },
          });
        }
      }

      await recordAuditLog({
        orderId: id,
        field: "TNA Milestones Schedule",
        oldValue: `Anchored to ${oldStr}`,
        newValue: `Re-aligned to ${newStr}`,
        changedBy: changedBy || "Merchandiser",
        reason: "Automatic TNA milestone schedule update following Ex-Factory amendment",
      });
    }

    if (currentStage) {
      updateData.currentStage = currentStage;
    }

    if (currentProducedQty !== undefined) {
      updateData.currentProducedQty = Number(currentProducedQty);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        buyer: true,
        unit: true,
        milestones: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
