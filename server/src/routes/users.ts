import { Router, Response } from "express";
import { db } from "../database";
import { users, userRoles, roles, profiles } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const now = Date.now();
    const allUsers = db.select().from(users).all();

    const result = allUsers.map((u) => {
        const userRolesList = db
            .select({ roleId: userRoles.roleId, name: roles.name, color: roles.color })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, u.id))
            .all();

        const profile = db.select().from(profiles).where(eq(profiles.userId, u.id)).get();

        const lastActiveMs = u.lastActive ? new Date(u.lastActive).getTime() : 0;
        const isOnline = lastActiveMs > 0 && now - lastActiveMs < ONLINE_THRESHOLD_MS;

        return {
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            surname: u.surname,
            patronymic: u.patronymic,
            avatar: u.avatar,
            email: u.email,
            phone: u.phone,
            dateOfBirth: u.dateOfBirth,
            status: u.status,
            createdAt: u.createdAt,
            lastActive: u.lastActive,
            isOnline,
            roles: userRolesList,
            profile: profile || null,
        };
    });

    res.json(result);
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const u = db.select().from(users).where(eq(users.id, id)).get();
    if (!u) {
        res.status(404).json({ error: "User not found" });
        return;
    }

    const userRolesList = db
        .select({ roleId: userRoles.roleId, name: roles.name, color: roles.color })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, id))
        .all();

    const profile = db.select().from(profiles).where(eq(profiles.userId, id)).get();

    const now = Date.now();
    const lastActiveMs = u.lastActive ? new Date(u.lastActive).getTime() : 0;
    const isOnline = lastActiveMs > 0 && now - lastActiveMs < ONLINE_THRESHOLD_MS;

    res.json({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        surname: u.surname,
        patronymic: u.patronymic,
        avatar: u.avatar,
        email: u.email,
        phone: u.phone,
        dateOfBirth: u.dateOfBirth,
        status: u.status,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        isOnline,
        roles: userRolesList,
        profile: profile || null,
    });
});

export default router;
