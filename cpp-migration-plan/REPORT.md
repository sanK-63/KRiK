# Corporate Portal — Полный отчёт по миграции на C++

---

## ЧАСТЬ 1: ОТЧЁТ АГЕНТА-СКАУТА (Структура проекта)

### Обнаруженные подпроекты

| Подпроект | Тип | Стек |
|---|---|---|
| `corporate-portal-desktop/` | Electron (React 19 + Vite 8 + TS 6 + Tailwind 4) | Десктоп-клиент |
| `corporate-portal/` (client/) | React 19 + Vite 8 + TS 6 + Tailwind 4 | Web-клиент |
| `corporate-portal/` (server/) | Express + better-sqlite3 + Drizzle ORM + Socket.IO + JWT | Бэкенд |
| `notification-app/` | Electron (React 18 + Vite 5 + Tailwind 3) | Утилита рассылки |

### Дерево ключевых файлов

```
сайт/
├── corporate-portal-desktop/          # === PRIMARY MIGRATION TARGET ===
│   ├── electron/
│   │   ├── main.js                    # Electron Main Process (174 строки)
│   │   └── preload.js                 # Context Bridge API (12 строк)
│   ├── src/
│   │   ├── main.tsx                   # React entry point
│   │   ├── App.tsx                    # Router + 26 маршрутов
│   │   ├── context/
│   │   │   ├── UserContext.tsx         # Глоб. состояние пользователя (JWT auth)
│   │   │   └── SocketContext.tsx       # WebSocket (Socket.IO) + натив. уведомления
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx         # TitleBar + Header + Sidebar + Outlet
│   │   │   └── AuthLayout.tsx         # Минималистичный layout логина
│   │   ├── components/
│   │   │   ├── UI/                    # Button, Card, Input (базовые компоненты)
│   │   │   ├── Desktop/               # TitleBar.tsx (кастомная рамка окна)
│   │   │   │                          # OfflineBanner.tsx
│   │   │   ├── Header/                # Header.tsx + Navigation.tsx + UserMenu.tsx
│   │   │   ├── Sidebar.tsx            # Навигация (16 разделов + админ)
│   │   │   ├── Dashboard/             # ActivityFeed, QuickActions, StatCard
│   │   │   ├── Tournament/            # 7 компонентов турниров
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── Codex.tsx
│   │   │   ├── CommentItem.tsx
│   │   │   └── Layout.tsx
│   │   ├── pages/                     # 29 страниц
│   │   │   ├── LoginPage.tsx          # Авторизация по ключу
│   │   │   ├── Dashboard.tsx          # Главная (основатели, статистика, лента)
│   │   │   ├── ForumPage.tsx          # Форум
│   │   │   ├── ThreadPage.tsx         # Тред форума
│   │   │   ├── ConstitutionPage.tsx   # Конституция (Markdown)
│   │   │   ├── ViolationsPage.tsx     # Нарушения
│   │   │   ├── UsersPage.tsx          # Список пользователей
│   │   │   ├── LogsPage.tsx           # Аудит-логи
│   │   │   ├── SearchPage.tsx         # Поиск
│   │   │   ├── TournamentPage.tsx     # Турниры
│   │   │   ├── ArchivePage.tsx        # Архив
│   │   │   ├── MemesPage.tsx          # Мемы
│   │   │   ├── TavernPage.tsx         # Таверна (рецепты)
│   │   │   ├── WorkersPage.tsx        # Работяги
│   │   │   ├── UserPublicProfilePage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SoftwarePage.tsx       # Софт
│   │   │   ├── CinemaPage.tsx         # Кинотека
│   │   │   ├── EventsPage.tsx         # Ивенты
│   │   │   ├── LeaderboardPage.tsx    # Лидерборд (ELO)
│   │   │   ├── FeedPage.tsx           # Лента новостей
│   │   │   ├── LibraryPage.tsx        # Библиотека документов
│   │   │   ├── AdminPage.tsx          # Админ-панель
│   │   │   └── MessagesPage.tsx       # Мессенджер
│   │   ├── services/
│   │   │   ├── software.ts            # CRUD API для ПО
│   │   │   └── tournaments.ts         # CRUD API турниров (100+ строк)
│   │   └── index.css                  # Tailwind 4 + CSS-тема (111 строк)
│   ├── vite.config.ts
│   ├── electron-builder.yml
│   └── package.json
│
├── corporate-portal/
│   ├── server/                        # === SERVER ===
│   │   ├── src/
│   │   │   ├── server.ts              # Entry point
│   │   │   ├── app.ts                 # Express + 19 маршрутов API
│   │   │   ├── config.ts              # Конфигурация (JWT secret, DB path)
│   │   │   ├── socket.ts              # Socket.IO + WebRTC signaling
│   │   │   ├── database/
│   │   │   │   ├── schema.ts          # 587 строк — 40+ таблиц SQLite (Drizzle)
│   │   │   │   ├── index.ts           # better-sqlite3 connection
│   │   │   │   └── migrate.ts
│   │   │   ├── routes/               # 19 файлов маршрутов
│   │   │   ├── modules/              # 11 модулей бизнес-логики
│   │   │   │   ├── audit/
│   │   │   │   ├── auth/
│   │   │   │   ├── constitution/
│   │   │   │   ├── forum/
│   │   │   │   ├── games/
│   │   │   │   ├── notifications/
│   │   │   │   ├── portal/
│   │   │   │   ├── settings/
│   │   │   │   ├── teams/
│   │   │   │   ├── tournament/
│   │   │   │   └── users/
│   │   │   ├── services/
│   │   │   │   ├── elo.ts             # ELO-рейтинг
│   │   │   │   ├── email.ts           # Nodemailer (SMTP)
│   │   │   │   ├── messages.ts        # Мессенджер
│   │   │   │   └── notifications.ts   # Уведомления
│   │   │   ├── core/
│   │   │   │   ├── audit.ts           # Аудит действий
│   │   │   │   ├── eventBus.ts        # Внутренний event bus
│   │   │   │   ├── logger.ts          # Логирование
│   │   │   │   └── permissions.ts     # RBAC
│   │   │   └── middleware/            # Auth middleware
│   │   └── package.json
│   │
│   └── client/                        # === WEB CLIENT (дубликат десктопа) ===
│       └── src/                       # Та же структура, что и desktop
│
└── notification-app/                  # === MINI-APP ===
    ├── electron/main.js               # Простой BrowserWindow
    └── src/
        ├── App.tsx                    # 356 строк — login + рассылка
        └── api.ts                     # API-клиент
```

