const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TMDB_TOKEN = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

const db = new Database(path.join(__dirname, 'data/corporate-portal.db'));

const GENRE_MAP = {
    28: 'Боевик', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия',
    80: 'Криминал', 99: 'Документальный', 18: 'Драма', 10751: 'Семейный',
    14: 'Фантастика', 27: 'Ужасы', 9648: 'Детектив', 10749: 'Мелодрама',
    878: 'Фантастика', 53: 'Триллер', 10752: 'Военный', 37: 'Вестерн',
    36: 'Исторический', 10762: 'Детский', 10763: 'Новости', 10764: 'Реалити',
    10765: 'Фантастика', 10766: 'Мыльная опера', 10767: 'Ток-шоу', 10768: 'Война',
};

const TMDB_GENRE_TO_RU = {};
for (const [k, v] of Object.entries(GENRE_MAP)) {
    TMDB_GENRE_TO_RU[Number(k)] = v;
}

const RUSSIAN_GENRE_MAP = {
    'боевик': 'Боевик', 'комедия': 'Комедия', 'драма': 'Драма',
    'ужасы': 'Ужасы', 'фантастика': 'Фантастика', 'триллер': 'Триллер',
    'мультфильм': 'Мультфильм', 'мультфильмы': 'Мультфильм',
    'документальный': 'Документальный', 'сериалы': 'Сериалы', 'сериал': 'Сериалы',
    'аниме': 'Аниме', 'мелодрама': 'Мелодрама', 'приключения': 'Приключения',
    'семейный': 'Семейный', 'фэнтези': 'Фантастика', 'исторический': 'Исторический',
    'криминал': 'Криминал', 'детектив': 'Детектив', 'военный': 'Военный',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function tmdbSearch(query) {
    const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=ru-RU&page=1`;
    const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.results || [];
}

async function tmdbSearchTV(query) {
    const url = `${TMDB_BASE}/search/tv?query=${encodeURIComponent(query)}&language=ru-RU&page=1`;
    const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.results || [];
}

function getGenre(genreIds) {
    if (!genreIds || genreIds.length === 0) return 'Драма';
    for (const id of genreIds) {
        if (TMDB_GENRE_TO_RU[id]) return TMDB_GENRE_TO_RU[id];
    }
    return 'Драма';
}

function posterUrl(path) {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w500${path}`;
}

const newMovies = [
    // ── ФИЛЬМЫ ──
    { title: 'Эван Всемогущий', genreHint: 'Комедия' },
    { title: 'Моана', genreHint: 'Мультфильм' },
    { title: 'Моана 2', genreHint: 'Мультфильм' },
    { title: 'Холодное сердце', genreHint: 'Мультфильм' },
    { title: 'Холодное сердце 2', genreHint: 'Мультфильм' },
    { title: 'Храбрая сердцем', genreHint: 'Мультфильм' },
    { title: 'Терминатор 3', genreHint: 'Фантастика' },
    { title: 'Терминатор 4', genreHint: 'Фантастика' },
    { title: 'Терминатор 5', genreHint: 'Фантастика' },
    { title: 'Терминатор 6', genreHint: 'Фантастика' },
    { title: 'Ну здравствуй, Оксана Соколова!', genreHint: 'Комедия' },
    { title: 'Спирит: Душа прерий', genreHint: 'Мультфильм' },
    { title: 'Любовь на Бали', genreHint: 'Мелодрама' },
    { title: 'Школа магических зверей', genreHint: 'Фантастика' },
    { title: 'Школа магических зверей 2', genreHint: 'Фантастика' },
    { title: 'Школа магических зверей 3', genreHint: 'Фантастика' },
    { title: 'Твоё сердце будет разбито', genreHint: 'Мелодрама' },
    { title: 'Дети леса', genreHint: 'Мультфильм' },
    { title: 'Дети леса 2', genreHint: 'Мультфильм' },
    { title: 'Родительский дом', genreHint: 'Драма' },
    { title: 'Приключение жёлтого чемоданчика', genreHint: 'Комедия' },
    { title: 'Няня Оксана', genreHint: 'Комедия' },
    { title: 'Кузнецовы ТВ', genreHint: 'Комедия' },
    { title: 'На деревне дедушке', genreHint: 'Комедия' },
    { title: 'Плагиатор', genreHint: 'Триллер' },
    { title: 'Жизнь по вызову', genreHint: 'Комедия' },
    { title: 'Сводишь с ума', genreHint: 'Мелодрама' },
    { title: 'Принц из рая', genreHint: 'Фантастика' },
    { title: 'Девка-баба', genreHint: 'Комедия' },
    { title: 'Беляковы в отпуске', genreHint: 'Комедия' },
    { title: 'Новогодний шеф', genreHint: 'Комедия' },
    { title: 'Культурная комедия', genreHint: 'Комедия' },
    { title: 'Бывший в помощь', genreHint: 'Комедия' },
    { title: 'Мужские правила моего деда', genreHint: 'Комедия' },
    { title: 'Мой дикий друг', genreHint: 'Комедия' },
    { title: 'Царевна-лягушка', genreHint: 'Фантастика' },
    { title: 'Баба Яга спасает Новый год', genreHint: 'Комедия' },
    { title: 'Психиатрическая больница Конджиама', genreHint: 'Ужасы' },
    { title: 'Яга на нашу голову', genreHint: 'Комедия' },
    { title: 'Алиса в стране чудес', genreHint: 'Фантастика' },
    { title: 'Финист. Первый богатырь', genreHint: 'Фантастика' },
    { title: 'Горыныч', genreHint: 'Фантастика' },
    { title: 'По стучись в мою Тверь', genreHint: 'Комедия' },
    { title: 'Равиоли Оли', genreHint: 'Мультфильм' },
    { title: 'Несвятая Валентина', genreHint: 'Комедия' },
    { title: 'Поступь хаоса', genreHint: 'Ужасы' },
    { title: 'Вышка', genreHint: 'Ужасы' },
    { title: 'Холодное сердце', yearHint: 2025, genreHint: 'Фантастика' },
    { title: 'Прыжок в будущее', genreHint: 'Фантастика' },
    { title: 'Сказка о царе Салтане', genreHint: 'Мультфильм' },
    { title: 'Братья', yearHint: 2024, genreHint: 'Боевик' },
    { title: 'Как не жениться на принцессе', genreHint: 'Мультфильм' },
    { title: 'Первая', genreHint: 'Драма' },
    { title: 'Смерть единорога', genreHint: 'Ужасы' },
    { title: 'Еретик', genreHint: 'Ужасы' },
    { title: 'Коты-эрмитажа', genreHint: 'Мультфильм' },
    { title: 'Коты-эрмитажа 2', genreHint: 'Мультфильм' },
    { title: 'Коты-эрмитажа 3', genreHint: 'Мультфильм' },
    { title: 'Золушка. Тайна трёх желаний', genreHint: 'Мультфильм' },
    { title: 'Холоп', genreHint: 'Комедия' },
    { title: 'Холоп 2', genreHint: 'Комедия' },
    { title: 'Тайна Коко', genreHint: 'Мультфильм' },
    { title: 'Дюна', genreHint: 'Фантастика' },
    { title: 'Дюна 2', genreHint: 'Фантастика' },
    { title: 'Дом монстр', genreHint: 'Мультфильм' },
    { title: 'Аватар', genreHint: 'Фантастика' },
    { title: 'Аватар 2', genreHint: 'Фантастика' },
    { title: 'Субстанция', genreHint: 'Ужасы' },
    { title: 'Тепло наших тел', genreHint: 'Триллер' },
    { title: 'Мавка', genreHint: 'Мультфильм' },
    { title: 'Волшебник изумрудного города', genreHint: 'Фантастика' },
    { title: 'Как приручить дракона 2', genreHint: 'Мультфильм' },
    { title: 'Как приручить дракона 3', genreHint: 'Мультфильм' },
    { title: 'Птичий короб', genreHint: 'Ужасы' },
    { title: 'Гладиатор', genreHint: 'Боевик' },
    { title: 'Заклятие', genreHint: 'Ужасы' },
    { title: 'Заклятие 2', genreHint: 'Ужасы' },
    { title: 'Король лев', genreHint: 'Мультфильм' },
    { title: 'Шрек', genreHint: 'Мультфильм' },
    { title: 'Корпорация монстров', genreHint: 'Мультфильм' },
    { title: 'Из тьмы', genreHint: 'Ужасы' },
    { title: 'Рататуй', genreHint: 'Мультфильм' },
    { title: 'Хранитель Луны', genreHint: 'Фантастика' },
    { title: 'Дорога домой', genreHint: 'Приключения' },
    { title: 'Монстры на каникулах', genreHint: 'Мультфильм' },
    { title: 'Монстры на каникулах 2', genreHint: 'Мультфильм' },
    { title: 'Босс молокосос', genreHint: 'Мультфильм' },
    { title: 'Дикий робот', genreHint: 'Мультфильм' },
    { title: 'Орион и тьма', genreHint: 'Мультфильм' },
    { title: 'Энканто', genreHint: 'Мультфильм' },
    { title: 'Бэмби', genreHint: 'Мультфильм' },
    { title: 'Мулан', genreHint: 'Мультфильм' },
    { title: 'Золушка', genreHint: 'Мультфильм' },
    { title: 'Белоснежка', genreHint: 'Мультфильм' },
    { title: 'Красавица и Чудовище', genreHint: 'Мультфильм' },
    { title: 'Спящая красавица', genreHint: 'Мультфильм' },
    { title: 'Алладин', genreHint: 'Мультфильм' },
    { title: 'Анабель', genreHint: 'Ужасы' },
    { title: 'Париж горит мёртвых', genreHint: 'Комедия' },
    { title: 'Оно', genreHint: 'Ужасы' },
    { title: 'Фирстрит', genreHint: 'Драма' },
    { title: 'Монстры в Париже', genreHint: 'Мультфильм' },
    { title: 'В поисках Немо', genreHint: 'Мультфильм' },
    { title: 'Смурфики', genreHint: 'Мультфильм' },
    { title: 'Девочки Эквестрии', genreHint: 'Мультфильм' },

    // ── СЕРИАЛЫ ──
    { title: 'Тень и кость', genreHint: 'Фантастика', type: 'tv' },

    // ── АНИМЕ ──
    { title: 'Я хочу съесть твою поджелудочную', genreHint: 'Аниме' },
    { title: 'Корзинка фруктов', genreHint: 'Аниме' },
    { title: 'Этот глупый свин не понимает мечту девочки-зайки', genreHint: 'Аниме' },
    { title: 'Дитя погоды', genreHint: 'Аниме' },
    { title: 'В лес, где мерцают светлячки', genreHint: 'Аниме' },
    { title: 'Тонешь в лето, выход прощаний', genreHint: 'Аниме' },
    { title: 'Сад изящных слов', genreHint: 'Аниме' },
    { title: 'Сердцу хочется кричать', genreHint: 'Аниме' },
    { title: 'Оседлав волну с тобой', genreHint: 'Аниме' },
    { title: 'Пять сантиметров в секунду', genreHint: 'Аниме' },
    { title: 'Любит — не любит', genreHint: 'Аниме' },
    { title: 'Украсить цветами обещания прощальное утро', genreHint: 'Аниме' },
    { title: 'Связанные', genreHint: 'Аниме' },
    { title: 'Наруто', genreHint: 'Аниме', type: 'tv' },
    { title: 'Боруто', genreHint: 'Аниме', type: 'tv' },
    { title: 'Седьмая жизнь злодейки: узы вражды', genreHint: 'Аниме', type: 'tv' },
    { title: 'Повар небесной гостиницы', genreHint: 'Аниме', type: 'tv' },
    { title: 'Сказка о сахарном яблоке', genreHint: 'Аниме' },
    { title: 'Принесённая в жертву принцесса и царь зверей', genreHint: 'Аниме', type: 'tv' },
];

async function main() {
    const existing = db.prepare('SELECT title FROM movies').all().map(m => m.title.toLowerCase());
    const insert = db.prepare(
        'INSERT INTO movies (title, year, genre, rating, description, poster, added_by) VALUES (?, ?, ?, ?, ?, ?, 1)'
    );

    let added = 0;
    let skipped = 0;
    let noResult = 0;

    for (const movie of newMovies) {
        const titleLower = movie.title.toLowerCase();

        // Check approximate duplicate
        const isDup = existing.some(e =>
            e.includes(titleLower) || titleLower.includes(e) ||
            e === titleLower
        );
        if (isDup) {
            console.log(`  SKIP (exists): ${movie.title}`);
            skipped++;
            continue;
        }

        console.log(`  Searching: ${movie.title}...`);
        let results;

        if (movie.type === 'tv') {
            results = await tmdbSearchTV(movie.title);
        } else {
            results = await tmdbSearch(movie.title);
        }

        if (!results || results.length === 0) {
            console.log(`  NO RESULT: ${movie.title}`);
            noResult++;
            // Insert without poster
            insert.run(movie.title, movie.yearHint || null, RUSSIAN_GENRE_MAP[movie.genreHint?.toLowerCase()] || movie.genreHint || 'Драма', null, null, null);
            existing.push(titleLower);
            added++;
            await sleep(200);
            continue;
        }

        const best = results[0];
        const year = best.release_date ? Number(best.release_date.substring(0, 4)) : (movie.yearHint || null);
        const genre = movie.genreHint || getGenre(best.genre_ids);
        const poster = best.poster_path ? posterUrl(best.poster_path) : null;
        const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
        const desc = best.overview || null;

        // Check if year hint helps narrow down
        let match = best;
        if (movie.yearHint && results.length > 1) {
            const yearMatch = results.find(r => {
                const y = r.release_date ? Number(r.release_date.substring(0, 4)) : 0;
                return Math.abs(y - movie.yearHint) <= 1;
            });
            if (yearMatch) match = yearMatch;
        }

        const finalYear = match.release_date ? Number(match.release_date.substring(0, 4)) : (movie.yearHint || null);
        const finalPoster = match.poster_path ? posterUrl(match.poster_path) : poster;
        const finalRating = match.vote_average ? Math.round(match.vote_average / 2) : rating;
        const finalDesc = match.overview || desc;

        insert.run(
            movie.title,
            finalYear,
            genre,
            finalRating,
            finalDesc,
            finalPoster,
        );
        existing.push(titleLower);
        added++;
        console.log(`  ADDED: ${movie.title} (${finalYear}) ${genre} ⭐${finalRating} poster=${finalPoster ? 'YES' : 'NO'}`);
        await sleep(250); // Rate limit TMDb
    }

    console.log(`\n=== DONE ===`);
    console.log(`Added: ${added}, Skipped (duplicate): ${skipped}, No TMDb result: ${noResult}`);
    const total = db.prepare('SELECT count(*) as c FROM movies').get();
    console.log(`Total movies now: ${total.c}`);

    db.close();
}

main().catch(e => { console.error(e); db.close(); process.exit(1); });
