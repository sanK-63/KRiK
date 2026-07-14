import { sqlite } from "./index";

export function migrate() {
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const bcrypt = require("bcryptjs");
    const admin = sqlite.prepare("SELECT id FROM users WHERE email = ?").get("admin@admin.com") as any;
    if (!admin) {
        const hash = bcrypt.hashSync("admin", 10);
        sqlite.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run("admin@admin.com", hash, "Александр", "Lord-Generalissimo");
        console.log("Admin user created: admin@admin.com / admin");
    }

    console.log("Database migrated successfully");
}
