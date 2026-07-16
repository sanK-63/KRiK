const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TMDB_TOKEN = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const db = new Database(path.join(__dirname, 'data/corporate-portal.db'));

function posterUrl(p) { return p ? `https://image.tmdb.org/t/p/w500${p}` : null; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function search(query) {
    const resp = await fetch(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=ru-RU&page=1`, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
    });
    if (!resp.ok) return [];
    return (await resp.json()).results || [];
}

const TMDB_GENRE_TO_RU = {
    28: 'Боевик', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия',
    18: 'Драма', 10751: 'Семейный', 14: 'Фантастика', 27: 'Ужасы',
    878: 'Фантастика', 53: 'Триллер', 36: 'Исторический', 80: 'Криминал',
};
function getGenre(ids) {
    if (!ids || !ids.length) return 'Боевик';
    for (const id of ids) { if (TMDB_GENRE_TO_RU[id]) return TMDB_GENRE_TO_RU[id]; }
    return 'Боевик';
}

const fixes = [
    { title: 'Очень страшное кино', year: 2000, search: 'Scary Movie 2000' },
    { title: 'Мстители', year: 2012, search: 'Avengers 2012' },
    { title: 'Человек-паук 3', year: 2007, search: 'Spider-Man 3 2007' },
    { title: 'Блеф', year: 2024, search: 'Blef 2024' },
    { title: 'Безумно влюблённый', year: 2012, search: 'Crazy Stupid Love' },
    { title: 'Лунный рыцарь', year: 2022, search: 'Moon Knight 2022' },
    { title: 'Падение ордена', year: 2025, search: 'Падение ордена сериал' },
    { title: 'Как закалялся стайл', year: 2022, search: 'How I Met Your Father 2022' },
    { title: 'Сеструха', year: 2024, search: 'Сеструха сериал 2024' },
];

async function main() {
    const updateStmt = db.prepare('UPDATE movies SET year=?, genre=?, rating=?, poster=?, description=? WHERE id=?');

    for (const fix of fixes) {
        const row = db.prepare('SELECT id, title, year, poster FROM movies WHERE title = ?').get(fix.title);
        if (!row) { console.log('NOT FOUND:', fix.title); continue; }

        console.log(`FIX: ${fix.title} (year=${row.year}, poster=${row.poster ? 'YES' : 'NO'})`);
        const results = await search(fix.search);

        // Find best match by year
        let best = results[0];
        if (results.length > 1) {
            const yearMatch = results.find(r => {
                const y = r.release_date ? Number(r.release_date.substring(0, 4)) : 0;
                return Math.abs(y - fix.year) <= 1;
            });
            if (yearMatch) best = yearMatch;
        }

        if (best) {
            const year = best.release_date ? Number(best.release_date.substring(0, 4)) : fix.year;
            const genre = getGenre(best.genre_ids);
            const poster = best.poster_path ? posterUrl(best.poster_path) : row.poster;
            const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
            const desc = best.overview || null;
            updateStmt.run(year, genre, rating, poster, desc, row.id);
            console.log(`  -> (${year}) ${genre} ⭐${rating} poster=${poster ? 'YES' : 'NO'}`);
        } else {
            updateStmt.run(fix.year, null, null, null, null, row.id);
            console.log(`  -> year fixed to ${fix.year} (no TMDb)`);
        }
        await sleep(250);
    }

    db.close();
}

main().catch(e => { console.error(e); db.close(); process.exit(1); });
