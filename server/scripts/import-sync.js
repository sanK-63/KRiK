// Run on server: node scripts/import-sync.js
// Imports sync-dump.sql into the server database

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/corporate-portal.db');
const sqlPath = path.join(__dirname, 'sync-dump.sql');

if (!fs.existsSync(sqlPath)) {
    console.error('sync-dump.sql not found! Run dump-db.js on local first and push to git.');
    process.exit(1);
}

console.log('Reading sync-dump.sql...');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Count statements
const stmts = sql.split(';').filter(s => s.trim().length > 0);
console.log(`Found ${stmts.length} SQL statements`);

console.log('Opening database:', dbPath);
const db = new Database(dbPath);

// Use a transaction for speed
console.log('Importing...');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');

const importTx = db.transaction(() => {
    let count = 0;
    for (const stmt of stmts) {
        try {
            db.exec(stmt + ';');
            count++;
        } catch (e) {
            // Skip duplicate/already-exists errors
            if (!e.message.includes('UNIQUE') && !e.message.includes('already exists')) {
                console.error('Error on statement:', stmt.substring(0, 80) + '...', e.message);
            }
        }
    }
    return count;
});

const imported = importTx();
console.log(`Imported ${imported} statements`);

const movieCount = db.prepare('SELECT count(*) as c FROM movies').get();
const withPoster = db.prepare("SELECT count(*) as c FROM movies WHERE poster IS NOT NULL AND poster != ''").get();
console.log(`Movies: ${movieCount.c} total, ${withPoster.c} with poster`);

db.close();
console.log('Done! Restart server: pm2 restart krik-backend');
