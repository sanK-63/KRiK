const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TMDB_TOKEN = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const db = new Database(path.join(__dirname, 'data/corporate-portal.db'));

const TMDB_GENRE_TO_RU = {
    28: 'Боевик', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия',
    80: 'Криминал', 99: 'Документальный', 18: 'Драма', 10751: 'Семейный',
    14: 'Фантастика', 27: 'Ужасы', 9648: 'Детектив', 10749: 'Мелодрама',
    878: 'Фантастика', 53: 'Триллер', 10752: 'Военный', 37: 'Вестерн',
    36: 'Исторический',
};

function posterUrl(p) { return p ? `https://image.tmdb.org/t/p/w500${p}` : null; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function search(query) {
    const resp = await fetch(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=ru-RU&page=1`, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.results || [];
}

async function searchTV(query) {
    const resp = await fetch(`${TMDB_BASE}/search/tv?query=${encodeURIComponent(query)}&language=ru-RU&page=1`, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.results || [];
}

function getGenre(ids) {
    if (!ids || !ids.length) return 'Драма';
    for (const id of ids) { if (TMDB_GENRE_TO_RU[id]) return TMDB_GENRE_TO_RU[id]; }
    return 'Драма';
}

// Fix wrong year/version matches
const fixes = [
    // title, expectedYear, searchQuery (null = same title)
    { id: null, title: 'Шрек', year: 2001, search: 'Shrek' },
    { id: null, title: 'Бэмби', year: 1942, search: 'Bambi' },
    { id: null, title: 'Моана', year: 2016, search: 'Moana' },
    { id: null, title: 'Дорога домой', year: 2010, search: 'Home Alone' }, // likely Home Alone, not 1967
    { id: null, title: 'Оно', year: 2017, search: 'It 2017' },
    { id: null, title: 'Король лев', year: 1994, search: 'The Lion King 1994' },
];

// Try to find missing movies with English or alternative titles
const missing = [
    { title: 'Приключение жёлтого чемоданчика', search: 'Yellow Suitcase adventure' },
    { title: 'Няня Оксана', search: 'Няня Оксана' },
    { title: 'Кузнецовы ТВ', search: 'Кузнецовы' },
    { title: 'На деревне дедушке', search: 'дедушке деревня фильм' },
    { title: 'Психиатрическая больница Конджиама', search: 'Kondjiam asylum' },
    { title: 'По стучись в мою Тверь', search: 'постучись в мою дверь фильм' },
    { title: 'Алладин', search: 'Aladdin' },
    { title: 'Париж горит мёртвых', search: 'Paris is burning' },
    { title: 'Фирстрит', search: 'First Street' },
    { title: 'Монстры в Париже', search: 'Monsters in Paris' },
    { title: 'Тонешь в лето, выход прощаний', search: 'Drowning in Summer' },
    { title: 'Сердцу хочется кричать', search: 'Heart wants to scream anime' },
    { title: 'Оседлав волну с тобой', search: 'Riding wave anime' },
    { title: 'Пять сантиметров в секунду', search: '5 Centimeters per Second' },
    { title: 'Украсить цветами обещания прощальное утро', search: 'Flowers promises morning anime' },
    { title: 'Седьмая жизнь злодейки: узы вражды', search: 'Seventh Life villainess anime' },
    { title: 'Сказка о сахарном яблоке', search: 'Sugar Apple Fairy Tale anime' },
];

// Also handle "Холодное сердце (2025)" — different from "Холодное сердце" (Frozen 2013)
const specialInserts = [
    { title: 'Холодное сердце (2025)', search: 'Холодное сердце 2025 фильм', genreHint: 'Фантастика' },
    { title: 'Дети леса 2', search: 'Children of the Forest 2', genreHint: 'Мультфильм' },
];

async function main() {
    const updateStmt = db.prepare('UPDATE movies SET year=?, genre=?, poster=? WHERE id=?');
    const insertStmt = db.prepare('INSERT INTO movies (title, year, genre, rating, description, poster, added_by) VALUES (?, ?, ?, ?, ?, ?, 1)');

    // 1. Fix wrong matches by title + year
    for (const fix of fixes) {
        const row = db.prepare('SELECT id, title, year FROM movies WHERE title = ?').get(fix.title);
        if (row && row.year !== fix.year) {
            console.log(`  FIX: ${fix.title} year ${row.year} -> ${fix.year}`);
            const results = await search(fix.search);
            const match = results.find(r => {
                const y = r.release_date ? Number(r.release_date.substring(0, 4)) : 0;
                return Math.abs(y - fix.year) <= 1;
            }) || results[0];
            if (match) {
                const year = match.release_date ? Number(match.release_date.substring(0, 4)) : fix.year;
                const genre = getGenre(match.genre_ids);
                const poster = match.poster_path ? posterUrl(match.poster_path) : null;
                updateStmt.run(year, genre, poster, row.id);
                console.log(`    -> ${fix.title} (${year}) ${genre} poster=${poster ? 'YES' : 'NO'}`);
            } else {
                // Just fix year manually
                updateStmt.run(fix.year, null, null, row.id);
                console.log(`    -> year fixed to ${fix.year} (no TMDb result)`);
            }
            await sleep(250);
        }
    }

    // 2. Find missing movies
    const existingTitles = db.prepare('SELECT title FROM movies').all().map(m => m.title.toLowerCase());

    for (const m of missing) {
        const lower = m.title.toLowerCase();
        if (existingTitles.some(e => e.includes(lower) || lower.includes(e))) {
            console.log(`  SKIP (exists): ${m.title}`);
            continue;
        }
        console.log(`  SEARCHING MISSING: ${m.title} (${m.search})...`);
        let results = await search(m.search);
        if (!results.length) results = await searchTV(m.search);

        if (results.length > 0) {
            const best = results[0];
            const year = best.release_date ? Number(best.release_date.substring(0, 4)) : null;
            const genre = getGenre(best.genre_ids);
            const poster = best.poster_path ? posterUrl(best.poster_path) : null;
            const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
            insertStmt.run(m.title, year, genre, rating, best.overview || null, poster);
            existingTitles.push(lower);
            console.log(`    -> ADDED: ${m.title} (${year}) ${genre} poster=${poster ? 'YES' : 'NO'}`);
        } else {
            console.log(`    -> NOT FOUND`);
        }
        await sleep(250);
    }

    // 3. Special inserts for sequels/remakes
    for (const sp of specialInserts) {
        const lower = sp.title.toLowerCase();
        if (existingTitles.some(e => e === lower || e.includes(lower))) {
            console.log(`  SKIP (exists): ${sp.title}`);
            continue;
        }
        console.log(`  SEARCHING SPECIAL: ${sp.title}...`);
        const results = await search(sp.search);
        if (results.length > 0) {
            const best = results[0];
            const year = best.release_date ? Number(best.release_date.substring(0, 4)) : null;
            const genre = getGenre(best.genre_ids);
            const poster = best.poster_path ? posterUrl(best.poster_path) : null;
            const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
            insertStmt.run(sp.title, year, genre, rating, best.overview || null, poster);
            existingTitles.push(lower);
            console.log(`    -> ADDED: ${sp.title} (${year}) ${genre} poster=${poster ? 'YES' : 'NO'}`);
        } else {
            insertStmt.run(sp.title, null, sp.genreHint, null, null, null);
            existingTitles.push(lower);
            console.log(`    -> ADDED (no TMDb): ${sp.title}`);
        }
        await sleep(250);
    }

    const total = db.prepare('SELECT count(*) as c FROM movies').get();
    console.log(`\nTotal movies: ${total.c}`);
    db.close();
}

main().catch(e => { console.error(e); db.close(); process.exit(1); });
