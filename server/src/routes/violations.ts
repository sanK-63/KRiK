import { Router, Response } from "express";
import { db } from "../database";
import { sqlite } from "../database";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { broadcast } from "../socket";

const router = Router();

interface Violation {
    id: number;
    userId: number;
    reporterId: number;
    title: string;
    description: string;
    severity: string;
    status: string;
    constitutionArticle: string | null;
    createdAt: string;
    resolvedAt: string | null;
    resolvedBy: number | null;
}

// ─── GET all violations ──────────────────────────
router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const rows = sqlite.prepare(`
        SELECT v.*,
            u.username as user_username, u.display_name as user_display_name, u.surname as user_surname, u.avatar as user_avatar,
            r.username as reporter_username, r.display_name as reporter_display_name, r.surname as reporter_surname
        FROM violations v
        LEFT JOIN users u ON v.user_id = u.id
        LEFT JOIN users r ON v.reporter_id = r.id
        ORDER BY v.created_at DESC
    `).all() as any[];

    const result: any[] = rows.map((v) => ({
        id: v.id,
        userId: v.user_id,
        reporterId: v.reporter_id,
        title: v.title,
        description: v.description,
        severity: v.severity,
        status: v.status,
        constitutionArticle: v.constitution_article,
        createdAt: v.created_at,
        resolvedAt: v.resolved_at,
        resolvedBy: v.resolved_by,
        user: {
            id: v.user_id,
            username: v.user_username,
            displayName: v.user_display_name,
            surname: v.user_surname,
            avatar: v.user_avatar,
        },
        reporter: {
            id: v.reporter_id,
            username: v.reporter_username,
            displayName: v.reporter_display_name,
            surname: v.reporter_surname,
        },
    }));

    res.json(result);
});

// ─── GET single violation ────────────────────────
router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const v = sqlite.prepare(`
        SELECT v.*,
            u.username as user_username, u.display_name as user_display_name, u.surname as user_surname, u.avatar as user_avatar,
            r.username as reporter_username, r.display_name as reporter_display_name, r.surname as reporter_surname
        FROM violations v
        LEFT JOIN users u ON v.user_id = u.id
        LEFT JOIN users r ON v.reporter_id = r.id
        WHERE v.id = ?
    `).get(id) as any;

    if (!v) return res.status(404).json({ error: "Violation not found" });

    res.json({
        id: v.id,
        userId: v.user_id,
        reporterId: v.reporter_id,
        title: v.title,
        description: v.description,
        severity: v.severity,
        status: v.status,
        constitutionArticle: v.constitution_article,
        createdAt: v.created_at,
        resolvedAt: v.resolved_at,
        resolvedBy: v.resolved_by,
        user: { id: v.user_id, username: v.user_username, displayName: v.user_display_name, surname: v.user_surname, avatar: v.user_avatar },
        reporter: { id: v.reporter_id, username: v.reporter_username, displayName: v.reporter_display_name, surname: v.reporter_surname },
    });
});

// ─── POST create violation ───────────────────────
router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { userId, title, description, severity, constitutionArticle } = req.body;

    if (!userId || !title) {
        return res.status(400).json({ error: "userId and title are required" });
    }

    const validSeverities = ["warning", "moderation", "ban"];
    const sev = validSeverities.includes(severity) ? severity : "warning";

    const result = sqlite.prepare(`
        INSERT INTO violations (user_id, reporter_id, title, description, severity, status, constitution_article, created_at)
        VALUES (?, ?, ?, ?, ?, 'open', ?, datetime('now'))
    `).run(userId, req.userId, title, description || "", sev, constitutionArticle || null);

    const created = sqlite.prepare(`
        SELECT v.*,
            u.username as user_username, u.display_name as user_display_name, u.surname as user_surname, u.avatar as user_avatar,
            r.username as reporter_username, r.display_name as reporter_display_name, r.surname as reporter_surname
        FROM violations v
        LEFT JOIN users u ON v.user_id = u.id
        LEFT JOIN users r ON v.reporter_id = r.id
        WHERE v.id = ?
    `).get(result.lastInsertRowid) as any;

    const violation = {
        id: created.id,
        userId: created.user_id,
        reporterId: created.reporter_id,
        title: created.title,
        description: created.description,
        severity: created.severity,
        status: created.status,
        constitutionArticle: created.constitution_article,
        createdAt: created.created_at,
        resolvedAt: null,
        resolvedBy: null,
        user: { id: created.user_id, username: created.user_username, displayName: created.user_display_name, surname: created.user_surname, avatar: created.user_avatar },
        reporter: { id: created.reporter_id, username: created.reporter_username, displayName: created.reporter_display_name, surname: created.reporter_surname },
    };

    broadcast("violation:created", violation);
    res.json(violation);
});

// ─── PUT update violation ────────────────────────
router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const id = Number(req.params.id);
    const { title, description, severity, constitutionArticle } = req.body;

    const existing = sqlite.prepare("SELECT * FROM violations WHERE id = ?").get(id) as any;
    if (!existing) return res.status(404).json({ error: "Violation not found" });

    sqlite.prepare(`
        UPDATE violations SET
            title = ?,
            description = ?,
            severity = ?,
            constitution_article = ?
        WHERE id = ?
    `).run(
        title ?? existing.title,
        description ?? existing.description,
        severity ?? existing.severity,
        constitutionArticle !== undefined ? constitutionArticle : existing.constitution_article,
        id
    );

    broadcast("violation:updated", { id });
    res.json({ ok: true });
});

// ─── PUT resolve violation ───────────────────────
router.put("/:id/resolve", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const id = Number(req.params.id);
    const existing = sqlite.prepare("SELECT * FROM violations WHERE id = ?").get(id) as any;
    if (!existing) return res.status(404).json({ error: "Violation not found" });

    sqlite.prepare(`
        UPDATE violations SET status = 'resolved', resolved_at = datetime('now'), resolved_by = ? WHERE id = ?
    `).run(req.userId, id);

    broadcast("violation:resolved", { id, resolvedBy: req.userId });
    res.json({ ok: true, status: "resolved" });
});

// ─── PUT dismiss violation ───────────────────────
router.put("/:id/dismiss", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const id = Number(req.params.id);
    const existing = sqlite.prepare("SELECT * FROM violations WHERE id = ?").get(id) as any;
    if (!existing) return res.status(404).json({ error: "Violation not found" });

    sqlite.prepare(`
        UPDATE violations SET status = 'dismissed', resolved_at = datetime('now'), resolved_by = ? WHERE id = ?
    `).run(req.userId, id);

    broadcast("violation:dismissed", { id, resolvedBy: req.userId });
    res.json({ ok: true, status: "dismissed" });
});

// ─── DELETE violation ────────────────────────────
router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const admin = sqlite.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    if (!admin || admin.username !== "tunev") return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    const existing = sqlite.prepare("SELECT * FROM violations WHERE id = ?").get(id) as any;
    if (!existing) return res.status(404).json({ error: "Violation not found" });

    sqlite.prepare("DELETE FROM violations WHERE id = ?").run(id);

    broadcast("violation:deleted", { id });
    res.json({ ok: true });
});

export default router;
