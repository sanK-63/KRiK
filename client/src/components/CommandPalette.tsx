import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface CommandItem {
    label: string;
    path: string;
    category: string;
}

const COMMANDS: CommandItem[] = [
    { label: "Главная", path: "/", category: "Навигация" },
    { label: "Лента", path: "/feed", category: "Навигация" },
    { label: "Конституция", path: "/constitution", category: "Навигация" },
    { label: "Форум", path: "/forum", category: "Навигация" },
    { label: "Ивенты", path: "/events", category: "Навигация" },
    { label: "Работяги", path: "/workers", category: "Навигация" },
    { label: "Портал", path: "/portal", category: "Навигация" },
    { label: "Софт", path: "/software", category: "Навигация" },
    { label: "Турниры", path: "/tournament", category: "Навигация" },
    { label: "Кинотека", path: "/cinema", category: "Навигация" },
    { label: "Таверна", path: "/tavern", category: "Навигация" },
    { label: "Мемы", path: "/memes", category: "Навигация" },
    { label: "Лидеры", path: "/leaderboard", category: "Навигация" },
    { label: "Исследования", path: "/research", category: "Навигация" },
    { label: "Библиотека", path: "/library", category: "Навигация" },
    { label: "Архив", path: "/archive", category: "Навигация" },
    { label: "Нарушения", path: "/violations", category: "Админ" },
    { label: "Пользователи", path: "/users", category: "Админ" },
    { label: "Логи", path: "/logs", category: "Админ" },
    { label: "Админ-панель", path: "/admin", category: "Админ" },
    { label: "Поиск", path: "/search", category: "Утилиты" },
    { label: "Профиль", path: "/profile", category: "Утилиты" },
];

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIdx, setSelectedIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const filtered = COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
    );

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            setOpen((prev) => !prev);
        }
    }, []);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (open) {
            setQuery("");
            setSelectedIdx(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        setSelectedIdx(0);
    }, [query]);

    const selectItem = (path: string) => {
        navigate(path);
        setOpen(false);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && filtered[selectedIdx]) {
            selectItem(filtered[selectedIdx].path);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    if (!open) return null;

    const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {});

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div
                className="relative w-full max-w-md bg-[#282828] border border-[#3a3a3a] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center border-b border-[#3a3a3a] px-3">
                    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Найти страницу..."
                        className="flex-1 bg-transparent text-sm text-white px-3 py-3 outline-none placeholder-gray-500"
                    />
                    <kbd className="text-[10px] text-gray-500 border border-[#3a3a3a] px-1.5 py-0.5">ESC</kbd>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                    {Object.entries(grouped).map(([category, items]) => (
                        <div key={category}>
                            <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase">{category}</div>
                            {items.map((item) => {
                                const idx = filtered.indexOf(item);
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => selectItem(item.path)}
                                        onMouseEnter={() => setSelectedIdx(idx)}
                                        className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                                            idx === selectedIdx ? "bg-[#FA6814] text-white" : "text-gray-300 hover:bg-[#2f2f2f]"
                                        }`}
                                    >
                                        {item.label}
                                        <span className={`ml-2 text-[10px] ${idx === selectedIdx ? "text-white/60" : "text-gray-600"}`}>
                                            {item.path}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="px-3 py-6 text-center text-xs text-gray-500">Ничего не найдено</div>
                    )}
                </div>
                <div className="border-t border-[#3a3a3a] px-3 py-1.5 flex items-center gap-4">
                    <span className="text-[10px] text-gray-600">
                        <kbd className="border border-[#3a3a3a] px-1 py-0.5">↑↓</kbd> навигация
                    </span>
                    <span className="text-[10px] text-gray-600">
                        <kbd className="border border-[#3a3a3a] px-1 py-0.5">Enter</kbd> выбрать
                    </span>
                    <span className="text-[10px] text-gray-600">
                        <kbd className="border border-[#3a3a3a] px-1 py-0.5">Ctrl+K</kbd> открыть
                    </span>
                </div>
            </div>
        </div>
    );
}