### Ключевые цифры

| Метрика | Значение |
|---|---|
| Всего TSX/TS файлов (desktop) | ~50+ |
| Страниц (desktop) | 26 |
| Компонентов (desktop) | ~25 |
| API-эндпоинтов (server) | 19 маршрутов (~100+ endpoints) |
| Таблиц БД (SQLite) | 40+ |
| Модулей серверной логики | 11 |
| Строк схемы БД | 587 |

---

## ЧАСТЬ 2: ОТЧЁТ АГЕНТА IPC И STATE (Связи и коммуникация)

### 2.1. IPC-каналы Electron

| Канал | Направление | Тип | Описание |
|---|---|---|---|
| `window:minimize` | Renderer→Main | `ipcRenderer.send` | Сворачивание окна |
| `window:maximize` | Renderer→Main | `ipcRenderer.send` | Максимизация/восстановление |
| `window:close` | Renderer→Main | `ipcRenderer.send` | Закрытие (скрытие в трей) |
| `window:isMaximized` | Renderer→Main | `ipcRenderer.invoke` | Проверка состояния окна |
| `notification:show` | Renderer→Main | `ipcRenderer.send` | Нативные уведомления ОС |
| `app:getPlatform` | Renderer→Main | `ipcRenderer.invoke` | Определение платформы |
| `ipc-menu-action` | Main→Renderer | `webContents.send` | Обработка Ctrl+C/V/X/A/Z |

