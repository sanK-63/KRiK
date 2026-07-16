import { db } from "../database";
import { conversations, conversationParticipants, messages, messageReactions, users } from "../database/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { emitToUser, emitToConversation } from "../socket";

interface ConversationResult {
    id: number;
    title: string | null;
    isGroup: boolean;
    avatar: string | null;
    createdAt: string;
    createdBy: number | null;
    otherUser: { id: number; username: string; displayName: string | null; avatar: string | null } | null;
    otherUsers?: { id: number; username: string; displayName: string | null; avatar: string | null }[];
    lastMessage: { content: string | null; senderId: number; createdAt: string; attachmentName: string | null } | null;
    unreadCount: number;
    participantsCount?: number;
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
            avatar: conv.avatar,
            createdAt: conv.createdAt,
            createdBy: conv.createdBy,
            otherUser,
            otherUsers,
            lastMessage: lastMsg
                ? { content: lastMsg.content, senderId: lastMsg.senderId, createdAt: lastMsg.createdAt, attachmentName: lastMsg.attachmentName }
                : null,
            unreadCount,
            participantsCount: participants.length,
        });
    }

    results.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt);
    });

    return results;
}

export function getConversationById(conversationId: number) {
    const conv = db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .get();

    if (!conv) return null;

    const participants = db
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversationId))
        .all();

    const participantsWithUser = participants.map((p) => {
        const u = db
            .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
            .from(users)
            .where(eq(users.id, p.userId))
            .get();
        return {
            userId: p.userId,
            joinedAt: p.joinedAt,
            lastReadAt: p.lastReadAt,
            role: p.role,
            user: u || null,
        };
    });

    return { ...conv, participants: participantsWithUser };
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

    const rawMessages = db
        .select({
            id: messages.id,
            conversationId: messages.conversationId,
            senderId: messages.senderId,
            content: messages.content,
            attachmentPath: messages.attachmentPath,
            attachmentName: messages.attachmentName,
            createdAt: messages.createdAt,
            replyToId: messages.replyToId,
            forwardedFromId: messages.forwardedFromId,
            editedAt: messages.editedAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset)
        .all()
        .reverse();

    const result = rawMessages.map((m) => {
        const sender = db
            .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
            .from(users)
            .where(eq(users.id, m.senderId))
            .get();

        let replyTo = null;
        if (m.replyToId) {
            const origMsg = db.select().from(messages).where(eq(messages.id, m.replyToId)).get();
            if (origMsg) {
                const origSender = db.select({ id: users.id, username: users.username, displayName: users.displayName }).from(users).where(eq(users.id, origMsg.senderId)).get();
                replyTo = { id: origMsg.id, content: origMsg.content, sender: origSender || null, attachmentName: origMsg.attachmentName };
            }
        }

        let forwardedFrom = null;
        if (m.forwardedFromId) {
            const fwdUser = db.select({ id: users.id, username: users.username, displayName: users.displayName }).from(users).where(eq(users.id, m.forwardedFromId)).get();
            forwardedFrom = fwdUser || null;
        }

        const reactionRows = db
            .select({
                emoji: messageReactions.emoji,
                userId: messageReactions.userId,
            })
            .from(messageReactions)
            .where(eq(messageReactions.messageId, m.id))
            .all();

        const reactionsMap: Record<string, { emoji: string; userIds: number[] }> = {};
        for (const r of reactionRows) {
            if (!reactionsMap[r.emoji]) {
                reactionsMap[r.emoji] = { emoji: r.emoji, userIds: [] };
            }
            reactionsMap[r.emoji].userIds.push(r.userId);
        }

        return {
            ...m,
            sender: sender || null,
            reactions: Object.values(reactionsMap),
            replyTo,
            forwardedFrom,
        };
    });

    return result;
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
            .values({ conversationId: conv.id, userId: uid, role: uid === creatorId ? "admin" : "member" })
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
    attachmentName?: string,
    replyToId?: number | null
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
            replyToId: replyToId || null,
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

    const sender = db
        .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, senderId))
        .get();

    let replyTo: any = null;
    if (replyToId) {
        const origMsg = db.select().from(messages).where(eq(messages.id, replyToId)).get();
        if (origMsg) {
            const origSender = db.select({ id: users.id, username: users.username, displayName: users.displayName }).from(users).where(eq(users.id, origMsg.senderId)).get();
            replyTo = { ...origMsg, sender: origSender || null };
        }
    }

    const messageWithSender = { ...msg, sender, reactions: [], replyTo };

    try {
        emitToConversation(conversationId, "message:new", messageWithSender);
    } catch {}

    return messageWithSender;
}

