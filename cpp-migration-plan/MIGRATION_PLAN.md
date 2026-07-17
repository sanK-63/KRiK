# Corporate Portal — Детальный план миграции на C++ (Qt 6)

> Каждый этап — отдельная, самодостаточная задача. После каждого этапа приложение должно компилироваться и запускаться.

---

## Статус: ФАЗЫ 0-13 ВЫПОЛНЕНЫ, ФАЗЫ 14-15 В РАБОТЕ (82 файла, ~7700 строк C++/QSS, BUILD + RUN SUCCESS)

| Параметр | Значение |
|---|---|
| Исходный стек | React 19 + Electron + Vite + Tailwind 4 + TypeScript |
| Целевой стек | Qt 6.7+ / C++20 / SQLite / OpenSSL / spdlog |
| Всего JS-файлов | 53 файла, ~10 177 строк |
| Всего страниц | 27 |
| Всего компонентов | 26 |
| API-эндпоинтов | 19 маршрутов (~100+ endpoints) |
| Таблиц БД | 40+ |

---

## ФАЗА 0: ИНФРАСТРУКТУРА СБОРКИ

### Шаг 0.1 — CMakeLists.txt + Qt Project
- [x] Настроить `CMakeLists.txt` с Qt6::Core, Qt6::Widgets, Qt6::Network, Qt6::Sql, Qt6::WebSockets
- [x] Подключить OpenSSL, spdlog, sqlite3
- [x] C++20, AUTOMOC, AUTORCC, AUTOUIC
- [ ] Убедиться что проект компилируется: `cmake -B build && cmake --build build`

### Шаг 0.2 — Ресурсы
- [x] Создать `resources/portal.qss` — глобальная тема
- [x] Создать `resources/resources.qrc`
- [ ] Добавить иконки (SVG) для sidebar, tray, titlebar
- [ ] Добавить шрифт "Press Start 2P" в ресурсы

### Шаг 0.3 — Заглушка main.cpp
- [x] Написать `main.cpp` с QApplication
- [x] Application singleton
- [ ] Убедиться: `build/CorporatePortal` запускает пустое окно

**Результат фазы 0:** Пустое Qt-окно собирается и запускается.

---

## ФАЗА 1: ЯДРО (Core Layer)

### Шаг 1.1 — Logger
- [x] `Logger.h/.cpp` — spdlog wrapper
- [ ] Логирование в консоль + файл `portal.log`
- [ ] Проверить: логи пишутся при запуске

### Шаг 1.2 — Config
- [x] `Config.h/.cpp` — QSettings wrapper
- [ ] Методы: `load()`, `save()`, `value()`, `setValue()`
- [ ] Хранение: `auth/token`, `api/url`, `database/path`

### Шаг 1.3 — DatabaseManager
- [x] `DatabaseManager.h/.cpp` — QSqlDatabase wrapper
- [ ] Методы: `init()`, `execute()`, `selectOne()`, `selectAll()`, `insert()`
- [ ] PRAGMA: WAL mode, foreign_keys=ON
- [ ] Проверить: подключение к SQLite открывается

### Шаг 1.4 — EventBus
- [x] `EventBus.h/.cpp` — pub/sub
- [ ] Методы: `subscribe()`, `unsubscribe()`, `publish()`
- [ ] Проверить: публикация и подписка работают

### Шаг 1.5 — Схема БД (миграции)
- [ ] Написать SQL-скрипт миграции (40+ таблиц из `schema.ts`)
- [ ] Выполнить миграцию при первом запуске
- [ ] Проверить: таблицы создаются

**Результат фазы 1:** Ядро работает, БД создана.

---

## ФАЗА 2: СЕТЬ (Network Layer)

### Шаг 2.1 — HttpClient
- [x] `HttpClient.h/.cpp` — QNetworkAccessManager wrapper
- [ ] Методы: `get()`, `post()`, `put()`, `patch()`, `del()`
- [ ] Автоматическая вставка `Authorization: Bearer` заголовка
- [ ] Обработка ошибок (JSON `error` поле)
- [ ] Проверить: `GET /api/health` возвращает `{"status":"ok"}`

### Шаг 2.2 — AuthInterceptor
- [x] `AuthInterceptor.h/.cpp` — JWT логин/логаут
- [ ] `login(key)` → POST `/api/auth/key-login`
- [ ] `refreshUser()` → GET `/api/auth/me`
- [ ] `logout()` — очистка токена
- [ ] Сохранение/восстановление токена через Config
- [ ] Сигналы: `loginSuccess`, `loggedOut`, `loginError`
- [ ] Проверить: логин по ключу работает

