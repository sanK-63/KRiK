const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TMDB_TOKEN = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const db = new Database(path.join(__dirname, 'data/corporate-portal.db'));

function posterUrl(p) { return p ? `https://image.tmdb.org/t/p/w500${p}` : null; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

async function search(query) {
    const resp = await fetch(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=ru-RU&page=1`, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
    });
    if (!resp.ok) return [];
    return (await resp.json()).results || [];
}

async function main() {
    // Search for Мстители
    const results = await search('Avengers');
    console.log('Search results for Avengers:');
    for (const r of results.slice(0, 5)) {
        console.log(`  ${r.title} (${r.release_date}) genre_ids=${JSON.stringify(r.genre_ids)} poster=${r.poster_path ? 'YES' : 'NO'}`);
    }

    // Check what "Мстители" looks like in DB
    const row = db.prepare("SELECT id, title, year, genre, poster FROM movies WHERE title = 'Мстители'").get();
    console.log('\nDB row:', row);

    // Manually fix
    if (row) {
        const best = results.find(r => r.title === 'The Avengers' || (r.release_date && r.release_date.startsWith('2012')));
        if (best) {
            const year = 2012;
            const genre = getGenre(best.genre_ids);
            const poster = best.poster_path ? posterUrl(best.poster_path) : null;
            const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
            const desc = best.overview || null;
            console.log(`\nUpdating: year=${year} genre=${genre} poster=${poster ? 'YES' : 'NO'} rating=${rating}`);
            db.prepare('UPDATE movies SET year=?, genre=?, rating=?, poster=?, description=? WHERE id=?')
                .run(year, genre, rating, poster, desc, row.id);
            console.log('Updated!');
        }
    }

    // Also fix Человек-паук 3
    const sp3 = await search('Spider-Man 3');
    console.log('\nSpider-Man 3 results:');
    for (const r of sp3.slice(0, 3)) {
        console.log(`  ${r.title} (${r.release_date}) poster=${r.poster_path ? 'YES' : 'NO'}`);
    }
    const sp3row = db.prepare("SELECT id, title, year, poster FROM movies WHERE title = 'Человек-паук 3'").get();
    if (sp3row && sp3.length > 0) {
        const best = sp3.find(r => r.release_date && r.release_date.startsWith('2007')) || sp3[0];
        const year = best.release_date ? Number(best.release_date.substring(0, 4)) : 2007;
        const genre = getGenre(best.genre_ids);
        const poster = best.poster_path ? posterUrl(best.poster_path) : null;
        const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
        console.log(`\nUpdating Человек-паук 3: year=${year} genre=${genre}`);
        db.prepare('UPDATE movies SET year=?, genre=?, rating=?, poster=?, description=? WHERE id=?')
            .run(year, genre, rating, poster, best.overview || null, sp3row.id);
    }

    // Fix Падение ордена
    const fo = db.prepare("SELECT id, title, year, poster FROM movies WHERE title = 'Падение ордена'").get();
    if (fo) {
        console.log('\nПадение ордена:', fo);
        // Search for Fallen Order - Star Wars
        const foResults = await search('Fallen Order Star Wars');
        console.log('Fallen Order results:');
        for (const r of foResults.slice(0, 3)) {
            console.log(`  ${r.title} (${r.release_date}) poster=${r.poster_path ? 'YES' : 'NO'}`);
        }
    }

    db.close();
}

main().catch(e => { console.error(e); db.close(); process.exit(1); });
