import { Router, Response } from "express";
import { db } from "../database";
import { events, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getIO } from "../socket";
import { auditLog } from "../core/audit";
import { validate } from "../middleware/validate";
import { createEventSchema } from "../middleware/schemas";

const router = Router();

const isAdmin = (userId: number): boolean => {
    const user = db.select().from(users).where(eq(users.id, userId)).get() as any;
    return user?.username === "tunev";
};

function enrichEvent(e: any) {
    const author = db.select().from(users).where(eq(users.id, e.authorId || 0)).get();
    return {
        ...e,
        author: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null,
    };
}

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const all = db.select().from(events).all();
    res.json(all.map(enrichEvent));
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const event = db.select().from(events).where(eq(events.id, id)).get();
    if (!event) {
        res.status(404).json({ error: "Ивент не найден" });
        return;
    }
    res.json(enrichEvent(event));
});

router.post("/", authMiddleware, validate(createEventSchema), (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { title, description, date, time, location, category, image, video } = req.body;
    if (!title || !date) {
        res.status(400).json({ error: "Название и дата обязательны" });
        return;
    }
    const result = db.insert(events).values({
        title,
        description: description || null,
        date,
        time: time || null,
        location: location || null,
        category: category || "general",
        image: image || null,
        video: video || null,
        authorId: req.userId,
    }).returning().get();

    try { getIO().emit("event:created", enrichEvent(result)); } catch {}

    auditLog({ userId: req.userId ?? undefined, action: "event.create", targetType: "event", targetId: result.id, details: { title }, ipAddress: req.ip });
    res.json(result);
});

router.put("/:id", authMiddleware, validate(createEventSchema), (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const id = Number(req.params.id);
    const event = db.select().from(events).where(eq(events.id, id)).get();
    if (!event) {
        res.status(404).json({ error: "Ивент не найден" });
        return;
    }
    if (event.authorId !== req.userId) {
        res.status(403).json({ error: "Нет прав на редактирование" });
        return;
    }
    const { title, description, date, time, location, category, image, video } = req.body;
    const updated = db.update(events).set({
        title: title ?? event.title,
        description: description !== undefined ? description : event.description,
        date: date ?? event.date,
        time: time !== undefined ? time : event.time,
        location: location !== undefined ? location : event.location,
        category: category ?? event.category,
        image: image !== undefined ? image : event.image,
        video: video !== undefined ? video : (event as any).video,
    }).where(eq(events.id, id)).returning().get();

    try { getIO().emit("event:updated", enrichEvent(updated)); } catch {}

    auditLog({ userId: req.userId ?? undefined, action: "event.update", targetType: "event", targetId: id, details: { title: title ?? event.title }, ipAddress: req.ip });
    res.json(updated);
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const event = db.select().from(events).where(eq(events.id, id)).get();
    if (!event) {
        res.status(404).json({ error: "Ивент не найден" });
        return;
    }
    if (event.authorId !== req.userId && !isAdmin(req.userId!)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    db.delete(events).where(eq(events.id, id)).run();

    try { getIO().emit("event:deleted", { id }); } catch {}

    auditLog({ userId: req.userId ?? undefined, action: "event.delete", targetType: "event", targetId: id, details: { title: event.title }, ipAddress: req.ip });
    res.json({ ok: true });
});

export default router;
