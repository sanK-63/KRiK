import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function requireEnv(name: string): string {
    const val = process.env[name];
    if (!val) {
        throw new Error(`Missing required env variable: ${name}`);
    }
    return val;
}

export const config = {
    port: Number(process.env.PORT) || 5000,
    databaseUrl: process.env.DATABASE_URL || "./data/corporate-portal.db",
    jwtSecret: requireEnv("JWT_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    apiUrl: process.env.API_URL || "http://localhost:5000",
};
