const EXPERIENCE_KEY = "knight-experience";
const CURRENT_PAGE_KEY = "knight-current-page";

export function getExperience(): number {
    try {
        const raw = localStorage.getItem(EXPERIENCE_KEY);
        return raw ? parseInt(raw, 10) : 0;
    } catch {
        return 0;
    }
}

export function addExperience(amount: number = 1): number {
    const current = getExperience();
    const next = current + amount;
    try {
        localStorage.setItem(EXPERIENCE_KEY, next.toString());
    } catch {
        // ignore
    }
    return next;
}

export function getExperienceTitle(level: number): string {
    if (level < 5) return "Новичок";
    if (level < 15) return "Послушник";
    if (level < 30) return "Рыцарь";
    if (level < 60) return "Рыцарь-Командор";
    if (level < 100) return "Лорд-Рыцарь";
    if (level < 200) return "Герцог Чатов";
    return "Лорд-Генералиссимус";
}

export function setPageContext(page: string) {
    try {
        localStorage.setItem(CURRENT_PAGE_KEY, page);
    } catch {
        // ignore
    }
}

export function getPageContext(): string {
    try {
        return localStorage.getItem(CURRENT_PAGE_KEY) || "";
    } catch {
        return "";
    }
}

export function getSmartPageButtons(currentPage: string): { label: string; url: string }[] {
    const page = currentPage.replace(/^\//, "").toLowerCase();

    const pageButtons: Record<string, { label: string; url: string }[]> = {
        forum: [
            { label: "Создать пост", url: "/forum" },
            { label: "Турниры", url: "/tournament" },
            { label: "Мемы", url: "/memes" },
        ],
        cinema: [
            { label: "Добавить фильм", url: "/cinema" },
            { label: "Комментарии", url: "/cinema" },
            { label: "Мемы", url: "/memes" },
        ],
        tournament: [
            { label: "Создать турнир", url: "/tournament" },
            { label: "Рейтинг ELO", url: "/leaderboard" },
            { label: "Игры", url: "/tournament" },
        ],
        memes: [
            { label: "Добавить мем", url: "/memes" },
            { label: "Форум", url: "/forum" },
            { label: "Лента", url: "/feed" },
        ],
        events: [
            { label: "Создать ивент", url: "/events" },
            { label: "Календарь", url: "/events" },
            { label: "Форум", url: "/forum" },
        ],
        workers: [
            { label: "Рейтинг", url: "/leaderboard" },
            { label: "Сообщения", url: "/messages" },
            { label: "Форум", url: "/forum" },
        ],
        messages: [
            { label: "Форум", url: "/forum" },
            { label: "Ивенты", url: "/events" },
            { label: "Мемы", url: "/memes" },
        ],
        tavern: [
            { label: "Добавить рецепт", url: "/tavern" },
            { label: "Форум", url: "/forum" },
            { label: "Лента", url: "/feed" },
        ],
        software: [
            { label: "Добавить софт", url: "/software" },
            { label: "Инструкции", url: "/software" },
            { label: "Форум", url: "/forum" },
        ],
        profile: [
            { label: "Работяги", url: "/workers" },
            { label: "Настройки", url: "/profile" },
            { label: "Форум", url: "/forum" },
        ],
        leaderboard: [
            { label: "Турниры", url: "/tournament" },
            { label: "Работяги", url: "/workers" },
            { label: "Исследования", url: "/research" },
        ],
        research: [
            { label: "Калькулятор ELO", url: "/research" },
            { label: "Калькулятор ИМТ", url: "/research" },
            { label: "Лидеры", url: "/leaderboard" },
        ],
        portal: [
            { label: "Библиотека", url: "/library" },
            { label: "Конституция", url: "/constitution" },
            { label: "Документы", url: "/library" },
        ],
        feed: [
            { label: "Форум", url: "/forum" },
            { label: "Кинотека", url: "/cinema" },
            { label: "Ивенты", url: "/events" },
        ],
        constitution: [
            { label: "Правила", url: "/constitution" },
            { label: "Работяги", url: "/workers" },
            { label: "Форум", url: "/forum" },
        ],
    };

    return pageButtons[page] || [
        { label: "Форум", url: "/forum" },
        { label: "Кинотека", url: "/cinema" },
        { label: "Турниры", url: "/tournament" },
    ];
}
