import { Router } from "express";
import { sqlite } from "../database";

const router = Router();

router.get("/", (req, res) => {
    const q = (req.query.q as string || "").trim();
    if (!q || q.length < 2) {
        return res.json({ results: [] });
    }

    const pattern = `%${q}%`;
    const results: { category: string; categoryColor: string; title: string; excerpt: string; link: string }[] = [];

    // Users
    try {
        const users = sqlite.prepare(`
            SELECT id, username, display_name, surname, email FROM users
            WHERE username LIKE ? OR display_name LIKE ? OR surname LIKE ? OR email LIKE ?
            LIMIT 5
        `).all(pattern, pattern, pattern, pattern) as any[];
        for (const u of users) {
            const role = sqlite.prepare(`
                SELECT r.name FROM roles r
                JOIN user_roles ur ON ur.role_id = r.id
                WHERE ur.user_id = ?
                LIMIT 1
            `).get(u.id) as any;
            results.push({
                category: "Пользователи",
                categoryColor: "#4CAF50",
                title: `${u.display_name || u.username} ${u.surname || ""}`.trim(),
                excerpt: `${role?.name || "Без роли"} · ${u.email}`,
                link: `/user/${u.id}`,
            });
        }
    } catch {}

    // Forum posts
    try {
        const posts = sqlite.prepare(`
            SELECT id, title, content FROM forum_posts
            WHERE title LIKE ? OR content LIKE ?
            LIMIT 5
        `).all(pattern, pattern) as any[];
        for (const p of posts) {
            results.push({
                category: "Форум",
                categoryColor: "#2196F3",
                title: p.title,
                excerpt: p.content.slice(0, 120) + (p.content.length > 120 ? "..." : ""),
                link: `/forum/${p.id}`,
            });
        }
    } catch {}

    // Movies
    try {
        const movies = sqlite.prepare(`
            SELECT id, title, year, genre, description FROM movies
            WHERE title LIKE ? OR description LIKE ? OR genre LIKE ?
            LIMIT 5
        `).all(pattern, pattern, pattern) as any[];
        for (const m of movies) {
            results.push({
                category: "Кинотека",
                categoryColor: "#FF9800",
                title: `${m.title} (${m.year || "?"})`,
                excerpt: `${m.genre} · ${(m.description || "").slice(0, 100)}${(m.description || "").length > 100 ? "..." : ""}`,
                link: `/cinema`,
            });
        }
    } catch {}

    // Events
    try {
        const events = sqlite.prepare(`
            SELECT id, title, description, date, category FROM events
            WHERE title LIKE ? OR description LIKE ?
            LIMIT 5
        `).all(pattern, pattern) as any[];
        for (const e of events) {
            results.push({
                category: "Ивенты",
                categoryColor: "#E91E63",
                title: e.title,
                excerpt: `${e.category} · ${e.date} · ${(e.description || "").slice(0, 80)}${(e.description || "").length > 80 ? "..." : ""}`,
                link: `/events`,
            });
        }
    } catch {}

    // Tournaments
    try {
        const tours = sqlite.prepare(`
            SELECT id, title, description, status, format FROM tournaments
            WHERE title LIKE ? OR description LIKE ?
            LIMIT 5
        `).all(pattern, pattern) as any[];
        for (const t of tours) {
            results.push({
                category: "Турниры",
                categoryColor: "#9C27B0",
                title: t.title,
                excerpt: `${t.format} · ${t.status} · ${(t.description || "").slice(0, 80)}${(t.description || "").length > 80 ? "..." : ""}`,
                link: `/tournament`,
            });
        }
    } catch {}

    // Software
    try {
        const sw = sqlite.prepare(`
            SELECT id, title, description, category FROM software_items
            WHERE title LIKE ? OR description LIKE ?
            LIMIT 5
        `).all(pattern, pattern) as any[];
        for (const s of sw) {
            results.push({
                category: "Софт",
                categoryColor: "#00BCD4",
                title: s.title,
                excerpt: `${s.category} · ${s.description.slice(0, 100)}${s.description.length > 100 ? "..." : ""}`,
                link: `/software`,
            });
        }
    } catch {}

    // Recipes
    try {
        const recipes = sqlite.prepare(`
            SELECT id, name, description, category FROM recipes
            WHERE name LIKE ? OR description LIKE ?
            LIMIT 5
        `).all(pattern, pattern) as any[];
        for (const r of recipes) {
            results.push({
                category: "Таверна",
                categoryColor: "#FF5722",
                title: r.name,
                excerpt: `${r.category} · ${(r.description || "").slice(0, 100)}${(r.description || "").length > 100 ? "..." : ""}`,
                link: `/tavern`,
            });
        }
    } catch {}

    // Memes
    try {
        const memes = sqlite.prepare(`
            SELECT id, title, category FROM memes
            WHERE title LIKE ?
            LIMIT 5
        `).all(pattern) as any[];
        for (const m of memes) {
            results.push({
                category: "Мемы",
                categoryColor: "#FFC107",
                title: m.title || "Мем без названия",
                excerpt: `Категория: ${m.category}`,
                link: `/memes`,
            });
        }
    } catch {}

    // Constitution
    try {
        const docs = sqlite.prepare(`
            SELECT id, title FROM constitution_documents WHERE title LIKE ? LIMIT 3
        `).all(pattern) as any[];
        for (const d of docs) {
            results.push({
                category: "Конституция",
                categoryColor: "#795548",
                title: d.title,
                excerpt: "Основной документ Конторы",
                link: `/constitution`,
            });
        }
    } catch {}

    res.json({ results });
});

export default router;
