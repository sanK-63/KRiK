import { Router, Response } from "express";
import { db } from "../database";
import { tournamentTemplates, games, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

const isAdmin = (userId: number): boolean => {
    const user = db.select().from(users).where(eq(users.id, userId)).get() as any;
    return user?.username === "tunev";
};

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const all = db.select().from(tournamentTemplates).all();
    const result = all.map((t) => {
        const game = db.select().from(games).where(eq(games.id, t.gameId)).get();
        let config: Record<string, unknown> = {};
        try { config = JSON.parse(t.configJson || "{}"); } catch {}
        return { ...t, gameName: game?.name || null, config };
    });
    res.json(result);
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const t = db.select().from(tournamentTemplates).where(eq(tournamentTemplates.id, id)).get();
    if (!t) {
        res.status(404).json({ error: "Template not found" });
        return;
    }
    const game = db.select().from(games).where(eq(games.id, t.gameId)).get();
    let config: Record<string, unknown> = {};
    try { config = JSON.parse(t.configJson || "{}"); } catch {}
    res.json({ ...t, gameName: game?.name || null, config });
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    const { gameId, name, description, config } = req.body;

    if (!gameId || !name) {
        res.status(400).json({ error: "gameId and name are required" });
        return;
    }

    const game = db.select().from(games).where(eq(games.id, gameId)).get();
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }

    const configJson = config ? JSON.stringify(config) : null;
    const template = db.insert(tournamentTemplates).values({ gameId, name, description: description || null, configJson }).returning().get();
    res.status(201).json({ id: template.id, name: template.name, gameId: template.gameId });
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const t = db.select().from(tournamentTemplates).where(eq(tournamentTemplates.id, id)).get();
    if (!t) {
        res.status(404).json({ error: "Template not found" });
        return;
    }
    if (!req.userId || !isAdmin(req.userId)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    const { gameId, name, description, config } = req.body;
    db.update(tournamentTemplates)
        .set({
            ...(gameId !== undefined && { gameId }),
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(config !== undefined && { configJson: JSON.stringify(config) }),
        })
        .where(eq(tournamentTemplates.id, id))
        .run();

    res.json({ ok: true });
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const t = db.select().from(tournamentTemplates).where(eq(tournamentTemplates.id, id)).get();
    if (!t) {
        res.status(404).json({ error: "Template not found" });
        return;
    }
    if (!req.userId || !isAdmin(req.userId)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    db.delete(tournamentTemplates).where(eq(tournamentTemplates.id, id)).run();
    res.json({ ok: true });
});

export default router;
