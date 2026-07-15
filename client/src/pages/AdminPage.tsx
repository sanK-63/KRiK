import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

interface User {
    id: number;
    username: string;
    displayName: string;
    email: string;
}

interface Notification {
    id: number;
    userId: number;
    title: string;
    body: string;
    type: string;
    read: boolean;
    createdAt: string;
}

export default function AdminPage() {
    const { user } = useUser();
    const token = localStorage.getItem("token");
    const API = import.meta.env.VITE_API_URL;

    const [users, setUsers] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [sendEmail, setSendEmail] = useState(false);
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState("");
    const [tab, setTab] = useState<"compose" | "history">("compose");

    const auth: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
    };

    useEffect(() => {
        fetch(`${API}/api/users`, { headers: auth })
            .then((r) => (r.ok ? r.json() : []))
            .then(setUsers)
            .catch(() => {});
        fetch(`${API}/api/notifications`, { headers: auth })
            .then((r) => (r.ok ? r.json() : []))
            .then(setNotifications)
            .catch(() => {});
    }, []);

    if (!user || user.username !== "tunev") {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400 text-lg">Доступ запрещён</p>
            </div>
        );
    }

    function toggle(id: number) {
        setSelectedUsers((p) =>
            p.includes(id) ? p.filter((u) => u !== id) : [...p, id]
        );
    }

    async function handleSend() {
        if (!title.trim()) return;
        if (!body.trim()) return;
        setSending(true);
        setMsg("");
        try {
            const target =
                selectedUsers.length === 0 || selectedUsers.length === users.length
                    ? `${API}/api/notifications/send-to-all`
                    : `${API}/api/notifications/bulk-email`;

            const payload =
                selectedUsers.length === 0 || selectedUsers.length === users.length
                    ? { title, body, sendEmail }
                    : { userIds: selectedUsers, title, body, sendEmail };

            const res = await fetch(target, {
                method: "POST",
                headers: auth,
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Ошибка");

            const data = await res.json();
            const count = data.sent || selectedUsers.length || users.length;
            setMsg(`Отправлено ${count} пользователю(ям)`);
            setTitle("");
            setBody("");
            setSelectedUsers([]);

            fetch(`${API}/api/notifications`, { headers: auth })
                .then((r) => (r.ok ? r.json() : []))
                .then(setNotifications);
        } catch {
            setMsg("Ошибка отправки");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="space-y-6">
            <h1
                className="text-sm text-[#FA6814]"
                style={{ fontFamily: '"Press Start 2P", system-ui' }}
            >
                Админ-панель
            </h1>

            <div className="flex gap-1 border-b border-[#3b3b3b]">
                {(
                    [
                        ["compose", "Написать"],
                        ["history", "История"],
                    ] as const
                ).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-4 py-2.5 text-sm transition-colors ${
                            tab === key
                                ? "text-[#FA6814] border-b-2 border-[#FA6814]"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === "compose" && (
                <div className="max-w-2xl space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-2"
                            style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                            Получатели
                        </label>
                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={() => setSelectedUsers(users.map((u) => u.id))}
                                className="text-xs bg-[#2a2a2a] border border-[#3b3b3b] px-3 py-1.5 text-gray-300 hover:text-white transition"
                            >
                                Все
                            </button>
                            <button
                                onClick={() => setSelectedUsers([])}
                                className="text-xs bg-[#2a2a2a] border border-[#3b3b3b] px-3 py-1.5 text-gray-300 hover:text-white transition"
                            >
                                Снять
                            </button>
                            <span className="text-xs text-gray-500 self-center">
                                {selectedUsers.length === 0
                                    ? "Все"
                                    : `${selectedUsers.length} из ${users.length}`}
                            </span>
                        </div>
                        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-3 max-h-40 overflow-y-auto space-y-1">
                            {users.map((u) => (
                                <label
                                    key={u.id}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#333] cursor-pointer transition"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(u.id)}
                                        onChange={() => toggle(u.id)}
                                        className="accent-[#FA6814]"
                                    />
                                    <span className="text-sm text-white">
                                        {u.displayName || u.username}
                                    </span>
                                    <span className="text-xs text-gray-500">{u.email}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-2"
                            style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                            Заголовок
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#2a2a2a] border border-[#3b3b3b] text-white px-4 py-3 focus:outline-none focus:border-[#FA6814] transition"
                            placeholder="Тема сообщения..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-2"
                            style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                            Текст
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={6}
                            className="w-full bg-[#2a2a2a] border border-[#3b3b3b] text-white px-4 py-3 focus:outline-none focus:border-[#FA6814] resize-none transition"
                            placeholder="Текст уведомления..."
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={sendEmail}
                            onChange={(e) => setSendEmail(e.target.checked)}
                            className="accent-[#FA6814]"
                        />
                        <span className="text-sm text-gray-300">Отправить на почту</span>
                    </label>

                    <button
                        onClick={handleSend}
                        disabled={sending || !title.trim() || !body.trim()}
                        className="w-full bg-[#FA6814] hover:bg-[#e55a0f] disabled:bg-gray-600 text-white py-3 font-medium transition"
                    >
                        {sending ? "Отправка..." : "Отправить"}
                    </button>

                    {msg && (
                        <div
                            className={`text-sm px-4 py-2 ${
                                msg.includes("Ошибка")
                                    ? "bg-red-900/30 text-red-400"
                                    : "bg-green-900/30 text-green-400"
                            }`}
                        >
                            {msg}
                        </div>
                    )}
                </div>
            )}

            {tab === "history" && (
                <div className="space-y-2 max-w-2xl">
                    {notifications.length === 0 && (
                        <p className="text-gray-500">Пока нет уведомлений</p>
                    )}
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className="bg-[#2a2a2a] border border-[#3b3b3b] p-4"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-medium text-sm">
                                    {n.title}
                                </span>
                                <span className="text-xs text-gray-500">
                                    #{n.id}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">{n.body}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
