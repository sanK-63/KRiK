import { db } from "../database";
import { conversations, conversationParticipants, messages, users } from "../database/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { emitToUser } from "../socket";

interface ConversationResult {
    id: number;
    title: string | null;
    isGroup: boolean;
    createdAt: string;
    otherUser: { id: number; username: string; displayName: string | null; avatar: string | null } | null;
    otherUsers?: { id: number; username: string; displayName: string | null; avatar: string | null }[];
    lastMessage: { content: string | null; senderId: number; createdAt: string; attachmentName: string | null } | null;
    unreadCount: number;
}

export function getUserConversations(userId: number): ConversationResult[] {
    const userConvs = db
        .select({ conversationId: conversationParticipants.conversationId })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, userId))
        .all();

    const results: ConversationResult[] = [];

    for (const uc of userConvs) {
        const conv = db
            .select()
            .from(conversations)
            .where(eq(conversations.id, uc.conversationId))
            .get();

        if (!conv) continue;

        const participants = db
            .select({
                userId: conversationParticipants.userId,
                lastReadAt: conversationParticipants.lastReadAt,
            })
            .from(conversationParticipants)
            .where(eq(conversationParticipants.conversationId, conv.id))
            .all();

        const otherParticipants = participants.filter((p) => p.userId !== userId);

        let otherUser: ConversationResult["otherUser"] = null;
        let otherUsers: ConversationResult["otherUsers"] = undefined;

        if (!conv.isGroup && otherParticipants.length === 1) {
            const u = db
                .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
                .from(users)
                .where(eq(users.id, otherParticipants[0].userId))
                .get();
            otherUser = u || null;
        } else if (conv.isGroup) {
            otherUsers = otherParticipants
                .map((p) => {
                    const u = db
                        .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
                        .from(users)
                        .where(eq(users.id, p.userId))
                        .get();
                    return u || null;
                })
                .filter(Boolean) as any[];
        }

        const lastMsg = db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(desc(messages.createdAt))
            .limit(1)
            .get();

        const myLastRead = participants.find((p) => p.userId === userId)?.lastReadAt;

        const allMessages = db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conv.id))
            .all();

        const unreadCount = lastMsg && lastMsg.senderId !== userId
            ? allMessages.filter(
                (m) =>
                    m.senderId !== userId &&
                    (!myLastRead || m.createdAt > myLastRead)
            ).length
            : 0;

        results.push({
            id: conv.id,
            title: conv.title,
            isGroup: conv.isGroup,
            createdAt: conv.createdAt,
            otherUser,
            otherUsers,
            lastMessage: lastMsg
                ? { content: lastMsg.content, senderId: lastMsg.senderId, createdAt: lastMsg.createdAt, attachmentName: lastMsg.attachmentName }
                : null,
            unreadCount,
        });
    }

    results.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt);
    });

    return results;
}

export function getConversationMessages(conversationId: number, userId: number, limit = 50, offset = 0) {
    const participant = db
        .select()
        .from(conversationParticipants)
        .where(
            and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, userId)
            )
        )
        .get();

    if (!participant) return null;

    return db
        .select({
            id: messages.id,
            conversationId: messages.conversationId,
            senderId: messages.senderId,
            content: messages.content,
            attachmentPath: messages.attachmentPath,
            attachmentName: messages.attachmentName,
            createdAt: messages.createdAt,
            senderIdRel: messages.senderId,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset)
        .all()
        .reverse()
        .map((m) => {
            const sender = db
                .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
                .from(users)
                .where(eq(users.id, m.senderId))
                .get();
            const { senderIdRel, ...rest } = m;
            return { ...rest, sender: sender || null };
        });
}

export function createConversation(creatorId: number, participantIds: number[], title?: string) {
    const allIds = [...new Set([creatorId, ...participantIds])];
    const isGroup = allIds.length > 2;

    if (!isGroup && allIds.length === 2) {
        const existing = findDirectConversation(allIds[0], allIds[1]);
        if (existing) return existing;
    }

    const conv = db
        .insert(conversations)
        .values({ createdBy: creatorId, isGroup, title: title || null })
        .returning()
        .get();

    for (const uid of allIds) {
        db.insert(conversationParticipants)
            .values({ conversationId: conv.id, userId: uid })
            .run();
    }

    return conv;
}

export function findDirectConversation(userId1: number, userId2: number) {
    const user1Convs = db
        .select({ conversationId: conversationParticipants.conversationId })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, userId1))
        .all()
        .map((r) => r.conversationId);

    if (user1Convs.length === 0) return null;

    for (const convId of user1Convs) {
        const conv = db
            .select()
            .from(conversations)
            .where(eq(conversations.id, convId))
            .get();

        if (!conv || conv.isGroup) continue;

        const participants = db
            .select()
            .from(conversationParticipants)
            .where(eq(conversationParticipants.conversationId, convId))
            .all();

        if (participants.length === 2 && participants.some((p) => p.userId === userId2)) {
            return conv;
        }
    }

    return null;
}

export function sendMessage(
    conversationId: number,
    senderId: number,
    content: string | null,
    attachmentPath?: string,
    attachmentName?: string
) {
    const participant = db
        .select()
        .from(conversationParticipants)
        .where(
            and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, senderId)
            )
        )
        .get();

    if (!participant) return null;

    const msg = db
        .insert(messages)
        .values({
            conversationId,
            senderId,
            content: content || null,
            attachmentPath: attachmentPath || null,
            attachmentName: attachmentName || null,
        })
        .returning()
        .get();

    db.update(conversationParticipants)
        .set({ lastReadAt: new Date().toISOString() })
        .where(
            and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, senderId)
            )
        )
        .run();

    const participants = db
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversationId))
        .all();

    const sender = db
        .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, senderId))
        .get();

    const messageWithSender = { ...msg, sender };

    for (const p of participants) {
        if (p.userId !== senderId) {
            try {
                emitToUser(p.userId, "message:new", messageWithSender);
            } catch {}
        }
    }

    return messageWithSender;
}

export function markAsRead(conversationId: number, userId: number) {
    db.update(conversationParticipants)
        .set({ lastReadAt: new Date().toISOString() })
        .where(
            and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, userId)
            )
        )
        .run();
    return { ok: true };
}

export function getTotalUnread(userId: number) {
    const userConvs = db
        .select({ conversationId: conversationParticipants.conversationId })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, userId))
        .all();

    let total = 0;

    for (const uc of userConvs) {
        const participant = db
            .select()
            .from(conversationParticipants)
            .where(
                and(
                    eq(conversationParticipants.conversationId, uc.conversationId),
                    eq(conversationParticipants.userId, userId)
                )
            )
            .get();

        if (!participant) continue;

        const allMessages = db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, uc.conversationId))
            .all();

        const unread = allMessages.filter(
            (m) =>
                m.senderId !== userId &&
                (!participant.lastReadAt || m.createdAt > participant.lastReadAt)
        ).length;

        total += unread;
    }

    return total;
}
