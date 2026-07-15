import { Router, Response } from "express";
import { db } from "../database";
import { memes, users, memeLikes, memeComments } from "../database/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getIO } from "../socket";

const router = Router();

function enrichMeme(m: any, userId?: number) {
    const author = db.select().from(users).where(eq(users.id, m.authorId || 0)).get();
    const liked = userId ? db.select().from(memeLikes).where(and(eq(memeLikes.memeId, m.id), eq(memeLikes.userId, userId))).get() : null;
    const commentCount = db.select().from(memeComments).where(eq(memeComments.memeId, m.id)).all().length;
    return {
        ...m,
        author: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null,
        isLiked: !!liked,
        commentCount,
    };
}

router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
    const { category } = req.query;
    let all: any[];
    if (category && category !== "all") {
        all = db.select().from(memes).where(eq(memes.category, category as string)).all();
    } else {
        all = db.select().from(memes).all();
    }
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(all.map((m) => enrichMeme(m, req.userId)));
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const meme = db.select().from(memes).where(eq(memes.id, id)).get();
    if (!meme) {
        res.status(404).json({ error: "Мем не найден" });
        return;
    }
    const comments = db.select().from(memeComments).where(eq(memeComments.memeId, id)).all().map((c) => {
        const author = db.select().from(users).where(eq(users.id, c.userId)).get();
        return { ...c, author: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null };
    });
    res.json({ ...enrichMeme(meme, req.userId), comments });
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { title, image, category } = req.body;
    if (!image) {
        res.status(400).json({ error: "Изображение обязательно" });
        return;
    }
    const result = db.insert(memes).values({
        title: title || null,
        image,
        category: category || "general",
        authorId: req.userId,
    }).returning().get();

    try { getIO().emit("meme:created", enrichMeme(result, req.userId)); } catch {}

    res.json(enrichMeme(result, req.userId));
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const id = Number(req.params.id);
    const meme = db.select().from(memes).where(eq(memes.id, id)).get();
    if (!meme) {
        res.status(404).json({ error: "Мем не найден" });
        return;
    }
    if (meme.authorId !== req.userId) {
        res.status(403).json({ error: "Нет прав" });
        return;
    }
    db.delete(memes).where(eq(memes.id, id)).run();
    try { getIO().emit("meme:deleted", { id }); } catch {}
    res.json({ ok: true });
});

router.post("/:id/like", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const id = Number(req.params.id);
    const meme = db.select().from(memes).where(eq(memes.id, id)).get();
    if (!meme) {
        res.status(404).json({ error: "Мем не найден" });
        return;
    }
    const existing = db.select().from(memeLikes).where(and(eq(memeLikes.memeId, id), eq(memeLikes.userId, req.userId))).get();
    if (existing) {
        db.delete(memeLikes).where(eq(memeLikes.id, existing.id)).run();
        db.update(memes).set({ likes: Math.max(0, meme.likes - 1) }).where(eq(memes.id, id)).run();
    } else {
        db.insert(memeLikes).values({ memeId: id, userId: req.userId }).run();
        db.update(memes).set({ likes: meme.likes + 1 }).where(eq(memes.id, id)).run();
    }
    const updated = db.select().from(memes).where(eq(memes.id, id)).get();
    try { getIO().emit("meme:updated", enrichMeme(updated, req.userId)); } catch {}
    res.json(enrichMeme(updated, req.userId));
});

router.post("/:id/comments", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const memeId = Number(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) {
        res.status(400).json({ error: "Комментарий обязателен" });
        return;
    }
    const result = db.insert(memeComments).values({ memeId, userId: req.userId, content }).returning().get();
    const author = db.select().from(users).where(eq(users.id, req.userId)).get();
    const comment = { ...result, author: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null };
    try { getIO().emit("meme_comment:created", { memeId, comment }); } catch {}
    res.json(comment);
});

router.delete("/:memeId/comments/:commentId", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const commentId = Number(req.params.commentId);
    const comment = db.select().from(memeComments).where(eq(memeComments.id, commentId)).get();
    if (!comment) {
        res.status(404).json({ error: "Комментарий не найден" });
        return;
    }
    if (comment.userId !== req.userId) {
        res.status(403).json({ error: "Нет прав" });
        return;
    }
    db.delete(memeComments).where(eq(memeComments.id, commentId)).run();
    try { getIO().emit("meme_comment:deleted", { memeId: Number(req.params.memeId), commentId }); } catch {}
    res.json({ ok: true });
});

export default router;
