import { db } from "../database";
import { logs } from "../database/schema";
import { logger } from "./logger";

export interface AuditLogData {
    userId?: number;
    action: string;
    targetType?: string;
    targetId?: number;
    details?: any;
    ipAddress?: string;
}

export async function auditLog(data: AuditLogData): Promise<void> {
    try {
        db.insert(logs).values({
            userId: data.userId || null,
            action: data.action,
            targetType: data.targetType || null,
            targetId: data.targetId || null,
            details: data.details ? JSON.stringify(data.details) : null,
            ipAddress: data.ipAddress || null,
        }).run();
        logger.debug(`Audit: ${data.action} by user ${data.userId || "system"}`);
    } catch (error) {
        logger.error("Failed to write audit log");
    }
}
