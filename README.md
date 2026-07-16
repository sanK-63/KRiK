<div align="center">

# 🏢 Corporate Portal

**Полнофункциональный корпоративный портал с турнирами, ELO-системой, библиотекой документов и исследовательскими инструментами**

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_6-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express_4-000000?style=flat&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-003B57?style=flat&logo=drizzle&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

</div>

## 📖 О проекте

**Corporate Portal** — это современный корпоративный портал для�� команд и сообществ, объединяющий управление турнирами, систему рейтинга, документооборот и набор полезных инструментов в едином интерфейсе.

### Ключевые особенности

- **🏆 Система турниров** — создание шаблонов, управление брекетами, фиксация результатов
- **📊 ELO-рейтинг** — общий рейтинг игроков across все игры с историей изменений
- **📚 Библиотека документов** — загрузка, категоризация, скачивание и поиск документов
- **🔬 Research-инструменты** — калькулятор ИМТ, колесо фортуны, рандомайзер, кости, метроном, тюнер, генератор частот
- **🎬 Кинотека** — каталог фильмов с постерами и описаниями (347+ фильмов)
- **👥 Управление пользователями** — роли, профили, публичные страницы
- **🔐 Авторизация** — JWT-аутентификация, bcrypt хеширование
- **⚡ WebSocket** — уведомления и обновления в реальном времени

---

## 🗂 Структура проекта

```
corporate-portal/
├── client/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/              # Переиспользуемые компоненты
│   │   │   └── Tournament/          # Компоненты турниров
│   │   │       ├── BracketView.tsx
│   │   │       ├── MatchCard.tsx
│   │   │       ├── TemplateWizard.tsx
│   │   │       ├── TournamentCard.tsx
│   │   │       ├── TournamentControlPanel.tsx
│   │   │       └── TournamentWizard.tsx
│   │   ├── context/                 # React Context (аутентификация и т.д.)
│   │   ├── hooks/                   # Кастомные хуки
│   │   ├── layouts/                 # Layout-компоненты
│   │   ├── pages/                   # Страницы приложения (30 страниц)
│   │   ├── services/                # API-клиенты (Axios)
│   │   ├── store/                   # Глобальное состояние
│   │   ├── styles/                  # Глобальные стили
│   │   ├── types/                   # TypeScript-типы
│   │   └── utils/                   # Утилиты
│   └── vite.config.ts
├── server/                          # Backend (Express + Drizzle)
│   ├── src/
│   │   ├── app.ts                   # Express app + route registration
│   │   ├── auth/                    # JWT логика
│   │   ├── config.ts                # Конфигурация сервера
│   │   ├── core/                    # Аудит, утилиты
│   │   ├── database/
│   │   │   ├── schema.ts            # Drizzle ORM schema (20+ таблиц)
│   │   │   ├── migrate.ts           # Миграции и seed-данные
│   │   │   └── index.ts             # Подключение к SQLite
│   │   ├── middleware/               # Auth, валидация
│   │   ├── routes/                  # API-роутеры (19 модулей)
│   │   ├── services/                # Бизнес-логика
│   │   │   └── elo.ts               # ELO-система
│   │   ├── socket.ts                # WebSocket сервер
│   │   └── server.ts                # Точка входа
│   ├── data/
│   │   ├── corporate-portal.db      # SQLite база данных
│   │   └── uploads/                 # Загруженные файлы
│   └── tsconfig.json
├── docker-compose.yml               # Docker-конфигурация
└── README.md
```

---

## 🚀 Быстрый старт

### Предварительные требования

