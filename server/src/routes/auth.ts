import { Router, Request, Response } from "express";
import { register, login, getProfile, changeEmail, keyLogin } from "../auth";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
    try {
        const { email, password, username, displayName } = req.body;
        const result = await register(email, password, username, displayName);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await login(email, password);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

router.post("/key-login", async (req: Request, res: Response) => {
    try {
        const { key } = req.body;
        if (!key || typeof key !== "string") {
            res.status(400).json({ error: "Введите ключ" });
            return;
        }
        const result = await keyLogin(key);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const profile = getProfile(req.userId!);
        if (!profile) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(profile);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/change-email", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { newEmail } = req.body;
        if (!newEmail || typeof newEmail !== "string" || !newEmail.includes("@")) {
            res.status(400).json({ error: "Некорректный email" });
            return;
        }
        changeEmail(req.userId!, newEmail);
        res.json({ ok: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
