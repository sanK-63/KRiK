import { Router, Request, Response } from "express";
import { register, login, getProfile, changeEmail, keyLogin } from "../auth";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { getIO } from "../socket";
import { auditLog } from "../core/audit";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, keyLoginSchema, changeEmailSchema } from "../middleware/schemas";

const router = Router();

router.post("/register", rateLimit, validate(registerSchema), async (req: Request, res: Response) => {
    try {
        const { email, password, username, displayName } = req.body;
        const result = await register(email, password, username, displayName);
        res.cookie("token", result.token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        });
        auditLog({ userId: result.user.id, action: "auth.register.success", details: { username }, ipAddress: req.ip });
        res.status(201).json(result);
    } catch (error: any) {
        auditLog({ action: "auth.register.failed", details: { email: req.body?.email, error: error.message }, ipAddress: req.ip });
        res.status(400).json({ error: error.message });
    }
});

router.post("/login", rateLimit, validate(loginSchema), async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await login(email, password);
        res.cookie("token", result.token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        });
        auditLog({ userId: result.user.id, action: "auth.login.success", details: { email }, ipAddress: req.ip });
        res.json(result);
    } catch (error: any) {
        auditLog({ action: "auth.login.failed", details: { email: req.body?.email, error: error.message }, ipAddress: req.ip });
        res.status(401).json({ error: error.message });
    }
});

router.post("/key-login", rateLimit, validate(keyLoginSchema), async (req: Request, res: Response) => {
    try {
        const { key } = req.body;
        if (!key || typeof key !== "string") {
            res.status(400).json({ error: "Введите ключ" });
            return;
        }
        const result = await keyLogin(key);
        try { getIO().emit("user:online", { userId: result.user.id, username: result.user.username, displayName: result.user.displayName }); } catch {}
        res.cookie("token", result.token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        });
        auditLog({ userId: result.user.id, action: "auth.key_login.success", ipAddress: req.ip });
        res.json(result);
    } catch (error: any) {
        auditLog({ action: "auth.key_login.failed", details: { keyPrefix: (req.body?.key || "").substring(0, 8) + "..." }, ipAddress: req.ip });
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

router.post("/change-email", authMiddleware, validate(changeEmailSchema), async (req: AuthRequest, res: Response) => {
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

router.post("/logout", (_req: Request, res: Response) => {
    res.clearCookie("token", { path: "/" });
    res.json({ ok: true });
});

export default router;
