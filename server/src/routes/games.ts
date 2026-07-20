import { Router, Response } from "express";
import { db } from "../database";
import { games, gameModes, gameMaps, gamePlatforms, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { auditLog } from "../core/audit";

const router = Router();

const isAdmin = (userId: number): boolean => {
    const user = db.select().from(users).where(eq(users.id, userId)).get() as any;
    return user?.username === "tunev";
};

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const all = db.select().from(games).all();
    const result = all.map((g) => {
        const modes = db.select().from(gameModes).where(eq(gameModes.gameId, g.id)).all();
        const maps = db.select().from(gameMaps).where(eq(gameMaps.gameId, g.id)).all();
        const platforms = db.select().from(gamePlatforms).where(eq(gamePlatforms.gameId, g.id)).all();
        return {
            ...g,
            modes: modes.map((m) => m.name),
            maps: maps.map((m) => ({ id: m.id, name: m.name, image: m.image })),
            platforms: platforms.map((p) => p.platform),
        };
    });
    res.json(result);
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const g = db.select().from(games).where(eq(games.id, id)).get();
    if (!g) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    const modes = db.select().from(gameModes).where(eq(gameModes.gameId, id)).all();
    const maps = db.select().from(gameMaps).where(eq(gameMaps.gameId, id)).all();
    const platforms = db.select().from(gamePlatforms).where(eq(gamePlatforms.gameId, id)).all();
    res.json({
        ...g,
        modes: modes.map((m) => m.name),
        maps: maps.map((m) => ({ id: m.id, name: m.name, image: m.image })),
        platforms: platforms.map((p) => p.platform),
    });
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId || !isAdmin(req.userId)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const { name, slug, logo, cover, description, platforms, maps, modes } = req.body;

    if (!name || !slug) {
        res.status(400).json({ error: "name and slug are required" });
        return;
    }

    const existing = db.select().from(games).where(eq(games.slug, slug)).get();
    if (existing) {
        res.status(409).json({ error: "Game with this slug already exists" });
        return;
    }

    const game = db.insert(games).values({ name, slug, logo: logo || null, cover: cover || null, description: description || null }).returning().get();

    if (Array.isArray(platforms)) {
        for (const p of platforms) {
            db.insert(gamePlatforms).values({ gameId: game.id, platform: p }).run();
        }
    }
    if (Array.isArray(maps)) {
        for (const m of maps) {
            const mapName = typeof m === "string" ? m : m.name;
            const mapImage = typeof m === "string" ? null : m.image || null;
            db.insert(gameMaps).values({ gameId: game.id, name: mapName, image: mapImage }).run();
        }
    }
    if (Array.isArray(modes)) {
        for (const m of modes) {
            db.insert(gameModes).values({ gameId: game.id, name: m }).run();
        }
    }

    auditLog({ userId: req.userId ?? undefined, action: "game.create", targetType: "game", targetId: game.id, details: { name, slug }, ipAddress: req.ip });
    res.status(201).json({ id: game.id, name: game.name, slug: game.slug });
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId || !isAdmin(req.userId)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const id = Number(req.params.id);
    const game = db.select().from(games).where(eq(games.id, id)).get();
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }

    const { name, slug, logo, cover, description, active, platforms, maps, modes } = req.body;

    db.update(games)
        .set({
            ...(name !== undefined && { name }),
            ...(slug !== undefined && { slug }),
            ...(logo !== undefined && { logo }),
            ...(cover !== undefined && { cover }),
            ...(description !== undefined && { description }),
            ...(active !== undefined && { active }),
        })
        .where(eq(games.id, id))
        .run();

    if (Array.isArray(platforms)) {
        db.delete(gamePlatforms).where(eq(gamePlatforms.gameId, id)).run();
        for (const p of platforms) {
            db.insert(gamePlatforms).values({ gameId: id, platform: p }).run();
        }
    }
    if (Array.isArray(modes)) {
        db.delete(gameModes).where(eq(gameModes.gameId, id)).run();
        for (const m of modes) {
            db.insert(gameModes).values({ gameId: id, name: m }).run();
        }
    }
    if (Array.isArray(maps)) {
        db.delete(gameMaps).where(eq(gameMaps.gameId, id)).run();
        for (const m of maps) {
            const mapName = typeof m === "string" ? m : m.name;
            const mapImage = typeof m === "string" ? null : m.image || null;
            db.insert(gameMaps).values({ gameId: id, name: mapName, image: mapImage }).run();
        }
    }

    auditLog({ userId: req.userId ?? undefined, action: "game.update", targetType: "game", targetId: id, details: { name: name ?? game.name }, ipAddress: req.ip });
    res.json({ ok: true });
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId || !isAdmin(req.userId)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const id = Number(req.params.id);
    const game = db.select().from(games).where(eq(games.id, id)).get();
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    db.delete(games).where(eq(games.id, id)).run();
    auditLog({ userId: req.userId ?? undefined, action: "game.delete", targetType: "game", targetId: id, details: { name: game.name }, ipAddress: req.ip });
    res.json({ ok: true });
});

export default router;
