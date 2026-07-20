import { Request, Response, NextFunction } from "express";

const attempts: Map<string, { count: number; resetAt: number }> = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function rateLimit(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const record = attempts.get(ip);

    if (record && now > record.resetAt) {
        attempts.delete(ip);
    }

    const current = attempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

    if (current.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((current.resetAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.` });
        return;
    }

    current.count++;
    attempts.set(ip, current);
    next();
}
