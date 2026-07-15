import { Router, Response } from "express";
import { db } from "../database";
import { movies, movieComments, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getIO } from "../socket";

const router = Router();

function enrichMovie(m: any) {
    const author = db.select().from(users).where(eq(users.id, m.addedBy || 0)).get();
    return {
        ...m,
        addedBy: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null,
    };
}

function enrichComment(c: any) {
    const author = db.select().from(users).where(eq(users.id, c.userId)).get();
    return {
        id: c.id,
        content: c.content,
        rating: c.rating,
        createdAt: c.createdAt,
        user: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null,
    };
}

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const all = db.select().from(movies).all();
    res.json(all.map(enrichMovie));
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const movie = db.select().from(movies).where(eq(movies.id, id)).get();
    if (!movie) {
        res.status(404).json({ error: "Фильм не найден" });
        return;
    }
    res.json(enrichMovie(movie));
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { title, year, genre, rating, description, poster } = req.body;
    if (!title || typeof title !== "string") {
        res.status(400).json({ error: "Название обязательно" });
        return;
    }
    const result = db.insert(movies).values({
        title,
        year: year || null,
        genre: genre || "Боевик",
        rating: rating || null,
        description: description || null,
        poster: poster || null,
        addedBy: req.userId,
    }).returning().get();

    try { getIO().emit("movie:created", enrichMovie(result)); } catch {}

    res.json(result);
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const id = Number(req.params.id);
    const movie = db.select().from(movies).where(eq(movies.id, id)).get();
    if (!movie) {
        res.status(404).json({ error: "Фильм не найден" });
        return;
    }
    if (movie.addedBy !== req.userId) {
        res.status(403).json({ error: "Нет прав на редактирование" });
        return;
    }
    const { title, year, genre, rating, description, poster } = req.body;
    db.update(movies).set({
        title: title ?? movie.title,
        year: year !== undefined ? year : movie.year,
        genre: genre ?? movie.genre,
        rating: rating !== undefined ? rating : movie.rating,
        description: description !== undefined ? description : movie.description,
        poster: poster !== undefined ? poster : movie.poster,
    }).where(eq(movies.id, id)).run();
    const updated = db.select().from(movies).where(eq(movies.id, id)).get();

    try { getIO().emit("movie:updated", enrichMovie(updated)); } catch {}

    res.json(enrichMovie(updated));
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const movie = db.select().from(movies).where(eq(movies.id, id)).get();
    if (!movie) {
        res.status(404).json({ error: "Фильм не найден" });
        return;
    }
    db.delete(movies).where(eq(movies.id, id)).run();

    try { getIO().emit("movie:deleted", { id }); } catch {}

    res.json({ ok: true });
});

// ── Комментарии ──

router.get("/:id/comments", authMiddleware, (req: AuthRequest, res: Response) => {
    const movieId = Number(req.params.id);
    const comments = db.select().from(movieComments).where(eq(movieComments.movieId, movieId)).all();
    res.json(comments.map(enrichComment));
});

router.post("/:id/comments", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const movieId = Number(req.params.id);
    const { content, rating } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
        res.status(400).json({ error: "Комментарий обязателен" });
        return;
    }
    const result = db.insert(movieComments).values({
        movieId,
        userId: req.userId,
        content: content.trim(),
        rating: rating || null,
    }).returning().get();

    const enriched = enrichComment(result);

    try { getIO().emit("movie_comment:created", { movieId, comment: enriched }); } catch {}

    res.json(enriched);
});

router.delete("/:movieId/comments/:commentId", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const commentId = Number(req.params.commentId);
    const movieId = Number(req.params.movieId);
    const comment = db.select().from(movieComments).where(eq(movieComments.id, commentId)).get();
    if (!comment) {
        res.status(404).json({ error: "Комментарий не найден" });
        return;
    }
    if (comment.userId !== req.userId) {
        res.status(403).json({ error: "Нет прав на удаление" });
        return;
    }
    db.delete(movieComments).where(eq(movieComments.id, commentId)).run();

    try { getIO().emit("movie_comment:deleted", { movieId, commentId }); } catch {}

    res.json({ ok: true });
});

export default router;
