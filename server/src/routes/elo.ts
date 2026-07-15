import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getLeaderboard, getUserElo, getEloHistory, recalculateAll } from "../services/elo";
import { db } from "../database";
import { userRoles, roles } from "../database/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/leaderboard", authMiddleware, (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = getLeaderboard({ page, limit });
    res.json(result);
});

router.get("/user/:userId", authMiddleware, (req: AuthRequest, res: Response) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
        res.status(400).json({ error: "Invalid userId" });
        return;
    }
    const result = getUserElo(userId);
    res.json(result);
});

router.get("/history/:userId", authMiddleware, (req: AuthRequest, res: Response) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
        res.status(400).json({ error: "Invalid userId" });
        return;
    }
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const result = getEloHistory(userId, limit);
    res.json(result);
});

router.post("/recalculate", authMiddleware, (req: AuthRequest, res: Response) => {
    const userPerms = db
        .select({ name: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, req.userId!))
        .all();

    const isAdmin = userPerms.some((r) => r.name === "Administrator");
    if (!isAdmin) {
        res.status(403).json({ error: "Only administrators can recalculate ELO" });
        return;
    }

    const result = recalculateAll();
    res.json({ message: "ELO recalculated successfully", ...result });
});

export default router;
