const Database = require('better-sqlite3');
const db = new Database('./data/corporate-portal.db');
const rows = db.prepare("SELECT id, title, poster FROM movies WHERE poster IS NULL OR poster = ''").all();
console.log("Movies without posters:", rows.length);
rows.forEach(r => console.log(r.id + " | " + r.title));
