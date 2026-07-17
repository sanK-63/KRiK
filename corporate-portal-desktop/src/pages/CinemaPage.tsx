import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";

interface Movie {
    id: number;
    title: string;
    year: number | null;
    genre: string;
    rating: number | null;
    description: string | null;
    poster: string | null;
    addedBy: { id: number; displayName: string | null; username: string; avatar: string | null } | null;
    createdAt: string;
}

interface Comment {
    id: number;
    content: string;
    rating: number | null;
    createdAt: string;
    user: { id: number; displayName: string | null; username: string; avatar: string | null } | null;
}

const genres = ["Все", "Боевик", "Комедия", "Драма", "Ужасы", "Фантастика", "Триллер", "Мультфильм", "Документальный", "Сериалы", "Аниме"];

const TMDB_GENRE_MAP: Record<number, string> = {
    28: "Боевик", 12: "Приключения", 16: "Мультфильм", 35: "Комедия",
    80: "Криминал", 99: "Документальный", 18: "Драма", 10751: "Семейный",
    14: "Фантастика", 27: "Ужасы", 9648: "Детектив", 10749: "Мелодрама",
    878: "Фантастика", 53: "Триллер", 10752: "Военный", 37: "Вестерн",
};

function PixelStars({ rating, size = 16, onClick }: { rating: number; size?: number; onClick?: (v: number) => void }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <span
                    key={i}
                    onClick={() => onClick?.(i)}
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: i <= rating ? "#FA6814" : "#3a3a3a",
                        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                        cursor: onClick ? "pointer" : "default",
                    }}
                />
            ))}
        </div>
    );
}

