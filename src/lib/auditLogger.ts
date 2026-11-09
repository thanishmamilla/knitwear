import { prisma } from "./prisma";

export interface LogAuditParams {
  orderId: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  reason: string;
}

export async function recordAuditLog(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        orderId: params.orderId,
        field: params.field,
        oldValue: params.oldValue,
        newValue: params.newValue,
        changedBy: params.changedBy,
        reason: params.reason,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
    throw err;
  }
}

