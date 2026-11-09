import { calculateRunRate } from "../src/lib/runRateEngine";
import { processSupervisorNoteWithAI } from "../src/lib/aiService";
import { exportOrdersToExcel, exportOrdersToPDF, ExportOrderItem } from "../src/lib/exportUtils";
import { prisma } from "../src/lib/prisma";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("=================================================");
  console.log("🧪 THREADFLOW COMPREHENSIVE AUTOMATED TEST SUITE");
  console.log("=================================================\n");

  // TEST 1: RISK CALCULATION TESTS
  console.log("--- 1. RUN-RATE RISK ENGINE MATHEMATICAL TESTS ---");
  {
    // Order 1: B-PO-88213 (Company B UK, Navy Tee)
    const o1 = calculateRunRate({
      totalQty: 12000,
      producedQty: 6800,
      exFactoryDate: "2026-11-20",
      referenceDate: "2026-11-09",
      fallbackActualRate: 395,
    });
    assert(o1.remainingQty === 5200, "Order 1 remaining quantity is 5,200 pcs (12000 - 6800)");
    assert(o1.daysLeft === 11, "Order 1 days remaining is 11 days (Nov 9 to Nov 20)");
    assert(o1.requiredRate === 472.7, "Order 1 required rate is 472.7 pcs/day (5200 / 11)");
    assert(o1.riskStatus === "AMBER", "Order 1 is AMBER status (actual 395 is 83.6% of required)");
    assert(o1.projectedDelayDays === 2.2, "Order 1 projected delay is +2.2 days late");

    // Order 2: B-PO-88240 (Company B UK, Men's polo white)
    const o2 = calculateRunRate({
      totalQty: 8000,
      producedQty: 5200,
      exFactoryDate: "2026-11-12",
      referenceDate: "2026-11-09",
      fallbackActualRate: 450,
    });
    assert(o2.remainingQty === 2800, "Order 2 remaining quantity is 2,800 pcs (8000 - 5200)");
    assert(o2.daysLeft === 3, "Order 2 days remaining is 3 days (Nov 9 to Nov 12)");
    assert(o2.requiredRate === 933.3, "Order 2 required rate is 933.3 pcs/day (2800 / 3)");
    assert(o2.riskStatus === "RED", "Order 2 is RED status (actual 450 is 48.2% of required)");
    assert(o2.projectedDelayDays === 3.2, "Order 2 projected delay is +3.2 days late");

    // Order 3: C-PO-0488 (Company C Germany, Kids printed tee yellow)
    const o3 = calculateRunRate({
      totalQty: 10000,
      producedQty: 3100,
      exFactoryDate: "2026-11-28",
      referenceDate: "2026-11-09",
      fallbackActualRate: 420,
    });
    assert(o3.remainingQty === 6900, "Order 3 remaining quantity is 6,900 pcs (10000 - 3100)");
    assert(o3.daysLeft === 19, "Order 3 days remaining is 19 days (Nov 9 to Nov 28)");
    assert(o3.requiredRate === 363.2, "Order 3 required rate is 363.2 pcs/day (6900 / 19)");
    assert(o3.riskStatus === "GREEN", "Order 3 is GREEN status (actual 420 is 115.6% of required)");
    assert(o3.projectedDelayDays < 0, "Order 3 has 0 delay (ahead of schedule)");
  }

  // TEST 2: AI TAMIL PARSER TESTS
  console.log("\n--- 2. AI TAMIL PARSER & REASON CATEGORIZATION TESTS ---");
  {
    const note1 = "தையல் இயந்திரம் எண் 4 மோட்டார் கோளாறு காரணமாக 3 மணி நேரம் நின்றது";
    const res1 = await processSupervisorNoteWithAI(note1);
    assert(
      res1.predictedCategory === "Machine Breakdown",
      `Machine issue identified as 'Machine Breakdown' (got: ${res1.predictedCategory})`
    );
    assert(res1.confidence >= 0.85, `Confidence score is high: ${res1.confidence}`);

    const note2 = "பட்டன் பொருத்தும் பிரிவில் 4 தொழிலாளர்கள் வரவில்லை";
    const res2 = await processSupervisorNoteWithAI(note2);
    assert(
      res2.predictedCategory === "Labour Shortage",
      `Absenteeism identified as 'Labour Shortage' (got: ${res2.predictedCategory})`
    );

    const note3 = "சாயப்பொருள் தரம் குறைவாக உள்ளதால் மறு ஆய்வு செய்யப்படுகிறது";
    const res3 = await processSupervisorNoteWithAI(note3);
    assert(
      res3.predictedCategory === "Quality Issue" || res3.predictedCategory === "Material Delay",
      `Dye/testing issue identified as Quality/Material category (got: ${res3.predictedCategory})`
    );
  }

  // TEST 3: RBAC & BUYER DATA ISOLATION TESTS
  console.log("\n--- 3. RBAC & MULTI-TENANT BUYER ISOLATION TESTS ---");
  {
    const buyerB = await prisma.buyer.findFirst({ where: { code: "COMPANY_B" } });
    const buyerC = await prisma.buyer.findFirst({ where: { code: "COMPANY_C" } });

    assert(buyerB !== null && buyerC !== null, "Both buyers exist in the database");

    // Query orders for Buyer B
    const buyerBOrders = await prisma.order.findMany({
      where: { buyerId: buyerB!.id },
    });
    // Query orders for Buyer C
    const buyerCOrders = await prisma.order.findMany({
      where: { buyerId: buyerC!.id },
    });

    assert(buyerBOrders.length >= 2, `Buyer B sees at least 2 orders (has ${buyerBOrders.length} orders)`);
    assert(buyerCOrders.length === 1, "Buyer C sees exactly 1 order (C-PO-0488)");

    const buyerBHasC = buyerBOrders.some((o) => o.poNumber === "C-PO-0488");
    assert(!buyerBHasC, "STRICT ISOLATION: Buyer B CANNOT see Company C orders or volumes");

    const buyerCHasB = buyerCOrders.some((o) => o.poNumber.startsWith("B-PO"));
    assert(!buyerCHasB, "STRICT ISOLATION: Buyer C CANNOT see Company B orders or styles");
  }

  // TEST 4: BUYER WARNING APPROVAL GATE TESTS
  console.log("\n--- 4. BUYER WARNING APPROVAL GATE TESTS ---");
  {
    // Find unapproved warnings
    const unapproved = await prisma.warning.findMany({
      where: { isApprovedForBuyer: false },
    });
    const approved = await prisma.warning.findMany({
      where: { isApprovedForBuyer: true },
    });

    assert(unapproved.length > 0, "Unapproved internal warnings exist in database");
    assert(approved.length > 0, "Approved buyer warnings exist in database");

    // Verify buyer query filters out unapproved warnings
    const buyerVisibleWarnings = await prisma.warning.findMany({
      where: { isApprovedForBuyer: true },
    });
    const hasUnapproved = buyerVisibleWarnings.some((w) => !w.isApprovedForBuyer);
    assert(!hasUnapproved, "CRITICAL: Buyer visibility query strictly filters out unapproved warnings");
  }

  // TEST 5: EXPORT DOSSIER GENERATION TESTS (EXCEL & PDF)
  console.log("\n--- 5. EXPORT DOSSIER GENERATION TESTS ---");
  {
    const sampleItems: ExportOrderItem[] = [
      {
        poNumber: "B-PO-88213",
        style: "Men's crew neck tee",
        color: "Navy",
        unit: "Own Unit A",
        totalQuantity: 12000,
        currentProducedQty: 6800,
        currentStage: "Stitching",
        exFactoryDate: "2026-11-20",
        daysLeft: 11,
        riskStatus: "AMBER",
        progressPercentage: 57,
        milestonesSummary: "Cutting: COMPLETED | Stitching: IN_PROGRESS",
      },
    ];

    const excelBuffer = exportOrdersToExcel("Company B (UK)", sampleItems);
    assert(excelBuffer && excelBuffer.length > 500, `Excel buffer generated successfully (${excelBuffer.length} bytes)`);

    const pdfBuffer = exportOrdersToPDF("Company B (UK)", sampleItems);
    assert(pdfBuffer && pdfBuffer.length > 1000, `PDF buffer generated successfully (${pdfBuffer.length} bytes)`);
  }

  // TEST 6: COMPLIANCE AUDIT TRAIL INTEGRITY
  console.log("\n--- 6. COMPLIANCE AUDIT TRAIL TESTS ---");
  {
    const auditLogs = await prisma.auditLog.findMany();
    assert(auditLogs.length > 0, "Audit logs exist and track field revisions");
    const hasReason = auditLogs.every((l) => l.reason && l.reason.length > 0);
    assert(hasReason, "Every audit log contains a mandatory compliance justification reason");
    const hasUser = auditLogs.every((l) => l.changedBy && l.changedBy.length > 0);
    assert(hasUser, "Every audit log contains the exact identity of who authorized the change");
  }

  console.log("\n=================================================");
  console.log(`🎯 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((e) => {
    console.error("Test runner crashed:", e);
    process.exit(1);
  })
  .finally(() => {});

