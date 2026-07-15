import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

interface FeedEntry {
    id: string;
    type: string;
    typeLabel: string;
    typeColor: string;
    title: string;
    description: string;
    date: string;
    author: string;
    authorAvatar?: string | null;
    image?: string | null;
    path: string;
    extraId?: number;
}

const TYPE_COLORS: Record<string, string> = {
    форум: "#FA6814",
    ивент: "#4CAF50",
    турнир: "#5B9BD5",
    мем: "#FFB020",
    таверна: "#E63946",
    кино: "#9C27B0",
};

function parseDate(s: string): Date {
    if (!s) return new Date(0);
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    const months: Record<string, number> = {
        "января":0,"февраля":1,"марта":2,"апреля":3,"мая":4,"июня":5,
        "июля":6,"августа":7,"сентября":8,"октября":9,"ноября":10,"декабря":11,
    };
    const parts = s.trim().split(/\s+/);
    if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const month = months[parts[1]];
        const year = parseInt(parts[2]);
        if (!isNaN(day) && month !== undefined && !isNaN(year)) return new Date(year, month, day);
    }
    return new Date(0);
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const d = parseDate(dateStr);
    if (d.getTime() === 0) return "";
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return "только что";
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} дн. назад`;
    return dateStr;
}

export default function FeedPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [entries, setEntries] = useState<FeedEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState<Record<string, boolean>>({});

    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const all: FeedEntry[] = [];

        const safe = async (url: string) => {
            try { const r = await fetch(url, { headers }); return r.ok ? await r.json() : []; } catch { return []; }
        };

        const [forumPosts, events, tournaments, memes, recipes, movies] = await Promise.all([
            safe(`${import.meta.env.VITE_API_URL}/api/forum`).catch(() => []),
            safe(`${import.meta.env.VITE_API_URL}/api/events`).catch(() => []),
            safe(`${import.meta.env.VITE_API_URL}/api/tournaments`).catch(() => []),
            safe(`${import.meta.env.VITE_API_URL}/api/memes`).catch(() => []),
            safe(`${import.meta.env.VITE_API_URL}/api/recipes`).catch(() => []),
            safe(`${import.meta.env.VITE_API_URL}/api/movies`).catch(() => []),
        ]);

        if (Array.isArray(forumPosts)) {
            for (const p of forumPosts) {
                all.push({
                    id: `forum-${p.id}`, type: "форум", typeLabel: "Форум", typeColor: TYPE_COLORS.форум,
                    title: p.title || "Тема", description: p.content?.slice(0, 300) || "",
                    date: p.createdAt || p.created_at || "", author: p.authorName || p.author || "—",
                    authorAvatar: p.authorAvatar || null, path: `/forum/${p.id}`,
                });
            }
        }

        if (Array.isArray(events)) {
            for (const e of events) {
                all.push({
                    id: `event-${e.id}`, type: "ивент", typeLabel: "Ивент", typeColor: TYPE_COLORS.ивент,
                    title: e.title, description: e.description?.slice(0, 300) || "",
                    date: e.createdAt || e.date || "", author: e.authorName || "—",
                    image: e.image || null, path: "/events", extraId: e.id,
                });
            }
        }

        if (Array.isArray(tournaments)) {
            for (const t of tournaments) {
                if (t.status === "draft") continue;
                all.push({
                    id: `tournament-${t.id}`, type: "турнир", typeLabel: "Турнир", typeColor: TYPE_COLORS.турнир,
                    title: t.title, description: t.description?.slice(0, 300) || `${t.gameName || ""} · ${t.status}`,
                    date: t.startDate || t.createdAt || "", author: t.creatorName || "—",
                    authorAvatar: t.creatorAvatar || null, path: "/tournament", extraId: t.id,
                });
            }
        }

        if (Array.isArray(memes)) {
            for (const m of memes) {
                all.push({
                    id: `meme-${m.id}`, type: "мем", typeLabel: "Мем", typeColor: TYPE_COLORS.мем,
                    title: m.title || "Мем", description: "",
                    date: m.createdAt || m.created_at || "", author: m.authorName || m.username || "—",
                    authorAvatar: m.authorAvatar || null, image: m.image || null, path: "/memes", extraId: m.id,
                });
            }
        }

        if (Array.isArray(recipes)) {
            for (const r of recipes) {
                all.push({
                    id: `recipe-${r.id}`, type: "таверна", typeLabel: "Таверна", typeColor: TYPE_COLORS.таверна,
                    title: r.title || "Рецепт", description: r.description?.slice(0, 300) || r.category || "",
                    date: r.createdAt || r.created_at || "", author: r.authorName || "—",
                    path: "/tavern", extraId: r.id,
                });
            }
        }

        if (Array.isArray(movies)) {
            for (const m of movies) {
                all.push({
                    id: `movie-${m.id}`, type: "кино", typeLabel: "Кино", typeColor: TYPE_COLORS.кино,
                    title: m.title, description: m.description?.slice(0, 300) || `${m.genre || ""} · ${m.year || ""}`,
                    date: m.createdAt || m.created_at || "", author: m.addedBy?.displayName || m.addedBy?.username || "—",
                    authorAvatar: m.addedBy?.avatar || null, image: m.poster || null, path: "/cinema", extraId: m.id,
                });
            }
        }

        all.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
        setEntries(all);
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const toggleLike = (id: string) => {
        setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="max-w-lg mx-auto space-y-5">
            {loading ? (
                <div className="text-center py-10 text-gray-500 text-xs">Загрузка...</div>
            ) : entries.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-xs text-gray-500">Лента пуста.</p>
                </div>
            ) : (
                entries.map((entry) => (
                    <div
                        key={entry.id}
                        className="bg-[#1a1a1a] border border-[#2a2a2a]"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3">
                            {entry.authorAvatar ? (
                                <img src={entry.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover object-top ring-2 ring-[#2a2a2a]" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center text-[10px] text-gray-400 font-semibold">
                                    {entry.author[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <span className="text-xs text-white font-medium block truncate">{entry.author}</span>
                                <span className="text-[10px] text-gray-500">{entry.typeLabel}</span>
                            </div>
                            <span className="text-[10px] text-gray-500">{timeAgo(entry.date)}</span>
                        </div>

                        {/* Image */}
                        {entry.image && (
                            <img src={entry.image} alt="" className="w-full" loading="lazy" />
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 px-4 py-2.5">
                            <button
                                onClick={() => toggleLike(entry.id)}
                                className="w-12 h-12 flex items-center justify-center bg-transparent border border-[#3a3a3a] text-xl cursor-pointer transition-colors hover:border-[#D32F2F]"
                                style={{ color: liked[entry.id] ? "#D32F2F" : "#808080" }}
                            >
                                {liked[entry.id] ? "♥" : "♡"}
                            </button>
                            <button
                                onClick={() => navigate(entry.path, { state: { openId: entry.extraId } })}
                                className="w-12 h-12 flex items-center justify-center bg-transparent border border-[#3a3a3a] text-xl cursor-pointer transition-colors hover:border-[#FA6814]"
                                style={{ color: "#808080" }}
                            >
                                💬
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-4 pb-4">
                            <h3
                                className="text-sm text-white font-semibold mb-1 cursor-pointer hover:text-[#FA6814] transition-colors"
                                onClick={() => navigate(entry.path, { state: { openId: entry.extraId } })}
                            >
                                {entry.title}
                            </h3>
                            {entry.description && (
                                <p className="text-xs text-gray-400 leading-relaxed">{entry.description}</p>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
