import { Router, Response } from "express";
import { sqlite } from "../database";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// ─── GET logs with filters + pagination ──────────
router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const admin = sqlite.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    if (!admin || admin.username !== "tunev") return res.status(403).json({ error: "Forbidden" });

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const action = (req.query.action as string || "").trim();
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const dateFrom = (req.query.dateFrom as string || "").trim();
    const dateTo = (req.query.dateTo as string || "").trim();

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (action) {
        where += " AND l.action LIKE ?";
        params.push(`%${action}%`);
    }
    if (userId) {
        where += " AND l.user_id = ?";
        params.push(userId);
    }
    if (dateFrom) {
        where += " AND l.created_at >= ?";
        params.push(dateFrom);
    }
    if (dateTo) {
        where += " AND l.created_at <= ?";
        params.push(dateTo + " 23:59:59");
    }

    const countRow = sqlite.prepare(`SELECT COUNT(*) as c FROM logs l ${where}`).get(...params) as any;
    const total = countRow.c;

    const rows = sqlite.prepare(`
        SELECT l.*, u.username, u.display_name, u.surname, u.avatar
        FROM logs l
        LEFT JOIN users u ON l.user_id = u.id
        ${where}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    res.json({
        logs: rows.map((r) => ({
            id: r.id,
            userId: r.user_id,
            username: r.username,
            userDisplayName: r.display_name,
            userSurname: r.surname,
            userAvatar: r.avatar,
            action: r.action,
            targetType: r.target_type,
            targetId: r.target_id,
            details: r.details,
            ipAddress: r.ip_address,
            createdAt: r.created_at,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    });
});

// ─── GET distinct actions (for filter dropdown) ──
router.get("/actions", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const admin = sqlite.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    if (!admin || admin.username !== "tunev") return res.status(403).json({ error: "Forbidden" });

    const rows = sqlite.prepare("SELECT DISTINCT action FROM logs ORDER BY action").all() as any[];
    res.json(rows.map((r) => r.action));
});

export default router;