### 2.2. State Management (React)

**Контексты (React Context):**

1. **UserContext** — Глобальное состояние пользователя:
   - `user: UserData | null` — профиль с ролями и соцсетями
   - `loading: boolean` — статус загрузки
   - `setUser(u)` — обновление
   - `logout()` — выход (очистка localStorage)
   - Инициализация: GET `/api/auth/me` с Bearer-токеном

2. **SocketContext** — WebSocket-подключение:
   - Синглтон `Socket` через `socket.io-client`
   - События: `notification:new`, `recipe:created`, `movie:created`, `meme:created`, `event:created`
   - Интеграция с Electron: `window.electronAPI.showNotification()` или браузерный Notification API

**Локальный state (useState в компонентах):**
- Каждая страница хранит свои данные через `useState` + `useEffect` для fetch
- Паттерн: `useEffect(() => { fetch(url, {headers: {Authorization}}).then(setData) }, [deps])`
- Нет Redux/Zustand — чистый React Context + локальный state

### 2.3. API-клиенты

Все запросы идут на `${VITE_API_URL}` (Express-сервер):

| Модуль | Методы | Эндпоинты |
|---|---|---|
| Auth | POST/GET | `/api/auth/key-login`, `/api/auth/me` |
| Users | GET | `/api/users`, `/api/users/:id` |
| Notifications | GET/PATCH | `/api/notifications`, `/api/notifications/unread-count`, `/api/notifications/read-all` |
| Forum | CRUD | `/api/forum/*` |
| Tournaments | CRUD+ | `/api/tournaments/*` (регистрации, скобки, матчи, ELO) |
| Games | CRUD | `/api/games` |
| Templates | CRUD | `/api/tournament-templates` |
| Software | CRUD | `/api/software` |
| Movies | CRUD | `/api/movies`, `/api/tmdb` |
| Memes | CRUD | `/api/memes` |
| Events | CRUD | `/api/events` |
| Library | CRUD | `/api/library` |
| Constitution | GET | `/api/constitution` |
| Messages | CRUD | `/api/messages` |
| Recipes | CRUD | `/api/recipes` |
| Admin | GET | `/api/admin/*` |
| ELO | GET | `/api/elo` |

### 2.4. Авторизация

- **Механизм**: Access Key → POST `/api/auth/key-login` → JWT (Bearer token)
- **Хранение**: `localStorage.setItem("token", ...)`
- **Передача**: `Authorization: Bearer ${token}` в заголовке каждого запроса
- **Socket.IO**: `auth: { token }` в handshake
- **ProtectectedRoute**: Простая проверка `localStorage.getItem("token")`

### 2.5. Узкие места при миграции (Bottlenecks)

| Проблема | JS-реализация | C++ эквивалент |
|---|---|---|
| **async/await + fetch** | Нативный JS event loop | `std::async` + `libcurl` или Qt `QNetworkAccessManager` |
| **React reactivity** | Virtual DOM diffing | `signals/slots` (Qt) или property bindings (QML) |
| **Socket.IO** | Библиотека клиента | `libsocketio` или Qt WebSocket +自己実装 протокола |
| **JWT decode/verify** | `jsonwebtoken` библиотека | `jwt-cpp` или OpenSSL HMAC |
| **bcrypt** | `bcryptjs` | `libbcrypt` или `OpenSSL EVP` |
| **SQLite** | `better-sqlite3` (синхронный) | `sqlite3` C API (асинхронный callback) или `QtSql` |
| **React Router** | `react-router-dom` v7 | `QStackedWidget` + `QStateMachine` или `Slint` Navigation |
| **Tailwind CSS** | JIT-стили в рантайме | QSS (Qt Style Sheets) или QML styling |
| **localStorage** | Web Storage API | `QSettings` или SQLite-таблица |
| **File uploads** | `multer` (multipart) | `QNetworkRequest` с multipart body |
| **Notifications** | Electron `Notification` API | `QSystemTrayIcon` + `QNotification` |
| **Framer Motion** | CSS-анимации React | `QPropertyAnimation` |
| **WebRTC signaling** | Socket.IO relay | Same signaling, native WebRTC lib |

