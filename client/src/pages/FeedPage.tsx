import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

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
    video?: string | null;
    path: string;
    extraId?: number;
    likesCount: number;
    commentsCount: number;
    pollOptions?: string[] | null;
    pollResults?: number[] | null;
    userVote?: number | null;
}

const TYPE_COLORS: Record<string, string> = {
    форум: "#FA6814",
    ивент: "#4CAF50",
    турнир: "#5B9BD5",
    мем: "#FFB020",
    таверна: "#E63946",
    кино: "#9C27B0",
    софт: "#5B9BD5",
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
    const [entries, setEntries] = useState<FeedEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState<Record<string, boolean>>({});
    const socket = useSocket();

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const all: FeedEntry[] = [];

        const safe = async (url: string) => {
            try { const r = await fetch(url, { headers }); return r.ok ? await r.json() : []; } catch { return []; }
        };

        const [forumPosts, events, tournaments, memes, recipes, movies, software] = await Promise.all([
            safe(`${import.meta.env.VITE_API_URL}/api/forum`),
            safe(`${import.meta.env.VITE_API_URL}/api/events`),
            safe(`${import.meta.env.VITE_API_URL}/api/tournaments`),
            safe(`${import.meta.env.VITE_API_URL}/api/memes`),
            safe(`${import.meta.env.VITE_API_URL}/api/recipes`),
            safe(`${import.meta.env.VITE_API_URL}/api/movies`),
            safe(`${import.meta.env.VITE_API_URL}/api/software`),
        ]);

        if (Array.isArray(forumPosts)) {
            for (const p of forumPosts) {
                all.push({
                    id: `forum-${p.id}`, type: "форум", typeLabel: "Форум", typeColor: TYPE_COLORS.форум,
                    title: p.title || "Тема", description: p.content?.slice(0, 300) || "",
                    date: p.created_at || "", author: p.authorName || "—",
                    authorAvatar: p.authorAvatar || null, path: `/forum/${p.id}`,
                    likesCount: 0, commentsCount: p.commentCount || 0,
                    pollOptions: p.pollOptions || null,
                    pollResults: p.pollResults || null,
                    userVote: p.userVote ?? null,
                });
            }
        }

        if (Array.isArray(events)) {
            for (const e of events) {
                all.push({
                    id: `event-${e.id}`, type: "ивент", typeLabel: "Ивент", typeColor: TYPE_COLORS.ивент,
                    title: e.title, description: e.description?.slice(0, 300) || "",
                    date: e.createdAt || e.date || "", author: e.authorName || "—",
                    image: e.image || null, video: e.video || null, path: "/events", extraId: e.id,
                    likesCount: 0, commentsCount: 0,
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
                    likesCount: 0, commentsCount: 0,
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
                    likesCount: m.likes || 0, commentsCount: m.commentCount || 0,
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
                    likesCount: 0, commentsCount: 0,
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
                    likesCount: 0, commentsCount: 0,
                });
            }
        }

        if (Array.isArray(software)) {
            for (const s of software) {
                all.push({
                    id: `software-${s.id}`, type: "софт", typeLabel: "Софт", typeColor: TYPE_COLORS.софт,
                    title: s.title, description: s.description?.slice(0, 300) || "",
                    date: s.createdAt || "", author: s.author?.displayName || s.author?.username || "—",
                    authorAvatar: s.author?.avatar || null, path: "/software", extraId: s.id,
                    likesCount: 0, commentsCount: 0,
                });
            }
        }

        all.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
        setEntries(all);
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        if (!socket) return;

        socket.on("forum:post_created", (p: any) => {
            const entry: FeedEntry = {
                id: `forum-${p.id}`, type: "форум", typeLabel: "Форум", typeColor: TYPE_COLORS.форум,
                title: p.title || "Тема", description: p.content?.slice(0, 300) || "",
                date: p.created_at || "", author: p.authorName || "—",
                authorAvatar: p.authorAvatar || null, path: `/forum/${p.id}`,
                likesCount: 0, commentsCount: p.commentCount || 0,
                pollOptions: p.pollOptions || null, pollResults: p.pollResults || null, userVote: p.userVote ?? null,
            };
            setEntries((prev) => prev.some((e) => e.id === entry.id) ? prev : [entry, ...prev]);
        });

        socket.on("forum:poll_voted", (p: any) => {
            setEntries((prev) => prev.map((e) => {
                if (e.id !== `forum-${p.id}`) return e;
                return { ...e, pollOptions: p.pollOptions, pollResults: p.pollResults, userVote: p.userVote };
            }));
        });

        socket.on("event:created", (e: any) => {
            const entry: FeedEntry = {
                id: `event-${e.id}`, type: "ивент", typeLabel: "Ивент", typeColor: TYPE_COLORS.ивент,
                title: e.title, description: e.description?.slice(0, 300) || "",
                date: e.createdAt || e.date || "", author: e.authorName || "—",
                image: e.image || null, video: e.video || null, path: "/events", extraId: e.id,
                likesCount: 0, commentsCount: 0,
            };
            setEntries((prev) => prev.some((ex) => ex.id === entry.id) ? prev : [entry, ...prev]);
        });

        socket.on("meme:created", (m: any) => {
            const entry: FeedEntry = {
                id: `meme-${m.id}`, type: "мем", typeLabel: "Мем", typeColor: TYPE_COLORS.мем,
                title: m.title || "Мем", description: "",
                date: m.createdAt || m.created_at || "", author: m.authorName || m.username || "—",
                authorAvatar: m.authorAvatar || null, image: m.image || null, path: "/memes", extraId: m.id,
                likesCount: m.likes || 0, commentsCount: m.commentCount || 0,
            };
            setEntries((prev) => prev.some((ex) => ex.id === entry.id) ? prev : [entry, ...prev]);
        });

        socket.on("movie:created", (m: any) => {
            const entry: FeedEntry = {
                id: `movie-${m.id}`, type: "кино", typeLabel: "Кино", typeColor: TYPE_COLORS.кино,
                title: m.title, description: m.description?.slice(0, 300) || `${m.genre || ""} · ${m.year || ""}`,
                date: m.createdAt || m.created_at || "", author: m.addedBy?.displayName || m.addedBy?.username || "—",
                authorAvatar: m.addedBy?.avatar || null, image: m.poster || null, path: "/cinema", extraId: m.id,
                likesCount: 0, commentsCount: 0,
            };
            setEntries((prev) => prev.some((ex) => ex.id === entry.id) ? prev : [entry, ...prev]);
        });

        socket.on("recipe:created", (r: any) => {
            const entry: FeedEntry = {
                id: `recipe-${r.id}`, type: "таверна", typeLabel: "Таверна", typeColor: TYPE_COLORS.таверна,
                title: r.title || r.name || "Рецепт", description: r.description?.slice(0, 300) || r.category || "",
                date: r.createdAt || r.created_at || "", author: r.author?.displayName || r.author?.username || "—",
                path: "/tavern", extraId: r.id,
                likesCount: 0, commentsCount: 0,
            };
            setEntries((prev) => prev.some((ex) => ex.id === entry.id) ? prev : [entry, ...prev]);
        });

        socket.on("software:created", (s: any) => {
            const entry: FeedEntry = {
                id: `software-${s.id}`, type: "софт", typeLabel: "Софт", typeColor: TYPE_COLORS.софт,
                title: s.title, description: s.description?.slice(0, 300) || "",
                date: s.createdAt || "", author: s.author?.displayName || s.author?.username || "—",
                authorAvatar: s.author?.avatar || null, path: "/software", extraId: s.id,
                likesCount: 0, commentsCount: 0,
            };
            setEntries((prev) => prev.some((ex) => ex.id === entry.id) ? prev : [entry, ...prev]);
        });

        return () => {
            socket.off("forum:post_created");
            socket.off("forum:poll_voted");
            socket.off("event:created");
            socket.off("meme:created");
            socket.off("movie:created");
            socket.off("recipe:created");
            socket.off("software:created");
        };
    }, [socket]);

    const toggleLike = (id: string) => {
        setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const votePoll = async (entryId: string, forumId: number, optionIndex: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/forum/${forumId}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ optionIndex }),
            });
            if (!r.ok) return;
            const updated = await r.json();
            setEntries((prev) => prev.map((e) => {
                if (e.id !== entryId) return e;
                return { ...e, pollOptions: updated.pollOptions, pollResults: updated.pollResults, userVote: updated.userVote };
            }));
        } catch {}
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
                        {entry.image && !entry.video && (
                            <img src={entry.image} alt="" className="w-full" loading="lazy" />
                        )}

                        {/* Video */}
                        {entry.video && (
                            <video
                                src={entry.video}
                                controls
                                playsInline
                                muted
                                preload="metadata"
                                loop
                                onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                                className="w-full max-h-[600px] object-contain bg-black cursor-pointer"
                            />
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-5 px-4 py-2.5 border-t border-[#2a2a2a]">
                            <button
                                onClick={() => toggleLike(entry.id)}
                                className="w-10 h-10 flex items-center justify-center bg-transparent border border-[#3a3a3a] text-lg cursor-pointer transition-colors hover:border-[#D32F2F]"
                                style={{ color: liked[entry.id] ? "#D32F2F" : "#808080" }}
                            >
                                {liked[entry.id] ? "♥" : "♡"}
                            </button>
                            <span className="text-xs text-gray-500">{entry.likesCount + (liked[entry.id] ? 1 : 0)}</span>

                            <button
                                onClick={() => navigate(entry.path, { state: { openId: entry.extraId } })}
                                className="w-10 h-10 flex items-center justify-center bg-transparent border border-[#3a3a3a] text-lg cursor-pointer transition-colors hover:border-[#FA6814]"
                                style={{ color: "#808080" }}
                            >
                                💬
                            </button>
                            <span className="text-xs text-gray-500">{entry.commentsCount}</span>
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

                            {/* Poll */}
                            {entry.pollOptions && entry.pollResults && (
                                <div className="mt-3 space-y-2">
                                    {entry.pollOptions.map((option, i) => {
                                        const total = entry.pollResults!.reduce((a, b) => a + b, 0);
                                        const pct = total > 0 ? Math.round((entry.pollResults![i] / total) * 100) : 0;
                                        const isSelected = entry.userVote === i;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    const forumId = parseInt(entry.id.replace("forum-", ""));
                                                    votePoll(entry.id, forumId, i);
                                                }}
                                                className="w-full relative overflow-hidden border text-left px-3 py-2 text-xs cursor-pointer transition-colors"
                                                style={{
                                                    background: isSelected ? "#FA681415" : "#1a1a1a",
                                                    borderColor: isSelected ? "#FA6814" : "#3a3a3a",
                                                    color: isSelected ? "#FA6814" : "#a0a0a0",
                                                }}
                                            >
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 transition-all duration-300"
                                                    style={{ width: `${pct}%`, background: isSelected ? "#FA681410" : "#3a3a3a20" }}
                                                />
                                                <span className="relative z-10 flex justify-between">
                                                    <span>{option}</span>
                                                    <span className="text-gray-500">{pct}%</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                    <p className="text-[10px] text-gray-600">
                                        {entry.pollResults!.reduce((a, b) => a + b, 0)} голосов
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
