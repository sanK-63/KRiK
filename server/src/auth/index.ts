import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../database";
import { users } from "../database/schema";
import { eq } from "drizzle-orm";
import { config } from "../config";

export async function register(email: string, password: string, name: string) {
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
        throw new Error("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.insert(users).values({ email, password: hashedPassword, name }).returning().get();

    const token = jwt.sign({ id: result.id, role: result.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });

    return { user: { id: result.id, email: result.email, name: result.name, role: result.role }, token };
}

export async function login(email: string, password: string) {
    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
        throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        throw new Error("Invalid credentials");
    }

    const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });

    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
}
