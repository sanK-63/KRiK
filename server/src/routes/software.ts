import { Router, Response } from "express";
import { db } from "../database";
import { softwareItems, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getIO } from "../socket";

const router = Router();

function enrichItem(item: any) {
    const author = db.select().from(users).where(eq(users.id, item.authorId || 0)).get();
    return {
        ...item,
        tags: (() => { try { return JSON.parse(item.tags || "[]"); } catch { return []; } })(),
        author: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null,
    };
}

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const all = db.select().from(softwareItems).all();
    res.json(all.map(enrichItem));
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const item = db.select().from(softwareItems).where(eq(softwareItems.id, id)).get();
    if (!item) {
        res.status(404).json({ error: "Публикация не найдена" });
        return;
    }
    res.json(enrichItem(item));
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { category, title, description, tags, version, downloadUrl, downloadLabel } = req.body;
    if (!title || !description || !category) {
        res.status(400).json({ error: "Заголовок, описание и категория обязательны" });
        return;
    }
    const result = db.insert(softwareItems).values({
        category,
        title,
        description,
        tags: JSON.stringify(tags || []),
        version: version || null,
        downloadUrl: downloadUrl || null,
        downloadLabel: downloadLabel || null,
        authorId: req.userId,
    }).returning().get();

    try { getIO().emit("software:created", enrichItem(result)); } catch {}

    res.json(enrichItem(result));
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const id = Number(req.params.id);
    const item = db.select().from(softwareItems).where(eq(softwareItems.id, id)).get();
    if (!item) {
        res.status(404).json({ error: "Публикация не найдена" });
        return;
    }
    if (item.authorId !== req.userId) {
        res.status(403).json({ error: "Нет прав на редактирование" });
        return;
    }
    const { category, title, description, tags, version, downloadUrl, downloadLabel } = req.body;
    const updated = db.update(softwareItems).set({
        ...(category !== undefined && { category }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(version !== undefined && { version: version || null }),
        ...(downloadUrl !== undefined && { downloadUrl: downloadUrl || null }),
        ...(downloadLabel !== undefined && { downloadLabel: downloadLabel || null }),
    }).where(eq(softwareItems.id, id)).returning().get();

    try { getIO().emit("software:updated", enrichItem(updated)); } catch {}

    res.json(enrichItem(updated));
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const id = Number(req.params.id);
    const item = db.select().from(softwareItems).where(eq(softwareItems.id, id)).get();
    if (!item) {
        res.status(404).json({ error: "Публикация не найдена" });
        return;
    }
    if (item.authorId !== req.userId) {
        res.status(403).json({ error: "Нет прав на удаление" });
        return;
    }
    db.delete(softwareItems).where(eq(softwareItems.id, id)).run();

    try { getIO().emit("software:deleted", { id }); } catch {}

    res.json({ ok: true });
});

export default router;
