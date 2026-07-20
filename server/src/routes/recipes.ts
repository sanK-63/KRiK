import { Router, Response } from "express";
import { db } from "../database";
import { recipes, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getIO } from "../socket";
import { auditLog } from "../core/audit";

const router = Router();

const isAdmin = (userId: number): boolean => {
    const user = db.select().from(users).where(eq(users.id, userId)).get() as any;
    return user?.username === "tunev";
};

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

    auditLog({ userId: req.userId ?? undefined, action: "recipe.create", targetType: "recipe", targetId: result.id, details: { name }, ipAddress: req.ip });
    res.json(result);
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const recipe = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!recipe) {
        res.status(404).json({ error: "Рецепт не найден" });
        return;
    }
    if (recipe.authorId !== req.userId && !isAdmin(req.userId!)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    db.delete(recipes).where(eq(recipes.id, id)).run();

    try { getIO().emit("recipe:deleted", { id }); } catch {}

    auditLog({ userId: req.userId ?? undefined, action: "recipe.delete", targetType: "recipe", targetId: id, details: { name: recipe.name }, ipAddress: req.ip });
    res.json({ ok: true });
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const recipe = db.select().from(recipes).where(eq(recipes.id, id)).get();
    if (!recipe) {
        res.status(404).json({ error: "Рецепт не найден" });
        return;
    }
    if (recipe.authorId !== req.userId && !isAdmin(req.userId!)) {
        res.status(403).json({ error: "Forbidden" });
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

    auditLog({ userId: req.userId ?? undefined, action: "recipe.update", targetType: "recipe", targetId: id, details: { name: name ?? recipe.name }, ipAddress: req.ip });
    res.json(enrichRecipe(updated));
});

export default router;
