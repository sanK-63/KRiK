const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TMDB_TOKEN = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const db = new Database(path.join(__dirname, 'data/corporate-portal.db'));

const ADDED_BY = 5; // Лера

function posterUrl(p) { return p ? `https://image.tmdb.org/t/p/w500${p}` : null; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const TMDB_GENRE_TO_RU = {
    28: 'Боевик', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия',
    80: 'Криминал', 99: 'Документальный', 18: 'Драма', 10751: 'Семейный',
    14: 'Фантастика', 27: 'Ужасы', 9648: 'Детектив', 10749: 'Мелодрама',
    878: 'Фантастика', 53: 'Триллер', 10752: 'Военный', 36: 'Исторический',
};
function getGenre(ids) {
    if (!ids || !ids.length) return 'Боевик';
    for (const id of ids) { if (TMDB_GENRE_TO_RU[id]) return TMDB_GENRE_TO_RU[id]; }
    return 'Боевик';
}

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

// All titles from Лера's list - many already exist
const allTitles = [
    'Гарри Поттер', 'Гарри Поттер 2', 'Гарри Поттер 3', 'Гарри Поттер 4', 'Гарри Поттер 5', 'Гарри Поттер 6', 'Гарри Поттер 7', 'Гарри Поттер 8',
    'Голодные игры', 'Голодные игры 2', 'Голодные игры 3', 'Голодные игры 4',
    'Хроники Нарнии', 'Хроники Нарнии 2', 'Хроники Нарнии 3',
    'Хоббит', 'Хоббит 2', 'Хоббит 3',
    'Властелин колец', 'Властелин колец 2', 'Властелин колец 3',
    'Тайна Коко', 'Тайна коко',
    'Интерстеллар', 'Астрал', 'Кошмары перед Рождеством', 'Рататуй',
    'Корпорация монстров', 'Из тьмы', 'Хранитель Луны', 'Дорога Домой',
    'Дикий робот', 'Орион и тьма', 'Энканто', 'Бэмби', 'Мулан', 'Золушка',
    'Белоснежка', 'Красавица и чудовище', 'Спящая красавица', 'Алладин',
    'Анабель', 'Оно', 'Монстры в Париже', 'В поисках Немо', 'Смурфики',
    'Девочки Эквестрии', 'Дюна', 'Мавка', 'Гладиатор',
    'Дом монстр', 'Субстанция', 'Тепло наших тел', 'Птичий короб',
    'Милый во Франксе', 'Очень приятно, Бог', 'Связанные',
    'Мадагаскар 1', 'Мадагаскар 2', 'Мадагаскар 3',
    'Как приручить дракона', 'Как приручить дракона 2', 'Как приручить дракона 3',
    'Король лев', 'Шрек',
    'Коты-эрмитажа', 'Коты-эрмитажа 2', 'Коты-эрмитажа 3',
    'Наруто', 'Боруто',
    'Монстры на каникулах', 'Монстры на каникулах 2',
    'Босс молокосос', 'Заклятие', 'Заклятие 2',
    'Дитя погоды', 'Дети леса', 'Дети леса 2',
    'В лес, где мерцают светлячки',
    'Сад изящных слов',
    'Пять сантиметров в секунду',
    'Любит — не любит',
    'Я хочу съесть твою поджелудочную',
    'Корзинка фруктов',
    'Этот глупый свин не понимает мечту девочки-зайки',
    'Повар небесной гостиницы',
    'Принесённая в жертву принцесса и царь зверей',
    'Фирстрит', 'Париж горит мёртвых',
    'Приключение жёлтого чемоданчика',
    'Психиатрическая больница Конджиама',
    'По стучись в мою Тверь',
    'Тонешь в лето, выход прощаний',
    'Сердцу хочется кричать',
    'Оседлав волну с тобой',
    'Украсить цветами обещания прощальное утро',
    'Седьмая жизнь злодейки: узы вражды',
    'Сказка о сахарном яблоке',
];

// Exact movies to add (ones NOT already in DB or needing new entries)
const toAdd = [
    // Гарри Поттер
    { title: 'Гарри Поттер и философский камень', search: 'Harry Potter and the Sorcerer\'s Stone', genre: 'Фантастика' },
    { title: 'Гарри Поттер и Тайная комната', search: 'Harry Potter and the Chamber of Secrets', genre: 'Фантастика' },
    { title: 'Гарри Поттер и узник Азкабана', search: 'Harry Potter and the Prisoner of Azkaban', genre: 'Фантастика' },
    { title: 'Гарри Поттер и Кубок огня', search: 'Harry Potter and the Goblet of Fire', genre: 'Фантастика' },
    { title: 'Гарри Поттер и Орден Феникса', search: 'Harry Potter and the Order of the Phoenix', genre: 'Фантастика' },
    { title: 'Гарри Поттер и Принц-полукровка', search: 'Harry Potter and the Half-Blood Prince', genre: 'Фантастика' },
    { title: 'Гарри Поттер и Дары Смерти. Часть 1', search: 'Harry Potter and the Deathly Hallows Part 1', genre: 'Фантастика' },
    { title: 'Гарри Поттер и Дары Смерти. Часть 2', search: 'Harry Potter and the Deathly Hallows Part 2', genre: 'Фантастика' },
    // Голодные игры
    { title: 'Голодные игры', search: 'The Hunger Games', genre: 'Боевик' },
    { title: 'Голодные игры: И вспыхнет пламя', search: 'The Hunger Games: Catching Fire', genre: 'Боевик' },
    { title: 'Голодные игры: Сойка-пересмешница. Часть 1', search: 'The Hunger Games: Mockingjay Part 1', genre: 'Боевик' },
    { title: 'Голодные игры: Сойка-пересмешница. Часть 2', search: 'The Hunger Games: Mockingjay Part 2', genre: 'Боевик' },
    // Хроники Нарнии
    { title: 'Хроники Нарнии: Лев, колдунья и платяной шкаф', search: 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe', genre: 'Фантастика' },
    { title: 'Хроники Нарнии: Принц Каспиан', search: 'The Chronicles of Narnia: Prince Caspian', genre: 'Фантастика' },
    { title: 'Хроники Нарнии: Покоритель Зари', search: 'The Chronicles of Narnia: The Voyage of the Dawn Treader', genre: 'Фантастика' },
    // Сумерки
    { title: 'Сумерки', search: 'Twilight', genre: 'Мелодрама' },
    { title: 'Сумерки. Сага. Новолуние', search: 'The Twilight Saga: New Moon', genre: 'Мелодрама' },
    { title: 'Сумерки. Сага. Затмение', search: 'The Twilight Saga: Eclipse', genre: 'Мелодрама' },
    { title: 'Сумерки. Сага. Рассвет — Часть 1', search: 'The Twilight Saga: Breaking Dawn Part 1', genre: 'Мелодрама' },
    { title: 'Сумерки. Сага. Рассвет — Часть 2', search: 'The Twilight Saga: Breaking Dawn Part 2', genre: 'Мелодрама' },
    // Царевна-лягушка (all parts)
    { title: 'Царевна-лягушка 2', search: 'Царевна-лягушка 2 мультфильм', genre: 'Мультфильм' },
    // Холодное сердце (all parts) - already have 2013 and 2025
    // Моана 2 already exists
    // Терминатор 1-6 already exist
    // Три богатыря (all parts) - need to check which exist
    // Иван Царевич (all parts) - need to check which exist
];

async function main() {
    const existingTitles = db.prepare('SELECT id, title, added_by FROM movies').all();
    const existingSet = new Set(existingTitles.map(m => m.title.toLowerCase()));
    const insert = db.prepare(
        'INSERT INTO movies (title, year, genre, rating, description, poster, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const updateOwner = db.prepare('UPDATE movies SET added_by = ? WHERE id = ?');

    // 1. Reassign existing movies that match Лера's list
    let reassigned = 0;
    for (const m of existingTitles) {
        const lower = m.title.toLowerCase();
        // Check if this movie is in Лера's list (broad match)
        const isLeras = allTitles.some(t => {
            const tl = t.toLowerCase();
            return lower.includes(tl) || tl.includes(lower);
        });
        if (isLeras && m.added_by !== ADDED_BY) {
            updateOwner.run(ADDED_BY, m.id);
            reassigned++;
            console.log(`  REASSIGN: ${m.title} (was user ${m.added_by})`);
        }
    }

    // 2. Add missing movies
    let added = 0;
    for (const movie of toAdd) {
        const lower = movie.title.toLowerCase();
        if (existingSet.has(lower)) {
            console.log(`  SKIP (exists): ${movie.title}`);
            continue;
        }

        console.log(`  ADD: ${movie.title}...`);
        const results = await searchMovie(movie.search);

        if (results.length > 0) {
            const best = results[0];
            const year = best.release_date ? Number(best.release_date.substring(0, 4)) : null;
            const genre = getGenre(best.genre_ids);
            const poster = best.poster_path ? posterUrl(best.poster_path) : null;
            const rating = best.vote_average ? Math.round(best.vote_average / 2) : null;
            const desc = best.overview || null;

            insert.run(movie.title, year, genre, rating, desc, poster, ADDED_BY);
            existingSet.add(lower);
            added++;
            console.log(`    -> ADDED: ${movie.title} (${year}) ${genre} poster=${poster ? 'YES' : 'NO'}`);
        } else {
            insert.run(movie.title, null, movie.genre, null, null, null, ADDED_BY);
            existingSet.add(lower);
            added++;
            console.log(`    -> ADDED (no TMDb): ${movie.title}`);
        }
        await sleep(250);
    }

    // Also reassign movies that were added by the first bulk import (user 1) and match Лера's explicit list
    const specificTitles = [
        'Моана', 'Холодное сердце', 'Храбрая сердцем', 'Терминатор 3', 'Терминатор 4',
        'Терминатор 5', 'Терминатор 6', 'Ну здравствуй, Оксана Соколова!', 'Спирит: Душа прерий',
        'Любовь на Бали', 'Твоё сердце будет разбито', 'Дети леса', 'Дети леса 2',
        'Родительский дом', 'Плагиатор', 'Жизнь по вызову', 'Сводишь с ума',
        'Принц из рая', 'Девка-баба', 'Беляковы в отпуске', 'Новогодний шеф',
        'Культурная комедия', 'Бывший в помощь', 'Мужские правила моего деда', 'Мой дикий друг',
        'Царевна-лягушка', 'Баба Яга спасает Новый год', 'Яга на нашу голову',
        'Алиса в стране чудес', 'Финист. Первый богатырь', 'Горыныч',
        'Равиоли Оли', 'Несвятая Валентина', 'Поступь хаоса', 'Вышка',
        'Холодное сердце (2025)', 'Прыжок в будущее', 'Сказка о царе Салтане',
        'Как не жениться на принцессе', 'Первая', 'Смерть единорога', 'Еретик',
        'Коты-эрмитажа', 'Коты-эрмитажа 2', 'Коты-эрмитажа 3',
        'Золушка. Тайна трёх желаний', 'Холоп', 'Холоп 2', 'Тайна Коко',
        'Дюна', 'Дюна 2', 'Дом монстр', 'Аватар', 'Аватар 2',
        'Субстанция', 'Тепло наших тел', 'Мавка',
        'Волшебник изумрудного города. Дорога из жёлтого кирпича',
        'Как приручить дракона 2', 'Как приручить дракона 3', 'Птичий короб',
        'Гладиатор', 'Заклятие', 'Заклятие 2', 'Астрал', 'Король лев',
        'Шрек', 'Корпорация монстров', 'Из тьмы', 'Интерстеллар', 'Рататуй',
        'Хранитель Луны', 'Дорога домой', 'Монстры на каникулах', 'Монстры на каникулах 2',
        'Босс молокосос', 'Дикий робот', 'Орион и тьма', 'Энканто',
        'Бэмби', 'Мулан', 'Золушка', 'Белоснежка', 'Красавица и Чудовище',
        'Спящая красавица', 'Алладин', 'Анабель', 'Париж горит мёртвых', 'Оно',
        'Фирстрит', 'Кошмары перед Рождеством', 'Монстры в Париже',
        'В поисках Немо', 'Мадагаскар 1', 'Мадагаскар 2', 'Мадагаскар 3',
        'Смурфики', 'Девочки Эквестрии',
    ];

    for (const title of specificTitles) {
        const rows = db.prepare('SELECT id, title, added_by FROM movies WHERE title = ?').all(title);
        for (const r of rows) {
            if (r.added_by !== ADDED_BY) {
                updateOwner.run(ADDED_BY, r.id);
                reassigned++;
                console.log(`  REASSIGN (specific): ${r.title}`);
            }
        }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Reassigned: ${reassigned}, Added: ${added}`);
    const total = db.prepare('SELECT count(*) as c FROM movies').get();
    console.log(`Total movies: ${total.c}`);
    db.close();
}

main().catch(e => { console.error(e); db.close(); process.exit(1); });
