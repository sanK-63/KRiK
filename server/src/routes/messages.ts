import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
    getUserConversations,
    getConversationById,
    getConversationMessages,
    createConversation,
    findDirectConversation,
    sendMessage,
    markAsRead,
    getTotalUnread,
    updateGroupTitle,
    updateGroupAvatar,
    addParticipant,
    removeParticipant,
    leaveGroup,
    deleteConversation,
    toggleReaction,
    getParticipants,
    editMessage,
    forwardMessage,
} from "../services/messages";
import { db } from "../database";
import { users, conversationParticipants, messages } from "../database/schema";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads/messages");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip|rar|7z|mp3|mp4|ogg|wav|webm|opus|m4a|mpeg/;
        const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
        if (allowed.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Файл не поддерживается"));
        }
    },
});

const router = Router();

router.get("/conversations", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const convs = getUserConversations(req.userId);
    res.json(convs);
});

router.post("/conversations", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { participantIds, title } = req.body;

    if (!participantIds?.length) {
        res.status(400).json({ error: "participantIds обязателен" });
        return;
    }

    const conv = createConversation(req.userId, participantIds, title);
    res.json(conv);
});

router.get("/conversations/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const msgs = getConversationMessages(id, req.userId, limit, offset);
    if (msgs === null) {
        res.status(403).json({ error: "Нет доступа" });
        return;
    }
    res.json(msgs);
});

router.post("/conversations/:id/send", authMiddleware, upload.single("attachment"), (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const conversationId = Number(req.params.id);
    const { content, replyToId } = req.body;

    if (!content && !req.file) {
        res.status(400).json({ error: "Укажите содержимое или вложение" });
        return;
    }

    const msg = sendMessage(
        conversationId,
        req.userId,
        content || null,
        req.file ? `/uploads/messages/${req.file.filename}` : undefined,
        req.file ? req.file.originalname : undefined,
        replyToId ? Number(replyToId) : undefined
    );

    if (!msg) {
        res.status(403).json({ error: "Нет доступа" });
        return;
    }

    res.json(msg);
});

router.patch("/conversations/:id/read", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);
    markAsRead(id, req.userId);
    res.json({ ok: true });
});

router.get("/find-or-create/:userId", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const otherUserId = Number(req.params.userId);

    const otherUser = db.select().from(users).where(eq(users.id, otherUserId)).get();
    if (!otherUser) {
        res.status(404).json({ error: "Пользователь не найден" });
        return;
    }

    let conv = findDirectConversation(req.userId, otherUserId);
    if (!conv) {
        conv = createConversation(req.userId, [otherUserId]);
    }
    res.json(conv);
});

router.get("/unread", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const count = getTotalUnread(req.userId);
    res.json({ count });
});

router.get("/conversations/:id/info", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);

    const participant = db.select().from(conversationParticipants)
        .where(and(
            eq(conversationParticipants.conversationId, id),
            eq(conversationParticipants.userId, req.userId)
        ))
        .get();

    if (!participant) {
        res.status(403).json({ error: "Нет доступа" });
        return;
    }

    const info = getConversationById(id);
    if (!info) {
        res.status(404).json({ error: "Чат не найден" });
        return;
    }
    res.json(info);
});

router.patch("/conversations/:id/title", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);
    const { title } = req.body;

    if (!title || !title.trim()) {
        res.status(400).json({ error: "Название обязательно" });
        return;
    }

    const result = updateGroupTitle(id, req.userId, title.trim());
    if ("error" in result) {
        res.status(403).json(result);
        return;
    }
    res.json(result);
});

router.patch("/conversations/:id/avatar", authMiddleware, upload.single("avatar"), (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);

    if (!req.file) {
        res.status(400).json({ error: "Файл аватара обязателен" });
        return;
    }

    const avatarPath = `/uploads/messages/${req.file.filename}`;
    const result = updateGroupAvatar(id, req.userId, avatarPath);
    if ("error" in result) {
        res.status(403).json(result);
        return;
    }
    res.json(result);
});

router.post("/conversations/:id/members", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);
    const { userId } = req.body;

    if (!userId) {
        res.status(400).json({ error: "userId обязателен" });
        return;
    }

    const result = addParticipant(id, req.userId, userId);
    if ("error" in result) {
        res.status(403).json(result);
        return;
    }
    res.json(result);
});

router.delete("/conversations/:id/members/:userId", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const conversationId = Number(req.params.id);
    const targetUserId = Number(req.params.userId);

    const result = removeParticipant(conversationId, req.userId, targetUserId);
    if ("error" in result) {
        res.status(403).json(result);
        return;
    }
    res.json(result);
});

router.post("/conversations/:id/leave", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);

    const result = leaveGroup(id, req.userId);
    if ("error" in result) {
        res.status(403).json(result);
        return;
    }
    res.json(result);
});

router.delete("/conversations/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);

    const result = deleteConversation(id, req.userId);
    if ("error" in result) {
        res.status(403).json(result);
        return;
    }
    res.json(result);
});

router.post("/conversations/:id/reactions", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const conversationId = Number(req.params.id);
    const { messageId, emoji } = req.body;

    if (!messageId || !emoji) {
        res.status(400).json({ error: "messageId и emoji обязательны" });
        return;
    }

    const result = toggleReaction(conversationId, req.userId, messageId, emoji);
    if ("error" in result) {
        res.status(403).json(result);
        return;
    }
    res.json(result);
});

router.post("/:msgId/reactions", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const messageId = Number(req.params.msgId);
    const { emoji } = req.body;

    if (!emoji) {
        res.status(400).json({ error: "emoji обязателен" });
        return;
    }

    const msg = db.select().from(messages).where(eq(messages.id, messageId)).get();
    if (!msg) { res.status(404).json({ error: "Сообщение не найдено" }); return; }

    const result = toggleReaction(msg.conversationId, req.userId, messageId, emoji);
    if ("error" in result) { res.status(403).json(result); return; }
    res.json({ reactions: result.reactions });
});

router.patch("/conversations/:id/messages/:msgId", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const conversationId = Number(req.params.id);
    const messageId = Number(req.params.msgId);
    const { content } = req.body;

    if (!content || !content.trim()) {
        res.status(400).json({ error: "Сообщение не может быть пустым" });
        return;
    }

    const result = editMessage(conversationId, req.userId, messageId, content.trim());
    if ("error" in result) { res.status(403).json(result); return; }
    res.json(result);
});

router.post("/conversations/:id/forward", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const conversationId = Number(req.params.id);
    const { messageId } = req.body;

    if (!messageId) {
        res.status(400).json({ error: "messageId обязателен" });
        return;
    }

    const result = forwardMessage(conversationId, req.userId, Number(messageId));
    if ("error" in result) { res.status(403).json(result); return; }
    res.json(result);
});

router.get("/messages/:msgId", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const msgId = Number(req.params.msgId);

    const msg = db.select().from(messages).where(eq(messages.id, msgId)).get();
    if (!msg) { res.status(404).json({ error: "Сообщение не найдено" }); return; }

    const sender = db.select({ id: users.id, username: users.username, displayName: users.displayName }).from(users).where(eq(users.id, msg.senderId)).get();

    res.json({ ...msg, sender: sender || null });
});

router.get("/conversations/:id/members", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(req.params.id);

    const members = getParticipants(id);
    if (!members) {
        res.status(404).json({ error: "Чат не найден" });
        return;
    }
    res.json(members);
});

export default router;
