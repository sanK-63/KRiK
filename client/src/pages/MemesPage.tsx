import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";

interface Meme {
    id: number;
    title: string | null;
    image: string;
    category: string;
    likes: number;
    isLiked: boolean;
    commentCount: number;
    author: { id: number; displayName: string | null; username: string; avatar: string | null } | null;
    comments?: MemeComment[];
    createdAt: string;
}

interface MemeComment {
    id: number;
    content: string;
    createdAt: string;
    author: { id: number; displayName: string | null; username: string; avatar: string | null } | null;
}

const tabs = [
    { key: "all", label: "Общая" },
    { key: "local", label: "Локальные" },
    { key: "edits", label: "Эдиты" },
];

export default function MemesPage() {
    const { user } = useUser();
    const socket = useSocket();
    const location = useLocation();
    const openId = (location.state as { openId?: number })?.openId;
    const [memes, setMemes] = useState<Meme[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<Meme | null>(null);
    const [commentText, setCommentText] = useState("");
    const [form, setForm] = useState({ title: "", image: "", category: "general" });

    const load = () => {
        const q = tab === "all" ? "" : `?category=${tab}`;
        fetch(`${import.meta.env.VITE_API_URL}/api/memes${q}`, {
            credentials: "include",
        })
            .then((r) => (r.ok ? r.json() : []))
            .then(setMemes)
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [tab]);

    useEffect(() => {
        if (openId && memes.length > 0 && !selected) {
            const meme = memes.find((m) => m.id === openId);
            if (meme) {
                loadDetail(meme.id);
                window.history.replaceState({}, "");
            }
        }
    }, [openId, memes, selected]);

    useEffect(() => {
        if (!socket) return;
        socket.on("meme:created", (meme: Meme) => {
            setMemes((prev) => {
                if (prev.some((m) => m.id === meme.id)) return prev;
                return [meme, ...prev];
            });
        });
        socket.on("meme:updated", (meme: Meme) => {
            setMemes((prev) => prev.map((m) => m.id === meme.id ? meme : m));
            setSelected((prev) => prev?.id === meme.id ? { ...prev, ...meme } : prev);
        });
        socket.on("meme:deleted", ({ id }: { id: number }) => {
            setMemes((prev) => prev.filter((m) => m.id !== id));
            setSelected((prev) => prev?.id === id ? null : prev);
        });
        socket.on("meme_comment:created", ({ memeId, comment }: { memeId: number; comment: MemeComment }) => {
            setSelected((prev) => {
                if (!prev || prev.id !== memeId) return prev;
                return { ...prev, comments: [...(prev.comments || []), comment], commentCount: (prev.commentCount || 0) + 1 };
            });
            setMemes((prev) => prev.map((m) => m.id === memeId ? { ...m, commentCount: (m.commentCount || 0) + 1 } : m));
        });
        socket.on("meme_comment:deleted", ({ memeId, commentId }: { memeId: number; commentId: number }) => {
            setSelected((prev) => {
                if (!prev || prev.id !== memeId) return prev;
                return { ...prev, comments: (prev.comments || []).filter((c) => c.id !== commentId), commentCount: Math.max(0, (prev.commentCount || 0) - 1) };
            });
            setMemes((prev) => prev.map((m) => m.id === memeId ? { ...m, commentCount: Math.max(0, (m.commentCount || 0) - 1) } : m));
        });
        return () => {
            socket.off("meme:created");
            socket.off("meme:updated");
            socket.off("meme:deleted");
            socket.off("meme_comment:created");
            socket.off("meme_comment:deleted");
        };
    }, [socket]);

    const handleCreate = async () => {
        if (!form.image) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/memes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title: form.title || null, image: form.image, category: form.category }),
        });
        setForm({ title: "", image: "", category: tab === "all" ? "general" : tab });
        setShowForm(false);
        load();
    };

    const handleDelete = async (id: number) => {
        await fetch(`${import.meta.env.VITE_API_URL}/api/memes/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        setSelected(null);
        load();
    };

    const handleLike = async (id: number) => {
        await fetch(`${import.meta.env.VITE_API_URL}/api/memes/${id}/like`, {
            method: "POST",
            credentials: "include",
        });
        load();
        if (selected?.id === id) loadDetail(id);
    };

    const loadDetail = async (id: number) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memes/${id}`, {
            credentials: "include",
        });
        if (res.ok) setSelected(await res.json());
    };

    const handleComment = async () => {
        if (!selected || !commentText.trim()) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/memes/${selected.id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content: commentText }),
        });
        setCommentText("");
        loadDetail(selected.id);
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!selected) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/memes/${selected.id}/comments/${commentId}`, {
            method: "DELETE",
            credentials: "include",
        });
        loadDetail(selected.id);
    };

    const timeAgo = (d: string) => {
        const diff = Date.now() - new Date(d).getTime();
        const min = Math.floor(diff / 60000);
        if (min < 1) return "только что";
        if (min < 60) return `${min}м`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}ч`;
        const days = Math.floor(hr / 24);
        return `${days}д`;
    };

    const isOwner = (m: Meme) => user && m.author?.id === user.id;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl">Мемы</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-[#fa6814] text-white text-sm hover:bg-[#ff7d30]"
                    style={{ borderRadius: 4 }}
                >
                    {showForm ? "Закрыть" : "+ Добавить"}
                </button>
            </div>

            <div className="flex gap-0 border-b border-[#3a3a3a] mb-6 overflow-x-auto">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => { setTab(t.key); setSelected(null); }}
                        className="px-5 py-2.5 text-sm text-gray-400 bg-transparent border-none cursor-pointer hover:text-white transition-colors"
                        style={{
                            borderBottom: tab === t.key ? "2px solid #FA6814" : "2px solid transparent",
                            color: tab === t.key ? "#F2F2F2" : undefined,
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {showForm && (
                <div className="bg-[#282828] border border-[#3a3a3a] p-5 mb-6" style={{ borderRadius: 4 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <input placeholder="Заголовок (необязательно)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                        <input placeholder="Ссылка на изображение*" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }}>
                            <option value="general">Общая</option>
                            <option value="local">Локальные</option>
                            <option value="edits">Эдиты</option>
                        </select>
                    </div>
                    <button onClick={handleCreate} className="px-4 py-2 bg-[#4caf50] text-white text-sm hover:bg-[#3cb371]" style={{ borderRadius: 4 }}>Опубликовать</button>
                </div>
            )}

            {loading ? (
                <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-10 text-center text-gray-500">Загрузка...</div>
            ) : selected ? (
                <div className="max-w-2xl mx-auto">
                    <button onClick={() => setSelected(null)} className="text-sm text-gray-400 hover:text-[#fa6814] mb-4 bg-transparent border-none cursor-pointer">&larr; Назад к ленте</button>

                    <article className="bg-[#282828] border border-[#3a3a3a] mb-4" style={{ borderRadius: 4 }}>
                        <div className="flex items-center gap-3 p-4 pb-2">
                            {selected.author?.avatar ? (
                                <img src={selected.author.avatar} className="w-9 h-9" style={{ borderRadius: 4, objectFit: "cover" }} />
                            ) : (
                                <div className="w-9 h-9 bg-[#2a2a2a] flex items-center justify-center text-[10px] text-gray-400 font-semibold shrink-0" style={{ borderRadius: 4 }}>
                                    {(selected.author?.displayName || selected.author?.username || "?").charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#F2F2F2] truncate">{selected.author?.displayName || selected.author?.username || "—"}</p>
                                <p className="text-[10px] text-gray-500">{timeAgo(selected.createdAt)} назад</p>
                            </div>
                            <span className="px-2 py-0.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-400 text-[10px]">
                                {tabs.find((t) => t.key === selected.category)?.label || selected.category}
                            </span>
                        </div>

                        {selected.title && <p className="px-4 pb-2 text-sm text-[#e0e0e0]">{selected.title}</p>}

                        <img src={selected.image} alt={selected.title || "мем"} className="w-full" />

                        <div className="p-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleLike(selected.id)}
                                    className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-sm"
                                    style={{ color: selected.isLiked ? "#FA6814" : "#808080" }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill={selected.isLiked ? "#FA6814" : "none"} stroke={selected.isLiked ? "#FA6814" : "currentColor"} strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                    {selected.likes}
                                </button>
                                <span className="text-sm text-gray-500">{selected.commentCount || 0}</span>
                                {isOwner(selected) && (
                                    <button onClick={() => handleDelete(selected.id)} className="ml-auto text-xs text-gray-500 hover:text-[#d32f2f] bg-transparent border-none cursor-pointer">Удалить</button>
                                )}
                            </div>
                        </div>
                    </article>

                    <div className="bg-[#282828] border border-[#3a3a3a] p-4" style={{ borderRadius: 4 }}>
                        <h3 className="text-sm text-[#F2F2F2] mb-3">Комментарии ({selected.comments?.length || 0})</h3>

                        <div className="flex gap-2 mb-4">
                            <input
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                                placeholder="Написать комментарий..."
                                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm"
                                style={{ borderRadius: 4 }}
                            />
                            <button
                                onClick={handleComment}
                                disabled={!commentText.trim()}
                                className="px-3 py-2 bg-[#fa6814] text-white text-sm hover:bg-[#ff7d30] disabled:opacity-40"
                                style={{ borderRadius: 4 }}
                            >
                                →
                            </button>
                        </div>

                        {selected.comments && selected.comments.length > 0 ? (
                            <div className="space-y-3">
                                {selected.comments.map((c) => (
                                    <div key={c.id} className="flex items-start gap-2">
                                        {c.author?.avatar ? (
                                            <img src={c.author.avatar} className="w-7 h-7 shrink-0" style={{ borderRadius: 4, objectFit: "cover" }} />
                                        ) : (
                                            <div className="w-7 h-7 bg-[#2a2a2a] flex items-center justify-center text-[9px] text-gray-400 font-semibold shrink-0" style={{ borderRadius: 4 }}>
                                                {(c.author?.displayName || c.author?.username || "?").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs text-[#F2F2F2]">{c.author?.displayName || c.author?.username || "—"}</span>
                                                <span className="text-[10px] text-gray-500">{timeAgo(c.createdAt)}</span>
                                                {user && c.author?.id === user.id && (
                                                    <button onClick={() => handleDeleteComment(c.id)} className="text-[10px] text-gray-500 hover:text-[#d32f2f] bg-transparent border-none cursor-pointer ml-auto">✕</button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-300">{c.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-xs">Пока нет комментариев.</p>
                        )}
                    </div>
                </div>
            ) : memes.length === 0 ? (
                <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-10 text-center text-gray-500">Пока ничего нет. Будьте первым!</div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                    {memes.map((m) => (
                        <article key={m.id} className="bg-[#282828] border border-[#3a3a3a]" style={{ borderRadius: 4 }}>
                            <div className="flex items-center gap-3 p-4 pb-2">
                                {m.author?.avatar ? (
                                    <img src={m.author.avatar} className="w-9 h-9" style={{ borderRadius: 4, objectFit: "cover" }} />
                                ) : (
                                    <div className="w-9 h-9 bg-[#2a2a2a] flex items-center justify-center text-[10px] text-gray-400 font-semibold shrink-0" style={{ borderRadius: 4 }}>
                                        {(m.author?.displayName || m.author?.username || "?").charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[#F2F2F2] truncate">{m.author?.displayName || m.author?.username || "—"}</p>
                                    <p className="text-[10px] text-gray-500">{timeAgo(m.createdAt)} назад</p>
                                </div>
                                <span className="px-2 py-0.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-400 text-[10px]">
                                    {tabs.find((t) => t.key === m.category)?.label || m.category}
                                </span>
                            </div>

                            {m.title && <p className="px-4 pb-2 text-sm text-[#e0e0e0]">{m.title}</p>}

                            <img src={m.image} alt={m.title || "мем"} className="w-full cursor-pointer" onClick={() => { setSelected(m); loadDetail(m.id); }} />

                            <div className="p-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleLike(m.id)}
                                        className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-sm"
                                        style={{ color: m.isLiked ? "#FA6814" : "#808080" }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill={m.isLiked ? "#FA6814" : "none"} stroke={m.isLiked ? "#FA6814" : "currentColor"} strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                        {m.likes}
                                    </button>
                                    <button
                                        onClick={() => { setSelected(m); loadDetail(m.id); }}
                                        className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-sm text-gray-500 hover:text-gray-300"
                                    >
                                        {m.commentCount || 0}
                                    </button>
                                    {isOwner(m) && (
                                        <button onClick={() => handleDelete(m.id)} className="ml-auto text-xs text-gray-500 hover:text-[#d32f2f] bg-transparent border-none cursor-pointer">Удалить</button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}
