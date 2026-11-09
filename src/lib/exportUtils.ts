import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportOrderItem {
  poNumber: string;
  style: string;
  color: string;
  unit: string;
  totalQuantity: number;
  currentProducedQty: number;
  currentStage: string;
  exFactoryDate: string;
  daysLeft: number;
  riskStatus: string;
  progressPercentage: number;
  milestonesSummary: string;
  photoLinks?: string;
}

export function exportOrdersToExcel(buyerName: string, orders: ExportOrderItem[]): Uint8Array {
  const rows = orders.map((o) => ({
    "PO Number": o.poNumber,
    "Style Name": o.style,
    "Color": o.color,
    "Production Unit": o.unit,
    "Total Qty (pcs)": o.totalQuantity,
    "Produced Qty (pcs)": o.currentProducedQty,
    "Progress (%)": `${o.progressPercentage}%`,
    "Current Stage": o.currentStage,
    "Ex-Factory Date": o.exFactoryDate,
    "Days Remaining": o.daysLeft,
    "Risk Status": o.riskStatus,
    "Milestones": o.milestonesSummary,
    "Floor Photo Links": o.photoLinks || "N/A",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Weekly Status");

  // Adjust column widths
  worksheet["!cols"] = [
    { wch: 15 }, // PO
    { wch: 25 }, // Style
    { wch: 12 }, // Color
    { wch: 18 }, // Unit
    { wch: 14 }, // Total
    { wch: 14 }, // Produced
    { wch: 12 }, // Progress
    { wch: 14 }, // Stage
    { wch: 14 }, // ExFactory
    { wch: 14 }, // Days
    { wch: 12 }, // Risk
    { wch: 35 }, // Milestones
    { wch: 40 }, // Photos
  ];

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function exportOrdersToPDF(buyerName: string, orders: ExportOrderItem[]): Uint8Array {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 30, 45);
  doc.text("THREADFLOW - TIRUPPUR EXPORT OPERATIONS", 14, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 100, 115);
  doc.text(`Buyer Weekly Status Report: ${buyerName}`, 14, 25);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")} | Company A Knitwear Exporter`, 14, 30);

  const tableData = orders.map((o) => [
    o.poNumber,
    o.style,
    o.color,
    o.unit,
    o.totalQuantity.toLocaleString(),
    o.currentProducedQty.toLocaleString(),
    `${o.progressPercentage}%`,
    o.currentStage,
    o.exFactoryDate,
    `${o.daysLeft}d`,
    o.riskStatus,
    o.milestonesSummary,
  ]);

  autoTable(doc, {
    startY: 36,
    head: [
      [
        "PO #",
        "Style",
        "Color",
        "Unit",
        "Total",
        "Done",
        "Prog",
        "Stage",
        "Ex-Factory",
        "Days",
        "Risk",
        "Milestone Status",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      10: {
        fontStyle: "bold",
      },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 10) {
        const val = String(data.cell.raw);
        if (val === "GREEN") {
          data.cell.styles.textColor = [22, 101, 52];
        } else if (val === "AMBER") {
          data.cell.styles.textColor = [180, 83, 9];
        } else if (val === "RED") {
          data.cell.styles.textColor = [185, 28, 28];
        }
      }
    },
  });

  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}
