import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
    port: Number(process.env.PORT) || 5000,
    databaseUrl: process.env.DATABASE_URL || "./data/corporate-portal.db",
    jwtSecret: process.env.JWT_SECRET || "fallback-secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};
