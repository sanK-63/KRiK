const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'data/corporate-portal.db'));

// Remove duplicates - keep the first one (lowest id)
const dupes = db.prepare("SELECT id, title FROM movies WHERE id NOT IN (SELECT MIN(id) FROM movies GROUP BY title) AND title IN (SELECT title FROM movies GROUP BY title HAVING COUNT(*) > 1)").all();
console.log('Removing ' + dupes.length + ' duplicates:');
for (const d of dupes) {
    console.log('  Delete id=' + d.id + ' ' + d.title);
    db.prepare("DELETE FROM movie_comments WHERE movie_id = ?").run(d.id);
    db.prepare("DELETE FROM movies WHERE id = ?").run(d.id);
}

console.log('Done. Remaining movies: ' + db.prepare("SELECT COUNT(*) as c FROM movies").get().c);
db.close();
