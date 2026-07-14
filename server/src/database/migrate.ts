import { sqlite } from "./index";
import crypto from "crypto";
import fs from "fs";
import path from "path";

function sha256(str: string): string {
    return crypto.createHash("sha256").update(str).digest("hex");
}

const tables = [
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT,
        surname TEXT,
        patronymic TEXT,
        date_of_birth TEXT,
        phone TEXT,
        access_key_hash TEXT,
        key_lookup TEXT,
        avatar TEXT,
        email TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT,
        last_active TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        priority INTEGER NOT NULL DEFAULT 0,
        color TEXT,
        description TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        module TEXT NOT NULL,
        description TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        refresh_token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ip TEXT,
        user_agent TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        discord TEXT,
        steam TEXT,
        ea TEXT,
        battle_net TEXT,
        country TEXT,
        bio TEXT,
        birthday TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS avatars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT,
        cover TEXT,
        description TEXT,
        active INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS game_modes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        name TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS game_maps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        image TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS game_platforms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        platform TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        tag TEXT,
        logo TEXT,
        captain_id INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS team_members (
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS team_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tournament_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL REFERENCES games(id),
        name TEXT NOT NULL,
        description TEXT,
        config_json TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER REFERENCES tournament_templates(id),
        game_id INTEGER NOT NULL REFERENCES games(id),
        title TEXT NOT NULL,
        description TEXT,
        banner TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        format TEXT NOT NULL DEFAULT 'single_elimination',
        participant_type TEXT NOT NULL DEFAULT 'team',
        registration_open TEXT,
        registration_close TEXT,
        start_date TEXT,
        end_date TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tournament_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        markdown TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS tournament_stages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        settings_json TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        team_id INTEGER REFERENCES teams(id),
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS registration_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
        field TEXT NOT NULL,
        value TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS brackets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        stage_id INTEGER REFERENCES tournament_stages(id),
        type TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS rounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bracket_id INTEGER NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
        number INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
        team1 INTEGER REFERENCES teams(id),
        team2 INTEGER REFERENCES teams(id),
        winner INTEGER REFERENCES teams(id),
        status TEXT NOT NULL DEFAULT 'scheduled',
        scheduled_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS maps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        map_name TEXT NOT NULL,
        winner INTEGER REFERENCES teams(id),
        score TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS standings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        team_id INTEGER NOT NULL REFERENCES teams(id),
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        draws INTEGER NOT NULL DEFAULT 0,
        points INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        team_id INTEGER REFERENCES teams(id),
        matches INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS forum_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS forum_topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        author_id INTEGER NOT NULL REFERENCES users(id),
        pinned INTEGER NOT NULL DEFAULT 0,
        locked INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS forum_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS forum_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        emoji TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS forum_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS portal_forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        active INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS portal_form_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES portal_forms(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        required INTEGER NOT NULL DEFAULT 0,
        order_index INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS portal_form_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES portal_forms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS appeals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS appeal_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appeal_id INTEGER NOT NULL REFERENCES appeals(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS constitution_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        active_version INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS constitution_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL REFERENCES constitution_documents(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        markdown TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        published_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT,
        type TEXT NOT NULL DEFAULT 'info',
        read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id INTEGER,
        payload TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ip TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS doc_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        filename TEXT NOT NULL,
        placeholders TEXT NOT NULL,
        uploaded_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Блюдо',
        author_id INTEGER REFERENCES users(id),
        image TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
];

const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
    `CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid)`,
    `CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name)`,
    `CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status)`,
    `CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)`,
    `CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON registrations(tournament_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
];

export function migrate() {
    for (const table of tables) {
        sqlite.exec(table);
    }
    for (const index of indexes) {
        sqlite.exec(index);
    }

    // Seed roles
    const roleCount = sqlite.prepare("SELECT COUNT(*) as c FROM roles").get() as { c: number };
    if (roleCount.c === 0) {
        sqlite.prepare("INSERT INTO roles (name, priority, color, description) VALUES (?, ?, ?, ?)").run("Administrator", 100, "#D32F2F", "Полный доступ");
        sqlite.prepare("INSERT INTO roles (name, priority, color, description) VALUES (?, ?, ?, ?)").run("Moderator", 80, "#FFB020", "Модерация контента");
        sqlite.prepare("INSERT INTO roles (name, priority, color, description) VALUES (?, ?, ?, ?)").run("Judge", 60, "#3CB371", "Судейство турниров");
        sqlite.prepare("INSERT INTO roles (name, priority, color, description) VALUES (?, ?, ?, ?)").run("Captain", 40, "#FA6814", "Капитан команды");
        sqlite.prepare("INSERT INTO roles (name, priority, color, description) VALUES (?, ?, ?, ?)").run("User", 10, "#A5A5A5", "Базовый доступ");
    }

    // Seed permissions
    const permCount = sqlite.prepare("SELECT COUNT(*) as c FROM permissions").get() as { c: number };
    if (permCount.c === 0) {
        const perms = [
            ["users.view", "Просмотр пользователей", "users"],
            ["users.create", "Создание пользователей", "users"],
            ["users.edit", "Редактирование пользователей", "users"],
            ["users.delete", "Удаление пользователей", "users"],
            ["tournament.create", "Создание турниров", "tournament"],
            ["tournament.edit", "Редактирование турниров", "tournament"],
            ["tournament.delete", "Удаление турниров", "tournament"],
            ["forum.create", "Создание тем", "forum"],
            ["forum.delete", "Удаление тем", "forum"],
            ["constitution.edit", "Редактирование конституции", "constitution"],
            ["constitution.publish", "Публикация конституции", "constitution"],
            ["portal.appeal.view", "Просмотр обращений", "portal"],
            ["portal.appeal.answer", "Ответ на обращения", "portal"],
            ["logs.view", "Просмотр логов", "logs"],
        ];
        for (const [code, desc, mod] of perms) {
            sqlite.prepare("INSERT INTO permissions (code, module, description) VALUES (?, ?, ?)").run(code, mod, desc);
        }
    }

    // Seed users
    const userCount = sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
    if (userCount.c === 0) {
        const insertUser = sqlite.prepare(`
            INSERT INTO users (uuid, username, display_name, surname, patronymic, date_of_birth, phone, email, avatar, access_key_hash, key_lookup, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertRole = sqlite.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
        const insertProfile = sqlite.prepare("INSERT INTO profiles (user_id, discord, steam, ea, battle_net, country, bio) VALUES (?, ?, ?, ?, ?, ?, ?)");

        // 1. tunev — Administrator
        insertUser.run(
            "674ba842-f87a-46ca-bcdc-3f5905c104a9", "tunev", "Александр", "Тунев", null,
            "2005-02-01", "+7 (870) 872-24-375", "tunov@portal.local", "/avatars/tunev.jpg",
            "$2b$10$WKa45bM8B5YC77ma3y4Ti.jmr3f/c4c2uvI72sy.aS8F6W4Kp9d4m",
            sha256("uqUCyp91Md0yzAlMrGs4uB0jVwua6Sjj"), "active"
        );
        insertRole.run(1, 1);
        insertProfile.run(1, null, null, null, null, "Казахстан", null);

        // 2. cherepkov — User
        insertUser.run(
            "b1c2d3e4-f5a6-7890-abcd-ef1234567890", "cherepkov", "Константин", "Черепков", "Александрович",
            "2005-01-30", "+7 (777) 129-4-227", "kostacerepkov700@gmail.com", "/avatars/cherepkov.jpg",
            "$2b$10$e8hpgR7HerzkkImHBF.eXO0GtVEWCeugcH9MsP0uRSPevBxCpsX4i",
            sha256("9v4YDVw6BygjGNRCiczM4voRKDsoqHAA"), "active"
        );
        insertRole.run(2, 5);
        insertProfile.run(2, null, null, null, null, "Казахстан", null);

        // 3. garbuzov — User
        insertUser.run(
            "c2d3e4f5-a6b7-8901-bcde-f12345678901", "garbuzov", "Никита", "Гарбузов", null,
            "2004-10-14", "+7 (777) 492-12-01", "nikitarin054@gmail.com", "/avatars/garbuzov.jpg",
            "$2b$10$4sfnUc4dQm0U/11oE7CtjOESK85cuDU1H0WRrlKQsuFb0wSL/VUyG",
            sha256("ZqayaqfYav0qaQtzU8Cf9YfGMPpBWp9Q"), "active"
        );
        insertRole.run(3, 5);
        insertProfile.run(3, null, null, null, null, "Казахстан", null);
    }

    // Seed constitution
    const docCount = sqlite.prepare("SELECT COUNT(*) as c FROM constitution_documents").get() as { c: number };
    if (docCount.c === 0) {
        sqlite.prepare("INSERT INTO constitution_documents (title, active_version) VALUES (?, ?)").run("Конституция Конторы", 1);
        const constitutionPath = path.join(__dirname, "../constitution.md");
        const defaultMarkdown = fs.readFileSync(constitutionPath, "utf-8");
        sqlite.prepare("INSERT INTO constitution_versions (document_id, version, markdown, created_by, published_at) VALUES (?, ?, ?, ?, datetime('now'))").run(1, 1, defaultMarkdown, 1);
    }

    console.log("Database migrated successfully");
}
