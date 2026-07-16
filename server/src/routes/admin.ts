import { Router, Response } from "express";
import { sqlite } from "../database";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/stats", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const admin = sqlite.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    if (!admin || admin.username !== "tunev") return res.status(403).json({ error: "Forbidden" });

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

    const recentUsers = sqlite.prepare("SELECT id, username, display_name, email, created_at, last_active FROM users ORDER BY created_at DESC LIMIT 5").all();
    const recentForumPosts = sqlite.prepare("SELECT id, title, category, created_at FROM forum_posts ORDER BY created_at DESC LIMIT 5").all();
    const recentEvents = sqlite.prepare("SELECT id, title, date, category FROM events ORDER BY created_at DESC LIMIT 5").all();

    const dbSize = (sqlite.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as any)?.size || 0;

    res.json({
        counts: { users, roles, forumPosts, forumComments, events, movies, movieComments, memes, memeComments, tournaments, matches, recipes, notifications, games },
        recent: { users: recentUsers, forumPosts: recentForumPosts, events: recentEvents },
        dbSize: Math.round(dbSize / 1024),
    });
});

export default router;