export function editMessage(conversationId: number, userId: number, messageId: number, content: string) {
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

    if (!participant) return { error: "Вы не участник этого чата" };

    const msg = db
        .select()
        .from(messages)
        .where(
            and(
                eq(messages.id, messageId),
                eq(messages.conversationId, conversationId)
            )
        )
        .get();

    if (!msg) return { error: "Сообщение не найдено" };
    if (msg.senderId !== userId) return { error: "Нельзя редактировать чужое сообщение" };

    db.update(messages)
        .set({ content, editedAt: new Date().toISOString() })
        .where(eq(messages.id, messageId))
        .run();

    const updated = db.select().from(messages).where(eq(messages.id, messageId)).get()!;

    const sender = db
        .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, updated.senderId))
        .get();

    const result = { ...updated, sender: sender || null };

    try {
        emitToConversation(conversationId, "message:edited", result);
    } catch {}

    return result;
}

export function forwardMessage(conversationId: number, senderId: number, messageId: number) {
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

    if (!participant) return { error: "Вы не участник этого чата" };

    const origMsg = db.select().from(messages).where(eq(messages.id, messageId)).get();
    if (!origMsg) return { error: "Исходное сообщение не найдено" };

    const newMsg = db
        .insert(messages)
        .values({
            conversationId,
            senderId,
            content: origMsg.content,
            attachmentPath: origMsg.attachmentPath,
            attachmentName: origMsg.attachmentName,
            forwardedFromId: origMsg.senderId,
        })
        .returning()
        .get();

    const sender = db
        .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, senderId))
        .get();

    const forwardedFrom = db
        .select({ id: users.id, username: users.username, displayName: users.displayName })
        .from(users)
        .where(eq(users.id, origMsg.senderId))
        .get();

    const result = { ...newMsg, sender: sender || null, forwardedFrom: forwardedFrom || null, reactions: [] };

    try {
        emitToConversation(conversationId, "message:new", result);
    } catch {}

    return result;
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

export function updateGroupTitle(conversationId: number, userId: number, title: string) {
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

    if (!participant) return { error: "Вы не участник этого чата" };
    if (participant.role !== "admin") return { error: "Только администратор может изменить название" };

    const conv = db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .get();

    if (!conv || !conv.isGroup) return { error: "Это не групповой чат" };

    db.update(conversations)
        .set({ title })
        .where(eq(conversations.id, conversationId))
        .run();

    try {
        emitToConversation(conversationId, "conversation:titleUpdated", { conversationId, title });
    } catch {}

    return { ok: true, title };
}

export function updateGroupAvatar(conversationId: number, userId: number, avatarPath: string) {
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

    if (!participant) return { error: "Вы не участник этого чата" };
    if (participant.role !== "admin") return { error: "Только администратор может изменить аватар" };

    const conv = db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .get();

    if (!conv || !conv.isGroup) return { error: "Это не групповой чат" };

    db.update(conversations)
        .set({ avatar: avatarPath })
        .where(eq(conversations.id, conversationId))
        .run();

    try {
        emitToConversation(conversationId, "conversation:avatarUpdated", { conversationId, avatar: avatarPath });
    } catch {}

    return { ok: true, avatar: avatarPath };
}

export function addParticipant(conversationId: number, userId: number, newUserId: number) {
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

    if (!participant) return { error: "Вы не участник этого чата" };
    if (participant.role !== "admin") return { error: "Только администратор может добавлять участников" };

    const conv = db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .get();

    if (!conv || !conv.isGroup) return { error: "Это не групповой чат" };

    const existing = db
        .select()
        .from(conversationParticipants)
        .where(
            and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, newUserId)
            )
        )
        .get();

    if (existing) return { error: "Пользователь уже является участником" };

    const newUser = db
        .select()
        .from(users)
        .where(eq(users.id, newUserId))
        .get();

    if (!newUser) return { error: "Пользователь не найден" };

    db.insert(conversationParticipants)
        .values({ conversationId, userId: newUserId, role: "member" })
        .run();

    try {
        emitToConversation(conversationId, "conversation:memberAdded", { conversationId, userId: newUserId });
    } catch {}

    return { ok: true };
}