---

## ЧАСТЬ 3: ОТЧЁТ АГЕНТА C++ GUI (Выбор GUI-фреймворка)

### 3.1. Сравнение альтернатив

| Критерий | Qt 6 (Widgets + QML) | Slint | wxWidgets |
|---|---|---|---|
| Кастомные рамки окна | ✅ `Qt::FramelessWindowHint` | ✅ через style | ⚠️ Сложнее |
| System Tray | ✅ `QSystemTrayIcon` | ❌ Нет | ✅ |
| Нативные уведомления | ✅ `QNotification` | ❌ | ⚠️ Платформозависимо |
| Вебсокеты | ✅ `QWebSocket` | ❌ (нужна внешняя lib) | ❌ |
| SQLite | ✅ `QtSql` / прямой C API | ❌ | ✅ через wxSQLite3 |
| HTTP клиент | ✅ `QNetworkAccessManager` | ❌ | ❌ (нужен libcurl) |
| Markdown рендер | ✅ `QTextBrowser` + HTML | ⚠️ Ограничен | ✅ |
| Анимации | ✅ `QPropertyAnimation` | ✅ Built-in | ❌ |
| Стилизация (тема) | ✅ QSS (аналог CSS) | ✅ Built-in | ⚠️ Плохая |
| Лицензия | LGPL / Commercial | GPLv3 / Commercial | wxWindows (LGPL) |
| Зрелость | 30+ лет | 2020+ | 25+ лет |

### 3.2. Рекомендация: **Qt 6 (Widgets)**

**Причины:**
1. `Qt::FramelessWindowHint` + ручная отрисовка заголовка — прямой аналог кастомного Electron TitleBar
2. `QSystemTrayIcon` — замена Electron Tray
3. `QWebSocket` — замена socket.io-client
4. `QSqlDatabase` (sqlite) — встроенная работа с БД
5. `QNetworkAccessManager` — замена fetch/axios
6. `QSettings` — замена localStorage
7. `QSS` — стилизация, близкая к CSS (tailwind конвертируется в QSS)
8. `QPropertyAnimation` — замена framer-motion

**Если нужна pixel-perfect адаптация стилей:**
- Можно использовать `Qt WebEngine` для рендеринга QML-страниц как "мини-Browser"
- Или использовать `QWebChannel` для гибридного подхода

---

## ЧАСТЬ 4: ДОРОЖНАЯ КАРТА МИГРАЦИИ (Главный Архитектор)

### Архитектура целевого C++ приложения

