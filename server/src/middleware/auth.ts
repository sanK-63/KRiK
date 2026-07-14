import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthRequest extends Request {
    userId?: number;
    userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, config.jwtSecret) as { id: number; role: string };
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}