- [Node.js](https://nodejs.org/) ≥ 18
- [npm](https://www.npmjs.com/) ≥ 9
- [Docker](https://www.docker.com/) (опционально)

### Установка и запуск

```bash
# Клонируем репозиторий
git clone https://github.com/your-username/corporate-portal.git
cd corporate-portal

# Устанавливаем зависимости сервера
cd server
npm install

# Запускаем миграции и seed-данные
npx tsx src/database/migrate.ts

# Запускаем сервер в dev-режиме
npm run dev
```

```bash
# В отдельном терминале — клиент
cd client
npm install
npm run dev
```

### Docker

```bash
docker-compose up --build
```

Сервер будет доступен на `http://localhost:5000`, клиент — на `http://localhost:5173`.

---

## 🔧 Технологии

### Frontend

| Технология | Назначение |
|---|---|
| **React 19** | UI-библиотека |
| **TypeScript 6** | Строгая типизация |
| **Vite 8** | Сборщик и dev-сервер |
| **Tailwind CSS 4** | Утилитарные стили |
| **React Router 7** | Маршрутизация |
| **TanStack Query 5** | Управление серверным состоянием |
| **React Hook Form + Zod** | Формы и валидация |
| **Axios** | HTTP-клиент |
| **Framer Motion** | Анимации |
| **Lucide React** | Иконки |
| **Socket.io Client** | WebSocket |

### Backend

| Технология | Назначение |
|---|---|
| **Express 4** | HTTP-фреймворк |
| **Drizzle ORM** | SQL-ORM для SQLite |
| **SQLite (better-sqlite3)** | Легковесная БД |
| **JWT (jsonwebtoken)** | Аутентификация |
| **bcryptjs** | Хеширование паролей |
| **Socket.io** | WebSocket сервер |
| **Helmet** | Безопасность HTTP-заголовков |
| **Morgan** | HTTP-логирование |
| **Multer** | Загрузка файлов |
| **Nodemailer** | Отправка email |
| **docxtemplater** | Генерация DOCX-документов |
| **pdfkit** | Генерация PDF |
| **docx** | Работа с Word-файлами |

---

## 📡 API Endpoints

### Аутентификация
| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |

### Пользователи
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/users` | Список пользователей |
| GET | `/api/users/:id` | Профиль пользователя |
| PUT | `/api/users/:id` | Обновление профиля |
| GET | `/api/users/:id/public` | Публичный профиль |

### ELO-система
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/elo/leaderboard` | Таблица лидеров |
| GET | `/api/elo/user/:userId` | ELO пользователя |
| GET | `/api/elo/history/:userId` | История ELO |
| POST | `/api/elo/recalculate` | Пересчёт ELO (admin) |

### Игры
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/games` | Список игр |
| POST | `/api/games` | Создание игры |
| PUT | `/api/games/:id` | Обновление игры |
| DELETE | `/api/games/:id` | Удаление игры |

### Турниры
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/tournaments` | Список турниров |
| POST | `/api/tournaments` | Создание турнира |
| GET | `/api/tournaments/:id` | Детали турнира |
| PUT | `/api/tournaments/:id` | Обновление турнира |
| DELETE | `/api/tournaments/:id` | Удаление турнира |
| POST | `/api/tournaments/:id/register` | Регистрация на турнир |
| DELETE | `/api/tournaments/:id/register` | Отмена регистрации |
| POST | `/api/tournaments/:id/brackets` | Генерация брекета |
| POST | `/api/tournaments/:id/matches/:matchId/start` | Начало матча |
| POST | `/api/tournaments/:id/matches/:matchId/finish` | Завершение матча |
| POST | `/api/tournaments/:id/matches/:matchId/cancel` | Отмена матча |

### Шаблоны турниров
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/tournament-templates` | Список шаблонов |
| POST | `/api/tournament-templates` | Создание шаблона |
| PUT | `/api/tournament-templates/:id` | Обновление шаблона |
| DELETE | `/api/tournament-templates/:id` | Удаление шаблона |

### Библиотека документов
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/library/categories` | Категории |
| POST | `/api/library/categories` | Создание категории |
| DELETE | `/api/library/categories/:id` | Удаление категории |
| GET | `/api/library/documents` | Список документов |
| POST | `/api/library/documents` | Загрузка документа |
| PUT | `/api/library/documents/:id` | Обновление документа |
| DELETE | `/api/library/documents/:id` | Удаление документа |
| GET | `/api/library/documents/:id/download` | Скачивание |
| GET | `/api/library/search` | Поиск |
| GET | `/api/library/stats` | Статистика |

### Другие
| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/events` | Мероприятия |
| GET | `/api/forum` | Форум |
| GET | `/api/movies` | Кинотека |
| GET | `/api/memes` | Мемы |
| GET | `/api/software` | Софт |
| GET | `/api/constitution` | Устав |
| GET | `/api/recipes` | Рецепты |

---

## 🎮 Возможности

### Система турниров

- **Шаблоны турниров** — создание повторно используемых конфигураций
- **Wizard создания** — пошаговый мастер с выбором игры, формата и участников
- **Брекеты** — автоматическая генерация Single Elimination с BYE-обработкой
- **Управление матчами** — старт, фиксация результатов, быстрая победа, отмена
- **Статистика** — автоматический подсчёт побед, поражений, лучших серий
- **Стадии** — registration → active → completed с валидацией переходов

### ELO-рейтинг

- **Начальный рейтинг**: 1000
- **K-фактор**: 32
- **Награды за турнир**: 1 место +50, 2 место +30, 3 место +15
- **История** — отслеживание всех изменений рейтинга с течением времени
- **Таблица лидеров** — общий рейтинг across все игры

### Research-инструменты

| Инструмент | Описание |
|---|---|
| **📊 Калькулятор ИМТ** | Расчёт индекса массы тела с цветовой шкалой |
| **🎡 Колесо фортуны** | SVG-колесо с анимацией (2–12 сегментов) |
| **🎲 Рандомайзер** | Генерация чисел с пресетами (D6, D20, проценты, лотерея) |
| **🎲 Кости** | D4/D6/D8/D10/D12/D20/D100 с SVG-отрисовкой |
| **🎵 Метроном** | Веб-аудио API, BPM 20–300, тайм-сигнатуры |
| **🎤 Тюнер** | Детекция питча через микрофон (автокорреляция) |
| **🔊 Генератор частот** | 4 формы волны, 8 пресетов, A4=440Hz |

### Кинотека

- **347+ фильмов** с постерами и описаниями
- **Фильтрация** по жанрам: Аниме, Комедии, Драмы, Триллеры, Мелодрамы, Приключения, Ужасы
- **Адаптивная сетка** с aspect-ratio постерами

### Библиотека документов

- **Категории** — documents, приказы, договоры, протоколы, шаблоны
- **Загрузка файлов** — DOCX, PDF, изображения и др.
- **Скачивание** со счётчиком
- **Поиск** по названию и описанию

### Дополнительно

- **Форум** — обсуждения с ветками и ответами
- **Мероприятия** — календарь событий
- **Софт** — каталог полезного ПО
- **Мемы** — раздел для мемов
- **Рецепты** — кулинарный раздел
- **Устав** — конституция организации
- **Обратная связь** — жалобы и предложения

---

## 🗄 База данных

### Таблицы

| Таблица | Описание |
|---|---|
| `users` | Пользователи |
| `user_roles` | Роли пользователей |
| `roles` | Список ролей |
| `profiles` | Профили |
| `games` | Игры (CS2, Dota 2, Valorant, BF6, PUBG, Minecraft, WoT, BFV, ACC, AC) |
| `tournaments` | Турниры |
| `tournament_templates` | Шаблоны турниров |
| `tournament_stages` | Стадии турниров |
| `tournament_rules` | Правила турниров |
| `brackets` | Брекеты |
| `rounds` | Раунды |
| `matches` | Матчи (с очками и судьёй) |
| `teams` | Команды |
| `team_members` | Участники команд |
| `registrations` | Регистрации на турниры |
| `registration_answers` | Ответы на вопросы регистрации |
| `standings` | Турнирная таблица |
| `player_statistics` | Статистика игроков |
| `user_elo` | ELO-рейтинги |
| `elo_history` | История ELO |
| `library_categories` | Категории документов |
| `library_documents` | Документы |

---

## 🎨 Дизайн-система

- **Основной акцент**: `#FA6814` (оранжевый)
- **Фоны**: `#2a2a2a`, `#1e1e1e`, `#3b3b3b` (тёмная тема)
- **Границы**: `#3b3b3b`, `#4a4a4a`
- **Шрифты**: системные моноширинные, Tailwind defaults
- **Компоненты**: переиспользуемые карточки, модальные окна, формы

---

## 📦 Скрипты

### Сервер (`/server`)

```bash
npm run dev        # Development с ts-node-dev
npm run build      # TypeScript компиляция
npm run start      # Production запуск
```

### Клиент (`/client`)

```bash
npm run dev        # Vite dev-сервер
npm run build      # Production сборка
npm run lint       # OxLint проверка
npm run preview    # Preview production-сборки
```

---

## 📄 Лицензия

MIT License

---

<div align="center">

**Built with ❤️ for corporate teams**

</div>
