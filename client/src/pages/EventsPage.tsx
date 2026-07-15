import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";

interface Event {
    id: number;
    title: string;
    description: string | null;
    date: string;
    time: string | null;
    location: string | null;
    category: string;
    image: string | null;
    author: { id: number; displayName: string | null; username: string; avatar: string | null } | null;
    createdAt: string;
}

const categories = ["Все", "Турнир", "Встреча", "Обновление", "Релиз", "Буткемп", "Попойка", "Рабочая задача", "Другое"];

export default function EventsPage() {
    const user = useUser();
    const socket = useSocket();
    const location = useLocation();
    const openId = (location.state as { openId?: number })?.openId;
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("Все");
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<Event | null>(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", description: "", date: "", time: "", location: "", category: "Другое", image: "" });
    const token = localStorage.getItem("token");

    const [form, setForm] = useState({ title: "", description: "", date: "", time: "", location: "", category: "Другое", image: "" });

    const load = () => {
        fetch(`${import.meta.env.VITE_API_URL}/api/events`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : []))
            .then(setEvents)
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (openId && events.length > 0 && !selected) {
            const ev = events.find((e) => e.id === openId);
            if (ev) {
                setSelected(ev);
                window.history.replaceState({}, "");
            }
        }
    }, [openId, events, selected]);

    useEffect(() => {
        if (!socket) return;
        socket.on("event:created", (event: Event) => {
            setEvents((prev) => {
                if (prev.some((e) => e.id === event.id)) return prev;
                return [event, ...prev];
            });
        });
        socket.on("event:updated", (event: Event) => {
            setEvents((prev) => prev.map((e) => e.id === event.id ? event : e));
            setSelected((prev) => prev?.id === event.id ? event : prev);
        });
        socket.on("event:deleted", ({ id }: { id: number }) => {
            setEvents((prev) => prev.filter((e) => e.id !== id));
            setSelected((prev) => prev?.id === id ? null : prev);
        });
        return () => {
            socket.off("event:created");
            socket.off("event:updated");
            socket.off("event:deleted");
        };
    }, [socket]);

    const handleCreate = async () => {
        if (!form.title || !form.date || !token) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                title: form.title,
                description: form.description || null,
                date: form.date,
                time: form.time || null,
                location: form.location || null,
                category: form.category,
                image: form.image || null,
            }),
        });
        setForm({ title: "", description: "", date: "", time: "", location: "", category: "Другое", image: "" });
        setShowForm(false);
        load();
    };

    const handleEdit = async () => {
        if (!selected || !token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${selected.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                title: editForm.title,
                description: editForm.description || null,
                date: editForm.date,
                time: editForm.time || null,
                location: editForm.location || null,
                category: editForm.category,
                image: editForm.image || null,
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
        await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setSelected(null);
        load();
    };

    const startEdit = () => {
        if (!selected) return;
        setEditForm({
            title: selected.title,
            description: selected.description || "",
            date: selected.date,
            time: selected.time || "",
            location: selected.location || "",
            category: selected.category,
            image: selected.image || "",
        });
        setEditing(true);
    };

    const filtered = filter === "Все" ? events : events.filter((e) => e.category === filter);

    const isOwner = (e: Event) => user && e.author?.id === user.id;

    const formatDate = (d: string) => {
        try { return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }); }
        catch { return d; }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl">Ивенты</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-[#fa6814] text-white text-sm hover:bg-[#ff7d30]"
                    style={{ borderRadius: 4 }}
                >
                    {showForm ? "Закрыть" : "+ Создать ивент"}
                </button>
            </div>

            <div className="flex gap-0 border-b border-[#3a3a3a] mb-6 flex-wrap">
                {categories.map((c) => (
                    <button
                        key={c}
                        onClick={() => setFilter(c)}
                        className="px-4 py-2.5 text-sm text-gray-400 bg-transparent border-none cursor-pointer hover:text-white transition-colors"
                        style={{
                            borderBottom: filter === c ? "2px solid #FA6814" : "2px solid transparent",
                            color: filter === c ? "#F2F2F2" : undefined,
                        }}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {showForm && (
                <div className="bg-[#282828] border border-[#3a3a3a] p-5 mb-6" style={{ borderRadius: 4 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <input placeholder="Название*" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                        <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                        <input placeholder="Место проведения" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }}>
                            {categories.filter((c) => c !== "Все").map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input placeholder="Изображение (URL)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                        <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm sm:col-span-2 resize-y" style={{ borderRadius: 4, minHeight: 60 }} />
                    </div>
                    <button onClick={handleCreate} className="px-4 py-2 bg-[#4caf50] text-white text-sm hover:bg-[#3cb371]" style={{ borderRadius: 4 }}>Создать</button>
                </div>
            )}

            {loading ? (
                <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-10 text-center text-gray-500">Загрузка...</div>
            ) : filtered.length === 0 ? (
                <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-10 text-center text-gray-500">Ивентов пока нет.</div>
            ) : selected ? (
                <div>
                    <button onClick={() => { setSelected(null); setEditing(false); }} className="text-sm text-gray-400 hover:text-[#fa6814] mb-4 bg-transparent border-none cursor-pointer">&larr; Назад к списку</button>

                    <div className="bg-[#282828] border border-[#3a3a3a] p-6 mb-6" style={{ borderRadius: 4 }}>
                        {editing ? (
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <input placeholder="Название*" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                                    <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                                    <input type="time" value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                                    <input placeholder="Место проведения" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                                    <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }}>
                                        {categories.filter((c) => c !== "Все").map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <input placeholder="Изображение (URL)" value={editForm.image} onChange={(e) => setEditForm({ ...editForm, image: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm" style={{ borderRadius: 4 }} />
                                    <textarea placeholder="Описание" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] px-3 py-2 text-sm sm:col-span-2 resize-y" style={{ borderRadius: 4, minHeight: 60 }} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleEdit} className="px-4 py-2 bg-[#4caf50] text-white text-sm hover:bg-[#3cb371]" style={{ borderRadius: 4 }}>Сохранить</button>
                                    <button onClick={() => setEditing(false)} className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-sm hover:text-white" style={{ borderRadius: 4 }}>Отмена</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {selected.image && <img src={selected.image} alt={selected.title} className="w-full h-48 sm:h-64 object-cover mb-4" style={{ borderRadius: 4 }} />}
                                <h2 className="text-xl text-[#F2F2F2] mb-2">{selected.title}</h2>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                                    <span>{formatDate(selected.date)}</span>
                                    {selected.time && <span>{selected.time}</span>}
                                    <span className="px-2 py-0.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-xs">{selected.category}</span>
                                    {selected.location && <span>{selected.location}</span>}
                                </div>
                                {selected.description && <p className="text-gray-300 text-sm leading-relaxed mb-4">{selected.description}</p>}
                                {selected.author && <p className="text-xs text-gray-500">Создал: {selected.author.displayName || selected.author.username}</p>}
                                <div className="flex gap-2 mt-4">
                                    {isOwner(selected) && (
                                        <button onClick={startEdit} className="px-3 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-xs hover:text-white hover:border-[#fa6814]" style={{ borderRadius: 4 }}>Редактировать</button>
                                    )}
                                    {isOwner(selected) && (
                                        <button onClick={() => handleDelete(selected.id)} className="px-3 py-1.5 bg-[#d32f2f] text-white text-xs hover:bg-[#b71c1c]" style={{ borderRadius: 4 }}>Удалить</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((e) => (
                        <div key={e.id} onClick={() => setSelected(e)} className="bg-[#282828] border border-[#3a3a3a] cursor-pointer hover:border-[#fa6814] transition-colors" style={{ borderRadius: 4 }}>
                            {e.image ? (
                                <img src={e.image} alt={e.title} className="w-full h-40 object-cover" style={{ borderRadius: "4px 4px 0 0" }} />
                            ) : (
                                <div className="w-full h-40 bg-[#2a2a2a] flex items-center justify-center text-gray-600 text-4xl"></div>
                            )}
                            <div className="p-4">
                                <h3 className="text-sm text-[#F2F2F2] mb-1">{e.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <span>{formatDate(e.date)}</span>
                                    {e.time && <span>{e.time}</span>}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="px-1.5 py-0.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-400 text-[10px]">{e.category}</span>
                                    {e.location && <span className="text-[10px] text-gray-500 truncate ml-2">{e.location}</span>}
                                </div>
                                {e.author && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        {e.author.avatar && <img src={e.author.avatar} className="w-4 h-4" style={{ borderRadius: 4, objectFit: "cover" }} />}
                                        <span className="text-[10px] text-gray-500">{e.author.displayName || e.author.username}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
