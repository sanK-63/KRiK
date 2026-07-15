import { useState, useMemo } from "react";
import { useUser } from "../context/UserContext";

interface SoftwareItem {
    id: number;
    category: "софт" | "файлы" | "оптимизация" | "инструкции";
    title: string;
    description: string;
    date: string;
    author: string;
    authorId: number;
    tags: string[];
    downloadUrl?: string;
    downloadLabel?: string;
    version?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    софт: "Софт",
    файлы: "Файлы",
    оптимизация: "Оптимизация",
    инструкции: "Инструкции",
};

const CATEGORY_COLORS: Record<string, string> = {
    софт: "#FA6814",
    файлы: "#4CAF50",
    оптимизация: "#5B9BD5",
    инструкции: "#FFB020",
};

const CATEGORY_ICONS: Record<string, string> = {
    софт: "📦",
    файлы: "📁",
    оптимизация: "⚡",
    инструкции: "📖",
};

const seedItems: SoftwareItem[] = [
    {
        id: 1, category: "софт", title: "Nox App — v2.0.0",
        description: "Полная переработка таймлайна и тепловой карты, добавлены тултипы и демо-данные. Обновлённый интерфейс, исправления ошибок и улучшение производительности.",
        date: "22 мая 2026", author: "sanK-63", authorId: 1, tags: ["Nox App", "Релиз", "Обновление"],
        downloadUrl: "https://github.com/sanK-63/nox-app/releases/tag/v2.0.0", downloadLabel: "Скачать v2.0.0", version: "v2.0.0",
    },
    {
        id: 2, category: "инструкции", title: "Настройка сервера для турниров",
        description: "Пошаговая инструкция по настройке выделенного сервера для проведения киберспортивных турниров. Включает оптимизацию сети и параметры запуска.",
        date: "18 мая 2026", author: "Тунев А.С.", authorId: 1, tags: ["Сервер", "Турниры", "Настройка"],
    },
    {
        id: 3, category: "оптимизация", title: "Оптимизация FPS в CS2",
        description: "Комплексный гайд по настройке графики и системы для максимального FPS в Counter-Strike 2. Конфиги, параметры запуска, настройки Windows.",
        date: "15 мая 2026", author: "Черепков К.В.", authorId: 2, tags: ["CS2", "FPS", "Оптимизация"],
    },
    {
        id: 4, category: "файлы", title: "Конфиги серверов",
        description: "Архив конфигурационных файлов для игровых серверов: CS2, Dota 2, Valorant. Готовые файлы для быстрого развёртывания.",
        date: "12 мая 2026", author: "sanK-63", authorId: 1, tags: ["Конфиги", "Серверы"],
        downloadUrl: "#", downloadLabel: "Скачать архив",
    },
    {
        id: 5, category: "софт", title: "Nox App — v1.5.0",
        description: "Добавлена поддержка Battlefield 6, исправлен баг с отображением тепловой карты, улучшена производительность на больших данных.",
        date: "5 мая 2026", author: "sanK-63", authorId: 1, tags: ["Nox App", "Обновление"],
        downloadUrl: "https://github.com/sanK-63/nox-app/releases/tag/v1.5.0", downloadLabel: "Скачать v1.5.0", version: "v1.5.0",
    },
    {
        id: 6, category: "инструкции", title: "Как создать турнир",
        description: "Подробная инструкция по созданию турнира в корпоративном портале: от настройки формата до генерации сетки и подведения итогов.",
        date: "1 мая 2026", author: "Тунев А.С.", authorId: 1, tags: ["Турниры", "Инструкция"],
    },
    {
        id: 7, category: "оптимизация", title: "Настройка Discord бота",
        description: "Гайд по развёртыванию и настройке Discord-бота для автоматического создания голосовых каналов для турниров и уведомлений.",
        date: "28 апреля 2026", author: "Черепков К.В.", authorId: 2, tags: ["Discord", "Бот", "Настройка"],
    },
    {
        id: 8, category: "файлы", title: "Шаблоны документов",
        description: "Готовые шаблоны .docx для внутренних документов: приказы, протоколы, заявки. Автоматическая генерация через портал.",
        date: "20 апреля 2026", author: "Тунев А.С.", authorId: 1, tags: ["Шаблоны", "Документы"],
        downloadUrl: "#", downloadLabel: "Скачать шаблоны",
    },
];

