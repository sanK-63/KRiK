import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { db } from "../database";
import { users } from "../database/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
    userId?: number;
    userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    let token: string | null = null;

    // 1. Try cookie first
    const cookies = (req as any).cookies;
    if (cookies && cookies.token) {
        token = cookies.token;
    }

    // 2. Fallback to Authorization header
    if (!token) {
        const header = req.headers.authorization;
        if (header && header.startsWith("Bearer ")) {
            token = header.split(" ")[1];
        }
    }

    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret) as { id: number };
        req.userId = decoded.id;

        // Check if user is still active
        const user = db.select().from(users).where(eq(users.id, decoded.id)).get();
        if (!user || user.status !== "active") {
            res.status(401).json({ error: "Account disabled" });
            return;
        }

        db.update(users)
            .set({ lastActive: new Date().toISOString() })
            .where(eq(users.id, decoded.id))
            .run();

        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}