export default function CinemaPage() {
    const { user } = useUser();
    const socket = useSocket();
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("Все");
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<Movie | null>(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", year: "", genre: "Боевик", rating: 0, description: "", poster: "" });
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [commentRating, setCommentRating] = useState(0);
    const location = useLocation();
    const openId = (location.state as { openId?: number })?.openId;
    const token = localStorage.getItem("token");

    const [form, setForm] = useState({ title: "", year: "", genre: "Боевик", rating: 0, description: "", poster: "" });
    const [tmdbQuery, setTmdbQuery] = useState("");
    const [tmdbResults, setTmdbResults] = useState<any[]>([]);
    const [tmdbSearching, setTmdbSearching] = useState(false);
    const [showTmdb, setShowTmdb] = useState(false);

    const load = () => {
        fetch(`${import.meta.env.VITE_API_URL}/api/movies`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : []))
            .then(setMovies)
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const loadComments = (movieId: number) => {
        fetch(`${import.meta.env.VITE_API_URL}/api/movies/${movieId}/comments`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : []))
            .then(setComments)
            .catch(() => {});
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (openId && movies.length > 0 && !selected) {
            const movie = movies.find((m) => m.id === openId);
            if (movie) {
                setSelected(movie);
                window.history.replaceState({}, "");
            }
        }
    }, [openId, movies, selected]);

    useEffect(() => {
        if (!tmdbQuery.trim() || tmdbQuery.length < 2) {
            setTmdbResults([]);
            setShowTmdb(false);
            return;
        }
        const t = setTimeout(() => {
            setTmdbSearching(true);
            fetch(`${import.meta.env.VITE_API_URL}/api/tmdb/search?query=${encodeURIComponent(tmdbQuery)}`)
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => { setTmdbResults(data); setShowTmdb(data.length > 0); })
                .catch(() => { setTmdbResults([]); setShowTmdb(false); })
                .finally(() => setTmdbSearching(false));
        }, 400);
        return () => clearTimeout(t);
    }, [tmdbQuery]);

    const selectTmdb = (m: any) => {
        const genreName = TMDB_GENRE_MAP[m.genreIds?.[0]] || "Драма";
        setForm({
            title: m.title || "",
            year: m.year?.toString() || "",
            genre: genres.includes(genreName) ? genreName : "Драма",
            rating: Math.round((m.rating || 0) / 2),
            description: m.description || "",
            poster: m.poster || "",
        });
        setTmdbQuery("");
        setTmdbResults([]);
        setShowTmdb(false);
    };

    useEffect(() => {
        if (selected) loadComments(selected.id);
    }, [selected]);

    useEffect(() => {
        if (!socket) return;
        socket.on("movie:created", (movie: Movie) => {
            setMovies((prev) => {
                if (prev.some((m) => m.id === movie.id)) return prev;
                return [movie, ...prev];
            });
        });
        socket.on("movie:updated", (movie: Movie) => {
            setMovies((prev) => prev.map((m) => m.id === movie.id ? movie : m));
            setSelected((prev) => prev?.id === movie.id ? movie : prev);
        });
        socket.on("movie:deleted", ({ id }: { id: number }) => {
            setMovies((prev) => prev.filter((m) => m.id !== id));
            setSelected((prev) => prev?.id === id ? null : prev);
        });
        socket.on("movie_comment:created", ({ movieId, comment }: { movieId: number; comment: Comment }) => {
            setSelected((prev) => {
                if (prev?.id !== movieId) return prev;
                return prev;
            });
            setComments((prev) => {
                if (prev.some((c) => c.id === comment.id)) return prev;
                return [...prev, comment];
            });
        });
        socket.on("movie_comment:deleted", ({ commentId }: { movieId: number; commentId: number }) => {
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        });
        return () => {
            socket.off("movie:created");
            socket.off("movie:updated");
            socket.off("movie:deleted");
            socket.off("movie_comment:created");
            socket.off("movie_comment:deleted");
        };
    }, [socket]);

    const handleCreate = async () => {
        if (!form.title || !token) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/movies`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                title: form.title,
                year: form.year ? Number(form.year) : null,
                genre: form.genre,
                rating: form.rating || null,
                description: form.description || null,
                poster: form.poster || null,
            }),
        });
        setForm({ title: "", year: "", genre: "Боевик", rating: 0, description: "", poster: "" });
        setShowForm(false);
        load();
    };

    const handleEdit = async () => {
        if (!selected || !token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/movies/${selected.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                title: editForm.title,
                year: editForm.year ? Number(editForm.year) : null,
                genre: editForm.genre,
                rating: editForm.rating || null,
                description: editForm.description || null,
                poster: editForm.poster || null,
            }),
        });
        if (res.ok) {
            const updated = await res.json();
            setSelected(updated);
            setEditing(false);
            load();
        }
    };

    const handleDelete = async (id: number) => {
        if (!token) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/movies/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setSelected(null);
        load();
    };

    const handleAddComment = async () => {
        if (!selected || !commentText.trim() || !token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/movies/${selected.id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ content: commentText, rating: commentRating || null }),
        });
        if (res.ok) {
            setCommentText("");
            setCommentRating(0);
            loadComments(selected.id);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!selected || !token) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/movies/${selected.id}/comments/${commentId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        loadComments(selected.id);
    };

    const startEdit = () => {
        if (!selected) return;
        setEditForm({
            title: selected.title,
            year: selected.year?.toString() || "",
            genre: selected.genre,
            rating: selected.rating || 0,
            description: selected.description || "",
            poster: selected.poster || "",
        });
        setEditing(true);
    };

    const filtered = filter === "Все" ? movies : movies.filter((m) => m.genre === filter);

    const isOwner = (m: Movie) => user && m.addedBy?.id === user.id;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl">Кинотека <span className="text-sm text-gray-500 align-middle">({filtered.length})</span></h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-[#fa6814] text-white text-sm hover:bg-[#ff7d30]"
                    style={{ borderRadius: 4 }}
                >
                    {showForm ? "Закрыть" : "+ Добавить фильм"}
                </button>
            </div>

            <div className="flex gap-0 border-b border-[#3a3a3a] mb-6 flex-wrap">
                {genres.map((g) => (
                    <button
                        key={g}
                        onClick={() => setFilter(g)}
                        className="px-4 py-2.5 text-sm text-gray-400 bg-transparent border-none cursor-pointer hover:text-white transition-colors"
                        style={{
                            borderBottom: filter === g ? "2px solid #FA6814" : "2px solid transparent",
                            color: filter === g ? "#F2F2F2" : undefined,
                        }}
                    >
                        {g}
                    </button>
                ))}
            </div>

            {showForm && (
                <div className="bg-[#282828] border border-[#3a3a3a] p-5 mb-6" style={{ borderRadius: 4 }}>
                    <div className="relative mb-4">
                        <p className="text-[10px] text-gray-500 mb-1.5" style={{ fontFamily: '"Press Start 2P", system-ui' }}>TMDB SEARCH</p>
                        <input
                            placeholder="Введите название для поиска обложки..."
                            value={tmdbQuery}
                            onChange={(e) => setTmdbQuery(e.target.value)}
                            onFocus={() => tmdbResults.length > 0 && setShowTmdb(true)}
                            onBlur={() => setTimeout(() => setShowTmdb(false), 200)}
                            className="w-full bg-[#1a1a1a] border border-[#FA6814] text-[#e0e0e0] px-3 py-2 text-sm"
                            style={{ borderRadius: 4 }}
                        />
                        {tmdbSearching && <span className="absolute right-3 top-9 text-xs text-gray-500">Поиск...</span>}
                        {showTmdb && tmdbResults.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#3a3a3a] max-h-80 overflow-y-auto">
                                {tmdbResults.map((m) => (
                                    <button
                                        key={m.id}
                                        onMouseDown={() => selectTmdb(m)}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#2a2a2a] bg-transparent border-none text-left cursor-pointer"
                                    >
                                        {m.poster ? (
                                            <img src={m.poster} alt="" className="w-10 h-14 object-cover shrink-0" style={{ borderRadius: 2 }} />
                                        ) : (
                                            <div className="w-10 h-14 bg-[#2a2a2a] border border-[#3a3a3a] shrink-0 flex items-center justify-center text-[8px] text-gray-600">N/A</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{m.title}</p>
                                            <p className="text-xs text-gray-500">{m.year || "?"} · {TMDB_GENRE_MAP[m.genreIds?.[0]] || "—"}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <input placeholder="Название*" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                        <input placeholder="Год" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                        <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }}>
                            {genres.filter((g) => g !== "Все").map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Рейтинг</p>
                            <PixelStars rating={form.rating} size={24} onClick={(v) => setForm({ ...form, rating: form.rating === v ? 0 : v })} />
                        </div>
                        <input placeholder="Постер (URL)" value={form.poster} onChange={(e) => setForm({ ...form, poster: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm sm:col-span-2" style={{ borderRadius: 4 }} />
                        <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm sm:col-span-2 resize-y" style={{ borderRadius: 4, minHeight: 60 }} />
                    </div>
                    <button onClick={handleCreate} className="px-4 py-2 bg-[#4caf50] text-white text-sm hover:bg-[#3cb371]" style={{ borderRadius: 4 }}>Добавить</button>
                </div>
            )}

            {loading ? (
                <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-10 text-center text-gray-500">Загрузка...</div>
            ) : filtered.length === 0 ? (
                <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-10 text-center text-gray-500">Фильмов пока нет.</div>
            ) : selected ? (
                <div>
                    <button onClick={() => { setSelected(null); setEditing(false); }} className="text-sm text-gray-400 hover:text-[#fa6814] mb-4 bg-transparent border-none cursor-pointer">&larr; Назад к списку</button>

                    <div className="bg-[#282828] border border-[#3a3a3a] p-6 mb-6" style={{ borderRadius: 4 }}>
                        {editing ? (
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <input placeholder="Название*" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                                    <input placeholder="Год" value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                                    <select value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }}>
                                        {genres.filter((g) => g !== "Все").map((g) => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Рейтинг</p>
                                        <PixelStars rating={editForm.rating} size={24} onClick={(v) => setEditForm({ ...editForm, rating: editForm.rating === v ? 0 : v })} />
                                    </div>
                                    <input placeholder="Постер (URL)" value={editForm.poster} onChange={(e) => setEditForm({ ...editForm, poster: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm sm:col-span-2" style={{ borderRadius: 4 }} />
                                    <textarea placeholder="Описание" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm sm:col-span-2 resize-y" style={{ borderRadius: 4, minHeight: 60 }} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleEdit} className="px-4 py-2 bg-[#4caf50] text-white text-sm hover:bg-[#3cb371]" style={{ borderRadius: 4 }}>Сохранить</button>
                                    <button onClick={() => setEditing(false)} className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-sm hover:text-white" style={{ borderRadius: 4 }}>Отмена</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                {selected.poster && <img src={selected.poster} alt={selected.title} className="w-full sm:w-48 h-72 object-cover shrink-0" style={{ borderRadius: 4 }} />}
                                <div className="flex-1">
                                    <h2 className="text-xl text-[#F2F2F2] mb-2">{selected.title}</h2>
                                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                                        {selected.year && <span>{selected.year}</span>}
                                        <span className="px-2 py-0.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-xs">{selected.genre}</span>
                                        {selected.rating !== null && <PixelStars rating={selected.rating} size={18} />}
                                    </div>
                                    {selected.description && <p className="text-gray-300 text-sm leading-relaxed mb-4">{selected.description}</p>}
                                    {selected.addedBy && <p className="text-xs text-gray-500">Добавил: {selected.addedBy.displayName || selected.addedBy.username}</p>}
                                    <div className="flex gap-2 mt-4">
                                        {isOwner(selected) && (
                                            <button onClick={startEdit} className="px-3 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-xs hover:text-white hover:border-[#fa6814]" style={{ borderRadius: 4 }}>Редактировать</button>
                                        )}
                                        {isOwner(selected) && (
                                            <button onClick={() => handleDelete(selected.id)} className="px-3 py-1.5 bg-[#d32f2f] text-white text-xs hover:bg-[#b71c1c]" style={{ borderRadius: 4 }}>Удалить</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-[#282828] border border-[#3a3a3a] p-5" style={{ borderRadius: 4 }}>
                        <h3 className="text-sm text-[#F2F2F2] mb-4">Комментарии ({comments.length})</h3>

                        <div className="flex flex-col sm:flex-row gap-3 mb-5">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Написать отзыв..."
                                className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm resize-none"
                                style={{ borderRadius: 4, minHeight: 50 }}
                            />
                            <div className="flex sm:flex-col items-center gap-2">
                                <PixelStars rating={commentRating} size={18} onClick={(v) => setCommentRating(commentRating === v ? 0 : v)} />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!commentText.trim()}
                                    className="px-3 py-1.5 bg-[#fa6814] text-white text-xs hover:bg-[#ff7d30] disabled:opacity-40"
                                    style={{ borderRadius: 4 }}
                                >
                                    Отправить
                                </button>
                            </div>
                        </div>

                        {comments.length === 0 ? (
                            <p className="text-gray-500 text-xs">Пока нет комментариев. Будьте первым!</p>
                        ) : (
                            <div className="space-y-3">
                                {comments.map((c) => (
                                    <div key={c.id} className="bg-[#2a2a2a] border border-[#3a3a3a] p-3" style={{ borderRadius: 4 }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                {c.user?.avatar && <img src={c.user.avatar} className="w-5 h-5" style={{ borderRadius: 4, objectFit: "cover" }} />}
                                                <span className="text-xs text-[#F2F2F2]">{c.user?.displayName || c.user?.username || "—"}</span>
                                                {c.rating !== null && <PixelStars rating={c.rating} size={12} />}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleDateString("ru-RU")}</span>
                                                {user && c.user?.id === user.id && (
                                                    <button onClick={() => handleDeleteComment(c.id)} className="text-[10px] text-gray-500 hover:text-[#d32f2f] bg-transparent border-none cursor-pointer">удалить</button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-300">{c.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map((m) => (
                        <div key={m.id} onClick={() => setSelected(m)} className="bg-[#282828] border border-[#3a3a3a] cursor-pointer hover:border-[#fa6814] transition-colors" style={{ borderRadius: 4 }}>
                            {m.poster ? (
                                <img src={m.poster} alt={m.title} className="w-full h-56 object-cover" style={{ borderRadius: "4px 4px 0 0" }} />
                            ) : (
                                <div className="w-full h-56 bg-[#2a2a2a] flex items-center justify-center text-gray-600 text-4xl"></div>
                            )}
                            <div className="p-3">
                                <h3 className="text-sm text-[#F2F2F2] truncate">{m.title}</h3>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500">{m.year || "—"}</span>
                                    {m.rating !== null && <PixelStars rating={m.rating} size={12} />}
                                </div>
                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-400 text-[10px]">{m.genre}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
