import { useState, useEffect } from "react";
import {
    setApiUrl,
    login,
    getUsers,
    getNotifications,
    sendNotification,
    sendToAll,
    sendBulkNotification,
} from "./api";

interface User {
    id: number;
    username: string;
    displayName: string;
    email: string;
    avatar: string;
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

export default function App() {
    const [page, setPage] = useState<"login" | "main">("login");
    const [serverUrl, setServerUrl] = useState("http://localhost:5000");
    const [accessKey, setAccessKey] = useState("");
    const [username, setUsername] = useState("");

    const [users, setUsers] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [sendEmail, setSendEmail] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");

    const [tab, setTab] = useState<"compose" | "users" | "history">("compose");

    async function handleLogin() {
        try {
            setApiUrl(serverUrl);
            const user = await login(accessKey);
            setUsername(user.displayName || user.username);
            setPage("main");
            loadData();
        } catch (e: any) {
            alert("Ошибка авторизации: " + e.message);
        }
    }

    async function loadData() {
        try {
            const [u, n] = await Promise.all([getUsers(), getNotifications()]);
            setUsers(u);
            setNotifications(n);
        } catch {}
    }

    useEffect(() => {
        if (page === "main") loadData();
    }, [page]);

    function toggleUser(id: number) {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
        );
    }

    function selectAll() {
        setSelectedUsers(users.map((u) => u.id));
    }

    async function handleSend() {
        if (!title.trim()) { alert("Введите заголовок"); return; }
        if (!body.trim()) { alert("Введите текст"); return; }

        setSending(true);
        setMessage("");

        try {
            if (selectedUsers.length === 0 || selectedUsers.length === users.length) {
                await sendToAll(title, body, sendEmail);
                setMessage(`Отправлено всем ${users.length} пользователям`);
            } else {
                await sendBulkNotification(selectedUsers, title, body, sendEmail);
                setMessage(`Отправлено ${selectedUsers.length} пользователям`);
            }
            setTitle("");
            setBody("");
            setSelectedUsers([]);
            loadData();
        } catch (e: any) {
            setMessage("Ошибка: " + e.message);
        } finally {
            setSending(false);
        }
    }

    if (page === "login") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-slate-800 p-8 rounded-2xl w-96 shadow-2xl">
                    <h1 className="text-2xl font-bold mb-6 text-center text-white">
                        Corporate Portal
                    </h1>
                    <p className="text-slate-400 text-sm mb-6 text-center">
                        Панель рассылки уведомлений
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">
                                Адрес сервера
                            </label>
                            <input
                                type="text"
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="http://localhost:5000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">
                                Ключ доступа
                            </label>
                            <input
                                type="password"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Введите ключ..."
                            />
                        </div>
                        <button
                            onClick={handleLogin}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
                        >
                            Войти
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            <aside className="w-64 bg-slate-800 p-4 flex flex-col">
                <h2 className="text-lg font-bold mb-1 text-white">Рассылка</h2>
                <p className="text-sm text-slate-400 mb-6">{username}</p>

                <nav className="space-y-1 flex-1">
                    <button
                        onClick={() => setTab("compose")}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                            tab === "compose" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
                        }`}
                    >
                        Написать
                    </button>
                    <button
                        onClick={() => setTab("users")}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                            tab === "users" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
                        }`}
                    >
                        Пользователи ({users.length})
                    </button>
                    <button
                        onClick={() => setTab("history")}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                            tab === "history" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
                        }`}
                    >
                        История ({notifications.length})
                    </button>
                </nav>

                <button
                    onClick={() => { setPage("login"); }}
                    className="text-sm text-slate-500 hover:text-slate-300 transition"
                >
                    Выйти
                </button>
            </aside>

            <main className="flex-1 p-6 overflow-y-auto">
                {tab === "compose" && (
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold mb-6 text-white">Новое сообщение</h1>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Получатели</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={selectAll}
                                        className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-300 transition"
                                    >
                                        Выбрать всех
                                    </button>
                                    <button
                                        onClick={() => setSelectedUsers([])}
                                        className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-300 transition"
                                    >
                                        Снять выделение
                                    </button>
                                    <span className="text-xs text-slate-500 self-center">
                                        {selectedUsers.length === 0
                                            ? "Все"
                                            : `${selectedUsers.length} из ${users.length}`}
                                    </span>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                                    {users.map((u) => (
                                        <label
                                            key={u.id}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700 cursor-pointer transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(u.id)}
                                                onChange={() => toggleUser(u.id)}
                                                className="rounded"
                                            />
                                            <span className="text-sm text-white">{u.displayName || u.username}</span>
                                            <span className="text-xs text-slate-500">{u.email}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Заголовок</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Тема сообщения..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Текст</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={6}
                                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Текст уведомления..."
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={sendEmail}
                                        onChange={(e) => setSendEmail(e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-slate-300">
                                        Отправить на почту
                                    </span>
                                </label>
                                {sendEmail && (
                                    <span className="text-xs text-slate-500">
                                        Письмо уйдёт с {selectedUsers.length === 0 || selectedUsers.length === users.length
                                            ? "всем пользователям"
                                            : `${selectedUsers.length} получателям`}
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white py-3 rounded-lg font-medium transition"
                            >
                                {sending ? "Отправка..." : "Отправить"}
                            </button>

                            {message && (
                                <div className={`text-sm px-4 py-2 rounded-lg ${message.includes("Ошибка") ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300"}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === "users" && (
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold mb-6 text-white">Пользователи</h1>
                        <div className="space-y-2">
                            {users.map((u) => (
                                <div
                                    key={u.id}
                                    className="bg-slate-800 rounded-lg p-4 flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                        {(u.displayName || u.username)[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">
                                            {u.displayName || u.username}
                                        </div>
                                        <div className="text-sm text-slate-400">{u.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "history" && (
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold mb-6 text-white">История уведомлений</h1>
                        <div className="space-y-2">
                            {notifications.length === 0 && (
                                <p className="text-slate-500">Пока нет уведомлений</p>
                            )}
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className="bg-slate-800 rounded-lg p-4"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-white font-medium text-sm">
                                            {n.title}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            #{n.id} · {n.read ? "прочитано" : "новое"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400">{n.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
