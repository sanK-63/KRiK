import { useState, useEffect, useCallback } from "react";
import { useUser } from "../context/UserContext";

const TABS = ["Дашборд", "Пользователи", "Форум", "Контент", "Уведомления", "Исследования"] as const;
type Tab = typeof TABS[number];

interface Stats {
    counts: Record<string, number>;
    recent: { users: any[]; forumPosts: any[]; events: any[] };
    dbSize: number;
}

interface User {
    id: number; username: string; displayName: string; email: string;
    avatar: string | null; status: string; created_at: string; last_active: string;
    roles?: string[];
}

interface ForumPost {
    id: number; title: string; category: string; content: string;
    author_id: number; pinned: number; created_at: string;
}

interface Notification {
    id: number; userId: number; title: string; body: string;
    type: string; read: boolean; createdAt: string;
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
    return (
        <div className="bg-[#282828] border border-[#3a3a3a] p-4">
            <p className="text-[10px] text-gray-500 mb-1" style={{ fontFamily: '"Press Start 2P", system-ui' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: color || "#F2F2F2" }}>{value}</p>
        </div>
    );
}

export default function AdminPage() {
    const { user } = useUser();
    const token = localStorage.getItem("token");
    const API = import.meta.env.VITE_API_URL;
    const [tab, setTab] = useState<Tab>("Дашборд");

    const auth: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
    };

    if (!user || user.username !== "tunev") {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400 text-lg" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Доступ запрещён</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                Админ-панель
            </h1>

            <div className="flex gap-1 border-b border-[#3a3a3a] overflow-x-auto">
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className="px-4 py-2.5 text-sm whitespace-nowrap transition-colors"
                        style={{
                            borderBottom: tab === t ? "2px solid #FA6814" : "2px solid transparent",
                            color: tab === t ? "#F2F2F2" : "#808080",
                        }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === "Дашборд" && <DashboardTab API={API} auth={auth} />}
            {tab === "Пользователи" && <UsersTab API={API} auth={auth} />}
            {tab === "Форум" && <ForumTab API={API} auth={auth} />}
            {tab === "Контент" && <ContentTab API={API} auth={auth} />}
            {tab === "Уведомления" && <NotificationsTab API={API} auth={auth} />}
            {tab === "Исследования" && <ResearchTab />}
        </div>
    );
}

