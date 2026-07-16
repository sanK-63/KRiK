import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
    getUserConversations,
    getConversationMessages,
    createConversation,
    findDirectConversation,
    sendMessage,
    markAsRead,
    getTotalUnread,
} from "../services/messages";
import { db } from "../database";
import { users } from "../database/schema";
import { eq } from "drizzle-orm";
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
    const { content } = req.body;

    if (!content && !req.file) {
        res.status(400).json({ error: "Укажите содержимое или вложение" });
        return;
    }

    const msg = sendMessage(
        conversationId,
        req.userId,
        content || null,
        req.file ? `/uploads/messages/${req.file.filename}` : undefined,
        req.file ? req.file.originalname : undefined
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

export default router;
