const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data/corporate-portal.db'), { readonly: true });

const rows = db.prepare("SELECT title, poster FROM movies WHERE poster IS NOT NULL AND poster != '' LIMIT 5").all();
console.log('Sample poster URLs:');
for (const r of rows) {
    console.log(`  ${r.title}: ${r.poster}`);
}

const noPoster = db.prepare("SELECT count(*) as c FROM movies WHERE poster IS NULL OR poster = ''").get();
const withPoster = db.prepare("SELECT count(*) as c FROM movies WHERE poster IS NOT NULL AND poster != ''").get();
console.log(`\nWith poster: ${withPoster.c}, Without poster: ${noPoster.c}`);

// Test if a poster URL is accessible
const testUrl = rows[0]?.poster;
if (testUrl) {
    console.log(`\nTesting URL: ${testUrl}`);
    fetch(testUrl, { method: 'HEAD' })
        .then(r => console.log(`Status: ${r.status}, Content-Type: ${r.headers.get('content-type')}`))
        .catch(e => console.log(`Error: ${e.message}`));
}

db.close();
