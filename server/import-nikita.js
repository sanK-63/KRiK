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
    878: 'Фантастика', 53: 'Триллер', 10752: 'Военный', 36: 'Исторический',
};
function getGenre(ids) {
    if (!ids || !ids.length) return 'Драма';
    for (const id of ids) { if (TMDB_GENRE_TO_RU[id]) return TMDB_GENRE_TO_RU[id]; }
    return 'Драма';
}
function posterUrl(p) { return p ? `https://image.tmdb.org/t/p/w500${p}` : null; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchMovie(query) {
    const resp = await fetch(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=ru-RU&page=1`, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
    });
    if (!resp.ok) return [];
    return (await resp.json()).results || [];
}

async function searchTV(query) {
    const resp = await fetch(`${TMDB_BASE}/search/tv?query=${encodeURIComponent(query)}&language=ru-RU&page=1`, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
    });
    if (!resp.ok) return [];
    return (await resp.json()).results || [];
}

const ADDED_BY = 3; // Никита

const tvShows = [
    { title: 'Викинги', search: 'Vikings', genre: 'Драма' },
    { title: 'Викинги: Вальхалла', search: 'Vikings Valhalla', genre: 'Драма' },
    { title: 'Последнее королевство', search: 'The Last Kingdom', genre: 'Драма' },
    { title: 'Мерлин', search: 'Merlin', genre: 'Фантастика' },
    { title: 'Сверхестественное', search: 'Supernatural', genre: 'Ужасы' },
    { title: 'Ведьмак', search: 'The Witcher', genre: 'Фантастика' },
    { title: 'Сёгун', search: 'Shogun', genre: 'Исторический' },
    { title: 'Падение ордена', search: 'The Fall of the Order', genre: 'Фантастика' },
    { title: 'Локи', search: 'Loki', genre: 'Фантастика' },
    { title: 'Как закалялся стайл', search: 'How I Met Your Father', genre: 'Комедия' },
    { title: 'Сеструха', search: 'Sisterhood', genre: 'Драма' },
    { title: 'Полицейский с рублёвки', search: 'Полицейский с Рублёвки', genre: 'Комедия' },
    { title: '911', search: '9-1-1', genre: 'Драма' },
    { title: 'Новичок', search: 'The Rookie', genre: 'Боевик' },
    { title: 'Декстер', search: 'Dexter', genre: 'Криминал' },
    { title: 'Доктор Кто', search: 'Doctor Who', genre: 'Фантастика' },
    { title: 'Доктор Хаус', search: 'House M.D.', genre: 'Драма' },
    { title: 'Мандалорец', search: 'The Mandalorian', genre: 'Фантастика' },
];

const movies = [
    { title: 'Первый мститель', search: 'Captain America: The First Avenger', genre: 'Боевик' },
    { title: 'Железный человек', search: 'Iron Man 2008', genre: 'Боевик' },
    { title: 'Железный человек 2', search: 'Iron Man 2', genre: 'Боевик' },
    { title: 'Железный человек 3', search: 'Iron Man 3', genre: 'Боевик' },
    { title: 'Мстители', search: 'The Avengers 2012', genre: 'Боевик' },
    { title: 'Первый мститель: Другая война', search: 'Captain America: The Winter Soldier', genre: 'Боевик' },
    { title: 'Стражи Галактики', search: 'Guardians of the Galaxy', genre: 'Боевик' },
    { title: 'Стражи Галактики 2', search: 'Guardians of the Galaxy Vol. 2', genre: 'Боевик' },
    { title: 'Мстители: Эра Альтрона', search: 'Avengers: Age of Ultron', genre: 'Боевик' },
    { title: 'Человек-муравей', search: 'Ant-Man', genre: 'Боевик' },
    { title: 'Первый мститель: Противостояние', search: 'Captain America: Civil War', genre: 'Боевик' },
    { title: 'Человек-паук: Возвращение домой', search: 'Spider-Man: Homecoming', genre: 'Боевик' },
    { title: 'Доктор Стрэндж', search: 'Doctor Strange', genre: 'Фантастика' },
    { title: 'Черная Пантера', search: 'Black Panther', genre: 'Боевик' },
    { title: 'Мстители: Война бесконечности', search: 'Avengers: Infinity War', genre: 'Боевик' },
    { title: 'Человек-муравей и Оса', search: 'Ant-Man and the Wasp', genre: 'Боевик' },
    { title: 'Мстители: Финал', search: 'Avengers: Endgame', genre: 'Боевик' },
    { title: 'Человек-паук: Вдали от дома', search: 'Spider-Man: Far From Home', genre: 'Боевик' },
    { title: 'Человек-паук: Нет пути домой', search: 'Spider-Man: No Way Home', genre: 'Боевик' },
    { title: 'Человек-паук 1', search: 'Spider-Man 2002', genre: 'Боевик' },
    { title: 'Человек-паук 2', search: 'Spider-Man 2 2004', genre: 'Боевик' },
    { title: 'Человек-паук 3', search: 'Spider-Man 3 2007', genre: 'Боевик' },
    { title: 'Новый человек-паук', search: 'The Amazing Spider-Man', genre: 'Боевик' },
    { title: 'Новый человек-паук 2', search: 'The Amazing Spider-Man 2', genre: 'Боевик' },
    { title: 'Лунный рыцарь', search: 'Moon Knight', genre: 'Боевик' },
    { title: 'Тор: Любовь и гром', search: 'Thor: Love and Thunder', genre: 'Боевик' },
    { title: 'Бэтмен (2022)', search: 'The Batman 2022', genre: 'Боевик' },
    { title: 'Бэтмен против Супермена', search: 'Batman v Superman', genre: 'Боевик' },
    { title: 'Очень страшное кино', search: 'Scary Movie', genre: 'Комедия' },
    { title: 'Очень страшное кино 2', search: 'Scary Movie 2', genre: 'Комедия' },
    { title: 'Очень страшное кино 3', search: 'Scary Movie 3', genre: 'Комедия' },
    { title: 'Очень страшное кино 4', search: 'Scary Movie 4', genre: 'Комедия' },
    { title: 'Очень страшное кино 5', search: 'Scary Movie 5', genre: 'Комедия' },
    { title: 'Борат', search: 'Borat', genre: 'Комедия' },
    { title: 'Борат 2', search: 'Borat 2', genre: 'Комедия' },
    { title: 'Зелёная миля', search: 'The Green Mile', genre: 'Драма' },
    { title: 'Зелёная книга', search: 'Green Book', genre: 'Комедия' },
    { title: 'Кит', search: 'Whale', genre: 'Драма' },
    { title: 'Не грози Южному централу', search: 'Don\'t Be a Menace to South Central', genre: 'Комедия' },
    { title: 'Побег из Шоушенка', search: 'The Shawshank Redemption', genre: 'Драма' },
    { title: 'Титаник', search: 'Titanic', genre: 'Мелодрама' },
    { title: 'Хатико', search: 'Hachi', genre: 'Драма' },
    { title: 'Волк с Уолл-стрит', search: 'The Wolf of Wall Street', genre: 'Комедия' },
    { title: 'Однажды в Голливуде', search: 'Once Upon a Time in Hollywood', genre: 'Комедия' },
    { title: 'Суперперцы', search: 'Superbad', genre: 'Комедия' },
    { title: 'Тупой и ещё тупее', search: 'Dumb and Dumber', genre: 'Комедия' },
    { title: 'Укрощение строптивого', search: '10 Things I Hate About You', genre: 'Мелодрама' },
    { title: 'Блеф', search: 'Bleff', genre: 'Триллер' },
    { title: 'Безумно влюблённый', search: 'Crazy in Love', genre: 'Комедия' },
    { title: 'Однажды в Вегосе', search: 'What Happens in Vegas', genre: 'Комедия' },
    { title: 'Властелин колец', search: 'The Lord of the Rings: The Fellowship of the Ring', genre: 'Фантастика' },
    { title: 'Властелин колец 2', search: 'The Lord of the Rings: The Two Towers', genre: 'Фантастика' },
    { title: 'Властелин колец 3', search: 'The Lord of the Rings: The Return of the King', genre: 'Фантастика' },
    { title: 'Звёздные войны', search: 'Star Wars', genre: 'Фантастика' },
    { title: 'Звёздные войны 2', search: 'Star Wars: The Empire Strikes Back', genre: 'Фантастика' },
    { title: 'Звёздные войны 3', search: 'Star Wars: Return of the Jedi', genre: 'Фантастика' },
    { title: 'Звёздные войны 4', search: 'Star Wars: The Phantom Menace', genre: 'Фантастика' },
    { title: 'Звёздные войны 5', search: 'Star Wars: Attack of the Clones', genre: 'Фантастика' },
    { title: 'Звёздные войны 6', search: 'Star Wars: Revenge of the Sith', genre: 'Фантастика' },
    { title: 'Звёздные войны 7', search: 'Star Wars: The Force Awakens', genre: 'Фантастика' },
    { title: 'Звёздные войны 8', search: 'Star Wars: The Last Jedi', genre: 'Фантастика' },
    { title: 'Звёздные войны 9', search: 'Star Wars: The Rise of Skywalker', genre: 'Фантастика' },
    { title: 'Изгой Один', search: 'Rogue One', genre: 'Фантастика' },
    { title: 'Хан Соло', search: 'Solo: A Star Wars Story', genre: 'Фантастика' },
];

async function main() {
    const existing = db.prepare('SELECT title FROM movies').all().map(m => m.title.toLowerCase());
    const insert = db.prepare(
        'INSERT INTO movies (title, year, genre, rating, description, poster, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    let added = 0;
    let skipped = 0;
    let notFound = 0;

    // Process TV shows
    for (const show of tvShows) {
        const lower = show.title.toLowerCase();
        if (existing.some(e => e.includes(lower) || lower.includes(e))) {
            console.log(`  SKIP (exists): ${show.title}`);
            skipped++;
            continue;
        }

        console.log(`  TV: ${show.title} (${show.search})...`);
        let results = await searchTV(show.search);
        if (!results.length) results = await searchMovie(show.search);

        if (results.length > 0) {
            const best = results[0];
            const year = best.first_air_date ? Number(best.first_air_date.substring(0, 4)) : (best.release_date ? Number(best.release_date.substring(0, 4)) : null);
            const genre = show.genre || getGenre(best.genre_ids);
            const poster = best.poster_path ? posterUrl(best.poster_path) : null;
            const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
            const desc = best.overview || null;

            insert.run(show.title, year, genre, rating, desc, poster, ADDED_BY);
            existing.push(lower);
            added++;
            console.log(`    -> ADDED: ${show.title} (${year}) ${genre} ⭐${rating} poster=${poster ? 'YES' : 'NO'}`);
        } else {
            insert.run(show.title, null, show.genre, null, null, null, ADDED_BY);
            existing.push(lower);
            added++;
            notFound++;
            console.log(`    -> ADDED (no TMDb): ${show.title}`);
        }
        await sleep(250);
    }

    // Process movies
    for (const movie of movies) {
        const lower = movie.title.toLowerCase();
        if (existing.some(e => e.includes(lower) || lower.includes(e))) {
            console.log(`  SKIP (exists): ${movie.title}`);
            skipped++;
            continue;
        }

        console.log(`  MOVIE: ${movie.title} (${movie.search})...`);
        let results = await searchMovie(movie.search);
        if (!results.length) results = await searchTV(movie.search);

        if (results.length > 0) {
            const best = results[0];
            const year = best.release_date ? Number(best.release_date.substring(0, 4)) : (best.first_air_date ? Number(best.first_air_date.substring(0, 4)) : null);
            const genre = movie.genre || getGenre(best.genre_ids);
            const poster = best.poster_path ? posterUrl(best.poster_path) : null;
            const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
            const desc = best.overview || null;

            insert.run(movie.title, year, genre, rating, desc, poster, ADDED_BY);
            existing.push(lower);
            added++;
            console.log(`    -> ADDED: ${movie.title} (${year}) ${genre} ⭐${rating} poster=${poster ? 'YES' : 'NO'}`);
        } else {
            insert.run(movie.title, null, movie.genre, null, null, null, ADDED_BY);
            existing.push(lower);
            added++;
            notFound++;
            console.log(`    -> ADDED (no TMDb): ${movie.title}`);
        }
        await sleep(250);
    }

    console.log(`\n=== DONE ===`);
    console.log(`Added: ${added}, Skipped: ${skipped}, No TMDb: ${notFound}`);
    const total = db.prepare('SELECT count(*) as c FROM movies').get();
    console.log(`Total movies: ${total.c}`);
    db.close();
}

main().catch(e => { console.error(e); db.close(); process.exit(1); });
