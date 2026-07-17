import { Router, Response } from "express";
import { sqlite } from "../database";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

function isAdmin(sqlite: any, userId: number): boolean {
    const admin = sqlite.prepare("SELECT username FROM users WHERE id = ?").get(userId) as any;
    return admin && admin.username === "tunev";
}

router.get("/stats", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    if (!isAdmin(sqlite, req.userId)) return res.status(403).json({ error: "Forbidden" });

    const count = (table: string) => (sqlite.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as any).c;

    const users = count("users");
    const roles = count("user_roles");
    const forumPosts = count("forum_posts");
    const forumComments = count("forum_comments");
    const events = count("events");
    const movies = count("movies");
    const movieComments = count("movie_comments");
    const memes = count("memes");
    const memeComments = count("meme_comments");
    const tournaments = count("tournaments");
    const matches = count("matches");
    const recipes = count("recipes");
    const notifications = count("notifications");
    const games = count("games");
    const softwareItems = count("software_items");
    const libraryDocs = count("library_documents");

    const recentUsers = sqlite.prepare("SELECT id, username, display_name, email, created_at, last_active FROM users ORDER BY created_at DESC LIMIT 5").all();
    const recentForumPosts = sqlite.prepare("SELECT id, title, category, created_at FROM forum_posts ORDER BY created_at DESC LIMIT 5").all();
    const recentEvents = sqlite.prepare("SELECT id, title, date, category FROM events ORDER BY created_at DESC LIMIT 5").all();

    const dbSize = (sqlite.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as any)?.size || 0;

    res.json({
        counts: { users, roles, forumPosts, forumComments, events, movies, movieComments, memes, memeComments, tournaments, matches, recipes, notifications, games, softwareItems, libraryDocs },
        recent: { users: recentUsers, forumPosts: recentForumPosts, events: recentEvents },
        dbSize: Math.round(dbSize / 1024),
    });
});

router.get("/users", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    if (!isAdmin(sqlite, req.userId)) return res.status(403).json({ error: "Forbidden" });
    const users = sqlite.prepare("SELECT id, username, display_name, surname, patronymic, email, status, phone, avatar, created_at, last_active FROM users ORDER BY id").all();
    const roles = sqlite.prepare("SELECT user_id, role_id FROM user_roles").all() as any[];
    const roleMap: Record<number, number[]> = {};
    roles.forEach((r: any) => { if (!roleMap[r.user_id]) roleMap[r.user_id] = []; roleMap[r.user_id].push(r.role_id); });
    res.json(users.map((u: any) => ({ ...u, roleIds: roleMap[u.id] || [] })));
});

router.put("/users/:id/status", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    if (!isAdmin(sqlite, req.userId)) return res.status(403).json({ error: "Forbidden" });
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!["active", "banned", "deleted"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    sqlite.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    res.json({ ok: true });
});

router.delete("/users/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    if (!isAdmin(sqlite, req.userId)) return res.status(403).json({ error: "Forbidden" });
    const id = Number(req.params.id);
    if (id === req.userId) return res.status(400).json({ error: "Cannot delete yourself" });
    sqlite.prepare("DELETE FROM user_roles WHERE user_id = ?").run(id);
    sqlite.prepare("DELETE FROM users WHERE id = ?").run(id);
    res.json({ ok: true });
});

router.get("/roles", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    if (!isAdmin(sqlite, req.userId)) return res.status(403).json({ error: "Forbidden" });
    const roles = sqlite.prepare("SELECT * FROM roles ORDER BY id").all();
    res.json(roles);
});

router.post("/users/:id/roles", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    if (!isAdmin(sqlite, req.userId)) return res.status(403).json({ error: "Forbidden" });
    const userId = Number(req.params.id);
    const { roleId } = req.body;
    if (!roleId) return res.status(400).json({ error: "roleId required" });
    const existing = sqlite.prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?").get(userId, roleId);
    if (!existing) {
        sqlite.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(userId, roleId);
    }
    res.json({ ok: true });
});

router.delete("/users/:id/roles/:roleId", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    if (!isAdmin(sqlite, req.userId)) return res.status(403).json({ error: "Forbidden" });
    const userId = Number(req.params.id);
    const roleId = Number(req.params.roleId);
    sqlite.prepare("DELETE FROM user_roles WHERE user_id = ? AND role_id = ?").run(userId, roleId);
    res.json({ ok: true });
});

export default router;
