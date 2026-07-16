const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, 'data/corporate-portal.db'), { readonly: true });

// Get all table names
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();

let sql = '-- Corporate Portal DB dump\n';
sql += '-- Generated: ' + new Date().toISOString() + '\n\n';

for (const { name } of tables) {
    // Get schema
    const createInfo = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(name);
    if (createInfo && createInfo.sql) {
        sql += `DROP TABLE IF EXISTS "${name}";\n`;
        sql += createInfo.sql + ';\n\n';
    }

    // Get data
    const rows = db.prepare(`SELECT * FROM "${name}"`).all();
    if (rows.length === 0) continue;

    // Get column names from first row
    const cols = Object.keys(rows[0]);

    for (const row of rows) {
        const values = cols.map(c => {
            const v = row[c];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number') return String(v);
            // Escape single quotes
            const escaped = String(v).replace(/'/g, "''");
            return `'${escaped}'`;
        });
        sql += `INSERT INTO "${name}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
    }
    sql += '\n';
}

fs.writeFileSync(path.join(__dirname, 'scripts', 'sync-dump.sql'), sql, 'utf8');
console.log(`Dump written: ${tables.length} tables, ${sql.length} chars`);

// Print summary of movies
const movieCount = db.prepare('SELECT count(*) as c FROM movies').get();
const withPoster = db.prepare("SELECT count(*) as c FROM movies WHERE poster IS NOT NULL AND poster != ''").get();
console.log(`Movies: ${movieCount.c} total, ${withPoster.c} with poster`);

db.close();
