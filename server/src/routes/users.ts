import { Router, Response } from "express";
import { db } from "../database";
import { sqlite } from "../database";
import { users, userRoles, roles, profiles } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { broadcast } from "../socket";

const router = Router();

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

// ─── GET all users ───────────────────────────────
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

// ─── GET all roles (must be before /:id) ─────────
router.get("/roles/all", authMiddleware, (_req: AuthRequest, res: Response) => {
    const allRoles = db.select().from(roles).all();
    res.json(allRoles);
});

// ─── GET single user ─────────────────────────────
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

// ─── PUT update user profile fields ──────────────
router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const admin = sqlite.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    if (!admin || admin.username !== "tunev") return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    const { displayName, surname, patronymic, email, phone } = req.body;

    const existing = db.select().from(users).where(eq(users.id, id)).get();
    if (!existing) return res.status(404).json({ error: "User not found" });

    db.update(users)
        .set({
            displayName: displayName ?? existing.displayName,
            surname: surname ?? existing.surname,
            patronymic: patronymic ?? existing.patronymic,
            email: email ?? existing.email,
            phone: phone ?? existing.phone,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, id))
        .run();

    res.json({ ok: true });
});

// ─── PUT assign roles ────────────────────────────
router.put("/:id/roles", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const admin = sqlite.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    if (!admin || admin.username !== "tunev") return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    const { roleIds } = req.body as { roleIds: number[] };

    if (!Array.isArray(roleIds)) return res.status(400).json({ error: "roleIds must be an array" });

    const existing = db.select().from(users).where(eq(users.id, id)).get();
    if (!existing) return res.status(404).json({ error: "User not found" });

    // Remove all current roles
    db.delete(userRoles).where(eq(userRoles.userId, id)).run();

    // Insert new roles
    for (const roleId of roleIds) {
        db.insert(userRoles).values({ userId: id, roleId }).run();
    }

    // Fetch updated roles
    const updatedRoles = db
        .select({ roleId: userRoles.roleId, name: roles.name, color: roles.color })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, id))
        .all();

    broadcast("user:role_changed", { userId: id, roles: updatedRoles });

    res.json({ ok: true, roles: updatedRoles });
});

// ─── PUT ban/unban user ─────────────────────────
router.put("/:id/status", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    const admin = sqlite.prepare("SELECT username FROM users WHERE id = ?").get(req.userId) as any;
    if (!admin || admin.username !== "tunev") return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    const { status } = req.body as { status: string };

    if (!["active", "banned"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'active' or 'banned'" });
    }

    const existing = db.select().from(users).where(eq(users.id, id)).get();
    if (!existing) return res.status(404).json({ error: "User not found" });

    db.update(users)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(eq(users.id, id))
        .run();

    broadcast("user:banned", { userId: id, status });

    res.json({ ok: true, status });
});

export default router;
