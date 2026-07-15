import { Router } from "express";

const router = Router();
const TMDB_TOKEN = process.env.TMDB_API_KEY || "";
const TMDB_BASE = "https://api.themoviedb.org/3";

const tmdbHeaders = () => ({ Authorization: `Bearer ${TMDB_TOKEN}` });

router.get("/search", async (req, res) => {
    if (!TMDB_TOKEN) {
        return res.status(503).json({ error: "TMDB API key not configured" });
    }
    const q = (req.query.query as string || "").trim();
    if (!q) return res.json([]);

    try {
        const r = await fetch(
            `${TMDB_BASE}/search/movie?query=${encodeURIComponent(q)}&language=ru-RU&include_adult=false`,
            { headers: tmdbHeaders() }
        );
        if (!r.ok) return res.status(502).json({ error: "TMDB error" });
        const data = await r.json();
        const results = (data.results || []).slice(0, 8).map((m: any) => ({
            id: m.id,
            title: m.title,
            originalTitle: m.original_title,
            year: m.release_date ? parseInt(m.release_date.slice(0, 4)) : null,
            description: m.overview || "",
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
            rating: m.vote_average || 0,
            genreIds: m.genre_ids || [],
        }));
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch from TMDB" });
    }
});

router.get("/genres", async (_req, res) => {
    if (!TMDB_TOKEN) return res.json([]);
    try {
        const r = await fetch(`${TMDB_BASE}/genre/movie/list?language=ru-RU`, { headers: tmdbHeaders() });
        if (!r.ok) return res.json([]);
        const data = await r.json();
        res.json(data.genres || []);
    } catch {
        res.json([]);
    }
});

export default router;