// ── ДАШБОРД ──────────────────────────────────
function DashboardTab({ API, auth }: { API: string; auth: Record<string, string> }) {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        fetch(`${API}/api/admin/stats`, { headers: auth })
            .then((r) => r.ok ? r.json() : null)
            .then(setStats)
            .catch(() => {});
    }, []);

    if (!stats) return <div className="text-gray-500 text-sm">Загрузка...</div>;

    const c = stats.counts;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatCard label="Юзеры" value={c.users} color="#FA6814" />
                <StatCard label="Форум" value={`${c.forumPosts} / ${c.forumComments}`} color="#5B9BD5" />
                <StatCard label="Турниры" value={c.tournaments} color="#4CAF50" />
                <StatCard label="Матчи" value={c.matches} color="#FFB020" />
                <StatCard label="Ивенты" value={c.events} color="#E63946" />
                <StatCard label="Фильмы" value={`${c.movies} / ${c.movieComments}`} color="#9C27B0" />
                <StatCard label="Мемы" value={`${c.memes} / ${c.memeComments}`} color="#FFB020" />
                <StatCard label="Рецепты" value={c.recipes} color="#E63946" />
                <StatCard label="Игры" value={c.games} color="#F0A500" />
                <StatCard label="Уведомления" value={c.notifications} color="#5B9BD5" />
                <StatCard label="Роли" value={c.roles} color="#4CAF50" />
                <StatCard label="БД" value={`${stats.dbSize} KB`} color="#808080" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-[#282828] border border-[#3a3a3a] p-4">
                    <h3 className="text-[10px] text-gray-500 mb-3" style={{ fontFamily: '"Press Start 2P", system-ui' }}>ПОСЛЕДНИЕ ЮЗЕРЫ</h3>
                    {stats.recent.users.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between py-2 border-b border-[#3a3a3a] last:border-0">
                            <span className="text-sm text-white">{u.display_name || u.username}</span>
                            <span className="text-xs text-gray-500">{u.created_at?.slice(0, 10)}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-[#282828] border border-[#3a3a3a] p-4">
                    <h3 className="text-[10px] text-gray-500 mb-3" style={{ fontFamily: '"Press Start 2P", system-ui' }}>ПОСЛЕДНИЕ ПОСТЫ</h3>
                    {stats.recent.forumPosts.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#3a3a3a] last:border-0">
                            <span className="text-sm text-white truncate">{p.title}</span>
                            <span className="text-xs text-gray-500 shrink-0 ml-2">{p.category}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-[#282828] border border-[#3a3a3a] p-4">
                    <h3 className="text-[10px] text-gray-500 mb-3" style={{ fontFamily: '"Press Start 2P", system-ui' }}>ПОСЛЕДНИЕ ИВЕНТЫ</h3>
                    {stats.recent.events.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between py-2 border-b border-[#3a3a3a] last:border-0">
                            <span className="text-sm text-white truncate">{e.title}</span>
                            <span className="text-xs text-gray-500 shrink-0 ml-2">{e.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── ПОЛЬЗОВАТЕЛИ ────────────────────────────
function UsersTab({ API, auth }: { API: string; auth: Record<string, string> }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/api/users`, { headers: auth })
            .then((r) => r.ok ? r.json() : [])
            .then(setUsers)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-gray-500 text-sm">Загрузка...</div>;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{users.length} пользователей</p>
            </div>
            <div className="bg-[#282828] border border-[#3a3a3a] overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#3a3a3a] text-left text-xs text-gray-500">
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Имя</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Статус</th>
                            <th className="px-4 py-3">Создан</th>
                            <th className="px-4 py-3">Активен</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => {
                            const online = u.last_active && (Date.now() - new Date(u.last_active).getTime()) < 300000;
                            return (
                                <tr key={u.id} className="border-b border-[#3a3a3a] last:border-0 hover:bg-[#2a2a2a]">
                                    <td className="px-4 py-3 text-gray-400">#{u.id}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {u.avatar ? (
                                                <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover object-top" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-[#3a3a3a] flex items-center justify-center text-[8px] text-gray-500">
                                                    {(u.displayName || u.username)[0]}
                                                </div>
                                            )}
                                            <span className="text-white">{u.displayName || u.username}</span>
                                            <span className="text-gray-500">@{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 ${u.status === "active" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                                            {u.status === "active" ? "Активен" : u.status}
                                        </span>
                                        {online && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-400" />}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{u.created_at?.slice(0, 10)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{u.last_active?.slice(0, 16).replace("T", " ")}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── ФОРУМ ────────────────────────────────────
function ForumTab({ API, auth }: { API: string; auth: Record<string, string> }) {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        fetch(`${API}/api/forum`, { headers: auth })
            .then((r) => r.ok ? r.json() : [])
            .then(setPosts)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const togglePin = async (id: number, current: number) => {
        await fetch(`${API}/api/forum/${id}`, {
            method: "PUT", headers: auth,
            body: JSON.stringify({ pinned: current ? 0 : 1 }),
        });
        load();
    };

    const deletePost = async (id: number) => {
        if (!confirm("Удалить пост?")) return;
        await fetch(`${API}/api/forum/${id}`, { method: "DELETE", headers: auth });
        load();
    };

    if (loading) return <div className="text-gray-500 text-sm">Загрузка...</div>;

    return (
        <div className="space-y-3">
            <p className="text-xs text-gray-500">{posts.length} постов</p>
            <div className="space-y-2">
                {posts.map((p) => (
                    <div key={p.id} className="bg-[#282828] border border-[#3a3a3a] p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {p.pinned ? <span className="text-[10px] text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}></span> : null}
                                <span className="text-white text-sm font-medium truncate">{p.title}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-400">{p.category}</span>
                            </div>
                            <p className="text-xs text-gray-500">{p.content?.slice(0, 100)}...</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button onClick={() => togglePin(p.id, p.pinned)} className="text-xs px-3 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:text-white hover:border-[#FA6814]">
                                {p.pinned ? "Открепить" : "Закрепить"}
                            </button>
                            <button onClick={() => deletePost(p.id)} className="text-xs px-3 py-1.5 bg-[#D32F2F]/20 border border-[#D32F2F]/40 text-red-400 hover:bg-[#D32F2F]/30">
                                Удалить
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── КОНТЕНТ ──────────────────────────────────
function ContentTab({ API, auth }: { API: string; auth: Record<string, string> }) {
    const [subTab, setSubTab] = useState<"Фильмы" | "Мемы" | "Ивенты">("Фильмы");
    const [movies, setMovies] = useState<any[]>([]);
    const [memes, setMemes] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${API}/api/movies`, { headers: auth }).then((r) => r.ok ? r.json() : []).then(setMovies).catch(() => {});
        fetch(`${API}/api/memes`, { headers: auth }).then((r) => r.ok ? r.json() : []).then(setMemes).catch(() => {});
        fetch(`${API}/api/events`, { headers: auth }).then((r) => r.ok ? r.json() : []).then(setEvents).catch(() => {});
    }, []);

    const del = async (type: string, id: number) => {
        if (!confirm("Удалить?")) return;
        await fetch(`${API}/api/${type}/${id}`, { method: "DELETE", headers: auth });
        if (type === "movies") setMovies((p) => p.filter((m) => m.id !== id));
        if (type === "memes") setMemes((p) => p.filter((m) => m.id !== id));
        if (type === "events") setEvents((p) => p.filter((e) => e.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-1 border-b border-[#3a3a3a]">
                {(["Фильмы", "Мемы", "Ивенты"] as const).map((t) => (
                    <button key={t} onClick={() => setSubTab(t)} className="px-4 py-2.5 text-sm"
                        style={{ borderBottom: subTab === t ? "2px solid #FA6814" : "2px solid transparent", color: subTab === t ? "#F2F2F2" : "#808080" }}>
                        {t}
                    </button>
                ))}
            </div>

            {subTab === "Фильмы" && (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500">{movies.length} фильмов</p>
                    {movies.map((m) => (
                        <div key={m.id} className="bg-[#282828] border border-[#3a3a3a] p-3 flex items-center gap-3">
                            {m.poster && <img src={m.poster} alt="" className="w-8 h-12 object-cover shrink-0" />}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{m.title}</p>
                                <p className="text-xs text-gray-500">{m.genre} · {m.year}</p>
                            </div>
                            <button onClick={() => del("movies", m.id)} className="text-xs px-3 py-1 bg-[#D32F2F]/20 border border-[#D32F2F]/40 text-red-400 hover:bg-[#D32F2F]/30 shrink-0">Удалить</button>
                        </div>
                    ))}
                </div>
            )}
            {subTab === "Мемы" && (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500">{memes.length} мемов</p>
                    {memes.map((m) => (
                        <div key={m.id} className="bg-[#282828] border border-[#3a3a3a] p-3 flex items-center gap-3">
                            {m.image && <img src={m.image} alt="" className="w-10 h-10 object-cover shrink-0" />}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{m.title || "Без названия"}</p>
                                <p className="text-xs text-gray-500">{m.category} · ♥ {m.likes}</p>
                            </div>
                            <button onClick={() => del("memes", m.id)} className="text-xs px-3 py-1 bg-[#D32F2F]/20 border border-[#D32F2F]/40 text-red-400 hover:bg-[#D32F2F]/30 shrink-0">Удалить</button>
                        </div>
                    ))}
                </div>
            )}
            {subTab === "Ивенты" && (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500">{events.length} ивентов</p>
                    {events.map((e) => (
                        <div key={e.id} className="bg-[#282828] border border-[#3a3a3a] p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{e.title}</p>
                                <p className="text-xs text-gray-500">{e.category} · {e.date}</p>
                            </div>
                            <button onClick={() => del("events", e.id)} className="text-xs px-3 py-1 bg-[#D32F2F]/20 border border-[#D32F2F]/40 text-red-400 hover:bg-[#D32F2F]/30 shrink-0">Удалить</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── УВЕДОМЛЕНИЯ ──────────────────────────────
function NotificationsTab({ API, auth }: { API: string; auth: Record<string, string> }) {
    const [users, setUsers] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [sendEmail, setSendEmail] = useState(false);
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState("");
    const [subTab, setSubTab] = useState<"compose" | "history">("compose");

    useEffect(() => {
        fetch(`${API}/api/users`, { headers: auth }).then((r) => r.ok ? r.json() : []).then(setUsers).catch(() => {});
        fetch(`${API}/api/notifications`, { headers: auth }).then((r) => r.ok ? r.json() : []).then(setNotifications).catch(() => {});
    }, []);

    const toggle = (id: number) => setSelectedUsers((p) => p.includes(id) ? p.filter((u) => u !== id) : [...p, id]);

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) return;
        setSending(true);
        setMsg("");
        try {
            const target = selectedUsers.length === 0 || selectedUsers.length === users.length
                ? `${API}/api/notifications/send-to-all`
                : `${API}/api/notifications/bulk-email`;
            const payload = selectedUsers.length === 0 || selectedUsers.length === users.length
                ? { title, body, sendEmail }
                : { userIds: selectedUsers, title, body, sendEmail };
            const res = await fetch(target, { method: "POST", headers: auth, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error("Ошибка");
            const data = await res.json();
            setMsg(`Отправлено ${data.sent || selectedUsers.length || users.length} пользователю(ям)`);
            setTitle(""); setBody(""); setSelectedUsers([]);
            fetch(`${API}/api/notifications`, { headers: auth }).then((r) => r.ok ? r.json() : []).then(setNotifications);
        } catch { setMsg("Ошибка отправки"); } finally { setSending(false); }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-1 border-b border-[#3a3a3a]">
                {(["compose", "history"] as const).map((k) => (
                    <button key={k} onClick={() => setSubTab(k)} className="px-4 py-2.5 text-sm"
                        style={{ borderBottom: subTab === k ? "2px solid #FA6814" : "2px solid transparent", color: subTab === k ? "#F2F2F2" : "#808080" }}>
                        {k === "compose" ? "Написать" : "История"}
                    </button>
                ))}
            </div>

            {subTab === "compose" && (
                <div className="max-w-2xl space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-2" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Получатели</label>
                        <div className="flex gap-2 mb-2">
                            <button onClick={() => setSelectedUsers(users.map((u) => u.id))} className="text-xs bg-[#2a2a2a] border border-[#3a3a3a] px-3 py-1.5 text-gray-300 hover:text-white">Все</button>
                            <button onClick={() => setSelectedUsers([])} className="text-xs bg-[#2a2a2a] border border-[#3a3a3a] px-3 py-1.5 text-gray-300 hover:text-white">Снять</button>
                            <span className="text-xs text-gray-500 self-center">{selectedUsers.length === 0 ? "Все" : `${selectedUsers.length} из ${users.length}`}</span>
                        </div>
                        <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 max-h-40 overflow-y-auto space-y-1">
                            {users.map((u) => (
                                <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2a2a2a] cursor-pointer">
                                    <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggle(u.id)} className="accent-[#FA6814]" />
                                    <span className="text-sm text-white">{u.displayName || u.username}</span>
                                    <span className="text-xs text-gray-500">{u.email}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-2" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Заголовок</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Тема..."
                            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-4 py-3 focus:outline-none focus:border-[#FA6814] transition" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-2" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Текст</label>
                        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Текст уведомления..."
                            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-4 py-3 focus:outline-none focus:border-[#FA6814] resize-none transition" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="accent-[#FA6814]" />
                        <span className="text-sm text-gray-300">Отправить на почту</span>
                    </label>
                    <button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()}
                        className="w-full bg-[#FA6814] hover:bg-[#e55a0f] disabled:bg-gray-600 text-white py-3 font-medium transition">
                        {sending ? "Отправка..." : "Отправить"}
                    </button>
                    {msg && <div className={`text-sm px-4 py-2 ${msg.includes("Ошибка") ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400"}`}>{msg}</div>}
                </div>
            )}

            {subTab === "history" && (
                <div className="space-y-2 max-w-2xl">
                    {notifications.length === 0 && <p className="text-gray-500">Пока нет уведомлений</p>}
                    {notifications.map((n) => (
                        <div key={n.id} className="bg-[#282828] border border-[#3a3a3a] p-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-medium text-sm">{n.title}</span>
                                <span className="text-xs text-gray-500">#{n.id}</span>
                            </div>
                            <p className="text-sm text-gray-400">{n.body}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── ИССЛЕДОВАНИЯ ─────────────────────────────
function ResearchTab() {
    const [calcType, setCalcType] = useState<"elo" | "bracket" | "probability" | "weight">("elo");

    const calcTypes = [
        { key: "elo" as const, label: "ELO Рейтинг" },
        { key: "bracket" as const, label: "Турнирная сетка" },
        { key: "probability" as const, label: "Вероятности" },
        { key: "weight" as const, label: "BMI Калькулятор" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex gap-1 border-b border-[#3a3a3a]">
                {calcTypes.map((c) => (
                    <button key={c.key} onClick={() => setCalcType(c.key)} className="px-4 py-2.5 text-sm"
                        style={{ borderBottom: calcType === c.key ? "2px solid #FA6814" : "2px solid transparent", color: calcType === c.key ? "#F2F2F2" : "#808080" }}>
                        {c.label}
                    </button>
                ))}
            </div>
            {calcType === "elo" && <EloCalc />}
            {calcType === "bracket" && <BracketCalc />}
            {calcType === "probability" && <ProbCalc />}
            {calcType === "weight" && <BMICalc />}
        </div>
    );
}

function EloCalc() {
    const [ra, setRa] = useState(1500);
    const [rb, setRb] = useState(1500);
    const [scoreA, setScoreA] = useState(1);
    const [k, setK] = useState(32);

    const ea = 1 / (1 + Math.pow(10, (rb - ra) / 400));
    const eb = 1 / (1 + Math.pow(10, (ra - rb) / 400));
    const sa = scoreA;
    const sb = 1 - sa;
    const newA = Math.round(ra + k * (sa - ea));
    const newB = Math.round(rb + k * (sb - eb));
    const deltaA = newA - ra;
    const deltaB = newB - rb;

    return (
        <div className="max-w-2xl space-y-4">
            <div className="bg-[#282828] border border-[#3a3a3a] p-5 space-y-4">
                <h3 className="text-[10px] text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>РАСЧЁТ ELO</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Игрок A — рейтинг</label>
                        <input type="number" value={ra} onChange={(e) => setRa(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Игрок B — рейтинг</label>
                        <input type="number" value={rb} onChange={(e) => setRb(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">K-фактор</label>
                        <input type="number" value={k} onChange={(e) => setK(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Результат</label>
                        <div className="flex gap-2">
                            <button onClick={() => setScoreA(1)} className={`flex-1 py-2 text-sm border transition ${scoreA === 1 ? "bg-[#4CAF50]/20 border-[#4CAF50] text-green-400" : "bg-[#1a1a1a] border-[#3a3a3a] text-gray-400"}`}>A побеждает</button>
                            <button onClick={() => setScoreA(0.5)} className={`flex-1 py-2 text-sm border transition ${scoreA === 0.5 ? "bg-[#FFB020]/20 border-[#FFB020] text-yellow-400" : "bg-[#1a1a1a] border-[#3a3a3a] text-gray-400"}`}>Ничья</button>
                            <button onClick={() => setScoreA(0)} className={`flex-1 py-2 text-sm border transition ${scoreA === 0 ? "bg-[#D32F2F]/20 border-[#D32F2F] text-red-400" : "bg-[#1a1a1a] border-[#3a3a3a] text-gray-400"}`}>B побеждает</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#282828] border border-[#3a3a3a] p-4 text-center">
                    <p className="text-[10px] text-gray-500 mb-2" style={{ fontFamily: '"Press Start 2P", system-ui' }}>ИГРОК A</p>
                    <p className="text-3xl font-bold text-white">{ra} → {newA}</p>
                    <p className={`text-sm font-bold mt-1 ${deltaA >= 0 ? "text-green-400" : "text-red-400"}`}>{deltaA >= 0 ? "+" : ""}{deltaA}</p>
                    <p className="text-xs text-gray-500 mt-2">Ожидание: {Math.round(ea * 100)}%</p>
                </div>
                <div className="bg-[#282828] border border-[#3a3a3a] p-4 text-center">
                    <p className="text-[10px] text-gray-500 mb-2" style={{ fontFamily: '"Press Start 2P", system-ui' }}>ИГРОК B</p>
                    <p className="text-3xl font-bold text-white">{rb} → {newB}</p>
                    <p className={`text-sm font-bold mt-1 ${deltaB >= 0 ? "text-green-400" : "text-red-400"}`}>{deltaB >= 0 ? "+" : ""}{deltaB}</p>
                    <p className="text-xs text-gray-500 mt-2">Ожидание: {Math.round(eb * 100)}%</p>
                </div>
            </div>
        </div>
    );
}

function BracketCalc() {
    const [players, setPlayers] = useState(8);
    const rounds = Math.ceil(Math.log2(players));
    const slots = Math.pow(2, rounds);
    const byes = slots - players;
    const matches = slots - 1;

    return (
        <div className="max-w-2xl space-y-4">
            <div className="bg-[#282828] border border-[#3a3a3a] p-5">
                <h3 className="text-[10px] text-gray-500 mb-4" style={{ fontFamily: '"Press Start 2P", system-ui' }}>РАСЧЁТ СЕТКИ</h3>
                <label className="text-xs text-gray-400 mb-1 block">Количество игроков/команд</label>
                <input type="number" min={2} max={256} value={players} onChange={(e) => setPlayers(Math.max(2, Math.min(256, Number(e.target.value))))}
                    className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                        <p className="text-2xl font-bold text-[#FA6814]">{slots}</p>
                        <p className="text-xs text-gray-500">Слоты</p>
                    </div>
                    <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                        <p className="text-2xl font-bold text-white">{rounds}</p>
                        <p className="text-xs text-gray-500">Раундов</p>
                    </div>
                    <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                        <p className="text-2xl font-bold text-[#4CAF50]">{matches}</p>
                        <p className="text-xs text-gray-500">Матчей</p>
                    </div>
                    <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                        <p className="text-2xl font-bold text-[#FFB020]">{byes}</p>
                        <p className="text-xs text-gray-500">BYE</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProbCalc() {
    const [wins, setWins] = useState(5);
    const [losses, setLosses] = useState(2);
    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    const elo = 1500 + 400 * Math.log10(wins / Math.max(losses, 1));
    const wr95 = total > 0 ? Math.round(1.96 * Math.sqrt((winRate / 100) * (1 - winRate / 100) / total) * 100) : 0;

    return (
        <div className="max-w-2xl space-y-4">
            <div className="bg-[#282828] border border-[#3a3a3a] p-5 space-y-4">
                <h3 className="text-[10px] text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>ВЕРОЯТНОСТИ</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Победы</label>
                        <input type="number" min={0} value={wins} onChange={(e) => setWins(Math.max(0, Number(e.target.value)))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Поражения</label>
                        <input type="number" min={0} value={losses} onChange={(e) => setLosses(Math.max(0, Number(e.target.value)))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#282828] border border-[#3a3a3a] p-4 text-center">
                    <p className="text-3xl font-bold text-[#FA6814]">{winRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">Винрейт</p>
                    <p className="text-[10px] text-gray-600 mt-1">±{wr95}% (95% CI)</p>
                </div>
                <div className="bg-[#282828] border border-[#3a3a3a] p-4 text-center">
                    <p className="text-3xl font-bold text-white">{total}</p>
                    <p className="text-xs text-gray-500 mt-1">Всего матчей</p>
                </div>
                <div className="bg-[#282828] border border-[#3a3a3a] p-4 text-center">
                    <p className="text-3xl font-bold text-[#4CAF50]">{total > 0 ? Math.round(wins / Math.max(losses, 1) * 100) / 100 : 0}</p>
                    <p className="text-xs text-gray-500 mt-1">K/D Ratio</p>
                </div>
                <div className="bg-[#282828] border border-[#3a3a3a] p-4 text-center">
                    <p className="text-3xl font-bold text-[#FFB020]">{Math.round(elo)}</p>
                    <p className="text-xs text-gray-500 mt-1">ELO Рейтинг</p>
                </div>
            </div>
        </div>
    );
}

function BMICalc() {
    const [height, setHeight] = useState(175);
    const [weight, setWeight] = useState(70);
    const bmi = height > 0 ? Math.round(weight / Math.pow(height / 100, 2) * 10) / 10 : 0;
    const category = bmi < 18.5 ? "Недовес" : bmi < 25 ? "Норма" : bmi < 30 ? "Избыточный" : "Ожирение";
    const categoryColor = bmi < 18.5 ? "#5B9BD5" : bmi < 25 ? "#4CAF50" : bmi < 30 ? "#FFB020" : "#D32F2F";

    return (
        <div className="max-w-2xl space-y-4">
            <div className="bg-[#282828] border border-[#3a3a3a] p-5 space-y-4">
                <h3 className="text-[10px] text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>BMI КАЛЬКУЛЯТОР</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Рост (см)</label>
                        <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Вес (кг)</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                    </div>
                </div>
            </div>
            <div className="bg-[#282828] border border-[#3a3a3a] p-4 text-center">
                <p className="text-4xl font-bold" style={{ color: categoryColor }}>{bmi}</p>
                <p className="text-sm mt-1" style={{ color: categoryColor }}>{category}</p>
                <div className="mt-4 h-2 bg-[#1a1a1a] border border-[#3a3a3a] overflow-hidden flex">
                    <div className="h-full bg-[#5B9BD5]" style={{ width: "30%" }} />
                    <div className="h-full bg-[#4CAF50]" style={{ width: "25%" }} />
                    <div className="h-full bg-[#FFB020]" style={{ width: "20%" }} />
                    <div className="h-full bg-[#D32F2F]" style={{ width: "25%" }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>&lt;18.5</span><span>18.5-25</span><span>25-30</span><span>&gt;30</span>
                </div>
            </div>
        </div>
    );
}
