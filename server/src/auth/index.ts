import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../database";
import { users, userRoles, roles, profiles } from "../database/schema";
import { eq } from "drizzle-orm";
import { config } from "../config";
import { v4 as uuid } from "uuid";

export function hashKeyLookup(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
}

export async function keyLogin(key: string) {
    const lookup = hashKeyLookup(key);
    const user = db.select().from(users).where(eq(users.keyLookup, lookup)).get();
    if (!user) {
        throw new Error("Неверный ключ");
    }

    const valid = await bcrypt.compare(key, user.accessKeyHash || "");
    if (!valid) {
        throw new Error("Неверный ключ");
    }

    db.update(users).set({ lastLogin: new Date().toISOString() }).where(eq(users.id, user.id)).run();

    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);

    return { user: { id: user.id, uuid: user.uuid, username: user.username, displayName: user.displayName }, token };
}

export async function register(email: string, password: string, username: string, displayName?: string) {
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
        throw new Error("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db
        .insert(users)
        .values({ uuid: uuid(), email, username, displayName, accessKeyHash: hashedPassword })
        .returning()
        .get();

    const token = jwt.sign({ id: result.id, role: "user" }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);

    return {
        user: { id: result.id, uuid: result.uuid, email: result.email, username: result.username, displayName: result.displayName },
        token,
    };
}

export async function login(email: string, password: string) {
    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
        throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.accessKeyHash || "");
    if (!valid) {
        throw new Error("Invalid credentials");
    }

    // Update last login
    db.update(users).set({ lastLogin: new Date().toISOString() }).where(eq(users.id, user.id)).run();

    const token = jwt.sign({ id: user.id, role: "user" }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);

    return {
        user: { id: user.id, uuid: user.uuid, email: user.email, username: user.username, displayName: user.displayName },
        token,
    };
}

export function getProfile(userId: number) {
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return null;

    const userRolesList = db
        .select({ roleId: userRoles.roleId, name: roles.name, color: roles.color, priority: roles.priority })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId))
        .all();

    const profile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();

    return {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        displayName: user.displayName,
        surname: user.surname,
        patronymic: user.patronymic,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        roles: userRolesList,
        profile: profile || null,
    };
}

export function changeEmail(userId: number, newEmail: string) {
    const existing = db.select().from(users).where(eq(users.email, newEmail)).get();
    if (existing) {
        throw new Error("Эта почта уже занята");
    }
    db.update(users).set({ email: newEmail }).where(eq(users.id, userId)).run();
}