```
┌─────────────────────────────────────────────────────┐
│                  Qt 6 Application                    │
│                                                      │
│  ┌──────────────┐  ┌─────────────────────────────┐  │
│  │  Main Process│  │      GUI Layer (Qt Widgets) │  │
│  │  (MainWindow)│  │                             │  │
│  │              │  │  QMainWindow                │  │
│  │  ├─ TrayIcon │  │  ├─ CustomTitleBar          │  │
│  │  ├─ MenuBar  │  │  ├─ HeaderWidget            │  │
│  │  └─ IPC      │  │  ├─ SidebarWidget           │  │
│  │              │  │  ├─ ContentStack (QStackedW) │  │
│  │              │  │  │  ├─ DashboardPage          │  │
│  │              │  │  │  ├─ ForumPage              │  │
│  │              │  │  │  ├─ TournamentPage         │  │
│  │              │  │  │  ├─ ... (26 pages)         │  │
│  │              │  │  └─ StatusBar                │  │
│  └──────┬───────┘  └─────────────┬───────────────┘  │
│         │                        │                   │
│  ┌──────┴────────────────────────┴───────────────┐  │
│  │              Core / Service Layer              │  │
│  │                                                │  │
│  │  ├─ AuthManager (JWT, sessions)                │  │
│  │  ├─ HttpClient (QNetworkAccessManager)         │  │
│  │  ├─ SocketManager (QWebSocket)                 │  │
│  │  ├─ DatabaseManager (SQLite3 / QtSql)          │  │
│  │  ├─ NotificationManager (QSystemTrayIcon)      │  │
│  │  ├─ ELO Calculator                             │  │
│  │  ├─ EventBus (pub/sub)                         │  │
│  │  └─ Logger                                     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │         Data / Model Layer                     │  │
│  │                                                │  │
│  │  ├─ UserModel                                  │  │
│  │  ├─ ForumModel                                 │  │
│  │  ├─ TournamentModel                            │  │
│  │  ├─ NotificationModel                          │  │
│  │  ├─ MovieModel                                 │  │
│  │  ├─ EventModel                                 │  │
│  │  ├─ MessageModel                               │  │
│  │  └─ ... (все 40+ таблиц)                       │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Карта соответствия компонентов

| React/JS | C++ (Qt 6) |
|---|---|
| `App.tsx` (Router) | `QStackedWidget` с 26 стеками + `QStateMachine` |
| `MainLayout.tsx` | `QMainWindow` с `QDockWidget` (Sidebar) |
| `AuthLayout.tsx` | `QDialog` или `QStackedWidget::setCurrentIndex(0)` |
| `TitleBar.tsx` | `QWidget` с `Qt::FramelessWindowHint`, mouse drag |
| `Header.tsx` | `QToolBar` или кастомный `QWidget` |
| `Sidebar.tsx` | `QListWidget` с `QStyledItemDelegate` |
| `LoginPage.tsx` | `QDialog` с `QLineEdit` + `QPushButton` + `QProgressBar` |
| `Dashboard.tsx` | `QWidget` с `QGridLayout` |
| `ForumPage.tsx` | `QScrollArea` + `QVBoxLayout` с `ForumItem widgets` |
| `TournamentPage.tsx` | `QTabWidget` + `QTreeWidget` (bracket) |
| `MessagesPage.tsx` | `QSplitter` (список/чат) |
| `ChatWindow.tsx` | `QTextEdit` + `QLineEdit` |
| `SocketContext.tsx` | `SocketManager` (QWebSocket singleton) |
| `UserContext.tsx` | `AuthManager` (синглтон, `Q_PROPERTY`) |
| `fetch()` calls | `QNetworkAccessManager::get/post/put/delete` |
| `localStorage` | `QSettings` |
| `react-router-dom` | `QStackedWidget` + custom routing logic |
| `framer-motion` | `QPropertyAnimation` |
| `tailwindcss` | QSS (Qt Style Sheets) |
| `lucide-react` icons | `QIcon::fromTheme` или SVG |
| Electron IPC | `Q_INVOKABLE` методы + `Q_SIGNAL` / `Q_SLOT` |
| `notification-app` | `QWidget` с `QTableWidget` + `QPushButton` |

### План миграции по этапам

#### Этап 1: Ядро и инфраструктура (2-3 недели)
```
Создать:
├── src/main.cpp                    # QApplication entry
├── src/CMakeLists.txt              # CMake build system
├── src/core/
│   ├── Application.h/.cpp          # Singleton QApplication wrapper
│   ├── Config.h/.cpp               # QSettings-based config
│   ├── Logger.h/.cpp               # Логирование (spdlog)
│   ├── EventBus.h/.cpp             # Signal-slot event bus
│   └── DatabaseManager.h/.cpp      # SQLite connection pool
├── src/network/
│   ├── HttpClient.h/.cpp           # QNetworkAccessManager wrapper
│   ├── WebSocketClient.h/.cpp      # QWebSocket (Socket.IO протокол)
│   └── AuthInterceptor.h/.cpp      # JWT Bearer injection
└── src/models/
    └── UserModel.h/.cpp            # Первичная модель пользователя
