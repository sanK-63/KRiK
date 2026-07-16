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
    80: 'Криминал', 99: 'Документальный', 18: 'Драма', 10751: 'Семейный',
    14: 'Фантастика', 27: 'Ужасы', 9648: 'Детектив', 10749: 'Мелодрама',
    878: 'Фантастика', 53: 'Триллер', 10752: 'Военный',
};
function getGenre(ids) {
    if (!ids || !ids.length) return 'Драма';
    for (const id of ids) { if (TMDB_GENRE_TO_RU[id]) return TMDB_GENRE_TO_RU[id]; }
    return 'Драма';
}

// Movies that were inserted with no poster / no data — need to fix them
const toFix = [
    { title: 'Алладин', search: 'Aladdin 2019' },
    { title: 'Париж горит мёртвых', search: 'Paris brûle-t-il' },
    { title: 'Фирстрит', search: 'Firstrait' },
    { title: 'Монстры в Париже', search: 'Un monstre à Paris' },
    { title: 'Приключение жёлтого чемоданчика', search: 'Приключение жёлтого чемоданчика' },
    { title: 'Няня Оксана', search: 'Няня Оксана фильм' },
    { title: 'Кузнецовы ТВ', search: 'Кузнецовы сериал' },
    { title: 'На деревне дедушке', search: 'На деревне дедушке фильм' },
    { title: 'Психиатрическая больница Конджиама', search: 'Kondybiama' },
    { title: 'По стучись в мою Тверь', search: 'По стучись в мою дверь' },
    { title: 'Тонешь в лето, выход прощаний', search: 'Тонешь в лето' },
    { title: 'Сердцу хочется кричать', search: 'Сердцу хочется кричать' },
    { title: 'Оседлав волну с тобой', search: 'Оседлав волну с тобой' },
    { title: 'Пять сантиметров в секунду', search: '5 Centimeters per Second' },
    { title: 'Украсить цветами обещания прощальное утро', search: 'Hanataba o kazaru' },
    { title: 'Седьмая жизнь злодейки: узы вражды', search: 'Seventh Life Villainess' },
    { title: 'Сказка о сахарном яблоке', search: 'Sugar Apple Fairy Tale' },
];

async function main() {
    const updateStmt = db.prepare('UPDATE movies SET year=?, genre=?, rating=?, description=?, poster=? WHERE id=?');

    for (const m of toFix) {
        const row = db.prepare("SELECT id, title, year, poster FROM movies WHERE title = ?").get(m.title);
        if (!row) { console.log('NOT IN DB:', m.title); continue; }
        // Only fix if missing poster or wrong year
        if (row.poster && row.year) {
            console.log(`SKIP (ok): ${m.title} (${row.year}) poster=${row.poster ? 'YES' : 'NO'}`);
            continue;
        }
        console.log(`FIX: ${m.title} (year=${row.year}, poster=${row.poster ? 'YES' : 'NO'})`);
        const results = await search(m.search);
        if (results.length > 0) {
            const best = results[0];
            const year = best.release_date ? Number(best.release_date.substring(0, 4)) : row.year;
            const genre = getGenre(best.genre_ids);
            const poster = best.poster_path ? posterUrl(best.poster_path) : row.poster;
            const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
            updateStmt.run(year, genre, rating, best.overview || null, poster, row.id);
            console.log(`  -> ${m.title} (${year}) ${genre} poster=${poster ? 'YES' : 'NO'}`);
        } else {
            console.log(`  -> NOT FOUND on TMDb`);
        }
        await sleep(250);
    }

    // Also check for "Терминатор 3-6" correctness
    const termRows = db.prepare("SELECT id, title, year, poster FROM movies WHERE title LIKE 'Терминатор%' ORDER BY id").all();
    console.log('\nТерминаторы:');
    for (const t of termRows) {
        console.log(`  ${t.title} (${t.year}) poster=${t.poster ? 'YES' : 'NO'}`);
    }

    // Check for duplicate titles
    const dupes = db.prepare("SELECT title, count(*) as cnt FROM movies GROUP BY title HAVING cnt > 1").all();
    if (dupes.length > 0) {
        console.log('\nDuplicate titles:');
        for (const d of dupes) {
            console.log(`  "${d.title}" x${d.cnt}`);
            const rows = db.prepare("SELECT id, year, poster FROM movies WHERE title = ?").all(d.title);
            for (const r of rows) {
                console.log(`    id=${r.id} year=${r.year} poster=${r.poster ? 'YES' : 'NO'}`);
            }
        }
    }

    // Count movies without poster
    const noPoster = db.prepare("SELECT count(*) as c FROM movies WHERE poster IS NULL OR poster = ''").get();
    console.log(`\nMovies without poster: ${noPoster.c}`);
    const total = db.prepare('SELECT count(*) as c FROM movies').get();
    console.log(`Total movies: ${total.c}`);

    db.close();
}

main().catch(e => { console.error(e); db.close(); process.exit(1); });
