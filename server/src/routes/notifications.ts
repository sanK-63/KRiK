import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
    getNotificationsByUser,
    getUnreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendBulkEmail,
} from "../services/notifications";
import { db } from "../database";
import { users } from "../database/schema";
import { eq } from "drizzle-orm";
import { auditLog } from "../core/audit";

const router = Router();

const isAdmin = (userId: number): boolean => {
    const user = db.select().from(users).where(eq(users.id, userId)).get() as any;
    return user?.username === "tunev";
};

router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const notifications = getNotificationsByUser(req.userId);
    res.json(notifications);
});

router.get("/unread-count", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const count = getUnreadCount(req.userId);
    res.json({ count });
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!isAdmin(req.userId)) { res.status(403).json({ error: "Forbidden" }); return; }
    const { userId, title, body, type, sendEmail: sendEmailFlag } = req.body;

    if (!title) { res.status(400).json({ error: "title обязателен" }); return; }
    if (!userId) { res.status(400).json({ error: "userId обязателен" }); return; }

    const notification = createNotification(
        userId,
        title,
        body || "",
        type || "info",
        sendEmailFlag || false
    );

    auditLog({ userId: req.userId ?? undefined, action: "notification.create", targetType: "notification", targetId: notification.id, details: { targetUserId: userId, title }, ipAddress: req.ip });
    res.json(notification);
});

router.post("/bulk-email", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!isAdmin(req.userId)) { res.status(403).json({ error: "Forbidden" }); return; }
    const { userIds, title, body } = req.body;

    if (!userIds?.length || !title) {
        res.status(400).json({ error: "userIds и title обязательны" });
        return;
    }

    const result = sendBulkEmail(userIds, title, body || "");
    auditLog({ userId: req.userId ?? undefined, action: "notification.bulk_email", targetType: "notification", details: { recipientCount: userIds.length, title }, ipAddress: req.ip });
    res.json(result);
});

router.post("/send-to-all", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!isAdmin(req.userId)) { res.status(403).json({ error: "Forbidden" }); return; }
    const { title, body } = req.body;

    if (!title) { res.status(400).json({ error: "title обязателен" }); return; }

    const allUsers = db.select().from(users).all();
    const userIds = allUsers.map((u) => u.id);
    const result = sendBulkEmail(userIds, title, body || "");
    auditLog({ userId: req.userId ?? undefined, action: "notification.send_to_all", targetType: "notification", details: { recipientCount: userIds.length, title }, ipAddress: req.ip });
    res.json(result);
});

router.patch("/:id/read", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);
    const result = markAsRead(id, req.userId);
    if (!result) { res.status(404).json({ error: "Не найдено" }); return; }
    auditLog({ userId: req.userId ?? undefined, action: "notification.mark_read", targetType: "notification", targetId: id, ipAddress: req.ip });
    res.json(result);
});

router.patch("/read-all", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    markAllAsRead(req.userId);
    res.json({ ok: true });
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);
    const result = deleteNotification(id, req.userId);
    if (!result) { res.status(404).json({ error: "Не найдено" }); return; }
    auditLog({ userId: req.userId ?? undefined, action: "notification.delete", targetType: "notification", targetId: id, ipAddress: req.ip });
    res.json({ ok: true });
});

export default router;