```

#### Этап 2: Авторизация и пользователи (1-2 недели)
```
Реализовать:
├── AuthManager (JWT login/me/logout)
├── UserModel (CRUD + roles + profile)
├── LoginPage (QDialog с QLineEdit + QProgressBar)
├── TitleBar (FramelessWindow + tray icon)
└── Главное окно (QMainWindow)
```

#### Этап 3: Навигация и layout (1 неделя)
```
Реализовать:
├── MainLayout (QMainWindow + QDockWidget sidebar)
├── SidebarWidget (QListWidget + стили)
├── HeaderWidget (поиск + уведомления + меню пользователя)
├── ContentStack (QStackedWidget на 26 страниц)
└── OfflineBanner
```

#### Этап 4: Базовые страницы (3-4 недели)
```
Реализовать (по приоритету):
├── Dashboard (основатели, статы, лента)
├── ForumPage + ThreadPage (форум CRUD)
├── UsersPage (список)
├── ProfilePage + UserPublicProfilePage
├── ConstitutionPage (Markdown viewer)
├── ViolationsPage
├── LogsPage
├── SearchPage
└── AdminPage (если нужен)
```

#### Этап 5: Продвинутые модули (3-4 недели)
```
Реализовать:
├── TournamentPage + 7 sub-components (Wizard, Bracket, Matches)
├── CinemaPage (TMDB интеграция)
├── EventsPage
├── MemesPage (загрузка файлов)
├── TavernPage (рецепты)
├── LibraryPage (документы)
├── SoftwarePage (каталог)
├── FeedPage (лента новостей)
├── LeaderboardPage (ELO)
├── ArchivePage
├── MessagesPage (реалтайм чат)
├── WorkersPage
└── Notification system (QSystemTrayIcon)
```

#### Этап 6: Notification App (1 неделя)
```
Реализовать (отдельное окно):
├── Login dialog (access key)
├── User list with checkboxes
├── Compose form (title, body, email toggle)
├── History view
└── HTTP API client
```

#### Этап 7: Полировка и сборка (1-2 недели)
```
Финализация:
├── QSS тема (pixel-perfect как в React)
├── Анимации переходов (QPropertyAnimation)
├── Контекстное меню
├── Обработка ошибок
├── Offline-режим
├── Автообновление (опционально)
├── Инсталлятор (NSIS / WiX)
└── Тестирование
```

### Пример идиоматичного C++ кода

#### Заголовок главного окна
```cpp
// mainwindow.h
#pragma once
#include <QMainWindow>
#include <QStackedWidget>
#include <QDockWidget>
#include <QWebSocket>
#include <QNetworkAccessManager>
#include <QSettings>

class SidebarWidget;
class HeaderWidget;
class TitleBar;
class AuthManager;

class MainWindow : public QMainWindow {
    Q_OBJECT
    Q_PROPERTY(bool sidebarOpen READ isSidebarOpen WRITE setSidebarOpen NOTIFY sidebarOpenChanged)

public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow() override;

    bool isSidebarOpen() const { return m_sidebarOpen; }

public slots:
    void setSidebarOpen(bool open);
    void navigateTo(const QString &route);
    void showLogin();
    void showMainContent();

signals:
    void sidebarOpenChanged(bool open);
    void userLoggedIn(const QJsonObject &user);
    void notificationReceived(const QString &title, const QString &body);

protected:
    void closeEvent(QCloseEvent *event) override;

private:
    void setupUi();
    void setupTray();
    void setupSocket();
    void loadStyleSheet();
    void registerPages();

    bool m_sidebarOpen = true;
    QStackedWidget *m_contentStack = nullptr;
    QDockWidget *m_sidebarDock = nullptr;
    TitleBar *m_titleBar = nullptr;
    HeaderWidget *m_header = nullptr;
    SidebarWidget *m_sidebar = nullptr;
    AuthManager *m_auth = nullptr;
    QWebSocket *m_socket = nullptr;
    QNetworkAccessManager *m_network = nullptr;
    QSettings m_settings;
};
```

#### Реализация авторизации
```cpp
// authmanager.h
#pragma once
#include <QObject>
#include <QNetworkAccessManager>
#include <QJsonObject>

