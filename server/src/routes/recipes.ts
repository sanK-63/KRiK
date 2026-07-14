import { Router, Response } from "express";
import { db } from "../database";
import { recipes, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const all = db.select().from(recipes).all();
    const result = all.map((r) => {
        const author = db.select().from(users).where(eq(users.id, r.authorId || 0)).get();
        return {
            ...r,
            author: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null,
        };
    });
    res.json(result);
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const recipe = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!recipe) {
        res.status(404).json({ error: "Рецепт не найден" });
        return;
    }
    const author = db.select().from(users).where(eq(users.id, recipe.authorId || 0)).get();
    res.json({
        ...recipe,
        author: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null,
    });
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { name, description, ingredients, instructions, category, image } = req.body;
    if (!name || !ingredients || !instructions) {
        res.status(400).json({ error: "Название, ингредиенты и приготовление обязательны" });
        return;
    }
    const result = db.insert(recipes).values({
        name,
        description: description || null,
        ingredients,
        instructions,
        category: category || "Блюдо",
        authorId: req.userId,
        image: image || null,
    }).returning().get();
    res.json(result);
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const recipe = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!recipe) {
        res.status(404).json({ error: "Рецепт не найден" });
        return;
    }
    db.delete(recipes).where(eq(recipes.id, id)).run();
    res.json({ ok: true });
});

export default router;
