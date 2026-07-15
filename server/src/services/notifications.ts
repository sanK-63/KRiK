import { db } from "../database";
import { notifications, users } from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { sendNotificationEmail } from "./email";
import { emitToUser } from "../socket";

export function getNotificationsByUser(userId: number) {
    return db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .all();
}

export function getUnreadCount(userId: number) {
    const rows = db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .all();
    return rows.filter((n) => !n.read).length;
}

export function createNotification(
    userId: number,
    title: string,
    body: string,
    type: string = "info",
    sendEmailFlag: boolean = false
) {
    const notification = db
        .insert(notifications)
        .values({ userId, title, body, type })
        .returning()
        .get();

    if (sendEmailFlag) {
        const user = db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .get();
        if (user?.email) {
            sendNotificationEmail(user.email, title, body).catch((err) =>
                console.error("[Email] Ошибка отправки:", err.message)
            );
        }
    }

    try { emitToUser(userId, "notification:new", notification); } catch {}

    return notification;
}

export function markAsRead(notificationId: number, userId: number) {
    const notification = db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .get();

    if (!notification || notification.userId !== userId) return null;

    return db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationId))
        .returning()
        .get();
}

export function markAllAsRead(userId: number) {
    db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId))
        .run();
    return { ok: true };
}

export function deleteNotification(notificationId: number, userId: number) {
    const notification = db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .get();

    if (!notification || notification.userId !== userId) return null;

    db.delete(notifications)
        .where(eq(notifications.id, notificationId))
        .run();
    return { ok: true };
}

export function sendBulkEmail(
    userIds: number[],
    title: string,
    body: string
) {
    const userList = db
        .select()
        .from(users)
        .all()
        .filter((u) => userIds.includes(u.id));

    for (const user of userList) {
        createNotification(user.id, title, body, "info", true);
    }

    return { sent: userList.length };
}
