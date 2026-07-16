import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

const API = import.meta.env.VITE_API_URL;

interface UserRole {
    roleId: number;
    name: string;
    color: string | null;
}

interface UserItem {
    id: number;
    username: string;
    displayName: string | null;
    surname: string | null;
    patronymic: string | null;
    avatar: string | null;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    status: string;
    createdAt: string;
    lastActive: string | null;
    isOnline: boolean;
    roles: UserRole[];
    profile: any;
}

interface Role {
    id: number;
    name: string;
    color: string | null;
    description: string | null;
}

const roleBadgeColor: Record<string, string> = {
    Administrator: "#D32F2F",
    Moderator: "#FFB020",
    Judge: "#3CB371",
    Captain: "#FA6814",
    User: "#A5A5A5",
};

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token || ""}`, "Content-Type": "application/json" };
}

function formatDate(d: string | null) {
    if (!d) return "—";
    const date = new Date(d.replace(" ", "T"));
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(d: string | null) {
    if (!d) return "—";
    const date = new Date(d.replace(" ", "T"));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Только что";
    if (diffMin < 60) return `${diffMin} мин. назад`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} ч. назад`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} дн. назад`;
    return formatDate(d);
}

export default function UsersPage() {
    const socket = useSocket();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    // Modal state
    const [editUser, setEditUser] = useState<UserItem | null>(null);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editSurname, setEditSurname] = useState("");
    const [editPatronymic, setEditPatronymic] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editRoleIds, setEditRoleIds] = useState<number[]>([]);
    const [editStatus, setEditStatus] = useState("active");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");

    // Fetch users
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setUsers(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Fetch roles
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${API}/api/users/roles/all`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setAllRoles(data))
            .catch(() => {});
    }, []);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;
        socket.on("user:online", ({ userId }: { userId: number }) => {
            setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isOnline: true } : u)));
        });
        socket.on("user:role_changed", ({ userId, roles: newRoles }: { userId: number; roles: UserRole[] }) => {
            setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roles: newRoles } : u)));
        });
        socket.on("user:banned", ({ userId, status }: { userId: number; status: string }) => {
            setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
        });
        return () => {
            socket.off("user:online");
            socket.off("user:role_changed");
            socket.off("user:banned");
        };
    }, [socket]);

    // Open edit modal
    function openEdit(u: UserItem) {
        setEditUser(u);
        setEditDisplayName(u.displayName || "");
        setEditSurname(u.surname || "");
        setEditPatronymic(u.patronymic || "");
        setEditEmail(u.email || "");
        setEditPhone(u.phone || "");
        setEditRoleIds(u.roles.map((r) => r.roleId));
        setEditStatus(u.status);
    }

    // Save edits
    async function saveUser() {
        if (!editUser) return;
        setSaving(true);
        try {
            // Update profile
            const r1 = await fetch(`${API}/api/users/${editUser.id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    displayName: editDisplayName,
                    surname: editSurname,
                    patronymic: editPatronymic,
                    email: editEmail,
                    phone: editPhone,
                }),
            });
            if (!r1.ok) throw new Error("Profile save failed");

            // Update roles
            const r2 = await fetch(`${API}/api/users/${editUser.id}/roles`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ roleIds: editRoleIds }),
            });
            if (!r2.ok) throw new Error("Roles save failed");

            // Update status
            if (editStatus !== editUser.status) {
                const r3 = await fetch(`${API}/api/users/${editUser.id}/status`, {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ status: editStatus }),
                });
                if (!r3.ok) throw new Error("Status save failed");
            }

            // Update local state
            setUsers((prev) =>
                prev.map((u) => {
                    if (u.id !== editUser.id) return u;
                    return {
                        ...u,
                        displayName: editDisplayName,
                        surname: editSurname,
                        patronymic: editPatronymic,
                        email: editEmail,
                        phone: editPhone,
                        status: editStatus,
                        roles: allRoles
                            .filter((r) => editRoleIds.includes(r.id))
                            .map((r) => ({ roleId: r.id, name: r.name, color: r.color })),
                    };
                })
            );

            setToast("Сохранено");
            setTimeout(() => setToast(""), 2000);
            setEditUser(null);
        } catch {
            setToast("Ошибка сохранения");
            setTimeout(() => setToast(""), 2000);
        } finally {
            setSaving(false);
        }
    }

    // Filter
    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        const fullName = [u.displayName, u.surname, u.patronymic].filter(Boolean).join(" ").toLowerCase();
        const matchesSearch = fullName.includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || u.status === statusFilter;
        const matchesRole = roleFilter === "all" || u.roles.some((r) => r.name === roleFilter);
        return matchesSearch && matchesStatus && matchesRole;
    });

    const onlineCount = users.filter((u) => u.isOnline).length;
    const bannedCount = users.filter((u) => u.status === "banned").length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-[#FA6814] text-sm" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                    Пользователи
                </h2>
                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                    <span>{users.length} всего</span>
                    <span className="text-[#4CAF50]">{onlineCount} онлайн</span>
                    {bannedCount > 0 && <span className="text-[#D32F2F]">{bannedCount} забанено</span>}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Поиск по имени, email, username..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                >
                    <option value="all">Все статусы</option>
                    <option value="active">Активные</option>
                    <option value="banned">Забаненные</option>
                </select>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                >
                    <option value="all">Все роли</option>
                    {allRoles.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-[#282828] border border-[#3a3a3a] p-4 animate-pulse">
                            <div className="h-3 bg-[#3a3a3a] w-1/3 mb-2" />
                            <div className="h-2 bg-[#3a3a3a] w-2/3" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-[#282828] border border-[#3a3a3a] p-8 text-center">
                    <p className="text-gray-500 text-sm">Пользователи не найдены</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-[#3a3a3a] text-left">
                                <th className="pb-3 text-gray-500 font-medium w-10"></th>
                                <th className="pb-3 text-gray-500 font-medium">Имя</th>
                                <th className="pb-3 text-gray-500 font-medium hidden md:table-cell">Username</th>
                                <th className="pb-3 text-gray-500 font-medium hidden lg:table-cell">Email</th>
                                <th className="pb-3 text-gray-500 font-medium">Роли</th>
                                <th className="pb-3 text-gray-500 font-medium w-16">Статус</th>
                                <th className="pb-3 text-gray-500 font-medium w-16">Онлайн</th>
                                <th className="pb-3 text-gray-500 font-medium hidden xl:table-cell">Активность</th>
                                <th className="pb-3 text-gray-500 font-medium w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => {
                                const fullName = [u.displayName, u.surname, u.patronymic].filter(Boolean).join(" ") || u.username;
                                return (
                                    <tr
                                        key={u.id}
                                        className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                                        onClick={() => openEdit(u)}
                                    >
                                        <td className="py-3 pr-3">
                                            <div className="w-8 h-8 bg-[#1e1e1e] border border-[#3a3a3a] flex items-center justify-center text-[10px] text-[#FA6814] font-bold overflow-hidden shrink-0">
                                                {u.avatar ? (
                                                    <img src={u.avatar} alt="" className="w-full h-full object-cover object-top" />
                                                ) : (
                                                    (u.displayName?.[0] || u.username?.[0] || "?").toUpperCase()
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 pr-3">
                                            <div className="text-gray-200 font-medium">{fullName}</div>
                                            <div className="text-gray-600 md:hidden">@{u.username}</div>
                                        </td>
                                        <td className="py-3 pr-3 text-gray-500 hidden md:table-cell">@{u.username}</td>
                                        <td className="py-3 pr-3 text-gray-500 hidden lg:table-cell">{u.email}</td>
                                        <td className="py-3 pr-3">
                                            <div className="flex flex-wrap gap-1">
                                                {u.roles.map((r) => (
                                                    <span
                                                        key={r.roleId}
                                                        className="inline-block text-[9px] px-1.5 py-0.5 border"
                                                        style={{
                                                            color: r.color || roleBadgeColor[r.name] || "#A5A5A5",
                                                            borderColor: r.color || roleBadgeColor[r.name] || "#A5A5A5",
                                                        }}
                                                    >
                                                        {r.name}
                                                    </span>
                                                ))}
                                                {u.roles.length === 0 && <span className="text-gray-600">—</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 pr-3">
                                            <span
                                                className="inline-block text-[9px] px-1.5 py-0.5"
                                                style={{
                                                    color: u.status === "active" ? "#4CAF50" : "#D32F2F",
                                                    border: `1px solid ${u.status === "active" ? "#4CAF50" : "#D32F2F"}`,
                                                }}
                                            >
                                                {u.status === "active" ? "Активен" : "Забанен"}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-3">
                                            <span
                                                className="inline-block w-2.5 h-2.5 rounded-full"
                                                style={{ background: u.isOnline ? "#4CAF50" : "#555" }}
                                            />
                                        </td>
                                        <td className="py-3 pr-3 text-gray-500 hidden xl:table-cell">
                                            {formatDateTime(u.lastActive)}
                                        </td>
                                        <td className="py-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEdit(u); }}
                                                className="text-gray-500 hover:text-[#FA6814] transition-colors px-1"
                                                title="Редактировать"
                                            >
                                                ✏️
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {editUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditUser(null)}>
                    <div
                        className="bg-[#212121] border border-[#3a3a3a] w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-4 border-b border-[#3a3a3a]">
                            <h3 className="text-[#FA6814] text-xs font-bold">Редактирование пользователя</h3>
                            <button onClick={() => setEditUser(null)} className="text-gray-500 hover:text-white text-lg">✕</button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* User info header */}
                            <div className="flex items-center gap-3 pb-3 border-b border-[#2a2a2a]">
                                <div className="w-12 h-12 bg-[#1e1e1e] border border-[#3a3a3a] flex items-center justify-center text-sm text-[#FA6814] font-bold overflow-hidden shrink-0">
                                    {editUser.avatar ? (
                                        <img src={editUser.avatar} alt="" className="w-full h-full object-cover object-top" />
                                    ) : (
                                        (editUser.displayName?.[0] || editUser.username?.[0] || "?").toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="text-white text-sm font-bold">@{editUser.username}</div>
                                    <div className="text-gray-500 text-[10px]">ID: {editUser.id} · Зарегистрирован: {formatDate(editUser.createdAt)}</div>
                                </div>
                            </div>

                            {/* Profile fields */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Имя</label>
                                    <input
                                        value={editDisplayName}
                                        onChange={(e) => setEditDisplayName(e.target.value)}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Фамилия</label>
                                    <input
                                        value={editSurname}
                                        onChange={(e) => setEditSurname(e.target.value)}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Отчество</label>
                                    <input
                                        value={editPatronymic}
                                        onChange={(e) => setEditPatronymic(e.target.value)}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Телефон</label>
                                    <input
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Email</label>
                                <input
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                                />
                            </div>

                            {/* Roles */}
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-2">Роли</label>
                                <div className="space-y-2">
                                    {allRoles.map((r) => {
                                        const checked = editRoleIds.includes(r.id);
                                        return (
                                            <label key={r.id} className="flex items-center gap-3 cursor-pointer group">
                                                <div
                                                    className="w-5 h-5 border flex items-center justify-center transition-colors shrink-0"
                                                    style={{
                                                        borderColor: checked ? (r.color || "#FA6814") : "#3a3a3a",
                                                        background: checked ? (r.color || "#FA6814") : "transparent",
                                                    }}
                                                    onClick={() => {
                                                        setEditRoleIds((prev) =>
                                                            checked ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                                                        );
                                                    }}
                                                >
                                                    {checked && (
                                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                            <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span
                                                    className="text-[10px] font-bold"
                                                    style={{ color: r.color || roleBadgeColor[r.name] || "#A5A5A5" }}
                                                >
                                                    {r.name}
                                                </span>
                                                {r.description && (
                                                    <span className="text-[9px] text-gray-600 hidden group-hover:inline">{r.description}</span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-2">Статус</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setEditStatus("active")}
                                        className="text-[10px] px-3 py-1.5 border transition-colors"
                                        style={{
                                            borderColor: editStatus === "active" ? "#4CAF50" : "#3a3a3a",
                                            color: editStatus === "active" ? "#4CAF50" : "#666",
                                            background: editStatus === "active" ? "rgba(76,175,80,0.1)" : "transparent",
                                        }}
                                    >
                                        Активен
                                    </button>
                                    <button
                                        onClick={() => setEditStatus("banned")}
                                        className="text-[10px] px-3 py-1.5 border transition-colors"
                                        style={{
                                            borderColor: editStatus === "banned" ? "#D32F2F" : "#3a3a3a",
                                            color: editStatus === "banned" ? "#D32F2F" : "#666",
                                            background: editStatus === "banned" ? "rgba(211,47,47,0.1)" : "transparent",
                                        }}
                                    >
                                        Забанен
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="flex justify-end gap-3 p-4 border-t border-[#3a3a3a]">
                            <button
                                onClick={() => setEditUser(null)}
                                className="text-[10px] px-4 py-2 border border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#555] transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={saveUser}
                                disabled={saving}
                                className="text-[10px] px-4 py-2 bg-[#FA6814] text-white hover:bg-[#FF7D30] transition-colors disabled:opacity-50"
                            >
                                {saving ? "Сохранение..." : "Сохранить"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-[#282828] border border-[#3a3a3a] px-4 py-3 text-xs text-white z-50 animate-fade-in">
                    {toast === "Сохранено" ? (
                        <span className="text-[#4CAF50]">✓ {toast}</span>
                    ) : (
                        <span className="text-[#D32F2F]">✕ {toast}</span>
                    )}
                </div>
            )}
        </div>
    );
}