export function removeParticipant(conversationId: number, userId: number, targetUserId: number) {
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

    if (!participant) return { error: "Вы не участник этого чата" };
    if (participant.role !== "admin") return { error: "Только администратор может удалять участников" };
    if (userId === targetUserId) return { error: "Используйте функцию выхода из группы" };

    const conv = db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .get();

    if (!conv || !conv.isGroup) return { error: "Это не групповой чат" };

    const targetParticipant = db
        .select()
        .from(conversationParticipants)
        .where(
            and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, targetUserId)
            )
        )
        .get();

    if (!targetParticipant) return { error: "Пользователь не является участником" };

    db.delete(conversationParticipants)
        .where(
            and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, targetUserId)
            )
        )
        .run();

    try {
        emitToConversation(conversationId, "conversation:memberRemoved", { conversationId, userId: targetUserId });
    } catch {}

    return { ok: true };
}

export function leaveGroup(conversationId: number, userId: number) {
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

    if (!participant) return { error: "Вы не участник этого чата" };

    const conv = db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .get();

    if (!conv || !conv.isGroup) return { error: "Это не групповой чат" };

    db.delete(conversationParticipants)
        .where(
            and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.userId, userId)
            )
        )
        .run();

    const remainingParticipants = db
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversationId))
        .all();

    if (remainingParticipants.length === 0) {
        db.delete(messages).where(eq(messages.conversationId, conversationId)).run();
        db.delete(conversations).where(eq(conversations.id, conversationId)).run();
    } else {
        try {
            emitToConversation(conversationId, "conversation:memberLeft", { conversationId, userId });
        } catch {}
    }

    return { ok: true };
}

export function deleteConversation(conversationId: number, userId: number) {
    const conv = db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .get();

    if (!conv) return { error: "Чат не найден" };

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

    if (!participant) return { error: "Вы не участник этого чата" };

    if (conv.isGroup) {
        if (participant.role !== "admin") {
            return { error: "Только администратор может удалить групповой чат" };
        }
    } else {
        if (conv.createdBy !== userId) {
            return { error: "Только создатель может удалить диалог" };
        }
    }

    try {
        emitToConversation(conversationId, "conversation:deleted", { conversationId });
    } catch {}

    db.delete(messages).where(eq(messages.conversationId, conversationId)).run();
    db.delete(conversationParticipants).where(eq(conversationParticipants.conversationId, conversationId)).run();
    db.delete(conversations).where(eq(conversations.id, conversationId)).run();

    return { ok: true };
}

export function toggleReaction(conversationId: number, userId: number, messageId: number, emoji: string) {
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

    if (!participant) return { error: "Вы не участник этого чата" };

    const msg = db
        .select()
        .from(messages)
        .where(
            and(
                eq(messages.id, messageId),
                eq(messages.conversationId, conversationId)
            )
        )
        .get();

    if (!msg) return { error: "Сообщение не найдено" };

    const existing = db
        .select()
        .from(messageReactions)
        .where(
            and(
                eq(messageReactions.messageId, messageId),
                eq(messageReactions.userId, userId),
                eq(messageReactions.emoji, emoji)
            )
        )
        .get();

    if (existing) {
        db.delete(messageReactions)
            .where(
                and(
                    eq(messageReactions.messageId, messageId),
                    eq(messageReactions.userId, userId),
                    eq(messageReactions.emoji, emoji)
                )
            )
            .run();
    } else {
        db.insert(messageReactions)
            .values({ messageId, userId, emoji })
            .run();
    }

    const reactionRows = db
        .select({
            emoji: messageReactions.emoji,
            userId: messageReactions.userId,
        })
        .from(messageReactions)
        .where(eq(messageReactions.messageId, messageId))
        .all();

    const reactionsMap: Record<string, { emoji: string; userIds: number[] }> = {};
    for (const r of reactionRows) {
        if (!reactionsMap[r.emoji]) {
            reactionsMap[r.emoji] = { emoji: r.emoji, userIds: [] };
        }
        reactionsMap[r.emoji].userIds.push(r.userId);
    }

    const reactions = Object.values(reactionsMap);

    try {
        emitToConversation(conversationId, "message:reactionsUpdated", { messageId, reactions });
    } catch {}

    return { ok: true, reactions };
}

export function getParticipants(conversationId: number) {
    const conv = db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .get();

    if (!conv) return null;

    const participants = db
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversationId))
        .all();

    return participants.map((p) => {
        const u = db
            .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
            .from(users)
            .where(eq(users.id, p.userId))
            .get();
        return {
            userId: p.userId,
            joinedAt: p.joinedAt,
            lastReadAt: p.lastReadAt,
            role: p.role,
            user: u || null,
        };
    });
}
