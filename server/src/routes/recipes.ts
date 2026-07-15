import { Router, Response } from "express";
import { db } from "../database";
import { recipes, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getIO } from "../socket";

const router = Router();

function enrichRecipe(r: any) {
    const author = db.select().from(users).where(eq(users.id, r.authorId || 0)).get();
    return {
        ...r,
        author: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null,
    };
}

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const all = db.select().from(recipes).all();
    res.json(all.map(enrichRecipe));
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const recipe = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!recipe) {
        res.status(404).json({ error: "Рецепт не найден" });
        return;
    }
    res.json(enrichRecipe(recipe));
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

    try { getIO().emit("recipe:created", enrichRecipe(result)); } catch {}

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

    try { getIO().emit("recipe:deleted", { id }); } catch {}

    res.json({ ok: true });
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const recipe = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!recipe) {
        res.status(404).json({ error: "Рецепт не найден" });
        return;
    }
    const { name, description, ingredients, instructions, category, image } = req.body;
    const updated = db.update(recipes).set({
        name: name ?? recipe.name,
        description: description !== undefined ? description : recipe.description,
        ingredients: ingredients ?? recipe.ingredients,
        instructions: instructions ?? recipe.instructions,
        category: category ?? recipe.category,
        image: image !== undefined ? image : recipe.image,
    }).where(eq(recipes.id, id)).returning().get();

    try { getIO().emit("recipe:updated", enrichRecipe(updated)); } catch {}

    res.json(enrichRecipe(updated));
});

export default router;
