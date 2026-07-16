const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data/corporate-portal.db'), { readonly: true });

const movies = db.prepare("SELECT id, title, year, genre, rating, CASE WHEN poster IS NOT NULL AND poster != '' THEN 'YES' ELSE 'NO' END as has_poster FROM movies ORDER BY id").all();
console.log('Total movies:', movies.length);
console.table(movies);

const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('\nAll tables:', allTables.map(t => t.name).join(', '));

const counts = {};
for (const t of allTables) {
    const row = db.prepare('SELECT count(*) as c FROM ' + t.name).get();
    counts[t.name] = row.c;
}
console.log('\nTable counts:', counts);

db.close();