const tabs = ["Лента", "Софт", "Файлы", "Оптимизация", "Инструкции"];

const catForTab: Record<string, string | null> = {
    "Лента": null, "Софт": "софт", "Файлы": "файлы", "Оптимизация": "оптимизация", "Инструкции": "инструкции",
};

function getCatForTab(tab: string): string | null {
    return catForTab[tab] ?? null;
}

function formatDate(d: Date): string {
    const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function SoftwarePage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("Лента");
    const [items, setItems] = useState<SoftwareItem[]>(seedItems);
    const [showAdd, setShowAdd] = useState(false);

    const [form, setForm] = useState({
        title: "", description: "", tags: "", version: "", downloadUrl: "", downloadLabel: "", category: "софт",
    });

    const currentCat = getCatForTab(activeTab);

    const filteredItems = useMemo(() => {
        if (currentCat === null) return [...items].sort((a, b) => b.id - a.id);
        return items.filter((i) => i.category === currentCat).sort((a, b) => b.id - a.id);
    }, [items, currentCat]);

    const handleAdd = () => {
        if (!form.title.trim() || !form.description.trim() || !user) return;
        const now = new Date();
        const cat = currentCat || form.category;
        const newItem: SoftwareItem = {
            id: Date.now(),
            category: cat as SoftwareItem["category"],
            title: form.title.trim(),
            description: form.description.trim(),
            date: formatDate(now),
            author: user.displayName || user.username,
            authorId: user.id,
            tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
            version: form.version.trim() || undefined,
            downloadUrl: form.downloadUrl.trim() || undefined,
            downloadLabel: form.downloadLabel.trim() || undefined,
        };
        setItems((prev) => [newItem, ...prev]);
        setForm({ title: "", description: "", tags: "", version: "", downloadUrl: "", downloadLabel: "", category: "софт" });
        setShowAdd(false);
    };

    const handleDelete = (id: number) => {
        if (!confirm("Удалить публикацию?")) return;
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    return (
        <div className="max-w-4xl xl:max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                    Софт
                </h1>
                <button
                    onClick={() => { setShowAdd(true); if (currentCat) setForm((p) => ({ ...p, category: currentCat })); }}
                    className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold uppercase hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                >
                    Добавить
                </button>
            </div>

            <div className="flex gap-1 border-b border-[#3b3b3b]">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-4 py-2.5 text-xs uppercase transition-colors cursor-pointer"
                        style={{
                            color: activeTab === tab ? "#FA6814" : "#6b7280",
                            borderBottom: activeTab === tab ? "2px solid #FA6814" : "2px solid transparent",
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {filteredItems.length === 0 ? (
                <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-8 text-center">
                    <p className="text-xs text-gray-500">Пока нет публикаций в этой категории.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="space-y-0"
                            style={{ background: "#2a2a2a", border: "1px solid #3b3b3b" }}
                        >
                            <div className="px-5 py-4 border-b border-[#3b3b3b]">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#212121] border border-[#3b3b3b] flex items-center justify-center text-[10px] text-[#FA6814] font-bold">
                                            {item.author[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="text-xs text-white font-medium">{item.author}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="text-[9px] px-2 py-0.5 uppercase font-semibold"
                                            style={{
                                                color: CATEGORY_COLORS[item.category],
                                                background: `${CATEGORY_COLORS[item.category]}15`,
                                                border: `1px solid ${CATEGORY_COLORS[item.category]}30`,
                                            }}
                                        >
                                            {CATEGORY_LABELS[item.category]}
                                        </span>
                                        <span className="text-[10px] text-gray-500">{item.date}</span>
                                        {user && (user.id === item.authorId || user.username === "tunev") && (
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-gray-600 hover:text-[#D32F2F] text-[10px] transition-colors cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <h2 className="text-base font-bold text-white">{item.title}</h2>
                                <div className="flex gap-2 mt-2">
                                    {item.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[9px] px-2 py-0.5 bg-[#212121] border border-[#3b3b3b] text-gray-400"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="px-5 py-4">
                                <p className="text-xs text-gray-300 leading-relaxed">{item.description}</p>
                            </div>

                            {(item.downloadUrl || item.version) && (
                                <div className="px-5 py-3 border-t border-[#3b3b3b] flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">
                                        {item.version && <>Версия: <span className="text-white">{item.version}</span></>}
                                    </span>
                                    {item.downloadUrl && (
                                        <a
                                            href={item.downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] uppercase px-5 py-2 bg-[#FA6814] text-white font-medium hover:bg-[#FF7D30] transition-colors inline-block"
                                        >
                                            {item.downloadLabel || "Скачать"}
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showAdd && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                    onClick={() => setShowAdd(false)}
                >
                    <div className="w-[550px] max-h-[85vh] overflow-y-auto bg-[#2a2a2a] border border-[#3b3b3b] p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-5">Новая публикация</h3>

                        {!currentCat && (
                            <>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Категория *</label>
                                <div className="flex gap-2 mb-4">
                                    {(["софт", "файлы", "оптимизация", "инструкции"] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setForm({ ...form, category: cat })}
                                            className="px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                                            style={{
                                                background: form.category === cat ? CATEGORY_COLORS[cat] : "#1e1e1e",
                                                color: form.category === cat ? "white" : "#9ca3af",
                                                border: `1px solid ${form.category === cat ? CATEGORY_COLORS[cat] : "#3a3a3a"}`,
                                            }}
                                        >
                                            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {currentCat && (
                            <div className="mb-4">
                                <span
                                    className="text-[10px] px-2 py-0.5 uppercase font-semibold inline-block"
                                    style={{
                                        color: CATEGORY_COLORS[currentCat],
                                        background: `${CATEGORY_COLORS[currentCat]}15`,
                                        border: `1px solid ${CATEGORY_COLORS[currentCat]}30`,
                                    }}
                                >
                                    {CATEGORY_ICONS[currentCat]} {CATEGORY_LABELS[currentCat]}
                                </span>
                            </div>
                        )}

                        <label className="block text-xs uppercase text-gray-400 mb-2">Заголовок *</label>
                        <input
                            type="text" value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Название публикации"
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                        />

                        <label className="block text-xs uppercase text-gray-400 mb-2">Описание *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Описание..."
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-24 mb-4"
                        />

                        <label className="block text-xs uppercase text-gray-400 mb-2">Теги (через запятую)</label>
                        <input
                            type="text" value={form.tags}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            placeholder="Nox App, Релиз, Обновление"
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                        />

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Версия</label>
                                <input
                                    type="text" value={form.version}
                                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                                    placeholder="v2.0.0"
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Ссылка на скачивание</label>
                                <input
                                    type="text" value={form.downloadUrl}
                                    onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                />
                            </div>
                        </div>

                        {form.downloadUrl && (
                            <>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Текст кнопки</label>
                                <input
                                    type="text" value={form.downloadLabel}
                                    onChange={(e) => setForm({ ...form, downloadLabel: e.target.value })}
                                    placeholder="Скачать"
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                                />
                            </>
                        )}

                        <div className="flex justify-end gap-3 mt-5">
                            <button onClick={() => setShowAdd(false)} className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">
                                Отмена
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!form.title.trim() || !form.description.trim()}
                                className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Опубликовать
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
