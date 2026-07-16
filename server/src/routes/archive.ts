import { Router, Response } from "express";
import { sqlite } from "../database";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
    const tab = (req.query.tab as string) || "all";

    const result: any = {};

    if (tab === "all" || tab === "tournaments") {
        result.tournaments = sqlite.prepare(`
            SELECT t.id, t.title, t.description, t.format, t.status, t.start_date, t.end_date,
                g.name as game_name, g.logo as game_logo,
                u.username as creator_username, u.display_name as creator_display_name, u.surname as creator_surname
            FROM tournaments t
            LEFT JOIN games g ON t.game_id = g.id
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.status IN ('completed', 'cancelled')
            ORDER BY t.end_date DESC, t.start_date DESC
            LIMIT 50
        `).all().map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            format: t.format,
            status: t.status,
            startDate: t.start_date,
            endDate: t.end_date,
            gameName: t.game_name,
            gameLogo: t.game_logo,
            creator: { username: t.creator_username, displayName: t.creator_display_name, surname: t.creator_surname },
        }));
    }

    if (tab === "all" || tab === "events") {
        result.events = sqlite.prepare(`
            SELECT e.id, e.title, e.description, e.date, e.time, e.location, e.category, e.image,
                u.username as author_username, u.display_name as author_display_name, u.surname as author_surname
            FROM events e
            LEFT JOIN users u ON e.author_id = u.id
            WHERE e.date < date('now')
            ORDER BY e.date DESC
            LIMIT 50
        `).all().map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            date: e.date,
            time: e.time,
            location: e.location,
            category: e.category,
            image: e.image,
            author: { username: e.author_username, displayName: e.author_display_name, surname: e.author_surname },
        }));
    }

    if (tab === "all" || tab === "forum") {
        result.forumPosts = sqlite.prepare(`
            SELECT fp.id, fp.title, fp.content, fp.category, fp.created_at,
                u.username as author_username, u.display_name as author_display_name, u.surname as author_surname
            FROM forum_posts fp
            LEFT JOIN users u ON fp.author_id = u.id
            WHERE fp.created_at < datetime('now', '-30 days')
            ORDER BY fp.created_at DESC
            LIMIT 50
        `).all().map((p: any) => ({
            id: p.id,
            title: p.title,
            content: p.content,
            category: p.category,
            createdAt: p.created_at,
            author: { username: p.author_username, displayName: p.author_display_name, surname: p.author_surname },
        }));
    }

    res.json(result);
});

export default router;
