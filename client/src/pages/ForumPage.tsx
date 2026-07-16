import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";

const API = import.meta.env.VITE_API_URL;

interface ForumPost {
    id: number;
    category: string;
    title: string;
    content: string;
    pinned: number;
    authorName: string;
    authorAvatar: string | null;
    commentCount: number;
    created_at: string;
    pollOptions?: string[] | null;
    pollResults?: number[] | null;
    userVote?: number | null;
}

const categories = [
    { label: "Форум", color: "#2196F3" },
    { label: "Новость", color: "#4CAF50" },
    { label: "Объявление", color: "#FA6814" },
    { label: "Документ", color: "#9C27B0" },
    { label: "Голосование", color: "#FFB020" },
];

function timeAgo(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr.replace(" ", "T"));
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "только что";
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} дн. назад`;
    return dateStr;
}

export default function ForumPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ category: "Форум", title: "", content: "" });
    const [pollEnabled, setPollEnabled] = useState(false);
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const socket = useSocket();

    const headers: Record<string, string> = { "Content-Type": "application/json" };

    useEffect(() => {
        fetch(`${API}/api/forum`, { headers, credentials: "include" })
            .then((r) => r.json())
            .then((data) => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on("forum:post_created", (post: ForumPost) => {
            setPosts((prev) => prev.some((p) => p.id === post.id) ? prev : [post, ...prev]);
        });
        socket.on("forum:post_updated", (post: ForumPost) => {
            setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
        });
        socket.on("forum:post_deleted", ({ id }: { id: number }) => {
            setPosts((prev) => prev.filter((p) => p.id !== id));
        });
        return () => {
            socket.off("forum:post_created");
            socket.off("forum:post_updated");
            socket.off("forum:post_deleted");
        };
    }, [socket]);

    const handleCreate = async () => {
        if (!form.title.trim() || !form.content.trim()) return;
        const body: any = { title: form.title.trim(), content: form.content.trim(), category: form.category };
        if (pollEnabled) {
            const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
            if (opts.length >= 2) body.pollOptions = opts;
        }
        try {
            const res = await fetch(`${API}/api/forum`, { method: "POST", headers, credentials: "include", body: JSON.stringify(body) });
            if (res.ok) {
                const post = await res.json();
                setPosts((prev) => [post, ...prev]);
                setForm({ category: "Форум", title: "", content: "" });
                setPollEnabled(false);
                setPollOptions(["", ""]);
                setShowModal(false);
            }
        } catch {}
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Удалить тему?")) return;
        try {
            await fetch(`${API}/api/forum/${id}`, { method: "DELETE", headers, credentials: "include" });
            setPosts((prev) => prev.filter((p) => p.id !== id));
        } catch {}
    };

    const addPollOption = () => {
        if (pollOptions.length < 8) setPollOptions([...pollOptions, ""]);
    };

    const removePollOption = (i: number) => {
        if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, idx) => idx !== i));
    };

    const updatePollOption = (i: number, val: string) => {
        const copy = [...pollOptions];
        copy[i] = val;
        setPollOptions(copy);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl">Форум <span className="text-sm text-gray-500 align-middle">({posts.length})</span></h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold uppercase hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                >
                    Новая тема
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500 text-xs">Загрузка...</div>
            ) : (
                <div className="space-y-3">
                    {posts.map((post) => {
                        const cat = categories.find((c) => c.label === post.category) || categories[0];
                        return (
                            <div
                                key={post.id}
                                className="bg-[#2a2a2a] border border-[#3b3b3b] p-5 hover:border-[#4a4a4a] transition-colors cursor-pointer"
                                onClick={() => navigate(`/forum/${post.id}`)}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {post.pinned ? (
                                        <span className="text-xs text-[#FA6814] uppercase font-semibold">Закреплено</span>
                                    ) : null}
                                    <span
                                        className="text-[10px] uppercase font-semibold px-2 py-0.5"
                                        style={{
                                            color: cat.color,
                                            background: `${cat.color}15`,
                                            border: `1px solid ${cat.color}30`,
                                        }}
                                    >
                                        {post.category}
                                    </span>
                                    {post.pollOptions && (
                                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 text-[#FFB020] bg-[#FFB02015] border border-[#FFB02030]">
                                            Голосование
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-base font-semibold mb-2">{post.title}</h3>

                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{post.content.split("\n")[0]}</p>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-4">
                                        <span>{post.authorName}</span>
                                        <span>{timeAgo(post.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span>{post.commentCount}</span>
                                        {user && (user.id === (post as any).author_id || user.username === "tunev") && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                                                className="text-gray-600 hover:text-[#D32F2F] transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                    onClick={() => setShowModal(false)}
                >
                    <div className="w-full max-w-[600px] mx-4 bg-[#2a2a2a] border border-[#3b3b3b] p-5 sm:p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-5">Новая тема</h3>

                        <label className="block text-xs uppercase text-gray-400 mb-2">Категория</label>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4 cursor-pointer"
                        >
                            {categories.map((c) => (
                                <option key={c.label} value={c.label}>{c.label}</option>
                            ))}
                        </select>

                        <label className="block text-xs uppercase text-gray-400 mb-2">Заголовок</label>
                        <input
                            type="text"
                            placeholder="Введите заголовок..."
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                        />

                        <label className="block text-xs uppercase text-gray-400 mb-2">Текст</label>
                        <textarea
                            placeholder="Напишите содержание темы..."
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-32 mb-4"
                        />

                        <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => setPollEnabled(!pollEnabled)}>
                            <div
                                className="w-5 h-5 border flex items-center justify-center transition-colors shrink-0"
                                style={{
                                    borderColor: pollEnabled ? "#FA6814" : "#3a3a3a",
                                    background: pollEnabled ? "#FA6814" : "transparent",
                                }}
                            >
                                {pollEnabled && (
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <label className="text-xs text-gray-400 cursor-pointer">Добавить голосование</label>
                        </div>

                        {pollEnabled && (
                            <div className="mb-4 space-y-2">
                                <label className="block text-xs uppercase text-gray-400">Варианты ответов (мин. 2)</label>
                                {pollOptions.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={`Вариант ${i + 1}`}
                                            value={opt}
                                            onChange={(e) => updatePollOption(i, e.target.value)}
                                            className="flex-1 bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                                        />
                                        {pollOptions.length > 2 && (
                                            <button
                                                onClick={() => removePollOption(i)}
                                                className="text-gray-600 hover:text-[#D32F2F] px-2 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {pollOptions.length < 8 && (
                                    <button
                                        onClick={addPollOption}
                                        className="text-xs text-[#FA6814] hover:text-[#ff7a2a] transition-colors cursor-pointer"
                                    >
                                        + Добавить вариант
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                onClick={() => { setShowModal(false); setPollEnabled(false); setPollOptions(["", ""]); }}
                                className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleCreate}
                                className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                            >
                                Создать
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