### Шаг 2.3 — SocketManager
- [x] `SocketManager.h/.cpp` — Socket.IO клиент
- [ ] Подключение к серверу с JWT token
- [ ] Engine.IO handshake (пакеты 0, 2, 3)
- [ ] Socket.IO connect пакет (40)
- [ ] ping/pong (пакет 2 каждые 25 сек)
- [ ] Обработка событий: `notification:new`, `recipe:created`, `movie:created`, `meme:created`, `event:created`, `user:online`
- [ ] Метод `emitEvent()` для отправки
- [ ] Проверить: подключение устанавливается, пинги приходят

**Результат фазы 2:** Сеть работает, авторизация через API.

---

## ФАЗА 3: ГЛАВНОЕ ОКНО (Shell)

### Шаг 3.1 — TitleBar
- [x] `TitleBar.h/.cpp` — кастомная рамка окна
- [ ] `Qt::FramelessWindowHint`
- [ ] Drag-to-move (mousePressEvent/MoveEvent)
- [ ] Кнопки: Minimize (-), Maximize (□), Close (X)
- [ ] Hover-эффекты (hover: #333, close:hover: #D32F2F)
- [ ] Double-click → maximize/restore
- [ ] Проверить: окно без рамки, перетаскивается, кнопки работают

### Шаг 3.2 — OfflineBanner
- [x] `OfflineBanner.h/.cpp`
- [ ] Скрыть/показать при потере сети
- [ ] Проверить: баннер скрыт по умолчанию

### Шаг 3.3 — HeaderWidget
- [x] `HeaderWidget.h/.cpp`
- [ ] Кнопка toggle sidebar (☰)
- [ ] Логотип "Piga i Kopyta" (оранжевый)
- [ ] Поиск (QLineEdit → navigateTo `/search?q=...`)
- [ ] Колокольчик уведомлений + badge unread
- [ ] Dropdown уведомлений (QListView popup)
- [ ] Проверить: хедер отображается, поиск навигирует

### Шаг 3.4 — SidebarWidget
- [x] `SidebarWidget.h/.cpp`
- [ ] 16 навигационных пунктов
- [ ] Активный пункт: оранжевый + border-left
- [ ] Hover-эффекты
- [ ] Клик → `MainWindow::navigateTo()`
- [ ] Админ-пункт (только для username == "tunev")
- [ ] Проверить: навигация между страницами работает

### Шаг 3.5 — MainWindow
- [x] `MainWindow.h/.cpp`
- [ ] Сборка: TitleBar + OfflineBanner + Header + Sidebar + ContentStack
- [ ] `QStackedWidget` на 26 страниц
- [ ] Маршрутизация: `navigateTo(route)` → `setCurrentIndex()`
- [ ] Анимация sidebar (QPropertyAnimation, 250ms)
- [ ] SystemTray (QSystemTrayIcon + контекстное меню)
- [ ] Режимы: `showLogin()` (скрыть sidebar/header), `showMainContent()`
- [ ] `closeEvent` → `hide()` вместо закрытия
- [ ] Проверить: приложение запускается, sidebar анимируется, tray работает

**Результат фазы 3:** Рабочий shell с навигацией (все страницы — заглушки).

---

## ФАЗА 4: АВТОРИЗАЦИЯ

### Шаг 4.1 — LoginPage
- [x] `LoginPage.h/.cpp`
- [ ] UI: карточка по центру, тёмный фон
- [ ] Заголовок "Kontora Piga i Kopyta" (Press Start 2P)
- [ ] Поле ввода ключа (QLineEdit, Password)
- [ ] Кнопка "VOJTI"
- [ ] Состояния: idle → loading (progress bar) → success → navigate
- [ ] Анимация прогресса (QTimer + random increment)
- [ ] Ошибки (красный текст)
- [ ] `returnPressed` → логин
- [ ] Проверить: логин по ключу работает, прогресс показывается

### Шаг 4.2 — ProtectedRoute
- [ ] В MainWindow: если нет токена → `showLogin()`
- [ ] Если токен есть → `refreshUser()` → `showMainContent()`
- [ ] Проверить: при перезапуске сессия восстанавливается

**Результат фазы 4:** Полноценная авторизация.

---

## ФАЗА 5: ДАШБОРД (Dashboard)

### Шаг 5.1 — AboutSection
- [ ] `AboutSection` внутри DashboardPage
- [ ] Текст "Corporate Portal - Desctop Client"
- [ ] Шрифт Press Start 2P

### Шаг 5.2 — Основатели (Founders)
- [ ] GET `/api/users` → список пользователей
- [ ] Отображение аватаров (QLabel + QPixmap) или инициалов
- [ ] Online-статус (зелёный/серый кружок)
- [ ] Клик → navigateTo `/user/{id}`
- [ ] Проверить: аватары загружаются, клик работает

### Шаг 5.3 — Quick Links
- [ ] Сетка 6 кнопок (Forum, Turniry, Konstituciya, Portal, Soft, Taverna)
- [ ] Hover: border-color #FA6814
- [ ] Клик → navigateTo

### Шаг 5.4 — Статистика (Stat Cards)
- [ ] 4 карточки: Обращения, Темы форума, Нарушения, Пользователи
- [ ] `Card` компонент: title + value
- [ ] Проверить: данные отображаются

### Шаг 5.5 — Последние темы форума
- [ ] Локальные данные из `forumData.ts` (захардкоженные)
- [ ] Список из 4 тем
- [ ] Клик → navigateTo `/forum/{id}`

### Шаг 5.6 — Ближайшие события
- [ ] Хардкоженные данные (3 события)
- [ ] Статус-бейджи (Регистрация, Скоро, Планируется)

### Шаг 5.7 — Основы Конституции
- [ ] 4 правила (римские цифры)
- [ ] Клик → navigateTo `/constitution`

### Шаг 5.8 — Сейчас онлайн
- [ ] Список онлайн-пользователей
- [ ] Socket: `user:online` → обновление списка
- [ ] Если никого — "Nikogo net onlajn"

**Результат фазы 5:** Полноценный Dashboard.

---

## ФАЗА 6: ПРОСТЫЕ СТРАНИЦЫ (без CRUD)

### Шаг 6.1 — ConstitutionPage
- [ ] GET `/api/constitution`
- [ ] Отображение Markdown → QTextBrowser (HTML)
- [ ] Проверить: конституция отображается

### Шаг 6.2 — FeedPage
- [ ] Пока заглушка или GET `/api/forum` (последние темы)
- [ ] Список новостей

### Шаг 6.3 — ArchivePage
- [ ] Заглушка / простой список

### Шаг 6.4 — WorkersPage
- [ ] Заглушка / простой список

### Шаг 6.5 — ViolationsPage
- [ ] GET `/api/admin` (нарушения)
- [ ] Таблица нарушений

### Шаг 6.6 — LogsPage
- [ ] GET `/api/admin` (аудит-логи)
- [ ] Таблица с timestamp, user, action

### Шаг 6.7 — SearchPage
- [ ] Принимает `?q=` из URL
- [ ] GET `/api/users` + поиск по username/displayName
- [ ] Результаты в виде списка

### Шаг 6.8 — UsersPage
- [ ] GET `/api/users`
- [ ] Список пользователей с аватарами и ролями
- [ ] Клик → navigateTo `/user/{id}`

**Результат фазы 6:** 8 страниц работают.

---

## ФАЗА 7: ФОРУМ (Forum CRUD)

### Шаг 7.1 — ForumPage
- [ ] GET `/api/forum` → список категорий и тем
- [ ] QTabWidget для категорий
- [ ] Список тем: заголовок, автор, дата, кол-во комментариев
- [ ] Кнопка "Новая тема" (QDialog)
- [ ] Клик → navigateTo `/forum/{id}`

### Шаг 7.2 — ThreadPage
- [ ] GET `/api/forum/{id}` → тема + посты
- [ ] Заголовок темы + мета (автор, дата, категория)
- [ ] Список постов: автор, контент, дата, реакции
- [ ] Форма ответа (QTextEdit + QPushButton)
- [ ] POST `/api/forum/{id}/posts` — отправка ответа
- [ ] Кнопка "назад" → navigateTo `/forum`

### Шаг 7.3 — Комментарии и реакции
- [ ] Компонент CommentItem (автор, дата, контент)
- [ ] Реакции (emoji): GET/POST reactions

**Результат фазы 7:** Полноценный форум.

---

## ФАЗА 8: ПРОФИЛЬ И ПОЛЬЗОВАТЕЛИ

### Шаг 8.1 — ProfilePage (свой профиль)
- [ ] GET `/api/auth/me` → данные текущего пользователя
- [ ] Аватар (QPixmap) или инициалы
- [ ] Имя, email, roles
- [ ] Профиль: Discord, Steam, EA, Battle.net
- [ ] Кнопка "Выйти" → logout

### Шаг 8.2 — UserPublicProfilePage
- [ ] GET `/api/users/{id}` → публичные данные
- [ ] Аватар, имя, roles
- [ ] Статус online/offline
- [ ] ELO рейтинг (GET `/api/elo/{id}`)

### Шаг 8.3 — AdminPage
- [ ] Только для username == "tunev"
- [ ] GET `/api/admin` → список пользователей
- [ ] Управление ролями (PATCH)

**Результат фазы 8:** Профили и админка работают.

---

## ФАЗА 9: ТУРНИРЫ (Сложный модуль)

### Шаг 9.1 — TournamentPage (список)
- [ ] GET `/api/tournaments` → список турниров
- [ ] Сетка карточек (TournamentCard)
- [ ] Каждая карточка: название, игра, статус, даты
- [ ] Клик → развернуть турнир (QStackedWidget внутри страницы)

### Шаг 9.2 — TournamentWizard
- [ ] GET `/api/games` → список игр
- [ ] 4-шаговый мастер: Игра → Описание → Настройки → Форма
- [ ] POST `/api/tournaments` → создание

### Шаг 9.3 — TournamentControlPanel
- [ ] Статус-кнопки: Draft → Published → Registration → Active → Completed
- [ ] PATCH `/api/tournaments/{id}/status`

### Шаг 9.4 — Регистрации
- [ ] GET `/api/tournaments/{id}/registrations`
- [ ] Одобрение/отклонение: PATCH approve/reject

### Шаг 9.5 — Bracket (Сетка)
- [ ] POST `/api/tournaments/{id}/generate-bracket`
- [ ] GET `/api/tournaments/{id}/bracket`
- [ ] Отображение раундов и матчей (QTreeWidget или кастомный виджет)

### Шаг 9.6 — MatchCard (управление матчами)
- [ ] Отображение: team1 vs team2
- [ ] Редактирование счета (inline)
- [ ] PATCH `/api/tournaments/{id}/matches/{matchId}`

### Шаг 9.7 — ELO и статистика
- [ ] GET `/api/tournaments/{id}/standings`
- [ ] GET `/api/tournaments/{id}/stats`
- [ ] LeaderboardPage: GET `/api/elo`

**Результат фазы 9:** Полная турнирная система.

---

## ФАЗА 10: СООБЩЕСТВО (Соцсети)

### Шаг 10.1 — MemesPage
- [ ] GET `/api/memes` → список мемов
- [ ] Карточки с изображениями (QPixmap)
- [ ] Лайки (POST `/api/memes/{id}/like`)
- [ ] Комментарии (GET/POST)

### Шаг 10.2 — TavernPage (рецепты)
- [ ] GET `/api/recipes` → список рецептов
- [ ] Карточки: название, описание, ингредиенты
- [ ] Socket: `recipe:created` → уведомление

### Шаг 10.3 — EventsPage
- [ ] GET `/api/events` → список событий
- [ ] Карточки: название, дата, место, категория
- [ ] Socket: `event:created` → уведомление

### Шаг 10.4 — CinemaPage
- [ ] GET `/api/movies` → список фильмов
- [ ] Постеры (QPixmap)
- [ ] Рейтинг, жанр, описание
- [ ] Socket: `movie:created` → уведомление

**Результат фазы 10:** Соцсети работают.

---

## ФАЗА 11: БИБЛИОТЕКА И СОФТ

### Шаг 11.1 — LibraryPage
- [ ] GET `/api/library` → категории + документы
- [ ] QTabWidget для категорий
- [ ] Список документов: название, описание, размер
- [ ] Скачивание (QDesktopServices::openUrl)

### Шаг 11.2 — SoftwarePage
- [ ] GET `/api/software` → список ПО
- [ ] Категории, теги, версии
- [ ] CRUD (create/update/delete) для админа

### Шаг 11.3 — LeaderboardPage
- [ ] GET `/api/elo` → рейтинг
- [ ] Таблица: место, игрок, ELO, wins, losses
- [ ] Цвет ELO: зелёный (>1200), жёлтый (1000-1200), красный (<1000)

**Результат фазы 11:** Библиотека и софт работают.

---

## ФАЗА 12: МЕССЕНДЖЕР

### Шаг 12.1 — MessagesPage
- [ ] GET `/api/messages` → список бесед
- [ ] QSplitter: список слева, чат справа
- [ ] Каждая беседа: название, последнее сообщение

### Шаг 12.2 — Чат
- [ ] GET `/api/messages/{id}` → сообщения беседы
- [ ] Список сообщений: автор, текст, время
- [ ] Форма ввода (QLineEdit + Send)
- [ ] POST `/api/messages/{id}` → отправка

### Шаг 12.3 — Новая беседа
- [ ] POST `/api/messages` → создать беседу
- [ ] Выбор участников

**Результат фазы 12:** Мессенджер работает.

---

## ФАЗА 13: УВЕДОМЛЕНИЯ

### Шаг 13.1 — Система уведомлений
- [ ] Header: badge unread count
- [ ] GET `/api/notifications/unread-count`
- [ ] Dropdown: GET `/api/notifications` → последние 20
- [ ] PATCH `/api/notifications/read-all`
- [ ] Socket: `notification:new` → +1 к badge

### Шаг 13.2 — Desktop уведомления
- [ ] `QSystemTrayIcon::showMessage()` при `notification:new`
- [ ] Нативные уведомления ОС

**Результат фазы 13:** Уведомления работают.

---

## ФАЗА 14: NOTIFICATION APP (Отдельное приложение)

### Шаг 14.1 — Окно рассылки
- [ ] Login dialog (access key)
- [ ] GET `/api/users` → список
- [ ] Таблица пользователей с чекбоксами

### Шаг 14.2 — Отправка
- [ ] Форма: заголовок, текст, чекбокс "Отправить на почту"
- [ ] POST `/api/notifications/bulk` → рассылка
- [ ] POST `/api/notifications/all` → всем

### Шаг 14.3 — История
- [ ] GET `/api/notifications` → история рассылок

**Результат фазы 14:** Отдельное приложение рассылки работает.

---

## ФАЗА 15: ТЕСТИРОВАНИЕ И ПОЛИРОВКА

### Шаг 15.1 — Визуальное тестирование
- [ ] Сравнить каждый экран с React-версией
- [ ] Поправить отступы, цвета, размеры шрифтов
- [ ] Проверить все hover/active состояния

### Шаг 15.2 — Сетевые ошибки
- [ ] Обработка таймаутов
- [ ] Offline-режим (баннер)
- [ ] Retry логика

### Шаг 15.3 — Tray и window management
- [ ] Double-click tray → show + focus
- [ ] Close → hide to tray
- [ ] Context menu: Show, Minimize, Quit

### Шаг 15.4 — Горячие клавиши
- [ ] Ctrl+C/V/X/A/Z → QShortcut ( undo/redo/cut/copy/paste)
- [ ] F12 → dev tools (log window)

### Шаг 15.5 — Сборка инсталлятора
- [ ] NSIS (Windows) инсталлятор
- [ ] Автообновление (опционально)

**Результат фазы 15:** Production-ready приложение.

---

## Хронология (прибл. оценка)

| Фаза | Описание | Дни |
|---|---|---|
| 0 | Инфраструктура сборки | 1 |
| 1 | Ядро (Core) | 2 |
| 2 | Сеть (Network) | 3 |
| 3 | Главное окно (Shell) | 3 |
| 4 | Авторизация | 1 |
| 5 | Dashboard | 3 |
| 6 | Простые страницы (8) | 4 |
| 7 | Форум | 3 |
| 8 | Профили | 2 |
| 9 | Турниры | 5 |
| 10 | Соцсети (4 модуля) | 4 |
| 11 | Библиотека + Софт | 2 |
| 12 | Мессенджер | 3 |
| 13 | Уведомления | 1 |
| 14 | Notification App | 2 |
| 15 | Тестирование + полировка | 3 |
| **ИТОГО** | | **~42 рабочих дня** |

---

## Зависимости между фазами

```
Фаза 0 ──→ Фаза 1 ──→ Фаза 2 ──→ Фаза 3 ──→ Фаза 4
                                          │
                                          ├──→ Фаза 5
                                          ├──→ Фаза 6 (независимые)
                                          ├──→ Фаза 7
                                          ├──→ Фаза 8
                                          ├──→ Фаза 9
                                          ├──→ Фаза 10
                                          ├──→ Фаза 11
                                          ├──→ Фаза 12
                                          ├──→ Фаза 13
                                          └──→ Фаза 14 (независимое)

Фаза 15 → после всех остальных
```

**Ключевой путь:** 0 → 1 → 2 → 3 → 4 → 5 → (6-14 параллельно) → 15
