import { sqlite } from "./database";

const movies = [
    // ── ФИЛЬМЫ (live-action) ──
    { title: "Тренер Картер", year: 2005, genre: "Драма", rating: 5 },
    { title: "Движение вверх", year: 2018, genre: "Драма", rating: 5 },
    { title: "Белые не умеют прыгать", year: 1992, genre: "Комедия", rating: 4 },
    { title: "Бэтмен: Начало", year: 2005, genre: "Боевик", rating: 5 },
    { title: "Тёмный рыцарь", year: 2008, genre: "Боевик", rating: 5 },
    { title: "Тёмный рыцарь: Возрождение легенды", year: 2012, genre: "Боевик", rating: 4 },
    { title: "Гонка (Rush)", year: 2013, genre: "Драма", rating: 5 },
    { title: "Гран Туризмо", year: 2023, genre: "Драма", rating: 4 },
    { title: "Форд против Феррари", year: 2019, genre: "Драма", rating: 5 },
    { title: "Need for Speed", year: 2014, genre: "Боевик", rating: 4 },
    { title: "Ущелье (The Gorge)", year: 2025, genre: "Фантастика", rating: 4 },
    { title: "Голод (The Hunger)", year: 2023, genre: "Ужасы", rating: 3 },
    { title: "F1", year: 2025, genre: "Драма", rating: 4 },
    { title: "Сволочи", year: 2012, genre: "Боевик", rating: 4 },
    { title: "Выкрутасы", year: 2011, genre: "Комедия", rating: 4 },
    { title: "Хардкор", year: 2015, genre: "Боевик", rating: 4 },
    { title: "Скуби-Ду (2002)", year: 2002, genre: "Комедия", rating: 3 },
    { title: "Скуби-Ду 2", year: 2004, genre: "Комедия", rating: 3 },
    { title: "Скуби-Ду (ТВ-фильм 2009)", year: 2009, genre: "Комедия", rating: 2 },
    { title: "Мармадюк", year: 2010, genre: "Комедия", rating: 2 },
    { title: "Брат", year: 1997, genre: "Драма", rating: 5 },
    { title: "Брат 2", year: 2000, genre: "Драма", rating: 5 },
    { title: "Интерстеллар", year: 2014, genre: "Фантастика", rating: 5 },
    { title: "Форсаж 1", year: 2001, genre: "Боевик", rating: 4 },
    { title: "Форсаж 2", year: 2003, genre: "Боевик", rating: 3 },
    { title: "Форсаж 3: Токийский дрифт", year: 2006, genre: "Боевик", rating: 3 },
    { title: "Форсаж 4", year: 2009, genre: "Боевик", rating: 4 },
    { title: "Форсаж 5", year: 2011, genre: "Боевик", rating: 5 },
    { title: "Форсаж 6", year: 2013, genre: "Боевик", rating: 4 },
    { title: "Форсаж 7", year: 2015, genre: "Боевик", rating: 4 },
    { title: "Форсаж 8", year: 2017, genre: "Боевик", rating: 3 },
    { title: "Форсаж 9", year: 2021, genre: "Боевик", rating: 3 },
    { title: "Форсаж 10", year: 2023, genre: "Боевик", rating: 3 },
    { title: "Джон Уик 4", year: 2023, genre: "Боевик", rating: 5 },
    { title: "Хоббит 1: Нежданное путешествие", year: 2012, genre: "Фантастика", rating: 4 },
    { title: "Хоббит 2: Пустошь Смауга", year: 2013, genre: "Фантастика", rating: 4 },
    { title: "Хоббит 3: Битва пяти воинств", year: 2014, genre: "Фантастика", rating: 4 },
    { title: "Человек-паук (Тоби 1)", year: 2002, genre: "Боевик", rating: 4 },
    { title: "Человек-паук (Тоби 2)", year: 2004, genre: "Боевик", rating: 4 },
    { title: "Человек-паук (Гарфилд 1)", year: 2012, genre: "Боевик", rating: 4 },
    { title: "Такси 1", year: 1998, genre: "Комедия", rating: 4 },
    { title: "Такси 2", year: 2000, genre: "Комедия", rating: 4 },
    { title: "Такси 3", year: 2003, genre: "Комедия", rating: 3 },
    { title: "Такси 4", year:2007, genre: "Комедия", rating: 3 },
    { title: "Лёд 1", year: 2018, genre: "Драма", rating: 4 },
    { title: "Лёд 2", year: 2020, genre: "Драма", rating: 3 },
    { title: "Матрица", year: 1999, genre: "Фантастика", rating: 5 },
    { title: "Бойцовский клуб", year: 1999, genre: "Триллер", rating: 5 },
    { title: "Джентльмены", year: 2019, genre: "Боевик", rating: 5 },
    { title: "Золото Рейна", year: 2023, genre: "Драма", rating: 4 },
    { title: "Рокки", year: 1976, genre: "Драма", rating: 5 },
    { title: "Крид", year: 2015, genre: "Драма", rating: 5 },
    { title: "Крид 2", year: 2018, genre: "Драма", rating: 4 },
    { title: "Крид 3", year: 2023, genre: "Драма", rating: 4 },
    { title: "Левша", year: 2025, genre: "Драма", rating: 4 },
    { title: "Бойка: Неоспоримый", year: 2023, genre: "Боевик", rating: 3 },
    { title: "Перевозчик 3", year: 2008, genre: "Боевик", rating: 3 },
    { title: "Терминатор 1", year: 1984, genre: "Фантастика", rating: 5 },
    { title: "Терминатор 2", year: 1991, genre: "Фантастика", rating: 5 },
    { title: "Три метра над уровнем неба 1", year: 2010, genre: "Драма", rating: 4 },
    { title: "Три метра над уровнем неба 2", year: 2012, genre: "Драма", rating: 3 },
    { title: "8 миля", year: 2002, genre: "Драма", rating: 4 },

    // ── МУЛЬТФИЛЬМЫ ──
    { title: "Поток (Flow)", year: 2024, genre: "Мультфильм", rating: 5 },
    { title: "Мадагаскар 1", year: 2005, genre: "Мультфильм", rating: 5 },
    { title: "Мадагаскар 2", year: 2008, genre: "Мультфильм", rating: 4 },
    { title: "Мадагаскар 3", year: 2012, genre: "Мультфильм", rating: 4 },
    { title: "Пингвины Мадагаскара", year: 2014, genre: "Мультфильм", rating: 4 },
    { title: "Скуби-Ду на острове зомби", year: 2006, genre: "Мультфильм", rating: 4 },
    { title: "Скуби-Ду и призрак ведьмы", year: 2012, genre: "Мультфильм", rating: 3 },
    { title: "Скуби-Ду и кибергонка", year: 2013, genre: "Мультфильм", rating: 3 },
    { title: "Три богатыря и Пуп Земли", year: 2022, genre: "Мультфильм", rating: 3 },
    { title: "Три богатыря и Наследница престола", year: 2018, genre: "Мультфильм", rating: 3 },
    { title: "Три богатыря и Пуп Земли", year: 2022, genre: "Мультфильм", rating: 3 },
    { title: "Три богатыря: Хроники параллельных миров", year: 2017, genre: "Мультфильм", rating: 3 },
    { title: "Три богатыря на дальних берегах", year: 2015, genre: "Мультфильм", rating: 3 },
    { title: "Три богатыря и Жена царя", year: 2014, genre: "Мультфильм", rating: 3 },
    { title: "Три богатыря и Принцесса Елизавета", year: 2012, genre: "Мультфильм", rating: 3 },
    { title: "Три богатыря и Земля неизвестная", year: 2011, genre: "Мультфильм", rating: 4 },
    { title: "Три богатыря и Шамаханская царица", year: 2010, genre: "Мультфильм", rating: 4 },
    { title: "Три богатыря и Наследник престола", year: 2009, genre: "Мультфильм", rating: 3 },
    { title: "Три богатыря", year: 2004, genre: "Мультфильм", rating: 4 },
    { title: "Иван Царевич и Серый Волк 1", year: 2011, genre: "Мультфильм", rating: 4 },
    { title: "Иван Царевич и Серый Волк 2", year: 2013, genre: "Мультфильм", rating: 4 },
    { title: "Иван Царевич и Серый Волк 3", year: 2016, genre: "Мультфильм", rating: 3 },
    { title: "Иван Царевич и Серый Волк 4", year: 2018, genre: "Мультфильм", rating: 3 },
    { title: "Иван Царевич и Серый Волк 5", year: 2020, genre: "Мультфильм", rating: 3 },
    { title: "Иван Царевич и Серый Волк: Возвращение", year: 2024, genre: "Мультфильм", rating: 3 },

    // ── МУЛЬТСЕРИАЛЫ ──
    { title: "Скуби-Ду (все сезоны)", year: null, genre: "Мультфильм", rating: 4 },

    // ── АНИМЕ-ФИЛЬМЫ ──
    { title: "Форма голоса (A Silent Voice)", year: 2016, genre: "Аниме", rating: 5 },

    // ── АНИМЕ-СЕРИАЛЫ ──
    { title: "Аватар: Легенда об Аанге", year: 2005, genre: "Аниме", rating: 5 },
    { title: "Хантер × Хантер", year: 2011, genre: "Аниме", rating: 5 },
    { title: "Токийский гуль", year: 2014, genre: "Аниме", rating: 4 },
    { title: "Человек-бензопила (Chainsaw Man)", year: 2022, genre: "Аниме", rating: 5 },
    { title: "Милый во Франксе", year: 2018, genre: "Аниме", rating: 4 },
    { title: "Глупый свин", year: 2017, genre: "Аниме", rating: 3 },
    { title: "Безумный азарт (Kakegurui)", year: 2017, genre: "Аниме", rating: 4 },
    { title: "Фарфоровая кукла", year: 2016, genre: "Аниме", rating: 4 },

    // ── СЕРИАЛЫ ──
    { title: "Во все тяжкие (Breaking Bad)", year: 2008, genre: "Сериалы", rating: 5 },
    { title: "13 причин почему (13 Reasons Why)", year: 2017, genre: "Сериалы", rating: 4 },
];

export function seedMovies() {
    const count = sqlite.prepare("SELECT COUNT(*) as c FROM movies").get() as { c: number };
    if (count.c > 0) return;

    const insert = sqlite.prepare(
        "INSERT INTO movies (title, year, genre, rating, added_by) VALUES (?, ?, ?, ?, 1)"
    );
    for (const m of movies) {
        insert.run(m.title, m.year, m.genre, m.rating);
    }
    console.log(`Seeded ${movies.length} movies`);
}
