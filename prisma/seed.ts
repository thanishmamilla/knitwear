import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Starting ThreadFlow database seed...");

  // Clean existing data
  await prisma.aIAnalysis.deleteMany({});
  await prisma.dailyUpdate.deleteMany({});
  await prisma.warning.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.orderSizeBreakdown.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.buyer.deleteMany({});
  await prisma.offlineSync.deleteMany({});

  console.log("🧹 Cleaned existing records.");

  // 1. Seed Units
  const unitA = await prisma.unit.create({
    data: {
      name: "Own Unit A",
      code: "UNIT_A",
      type: "OWN",
      dailyCapacity: 1500,
    },
  });

  const unitB = await prisma.unit.create({
    data: {
      name: "Own Unit B",
      code: "UNIT_B",
      type: "OWN",
      dailyCapacity: 1200,
    },
  });

  const unitC = await prisma.unit.create({
    data: {
      name: "Own Unit C",
      code: "UNIT_C",
      type: "OWN",
      dailyCapacity: 1000,
    },
  });

  const printingVendor = await prisma.unit.create({
    data: {
      name: "Printing Vendor",
      code: "PRINTING_VENDOR",
      type: "SUBCONTRACT",
      dailyCapacity: 2000,
    },
  });

  const washingVendor = await prisma.unit.create({
    data: {
      name: "Washing Vendor",
      code: "WASHING_VENDOR",
      type: "SUBCONTRACT",
      dailyCapacity: 2000,
    },
  });

  console.log("🏭 Seeded 5 Units (Own Units A, B, C & Subcontractors).");

  // 2. Seed Buyers
  const buyerB = await prisma.buyer.create({
    data: {
      name: "Company B (UK)",
      code: "COMPANY_B",
      country: "UK",
      contactEmail: "sourcing@companyb.co.uk",
    },
  });

  const buyerC = await prisma.buyer.create({
    data: {
      name: "Company C (Germany)",
      code: "COMPANY_C",
      country: "Germany",
      contactEmail: "buyer@companyc.de",
    },
  });

  console.log("🌍 Seeded 2 Buyers (Company B UK, Company C Germany).");

  // 3. Seed Users
  const userMerch = await prisma.user.create({
    data: {
      email: "merch@threadflow.app",
      name: "Karthik Raja (Senior Merchandiser)",
      role: "MERCHANDISER",
    },
  });

  const userSupervisor = await prisma.user.create({
    data: {
      email: "supervisor@threadflow.app",
      name: "Murugan S (Floor Supervisor)",
      role: "SUPERVISOR",
    },
  });

  const userBuyerB = await prisma.user.create({
    data: {
      email: "buyer.b@companyb.co.uk",
      name: "Sarah Jenkins (UK Sourcing)",
      role: "BUYER",
      buyerId: buyerB.id,
    },
  });

  const userBuyerC = await prisma.user.create({
    data: {
      email: "buyer.c@companyc.de",
      name: "Hans Müller (Germany Sourcing)",
      role: "BUYER",
      buyerId: buyerC.id,
    },
  });

  console.log("👥 Seeded 4 Demo Users with RBAC roles.");

  // Base date reference: 2026-11-09
  const now = new Date("2026-11-09T10:00:00Z");

  // 4. Seed Order 1: B-PO-88213 (Company B UK, Navy Tee, 12000 pcs, Stitching, 6800 done)
  const order1 = await prisma.order.create({
    data: {
      poNumber: "B-PO-88213",
      buyerId: buyerB.id,
      style: "Men's crew neck tee",
      color: "Navy",
      unitId: unitA.id,
      totalQuantity: 12000,
      exFactoryDate: new Date("2026-11-20T00:00:00Z"),
      currentStage: "Stitching",
      currentProducedQty: 6800,
      riskStatus: "AMBER",
      createdAt: new Date("2026-10-15T00:00:00Z"),
    },
  });

  // Size breakup: S: 2400, M: 3600, L: 3600, XL: 1800, XXL: 600
  await prisma.orderSizeBreakdown.createMany({
    data: [
      { orderId: order1.id, size: "S", quantity: 2400 },
      { orderId: order1.id, size: "M", quantity: 3600 },
      { orderId: order1.id, size: "L", quantity: 3600 },
      { orderId: order1.id, size: "XL", quantity: 1800 },
      { orderId: order1.id, size: "XXL", quantity: 600 },
    ],
  });

  // TNA Milestones
  const tnaStages = ["Cutting", "Printing", "Stitching", "Washing", "Finishing", "Packing"];
  await prisma.milestone.createMany({
    data: [
      { orderId: order1.id, stage: "Cutting", sequence: 1, targetDate: new Date("2026-10-22"), completedDate: new Date("2026-10-21"), status: "COMPLETED", progressQty: 12000 },
      { orderId: order1.id, stage: "Printing", sequence: 2, targetDate: new Date("2026-10-29"), completedDate: new Date("2026-10-29"), status: "COMPLETED", progressQty: 12000 },
      { orderId: order1.id, stage: "Stitching", sequence: 3, targetDate: new Date("2026-11-10"), status: "IN_PROGRESS", progressQty: 6800 },
      { orderId: order1.id, stage: "Washing", sequence: 4, targetDate: new Date("2026-11-14"), status: "PENDING", progressQty: 0 },
      { orderId: order1.id, stage: "Finishing", sequence: 5, targetDate: new Date("2026-11-17"), status: "PENDING", progressQty: 0 },
      { orderId: order1.id, stage: "Packing", sequence: 6, targetDate: new Date("2026-11-19"), status: "PENDING", progressQty: 0 },
    ],
  });

  // Daily updates for Order 1
  const update1a = await prisma.dailyUpdate.create({
    data: {
      orderId: order1.id,
      unitId: unitA.id,
      stage: "Stitching",
      quantityCompleted: 380,
      photoUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      rawNote: "தையல் இயந்திரம் எண் 4 மோட்டார் கோளாறு காரணமாக 3 மணி நேரம் நின்றது. உதிரி பாகங்கள் வர தாமதம்.",
      language: "ta",
      supervisorName: "Murugan S",
      createdAt: new Date("2026-11-08T17:30:00Z"),
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      dailyUpdateId: update1a.id,
      originalNote: "தையல் இயந்திரம் எண் 4 மோட்டார் கோளாறு காரணமாக 3 மணி நேரம் நின்றது. உதிரி பாகங்கள் வர தாமதம்.",
      translation: "Sewing machine No. 4 stopped for 3 hours due to motor breakdown. Spare parts arrival delayed.",
      predictedCategory: "Machine Breakdown",
      confidence: 0.94,
      finalCategory: "Machine Breakdown",
      reviewedBy: "Karthik Raja",
      reviewedAt: new Date("2026-11-08T18:15:00Z"),
      isOverridden: false,
    },
  });

  const update1b = await prisma.dailyUpdate.create({
    data: {
      orderId: order1.id,
      unitId: unitA.id,
      stage: "Stitching",
      quantityCompleted: 410,
      photoUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80",
      rawNote: "இரண்டாவது ஷிப்டில் வேகம் அதிகரித்துள்ளது. தையல் வரிசை சீராக இயங்குகிறது.",
      language: "ta",
      supervisorName: "Murugan S",
      createdAt: new Date("2026-11-09T17:00:00Z"),
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      dailyUpdateId: update1b.id,
      originalNote: "இரண்டாவது ஷிப்டில் வேகம் அதிகரித்துள்ளது. தையல் வரிசை சீராக இயங்குகிறது.",
      translation: "Speed picked up in the second shift. Stitching assembly running smoothly.",
      predictedCategory: "Other",
      confidence: 0.88,
      finalCategory: "Other",
      reviewedBy: null,
      reviewedAt: null,
      isOverridden: false,
    },
  });

  // Run rate warning for Order 1:
  // Remaining: 12000 - 6800 = 5200 pcs
  // Days left: 11 days (ExFactory: Nov 20)
  // Required: 5200 / 11 = 472.7 pcs/day
  // Actual rate: 395 pcs/day (83.5% of required -> AMBER)
  // Projected delay: ~2.1 days
  await prisma.warning.create({
    data: {
      orderId: order1.id,
      severity: "AMBER",
      message: "Current stitching rate is 83.5% of required throughput. Projected 2.1-day slippage if second shift is not augmented.",
      reasonCategory: "Machine Breakdown",
      remainingQty: 5200,
      daysLeft: 11,
      requiredRate: 472.7,
      actualRate: 395.0,
      difference: -77.7,
      projectedDelayDays: 2.1,
      isApprovedForBuyer: true,
      approvedBy: "Karthik Raja",
      approvedAt: new Date("2026-11-08T18:30:00Z"),
    },
  });

  await prisma.auditLog.create({
    data: {
      orderId: order1.id,
      field: "Milestone: Stitching",
      oldValue: "2026-11-08",
      newValue: "2026-11-10",
      changedBy: "Karthik Raja (Senior Merchandiser)",
      reason: "Machine breakdown in Unit A shifted target completion by 2 days",
      timestamp: new Date("2026-11-08T18:20:00Z"),
    },
  });

  // 5. Seed Order 2: B-PO-88240 (Company B UK, Men's polo white, 8000 pcs, Finishing, 5200 done, ExFactory 2026-11-12)
  const order2 = await prisma.order.create({
    data: {
      poNumber: "B-PO-88240",
      buyerId: buyerB.id,
      style: "Men's polo",
      color: "White",
      unitId: unitB.id,
      totalQuantity: 8000,
      exFactoryDate: new Date("2026-11-12T00:00:00Z"),
      currentStage: "Finishing",
      currentProducedQty: 5200,
      riskStatus: "RED",
      createdAt: new Date("2026-10-10T00:00:00Z"),
    },
  });

  await prisma.orderSizeBreakdown.createMany({
    data: [
      { orderId: order2.id, size: "S", quantity: 1600 },
      { orderId: order2.id, size: "M", quantity: 2400 },
      { orderId: order2.id, size: "L", quantity: 2400 },
      { orderId: order2.id, size: "XL", quantity: 1200 },
      { orderId: order2.id, size: "XXL", quantity: 400 },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { orderId: order2.id, stage: "Cutting", sequence: 1, targetDate: new Date("2026-10-18"), completedDate: new Date("2026-10-18"), status: "COMPLETED", progressQty: 8000 },
      { orderId: order2.id, stage: "Printing", sequence: 2, targetDate: new Date("2026-10-24"), completedDate: new Date("2026-10-25"), status: "COMPLETED", progressQty: 8000 },
      { orderId: order2.id, stage: "Stitching", sequence: 3, targetDate: new Date("2026-11-03"), completedDate: new Date("2026-11-05"), status: "COMPLETED", progressQty: 8000 },
      { orderId: order2.id, stage: "Washing", sequence: 4, targetDate: new Date("2026-11-07"), completedDate: new Date("2026-11-07"), status: "COMPLETED", progressQty: 8000 },
      { orderId: order2.id, stage: "Finishing", sequence: 5, targetDate: new Date("2026-11-10"), status: "IN_PROGRESS", progressQty: 5200 },
      { orderId: order2.id, stage: "Packing", sequence: 6, targetDate: new Date("2026-11-11"), status: "PENDING", progressQty: 0 },
    ],
  });

  const update2 = await prisma.dailyUpdate.create({
    data: {
      orderId: order2.id,
      unitId: unitB.id,
      stage: "Finishing",
      quantityCompleted: 450,
      photoUrl: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80",
      rawNote: "பட்டன் பொருத்தும் பிரிவில் 4 தொழிலாளர்கள் வரவில்லை. இறுதி ஆய்வு தாமதமாகிறது.",
      language: "ta",
      supervisorName: "Murugan S",
      createdAt: new Date("2026-11-09T16:00:00Z"),
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      dailyUpdateId: update2.id,
      originalNote: "பட்டன் பொருத்தும் பிரிவில் 4 தொழிலாளர்கள் வரவில்லை. இறுதி ஆய்வு தாமதமாகிறது.",
      translation: "4 workers absent in button attaching section. Final quality inspection delayed.",
      predictedCategory: "Labour Shortage",
      confidence: 0.95,
      finalCategory: "Labour Shortage",
      reviewedBy: "Karthik Raja",
      reviewedAt: new Date("2026-11-09T16:45:00Z"),
      isOverridden: false,
    },
  });

  // Run rate calculation for Order 2:
  // Remaining: 8000 - 5200 = 2800 pcs
  // Days left: 3 days (ExFactory: Nov 12)
  // Required: 2800 / 3 = 933.3 pcs/day
  // Actual rate: 450.0 pcs/day (48.2% of required -> RED CRITICAL)
  // Projected days needed: 2800 / 450 = 6.2 days
  // Projected delay: 6.2 - 3 = 3.2 days delay past ex-factory
  await prisma.warning.create({
    data: {
      orderId: order2.id,
      severity: "RED",
      message: "Severe delay risk: Finishing throughput at 450 pcs/day vs 933 pcs/day required. Projected 3.2 days ex-factory slip unless overtime or extra finishing lines added immediately.",
      reasonCategory: "Labour Shortage",
      remainingQty: 2800,
      daysLeft: 3,
      requiredRate: 933.3,
      actualRate: 450.0,
      difference: -483.3,
      projectedDelayDays: 3.2,
      isApprovedForBuyer: true,
      approvedBy: "Karthik Raja",
      approvedAt: new Date("2026-11-09T17:15:00Z"),
    },
  });

  await prisma.auditLog.create({
    data: {
      orderId: order2.id,
      field: "riskStatus",
      oldValue: "AMBER",
      newValue: "RED",
      changedBy: "Run Rate Engine & Karthik Raja",
      reason: "Finishing rate dropped below 50% of required throughput with 3 days to ex-factory",
      timestamp: new Date("2026-11-09T17:10:00Z"),
    },
  });

  // 6. Seed Order 3: C-PO-0488 (Company C Germany, Kids printed tee yellow, 10000 pcs, Printing, 3100 done, ExFactory 2026-11-28)
  const order3 = await prisma.order.create({
    data: {
      poNumber: "C-PO-0488",
      buyerId: buyerC.id,
      style: "Kids printed tee",
      color: "Yellow",
      unitId: printingVendor.id,
      totalQuantity: 10000,
      exFactoryDate: new Date("2026-11-28T00:00:00Z"),
      currentStage: "Printing",
      currentProducedQty: 3100,
      riskStatus: "GREEN",
      createdAt: new Date("2026-10-25T00:00:00Z"),
    },
  });

  await prisma.orderSizeBreakdown.createMany({
    data: [
      { orderId: order3.id, size: "S", quantity: 2000 },
      { orderId: order3.id, size: "M", quantity: 3000 },
      { orderId: order3.id, size: "L", quantity: 3000 },
      { orderId: order3.id, size: "XL", quantity: 1500 },
      { orderId: order3.id, size: "XXL", quantity: 500 },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { orderId: order3.id, stage: "Cutting", sequence: 1, targetDate: new Date("2026-11-02"), completedDate: new Date("2026-11-02"), status: "COMPLETED", progressQty: 10000 },
      { orderId: order3.id, stage: "Printing", sequence: 2, targetDate: new Date("2026-11-12"), status: "IN_PROGRESS", progressQty: 3100 },
      { orderId: order3.id, stage: "Stitching", sequence: 3, targetDate: new Date("2026-11-19"), status: "PENDING", progressQty: 0 },
      { orderId: order3.id, stage: "Washing", sequence: 4, targetDate: new Date("2026-11-22"), status: "PENDING", progressQty: 0 },
      { orderId: order3.id, stage: "Finishing", sequence: 5, targetDate: new Date("2026-11-25"), status: "PENDING", progressQty: 0 },
      { orderId: order3.id, stage: "Packing", sequence: 6, targetDate: new Date("2026-11-27"), status: "PENDING", progressQty: 0 },
    ],
  });

  const update3 = await prisma.dailyUpdate.create({
    data: {
      orderId: order3.id,
      unitId: printingVendor.id,
      stage: "Printing",
      quantityCompleted: 520,
      photoUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
      rawNote: "மஞ்சள் நிற சாயப்பொருள் தரம் குறைவாக இருந்ததால் மறுபடியும் ஆய்வக சோதனைக்கு அனுப்பப்பட்டுள்ளது. புதிய பேட்ச் அச்சு துவங்கியுள்ளது.",
      language: "ta",
      supervisorName: "Murugan S",
      createdAt: new Date("2026-11-09T15:00:00Z"),
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      dailyUpdateId: update3.id,
      originalNote: "மஞ்சள் நிற சாயப்பொருள் தரம் குறைவாக இருந்ததால் மறுபடியும் ஆய்வக சோதனைக்கு அனுப்பப்பட்டுள்ளது. புதிய பேட்ச் அச்சு துவங்கியுள்ளது.",
      translation: "Yellow dye pigment was subpar and sent for re-testing. New pigment batch printing is running actively.",
      predictedCategory: "Material Delay",
      confidence: 0.91,
      finalCategory: "Material Delay",
      reviewedBy: "Karthik Raja",
      reviewedAt: new Date("2026-11-09T16:00:00Z"),
      isOverridden: false,
    },
  });

  // Run rate calculation for Order 3:
  // Remaining: 10000 - 3100 = 6900 pcs
  // Days left: 19 days (ExFactory: Nov 28)
  // Required: 6900 / 19 = 363.2 pcs/day
  // Actual rate: 420.0 pcs/day (115.6% of required -> GREEN ON TRACK)
  // Projected delay: 0 days (ahead of schedule)
  await prisma.warning.create({
    data: {
      orderId: order3.id,
      severity: "AMBER",
      message: "Minor pigment inspection resolved with supplier. Throughput recovering rapidly.",
      reasonCategory: "Material Delay",
      remainingQty: 6900,
      daysLeft: 19,
      requiredRate: 363.2,
      actualRate: 420.0,
      difference: 56.8,
      projectedDelayDays: -2.5,
      isApprovedForBuyer: false, // Internal warning, NOT yet approved for buyer
      approvedBy: null,
      approvedAt: null,
    },
  });

  console.log("✅ Seed completed successfully with full sample data, milestones, AI analyses, and audit logs!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Done
  });

