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
        created_by INTEGER REFERENCES users(id),
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
        score1 INTEGER,
        score2 INTEGER,
        judge_id INTEGER REFERENCES users(id),
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
    `CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        year INTEGER,
        genre TEXT NOT NULL DEFAULT 'Боевик',
        rating INTEGER,
        description TEXT,
        poster TEXT,
        added_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS movie_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        rating INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT,
        location TEXT,
        category TEXT NOT NULL DEFAULT 'general',
        image TEXT,
        author_id INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS memes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        author_id INTEGER REFERENCES users(id),
        likes INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS meme_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meme_id INTEGER NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS meme_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meme_id INTEGER NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_elo (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        elo INTEGER NOT NULL DEFAULT 1000,
        games_played INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS elo_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tournament_id INTEGER REFERENCES tournaments(id),
        match_id INTEGER REFERENCES matches(id),
        old_elo INTEGER NOT NULL,
        new_elo INTEGER NOT NULL,
        change INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS library_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        order_index INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS library_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER REFERENCES library_categories(id),
        title TEXT NOT NULL,
        description TEXT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT,
        size INTEGER,
        uploaded_by INTEGER REFERENCES users(id),
        downloads INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
];
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
    `CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid)`,
    `CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name)`,
    `CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status)`,
    `CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)`,
    `CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON registrations(tournament_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_elo_history_user_id ON elo_history(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_elo_history_tournament_id ON elo_history(tournament_id)`,
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

    // Seed games
    const gameCount = sqlite.prepare("SELECT COUNT(*) as c FROM games").get() as { c: number };
    if (gameCount.c === 0) {
        const insertGame = sqlite.prepare("INSERT INTO games (name, slug, logo, description) VALUES (?, ?, ?, ?)");
        const insertPlatform = sqlite.prepare("INSERT INTO game_platforms (game_id, platform) VALUES (?, ?)");
        const insertMode = sqlite.prepare("INSERT INTO game_modes (game_id, name) VALUES (?, ?)");
        const insertMap = sqlite.prepare("INSERT INTO game_maps (game_id, name) VALUES (?, ?)");

        const g1 = insertGame.run("Counter-Strike 2", "cs2", "CS2", "Классический тактический шутер от Valve").lastInsertRowid;
        insertPlatform.run(g1, "PC");
        insertMode.run(g1, "Competitive");
        insertMode.run(g1, "Wingman");
        insertMap.run(g1, "Dust2");
        insertMap.run(g1, "Mirage");
        insertMap.run(g1, "Inferno");
        insertMap.run(g1, "Nuke");
        insertMap.run(g1, "Overpass");
        insertMap.run(g1, "Ancient");
        insertMap.run(g1, "Anubis");

        const g2 = insertGame.run("Dota 2", "dota2", "DOTA", "Многопользовательская онлайн-battlearena от Valve").lastInsertRowid;
        insertPlatform.run(g2, "PC");
        insertMode.run(g2, "Ranked");
        insertMode.run(g2, "Captain's Mode");
        insertMap.run(g2, "Captain's Mode");

        const g3 = insertGame.run("Valorant", "valorant", "VAL", "Тактический шутер от Riot Games").lastInsertRowid;
        insertPlatform.run(g3, "PC");
        insertMode.run(g3, "Competitive");
        insertMode.run(g3, "Spike Rush");
        insertMap.run(g3, "Bind");
        insertMap.run(g3, "Haven");
        insertMap.run(g3, "Split");
        insertMap.run(g3, "Ascent");
        insertMap.run(g3, "Icebox");

        const g4 = insertGame.run("Battlefield 6", "bf6", "BF6", "Масштабные multiplayer бои от EA").lastInsertRowid;
        insertPlatform.run(g4, "PC");
        insertPlatform.run(g4, "Xbox");
        insertPlatform.run(g4, "PlayStation");
        insertMode.run(g4, "Conquest");
        insertMode.run(g4, "Breakthrough");
        insertMap.run(g4, "Firestorm");
        insertMap.run(g4, "Locker");
        insertMap.run(g4, "Metro");

        const g5 = insertGame.run("PUBG", "pubg", "PUBG", "Battle Royale от Krafton").lastInsertRowid;
        insertPlatform.run(g5, "PC");
        insertMode.run(g5, "Squad");
        insertMode.run(g5, "Duo");
        insertMap.run(g5, "Erangel");
        insertMap.run(g5, "Miramar");
        insertMap.run(g5, "Sanhok");
        insertMap.run(g5, "Vikendi");

        const g6 = insertGame.run("Minecraft", "minecraft", "MC", "Креативная песочница от Mojang").lastInsertRowid;
        insertPlatform.run(g6, "PC");
        insertPlatform.run(g6, "Xbox");
        insertPlatform.run(g6, "PlayStation");
        insertPlatform.run(g6, "Nintendo Switch");
        insertMode.run(g6, "PvP");
        insertMode.run(g6, "Bedwars");
        insertMode.run(g6, "Skywars");
        insertMode.run(g6, "Hunger Games");
        insertMap.run(g6, "Hypixel");
        insertMap.run(g6, "CubeCraft");
        insertMap.run(g6, "Mineplex");

        const g7 = insertGame.run("World of Tanks", "wot", "WoT", "Танковый MMO-шутер от Wargaming").lastInsertRowid;
        insertPlatform.run(g7, "PC");
        insertMode.run(g7, "Random Battle");
        insertMode.run(g7, "Clan Wars");
        insertMode.run(g7, "Ranked Battles");
        insertMap.run(g7, "Himmelsdorf");
        insertMap.run(g7, "Malinovka");
        insertMap.run(g7, "Prokhorovka");
        insertMap.run(g7, "Ruinberg");
        insertMap.run(g7, "Ensk");

        const g8 = insertGame.run("Battlefield V", "bf5", "BFV", "Военный шутер от EA, Вторая мировая война").lastInsertRowid;
        insertPlatform.run(g8, "PC");
        insertPlatform.run(g8, "Xbox");
        insertPlatform.run(g8, "PlayStation");
        insertMode.run(g8, "Conquest");
        insertMode.run(g8, "Breakthrough");
        insertMode.run(g8, "Frontlines");
        insertMode.run(g8, "War Stories");
        insertMap.run(g8, "Twisted Steel");
        insertMap.run(g8, "Narvik");
        insertMap.run(g8, "Fjell 652");
        insertMap.run(g8, "Rotterdam");
        insertMap.run(g8, "Devastation");

        const g9 = insertGame.run("Assetto Corsa Competizione", "acc", "ACC", "Симулятор гонок от Kunos Simulazioni, официальный GT чемпионат").lastInsertRowid;
        insertPlatform.run(g9, "PC");
        insertPlatform.run(g9, "Xbox");
        insertPlatform.run(g9, "PlayStation");
        insertMode.run(g9, "Sprint");
        insertMode.run(g9, "Endurance");
        insertMode.run(g9, "Custom Race");
        insertMode.run(g9, "Championship");
        insertMap.run(g9, "Spa-Francorchamps");
        insertMap.run(g9, "Monza");
        insertMap.run(g9, "Silverstone");
        insertMap.run(g9, "Nurburgring");
        insertMap.run(g9, "Barcelona");
        insertMap.run(g9, "Misano");
        insertMap.run(g9, "Zolder");
        insertMap.run(g9, "Brands Hatch");

        const g10 = insertGame.run("Assetto Corsa", "ac", "AC", "Симулятор гонок от Kunos Simulazioni, моддинг-сообщество").lastInsertRowid;
        insertPlatform.run(g10, "PC");
        insertPlatform.run(g10, "Xbox");
        insertPlatform.run(g10, "PlayStation");
        insertMode.run(g10, "Hotlap");
        insertMode.run(g10, "Sprint");
        insertMode.run(g10, "Endurance");
        insertMode.run(g10, "Drift");
        insertMap.run(g10, "Monza");
        insertMap.run(g10, "Spa-Francorchamps");
        insertMap.run(g10, "Nurburgring");
        insertMap.run(g10, "Silverstone");
        insertMap.run(g10, "Barcelona");
        insertMap.run(g10, "Imola");
    }

    // Seed constitution
    const docCount = sqlite.prepare("SELECT COUNT(*) as c FROM constitution_documents").get() as { c: number };
    if (docCount.c === 0) {
        sqlite.prepare("INSERT INTO constitution_documents (title, active_version) VALUES (?, ?)").run("Конституция Конторы", 1);
        const constitutionPath = path.join(__dirname, "../constitution.md");
        const defaultMarkdown = fs.readFileSync(constitutionPath, "utf-8");
        sqlite.prepare("INSERT INTO constitution_versions (document_id, version, markdown, created_by, published_at) VALUES (?, ?, ?, ?, datetime('now'))").run(1, 1, defaultMarkdown, 1);
    }

    // Add created_by column to tournaments if missing (for existing DBs)
    try {
        sqlite.prepare("SELECT created_by FROM tournaments LIMIT 1").get();
    } catch {
        sqlite.exec("ALTER TABLE tournaments ADD COLUMN created_by INTEGER REFERENCES users(id)");
    }

    // Add registration_form column to tournaments if missing (for existing DBs)
    try {
        sqlite.prepare("SELECT registration_form FROM tournaments LIMIT 1").get();
    } catch {
        sqlite.exec("ALTER TABLE tournaments ADD COLUMN registration_form TEXT");
    }

    // Forum tables (drop and recreate if schema changed)
    sqlite.exec(`DROP TABLE IF EXISTS forum_likes`);
    sqlite.exec(`DROP TABLE IF EXISTS forum_comments`);
    sqlite.exec(`DROP TABLE IF EXISTS forum_posts`);
    sqlite.exec(`CREATE TABLE forum_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Форум',
        author_id INTEGER REFERENCES users(id),
        pinned INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    sqlite.exec(`CREATE TABLE IF NOT EXISTS forum_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES forum_comments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    sqlite.exec(`CREATE TABLE IF NOT EXISTS forum_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment_id INTEGER NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        UNIQUE(comment_id, user_id)
    )`);

    // Seed forum posts
    const fpCount = sqlite.prepare("SELECT COUNT(*) as c FROM forum_posts").get() as { c: number };
    if (fpCount.c === 0) {
        const insPost = sqlite.prepare("INSERT INTO forum_posts (title, content, category, author_id, pinned, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))");
        insPost.run("Изменение графика работы", "Начиная с понедельника изменяется порядок смен. Все сотрудники обязаны ознакомиться с новым расписанием в разделе «Документы».\n\nОсновные изменения:\n- Смена А: 08:00 — 16:00\n- Смена Б: 16:00 — 00:00\n- Смена В: 00:00 — 08:00\n\nПросьба подтвердить ознакомление в личном кабинете.", "Объявление", 1, 1, "-2 hours");
        insPost.run("Приказ №47 — Усиление контроля", "В связи с последними инцидентами вводится усиленный контроль за перемещением сотрудников между корпусами.\n\nС 15 июля:\n1. Все перемещения фиксируются в системе\n2. Пропуска проверяются на каждом блоке\n3. Нарушители направляются на дисциплинарную комиссию\n\nПриказ вступает в силу немедленно.", "Приказ", 1, 1, "-4 hours");
        insPost.run("Обновление систем безопасности", "Завершена модернизация системы пропусков. Новые карты доступа будут выданы до конца недели.\n\nНовые возможности:\n- Бесконтактное прохождение\n- Автоматическая фиксация входа/выхода\n- Интеграция с системой учёта рабочего времени\n\nВыдача карт — кабинет 105, с 9:00 до 17:00.", "Новость", 2, 0, "-1 days");
        insPost.run("Обсуждение: условия труда в 3-м корпусе", "Поднимаю вопрос о состоянии вентиляции в серверной. Температура стабильно выше нормы.\n\nЗамерил вчера — 28°C при норме 22-24°C. Кондиционер на 3 этаже работает, но не справляется.\n\nКто-то сталкивался с подобной проблемой? Как решали?", "Форум", 2, 0, "-1 days");
        insPost.run("Конституция Синдиката v2.1", "Опубликована обновлённая версия Конституции. Основные изменения касаются раздела «Дисциплинарные меры».\n\nКлючевые изменения:\n- Параграф 3.2: уточнены основания для выговора\n- Параграф 5.1: добавлены права сотрудников\n- Приложение Б: новый порядок обжалования\n\nПолный текст доступен в разделе «Конституция».", "Документ", 1, 0, "-2 days");

        const insComment = sqlite.prepare("INSERT INTO forum_comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, datetime('now', ?))");
        insComment.run(1, 2, "А что с ночными сменами? Будет ли надбавка?", "-1 hours");
        insComment.run(1, 1, "Надбавка сохраняется в полном объёме. Подробности у начальника смены.", "-50 minutes");
        insComment.run(1, 3, "Ознакомлена. Спасибо за информацию.", "-45 minutes");
        insComment.run(2, 2, "А как быть с сотрудниками, у которых пропуска старого образца?", "-3 hours");
        insComment.run(2, 1, "Обмен пропусков будет проведён до 14 июля в кабинете 312.", "-2 hours");
        insComment.run(3, 3, "Отлично! А старые карты нужно сдавать?", "-20 hours");
        insComment.run(3, 2, "Да, старые карты сдаются при получении новых. Спасибо!", "-19 hours");
        insComment.run(4, 3, "У нас на 2 этаже была похожая проблема. Вызвали сервис — починили заслонку.", "-18 hours");
        insComment.run(4, 2, "Спасибо, попробую. Куда именно подавать заявку?", "-17 hours");
        insComment.run(4, 3, "it@company.com или через портал в разделе «Обращения».", "-16 hours");
        console.log("Seeded 5 forum posts with comments");
    }

    console.log("Database migrated successfully");
}
