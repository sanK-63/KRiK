import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

interface ArchiveTournament {
    id: number;
    title: string;
    description: string | null;
    format: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    gameName: string | null;
    gameLogo: string | null;
    creator: { username: string; displayName: string | null; surname: string | null };
}

interface ArchiveEvent {
    id: number;
    title: string;
    description: string | null;
    date: string;
    time: string | null;
    location: string | null;
    category: string;
    image: string | null;
    author: { username: string; displayName: string | null; surname: string | null };
}

interface ArchiveForumPost {
    id: number;
    title: string;
    content: string;
    category: string;
    createdAt: string;
    author: { username: string; displayName: string | null; surname: string | null };
}

const tabs = [
    { key: "all", label: "Все" },
    { key: "tournaments", label: "Турниры" },
    { key: "events", label: "Ивенты" },
    { key: "forum", label: "Форум" },
] as const;

type TabKey = typeof tabs[number]["key"];

function formatDate(d: string | null) {
    if (!d) return "—";
    const date = new Date(d.replace(" ", "T"));
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(d: string | null) {
    if (!d) return "—";
    const date = new Date(d.replace(" ", "T"));
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const categoryColors: Record<string, string> = {
    Турнир: "#9C27B0",
    Встреча: "#E91E63",
    Обновление: "#2196F3",
    Релиз: "#4CAF50",
    Буткемп: "#FF9800",
    Попойка: "#D32F2F",
    "Рабочая задача": "#607D8B",
    Другое: "#888",
};

export default function ArchivePage() {
    const [activeTab, setActiveTab] = useState<TabKey>("all");
    const [tournaments, setTournaments] = useState<ArchiveTournament[]>([]);
    const [events, setEvents] = useState<ArchiveEvent[]>([]);
    const [forumPosts, setForumPosts] = useState<ArchiveForumPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${API}/api/archive?tab=${activeTab}`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
                if (data.tournaments) setTournaments(data.tournaments);
                if (data.events) setEvents(data.events);
                if (data.forumPosts) setForumPosts(data.forumPosts);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [activeTab]);

    const totalCount = tournaments.length + events.length + forumPosts.length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-[#FA6814] text-sm" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                    Архив
                </h2>
                {!loading && (
                    <span className="text-[10px] text-gray-500">{totalCount} записей</span>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[#3a3a3a] overflow-x-auto">
                {tabs.map((t) => {
                    const count = t.key === "all" ? totalCount
                        : t.key === "tournaments" ? tournaments.length
                        : t.key === "events" ? events.length
                        : forumPosts.length;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className="text-[10px] px-4 py-2.5 transition-colors"
                            style={{
                                borderBottom: activeTab === t.key ? "2px solid #FA6814" : "2px solid transparent",
                                color: activeTab === t.key ? "#FA6814" : "#666",
                            }}
                        >
                            {t.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#282828] border border-[#3a3a3a] p-4 animate-pulse">
                            <div className="h-3 bg-[#3a3a3a] w-1/3 mb-2" />
                            <div className="h-2 bg-[#3a3a3a] w-2/3" />
                        </div>
                    ))}
                </div>
            ) : totalCount === 0 ? (
                <div className="bg-[#282828] border border-[#3a3a3a] p-8 text-center">
                    <p className="text-gray-500 text-sm">Архив пуст</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Tournaments */}
                    {(activeTab === "all" || activeTab === "tournaments") && tournaments.length > 0 && (
                        <div>
                            {activeTab === "all" && (
                                <h3 className="text-[9px] uppercase font-bold mb-3 text-[#9C27B0] border-b border-[#3a3a3a] pb-2">
                                    Турниры ({tournaments.length})
                                </h3>
                            )}
                            <div className="space-y-2">
                                {tournaments.map((t) => (
                                    <div key={t.id} className="bg-[#282828] border border-[#3a3a3a] p-4 hover:border-[#4a4a4a] transition-colors">
                                        <div className="flex items-start gap-3">
                                            {t.gameLogo && (
                                                <div className="w-10 h-10 bg-[#1e1e1e] border border-[#3a3a3a] flex items-center justify-center overflow-hidden shrink-0">
                                                    <img src={t.gameLogo} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className="text-[9px] px-1.5 py-0.5 border"
                                                        style={{
                                                            color: t.status === "completed" ? "#4CAF50" : "#D32F2F",
                                                            borderColor: t.status === "completed" ? "#4CAF50" : "#D32F2F",
                                                        }}
                                                    >
                                                        {t.status === "completed" ? "Завершён" : "Отменён"}
                                                    </span>
                                                    <span className="text-[9px] text-gray-600">{t.format}</span>
                                                </div>
                                                <h4 className="text-white text-sm font-semibold">{t.title}</h4>
                                                <p className="text-[10px] text-gray-500 mt-1">
                                                    {t.gameName} · {formatDate(t.startDate)}
                                                    {t.endDate && ` — ${formatDate(t.endDate)}`}
                                                </p>
                                                <p className="text-[9px] text-gray-600 mt-1">
                                                    Создатель: {[t.creator.displayName, t.creator.surname].filter(Boolean).join(" ") || t.creator.username}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Events */}
                    {(activeTab === "all" || activeTab === "events") && events.length > 0 && (
                        <div>
                            {activeTab === "all" && (
                                <h3 className="text-[9px] uppercase font-bold mb-3 text-[#E91E63] border-b border-[#3a3a3a] pb-2">
                                    Ивенты ({events.length})
                                </h3>
                            )}
                            <div className="space-y-2">
                                {events.map((e) => (
                                    <div key={e.id} className="bg-[#282828] border border-[#3a3a3a] p-4 hover:border-[#4a4a4a] transition-colors">
                                        <div className="flex items-start gap-3">
                                            {e.image && (
                                                <div className="w-16 h-12 bg-[#1e1e1e] border border-[#3a3a3a] overflow-hidden shrink-0">
                                                    <img src={e.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className="text-[9px] px-1.5 py-0.5"
                                                        style={{
                                                            color: categoryColors[e.category] || "#888",
                                                            border: `1px solid ${categoryColors[e.category] || "#888"}`,
                                                        }}
                                                    >
                                                        {e.category}
                                                    </span>
                                                </div>
                                                <h4 className="text-white text-sm font-semibold">{e.title}</h4>
                                                <p className="text-[10px] text-gray-500 mt-1">
                                                    {formatDate(e.date)}
                                                    {e.time && ` ${e.time}`}
                                                    {e.location && ` · ${e.location}`}
                                                </p>
                                                <p className="text-[9px] text-gray-600 mt-1">
                                                    {[e.author.displayName, e.author.surname].filter(Boolean).join(" ") || e.author.username}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Forum posts */}
                    {(activeTab === "all" || activeTab === "forum") && forumPosts.length > 0 && (
                        <div>
                            {activeTab === "all" && (
                                <h3 className="text-[9px] uppercase font-bold mb-3 text-[#2196F3] border-b border-[#3a3a3a] pb-2">
                                    Форум ({forumPosts.length})
                                </h3>
                            )}
                            <div className="space-y-2">
                                {forumPosts.map((p) => (
                                    <div key={p.id} className="bg-[#282828] border border-[#3a3a3a] p-4 hover:border-[#4a4a4a] transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] px-1.5 py-0.5 border border-[#2196F3] text-[#2196F3]">
                                                {p.category}
                                            </span>
                                            <span className="text-[9px] text-gray-600">{formatDateTime(p.createdAt)}</span>
                                        </div>
                                        <h4 className="text-white text-sm font-semibold">{p.title}</h4>
                                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                                            {p.content.slice(0, 200)}{p.content.length > 200 ? "..." : ""}
                                        </p>
                                        <p className="text-[9px] text-gray-600 mt-2">
                                            {[p.author.displayName, p.author.surname].filter(Boolean).join(" ") || p.author.username}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
