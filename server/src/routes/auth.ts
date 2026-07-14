import { Router, Request, Response } from "express";
import { register, login } from "../auth";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        const result = await register(email, password, name);
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

export default router;
