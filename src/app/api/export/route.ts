import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exportOrdersToExcel, exportOrdersToPDF, ExportOrderItem } from "@/lib/exportUtils";
import { calculateRunRate } from "@/lib/runRateEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId");
    const format = searchParams.get("format") || "excel"; // "excel" | "pdf"

    if (!buyerId) {
      return NextResponse.json({ error: "buyerId query parameter is required" }, { status: 400 });
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      include: {
        orders: {
          include: {
            unit: true,
            milestones: { orderBy: { sequence: "asc" } },
            dailyUpdates: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    const refDate = new Date("2026-11-09T10:00:00Z");

    const exportItems: ExportOrderItem[] = buyer.orders.map((o) => {
      const recent = o.dailyUpdates
        .filter((u) => u.stage === o.currentStage)
        .map((u) => u.quantityCompleted);

      const runRate = calculateRunRate({
        totalQty: o.totalQuantity,
        producedQty: o.currentProducedQty,
        exFactoryDate: o.exFactoryDate,
        referenceDate: refDate,
        recentDailyOutputs: recent,
        fallbackActualRate: Math.round(o.totalQuantity / 25),
      });

      const progressPct = Math.round((o.currentProducedQty / o.totalQuantity) * 100);

      const milestoneSummary = o.milestones
        .map((m) => `${m.stage}: ${m.status}`)
        .join(" | ");

      const photoUrls = o.dailyUpdates
        .filter((u) => !!u.photoUrl)
        .map((u) => u.photoUrl)
        .slice(0, 3)
        .join(", ");

      return {
        poNumber: o.poNumber,
        style: o.style,
        color: o.color,
        unit: o.unit.name,
        totalQuantity: o.totalQuantity,
        currentProducedQty: o.currentProducedQty,
        currentStage: o.currentStage,
        exFactoryDate: new Date(o.exFactoryDate).toISOString().split("T")[0],
        daysLeft: runRate.daysLeft,
        riskStatus: runRate.riskStatus,
        progressPercentage: progressPct,
        milestonesSummary: milestoneSummary,
        photoLinks: photoUrls,
      };
    });

    const safeBuyerCode = buyer.code.toLowerCase().replace(/[^a-z0-9]/g, "_");

    if (format.toLowerCase() === "pdf") {
      const pdfBuffer = exportOrdersToPDF(buyer.name, exportItems);
      return new NextResponse(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="threadflow_${safeBuyerCode}_status.pdf"`,
        },
      });
    }

    // Default to Excel
    const excelBuffer = exportOrdersToExcel(buyer.name, exportItems);
    return new NextResponse(excelBuffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="threadflow_${safeBuyerCode}_status.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate export file" }, { status: 500 });
  }
}

