import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateRunRate } from "@/lib/runRateEngine";
import { recordAuditLog } from "@/lib/auditLogger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailCookie = req.cookies.get("threadflow_user_email")?.value;
    const userEmail = searchParams.get("userEmail") || emailCookie || "merch@threadflow.app";

    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { buyer: true },
    });

    const isBuyer = currentUser?.role === "BUYER";
    const buyerFilterId = searchParams.get("buyerId");
    const unitFilterId = searchParams.get("unitId");
    const riskFilter = searchParams.get("risk");
    const search = searchParams.get("search");

    // Construct where filter
    const whereClause: any = {};

    // STRICT RBAC: Buyer isolation
    if (isBuyer) {
      if (!currentUser.buyerId) {
        return NextResponse.json({ orders: [], kpis: null });
      }
      whereClause.buyerId = currentUser.buyerId;
    } else if (buyerFilterId && buyerFilterId !== "ALL") {
      whereClause.buyerId = buyerFilterId;
    }

    if (unitFilterId && unitFilterId !== "ALL") {
      whereClause.unitId = unitFilterId;
    }

    if (riskFilter && riskFilter !== "ALL") {
      whereClause.riskStatus = riskFilter;
    }

    if (search) {
      whereClause.OR = [
        { poNumber: { contains: search } },
        { style: { contains: search } },
        { color: { contains: search } },
      ];
    }

    const rawOrders = await prisma.order.findMany({
      where: whereClause,
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
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            aiAnalysis: !isBuyer, // Hide AI internal analysis from buyer
          },
        },
      },
      orderBy: { exFactoryDate: "asc" },
    });

    // Reference date for demo consistency
    const refDate = new Date("2026-11-09T10:00:00Z");

    const orders = rawOrders.map((order) => {
      // Calculate 7-day average rate from recent updates
      const recentOutputs = order.dailyUpdates
        .filter((u) => u.stage === order.currentStage)
        .map((u) => u.quantityCompleted);

      // Fallback rate estimation if no updates yet
      const fallbackRate =
        recentOutputs.length > 0
          ? undefined
          : Math.round(order.totalQuantity / 25);

      const runRate = calculateRunRate({
        totalQty: order.totalQuantity,
        producedQty: order.currentProducedQty,
        exFactoryDate: order.exFactoryDate,
        referenceDate: refDate,
        recentDailyOutputs: recentOutputs,
        fallbackActualRate: fallbackRate,
      });

      // Filter out internal notes for buyer role
      const sanitizedUpdates = isBuyer
        ? order.dailyUpdates.map((u) => ({
            id: u.id,
            stage: u.stage,
            quantityCompleted: u.quantityCompleted,
            photoUrl: u.photoUrl,
            createdAt: u.createdAt,
            // Omit rawNote, supervisorName, aiAnalysis for buyer privacy
          }))
        : order.dailyUpdates;

      return {
        ...order,
        dailyUpdates: sanitizedUpdates,
        runRate,
      };
    });

    // Compute dashboard summary KPIs
    const totalOrders = orders.length;
    const greenOrders = orders.filter((o) => o.runRate.riskStatus === "GREEN").length;
    const amberOrders = orders.filter((o) => o.runRate.riskStatus === "AMBER").length;
    const redOrders = orders.filter((o) => o.runRate.riskStatus === "RED").length;

    // Due this week (within 7 days of 2026-11-09)
    const dueThisWeek = orders.filter((o) => o.runRate.daysLeft <= 7).length;

    return NextResponse.json({
      orders,
      kpis: {
        totalOrders,
        greenOrders,
        amberOrders,
        redOrders,
        dueThisWeek,
      },
      currentUser,
    });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      poNumber,
      buyerId,
      style,
      color,
      unitId,
      totalQuantity,
      exFactoryDate,
      sizeBreakdown, // { S: 1000, M: 2000, L: 2000, XL: 1000, XXL: 500 }
    } = body;

    if (!poNumber || !buyerId || !style || !unitId || !totalQuantity || !exFactoryDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const exDate = new Date(exFactoryDate);
    const totalQty = Number(totalQuantity);

    // Auto-generate TNA milestone timeline working backwards from exFactoryDate
    // Standard Knitwear Lead Time Milestones:
    // Packing: ExFactory - 1 day
    // Finishing: ExFactory - 3 days
    // Washing: ExFactory - 6 days
    // Stitching: ExFactory - 10 days
    // Printing: ExFactory - 18 days
    // Cutting: ExFactory - 24 days
    const milestoneTemplates = [
      { stage: "Cutting", sequence: 1, daysBefore: 24 },
      { stage: "Printing", sequence: 2, daysBefore: 18 },
      { stage: "Stitching", sequence: 3, daysBefore: 10 },
      { stage: "Washing", sequence: 4, daysBefore: 6 },
      { stage: "Finishing", sequence: 5, daysBefore: 3 },
      { stage: "Packing", sequence: 6, daysBefore: 1 },
    ];

    const order = await prisma.order.create({
      data: {
        poNumber,
        buyerId,
        style,
        color: color || "Standard",
        unitId,
        totalQuantity: totalQty,
        exFactoryDate: exDate,
        currentStage: "Cutting",
        currentProducedQty: 0,
        riskStatus: "GREEN",
        sizeBreakdowns: {
          create: [
            { size: "S", quantity: Number(sizeBreakdown?.S || 0) },
            { size: "M", quantity: Number(sizeBreakdown?.M || 0) },
            { size: "L", quantity: Number(sizeBreakdown?.L || 0) },
            { size: "XL", quantity: Number(sizeBreakdown?.XL || 0) },
            { size: "XXL", quantity: Number(sizeBreakdown?.XXL || 0) },
          ],
        },
        milestones: {
          create: milestoneTemplates.map((m) => {
            const target = new Date(exDate);
            target.setDate(target.getDate() - m.daysBefore);
            return {
              stage: m.stage,
              sequence: m.sequence,
              targetDate: target,
              status: m.sequence === 1 ? "IN_PROGRESS" : "PENDING",
              progressQty: 0,
            };
          }),
        },
      },
      include: {
        buyer: true,
        unit: true,
        sizeBreakdowns: true,
        milestones: true,
      },
    });

    // Record initial audit log
    await recordAuditLog({
      orderId: order.id,
      field: "Order Setup",
      oldValue: "None",
      newValue: `Created PO ${order.poNumber} (${totalQty} pcs) with standard 6-stage TNA`,
      changedBy: "Merchandiser",
      reason: "Initial Order Booking",
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error("Create order error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "PO Number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