class AuthManager : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool isLoggedIn READ isLoggedIn NOTIFY loggedInChanged)
    Q_PROPERTY(QString token READ token NOTIFY tokenChanged)
    Q_PROPERTY(QJsonObject user READ user NOTIFY userChanged)

public:
    static AuthManager *instance();

    bool isLoggedIn() const { return m_loggedIn; }
    QString token() const { return m_token; }
    QJsonObject user() const { return m_user; }

    void setApiUrl(const QString &url) { m_apiUrl = url; }

public slots:
    void login(const QString &key);
    void logout();
    void fetchCurrentUser();

signals:
    void loggedInChanged(bool loggedIn);
    void tokenChanged(const QString &token);
    void userChanged(const QJsonObject &user);
    void loginError(const QString &error);
    void loginProgress(int percent);

private:
    explicit AuthManager(QObject *parent = nullptr);

    void saveToken();
    void loadToken();
    QNetworkRequest authedRequest(const QString &path) const;

    bool m_loggedIn = false;
    QString m_token;
    QJsonObject m_user;
    QString m_apiUrl;
    QNetworkAccessManager *m_network;
};
```

#### WebSocket клиент
```cpp
// socketmanager.h
#pragma once
#include <QObject>
#include <QWebSocket>
#include <QJsonObject>

class SocketManager : public QObject {
    Q_OBJECT

public:
    static SocketManager *instance();

    void connectToServer(const QString &url, const QString &token);
    void disconnect();
    void emitEvent(const QString &event, const QJsonObject &data = {});

signals:
    void connected();
    void disconnected();
    void notificationNew(const QString &title, const QString &body);
    void recipeCreated();
    void movieCreated();
    void memeCreated();
    void eventCreated();
    void userOnline(int userId);
    void rawEvent(const QString &event, const QJsonObject &data);

private:
    explicit SocketManager(QObject *parent = nullptr);

    void handleMessage(const QString &message);
    QJsonObject parseSocketIOPacket(const QString &raw) const;

    QWebSocket *m_socket = nullptr;
    QString m_url;
};
```

---

## СВОДНАЯ ТАБЛИЦА ЗАВИСИМОСТЕЙ JS → C++

| npm-пакет | C++ замена | Готово в Qt? |
|---|---|---|
| react / react-dom | Qt Widgets / QML | ✅ |
| react-router-dom | QStackedWidget routing | ✅ (ручная реализация) |
| socket.io-client | QWebSocket +自己协议 | ⚠️ (нужна обёртка Socket.IO) |
| axios / fetch | QNetworkAccessManager | ✅ |
| framer-motion | QPropertyAnimation | ✅ |
| lucide-react | SVG icons / QIcon | ✅ |
| clsx | QSS dynamic property | ✅ |
| tailwindcss | QSS | ✅ (ручная конвертация) |
| jsonwebtoken | jwt-cpp + OpenSSL | ✅ (3rd party) |
| bcryptjs | libbcrypt | ✅ (3rd party) |
| better-sqlite3 | sqlite3 C API / QtSql | ✅ |
| electron (Tray, Notification) | QSystemTrayIcon, QNotification | ✅ |
| electron (IPC) | Q_INVOKABLE + signals/slots | ✅ |
| drizzle-orm | Прямые SQL запросы | ✅ |
| multer | QHttpMultiPart | ✅ |
| nodemailer | QSslSocket + SMTP | ✅ (или libcurl) |

---

## ИТОГОВАЯ ОЦЕНКА

| Параметр | Значение |
|---|---|
| Сложность миграции | **Высокая** (26 страниц, 40+ таблиц БД, real-time) |
| Приблизительный объём C++ кода | 15 000–25 000 строк |
| Приблизительное время | 12–18 недель (1 разработчик) |
| Рекомендуемый стек | Qt 6.7+ / C++20 / SQLite3 / OpenSSL / spdlog |
| Критические риски | Socket.IO протокол (нужна совместимость), QSS vs Tailwind (визуальная точность) |
