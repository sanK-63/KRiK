const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const bcryptjs = require('bcryptjs');

const dbPath = path.join(__dirname, '../data/corporate-portal.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

// Check if vzhezhevska exists
const liza = db.prepare("SELECT id FROM users WHERE username = 'vzhezhevska'").get();

if (liza) {
    console.log('vzhezhevska already exists with id=' + liza.id);
} else {
    // Delete guest from id=4 to free it
    const guestAt4 = db.prepare("SELECT id FROM users WHERE username = 'guest' AND id = 4").get();
    if (guestAt4) {
        db.prepare("DELETE FROM user_roles WHERE user_id = 4").run();
        db.prepare("DELETE FROM profiles WHERE user_id = 4").run();
        db.prepare("DELETE FROM user_elo WHERE user_id = 4").run();
        db.prepare("DELETE FROM users WHERE id = 4").run();
        console.log('Deleted guest from id=4');
    }

    // Insert vzhezhevska with id=4
    db.prepare(`
        INSERT INTO users (id, uuid, username, display_name, surname, patronymic, date_of_birth, phone, access_key_hash, key_lookup, email, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        4, '770e5209-1e2d-4edd-b97c-5a1854ba0654', 'vzhezhevska', 'Елизавета', 'Вжежевская', 'Валентиновна',
        '2006-04-28', '+7 700 225 04 23',
        '$2b$10$B44AN/.vXRKhwzj0pRMFF.kWN7XR5VNyHey3fyqPBOPrbHKSgl9vG',
        '8a79ffc11f5f7900ce2241e9a7279b59620cd77d377c0778fcd1415d49c495f0',
        'vzezevskaaelizaveta@gmail.com', 'active'
    );
    console.log('Inserted vzhezhevska with id=4');

    // Add role
    db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(4, 5);
    console.log('Added role for vzhezhevska');

    // Add profile
    db.prepare("INSERT INTO profiles (user_id, country) VALUES (?, ?)").run(4, 'Казахстан');
    console.log('Added profile for vzhezhevska');

    // Add ELO
    db.prepare("INSERT OR IGNORE INTO user_elo (user_id, elo, games_played, wins, losses, updated_at) VALUES (?, 1000, 0, 0, 0, datetime('now'))").run(4);
    console.log('Added ELO entry for vzhezhevska');
}

// Re-create guest if missing
const guest = db.prepare("SELECT id FROM users WHERE username = 'guest'").get();
if (!guest) {
    const guestKey = 'gost-krik-6881b607';
    const guestLookup = crypto.createHash('sha256').update(guestKey).digest('hex');
    const guestHash = bcryptjs.hashSync(guestKey, 10);
    const { v4 } = require('uuid');
    db.prepare("INSERT INTO users (uuid, username, display_name, email, access_key_hash, key_lookup, status) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        v4(), 'guest', 'Гость', 'guest@krik.local', guestHash, guestLookup, 'active'
    );
    console.log('Re-created guest user');
}

// Verify all users
const users = db.prepare('SELECT id, username, display_name, surname, patronymic FROM users ORDER BY id').all();
console.log('\nAll users:');
users.forEach(u => console.log(u.id + ' | ' + u.username + ' | ' + u.display_name + ' ' + (u.surname || '') + ' ' + (u.patronymic || '')));

db.pragma('foreign_keys = ON');
db.close();
console.log('\nDone!');
