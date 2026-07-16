import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

const API = import.meta.env.VITE_API_URL;

interface ViolationUser {
    id: number;
    username: string;
    displayName: string | null;
    surname: string | null;
    avatar: string | null;
}

interface ViolationItem {
    id: number;
    userId: number;
    reporterId: number;
    title: string;
    description: string;
    severity: string;
    status: string;
    constitutionArticle: string | null;
    createdAt: string;
    resolvedAt: string | null;
    resolvedBy: number | null;
    user: ViolationUser;
    reporter: ViolationUser;
}

interface UserOption {
    id: number;
    username: string;
    displayName: string | null;
    surname: string | null;
}

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token || ""}`, "Content-Type": "application/json" };
}

function formatDate(d: string | null) {
    if (!d) return "—";
    const date = new Date(d.replace(" ", "T"));
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(d: string | null) {
    if (!d) return "—";
    const date = new Date(d.replace(" ", "T"));
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const severityConfig: Record<string, { label: string; color: string }> = {
    warning: { label: "Предупреждение", color: "#FFB020" },
    moderation: { label: "Модерация", color: "#FA6814" },
    ban: { label: "Бан", color: "#D32F2F" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: "Открыто", color: "#FFB020" },
    resolved: { label: "Решено", color: "#4CAF50" },
    dismissed: { label: "Отклонено", color: "#888" },
};

export default function ViolationsPage() {
    const socket = useSocket();
    const [violations, setViolations] = useState<ViolationItem[]>([]);
    const [allUsers, setAllUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [severityFilter, setSeverityFilter] = useState<string>("all");

    // Modal state
    const [showCreate, setShowCreate] = useState(false);
    const [editViolation, setEditViolation] = useState<ViolationItem | null>(null);
    const [formUserId, setFormUserId] = useState<number>(0);
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formSeverity, setFormSeverity] = useState("warning");
    const [formArticle, setFormArticle] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");

    // Fetch violations
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${API}/api/violations`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setViolations(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Fetch users for dropdown
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setAllUsers(data.map((u: any) => ({ id: u.id, username: u.username, displayName: u.displayName, surname: u.surname }))))
            .catch(() => {});
    }, []);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;
        socket.on("violation:created", (v: ViolationItem) => {
            setViolations((prev) => [v, ...prev]);
        });
        socket.on("violation:updated", ({ id }: { id: number }) => {
            fetch(`${API}/api/violations/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } })
                .then((r) => r.ok ? r.json() : null)
                .then((updated) => {
                    if (updated) setViolations((prev) => prev.map((v) => (v.id === id ? updated : v)));
                })
                .catch(() => {});
        });
        socket.on("violation:resolved", ({ id }: { id: number }) => {
            setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, status: "resolved", resolvedAt: new Date().toISOString() } : v)));
        });
        socket.on("violation:dismissed", ({ id }: { id: number }) => {
            setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, status: "dismissed", resolvedAt: new Date().toISOString() } : v)));
        });
        socket.on("violation:deleted", ({ id }: { id: number }) => {
            setViolations((prev) => prev.filter((v) => v.id !== id));
        });
        return () => {
            socket.off("violation:created");
            socket.off("violation:updated");
            socket.off("violation:resolved");
            socket.off("violation:dismissed");
            socket.off("violation:deleted");
        };
    }, [socket]);

    function openCreate() {
        setEditViolation(null);
        setFormUserId(0);
        setFormTitle("");
        setFormDescription("");
        setFormSeverity("warning");
        setFormArticle("");
        setShowCreate(true);
    }

    function openEdit(v: ViolationItem) {
        setEditViolation(v);
        setFormUserId(v.userId);
        setFormTitle(v.title);
        setFormDescription(v.description);
        setFormSeverity(v.severity);
        setFormArticle(v.constitutionArticle || "");
        setShowCreate(true);
    }

    async function saveViolation() {
        if (!formTitle.trim()) {
            setToast("Введите название");
            setTimeout(() => setToast(""), 2000);
            return;
        }

        setSaving(true);
        try {
            if (editViolation) {
                // Update existing
                const r = await fetch(`${API}/api/violations/${editViolation.id}`, {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        title: formTitle,
                        description: formDescription,
                        severity: formSeverity,
                        constitutionArticle: formArticle || null,
                    }),
                });
                if (!r.ok) throw new Error();
                setViolations((prev) =>
                    prev.map((v) =>
                        v.id === editViolation.id
                            ? { ...v, title: formTitle, description: formDescription, severity: formSeverity, constitutionArticle: formArticle || null }
                            : v
                    )
                );
            } else {
                // Create new
                if (!formUserId) {
                    setToast("Выберите пользователя");
                    setSaving(false);
                    setTimeout(() => setToast(""), 2000);
                    return;
                }
                const r = await fetch(`${API}/api/violations`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        userId: formUserId,
                        title: formTitle,
                        description: formDescription,
                        severity: formSeverity,
                        constitutionArticle: formArticle || null,
                    }),
                });
                if (!r.ok) throw new Error();
            }
            setToast(editViolation ? "Обновлено" : "Создано");
            setTimeout(() => setToast(""), 2000);
            setShowCreate(false);
        } catch {
            setToast("Ошибка");
            setTimeout(() => setToast(""), 2000);
        } finally {
            setSaving(false);
        }
    }

    async function resolveViolation(id: number) {
        try {
            const r = await fetch(`${API}/api/violations/${id}/resolve`, { method: "PUT", headers: getAuthHeaders() });
            if (r.ok) setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, status: "resolved", resolvedAt: new Date().toISOString() } : v)));
        } catch {}
    }

    async function dismissViolation(id: number) {
        try {
            const r = await fetch(`${API}/api/violations/${id}/dismiss`, { method: "PUT", headers: getAuthHeaders() });
            if (r.ok) setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, status: "dismissed", resolvedAt: new Date().toISOString() } : v)));
        } catch {}
    }

    async function deleteViolation(id: number) {
        if (!confirm("Удалить нарушение?")) return;
        try {
            const r = await fetch(`${API}/api/violations/${id}`, { method: "DELETE", headers: getAuthHeaders() });
            if (r.ok) setViolations((prev) => prev.filter((v) => v.id !== id));
        } catch {}
    }

    // Filters
    const filtered = violations.filter((v) => {
        const q = search.toLowerCase();
        const userName = [v.user.displayName, v.user.surname].filter(Boolean).join(" ").toLowerCase();
        const matchesSearch =
            v.title.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q) ||
            userName.includes(q) ||
            v.user.username.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || v.status === statusFilter;
        const matchesSeverity = severityFilter === "all" || v.severity === severityFilter;
        return matchesSearch && matchesStatus && matchesSeverity;
    });

    const openCount = violations.filter((v) => v.status === "open").length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-[#FA6814] text-sm" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        Нарушения
                    </h2>
                    {openCount > 0 && (
                        <span className="text-[9px] px-2 py-0.5 bg-[#D32F2F]/20 text-[#D32F2F] border border-[#D32F2F]">
                            {openCount} открытых
                        </span>
                    )}
                </div>
                <button
                    onClick={openCreate}
                    className="text-[10px] px-3 py-2 bg-[#FA6814] text-white hover:bg-[#FF7D30] transition-colors"
                >
                    + Нарушение
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Поиск по названию, описанию, пользователю..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                >
                    <option value="all">Все статусы</option>
                    <option value="open">Открыто</option>
                    <option value="resolved">Решено</option>
                    <option value="dismissed">Отклонено</option>
                </select>
                <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                >
                    <option value="all">Все типы</option>
                    <option value="warning">Предупреждение</option>
                    <option value="moderation">Модерация</option>
                    <option value="ban">Бан</option>
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#282828] border border-[#3a3a3a] p-4 animate-pulse">
                            <div className="h-3 bg-[#3a3a3a] w-1/3 mb-2" />
                            <div className="h-2 bg-[#3a3a3a] w-2/3" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-[#282828] border border-[#3a3a3a] p-8 text-center">
                    <p className="text-gray-500 text-sm">
                        {violations.length === 0 ? "Нарушений пока нет" : "Ничего не найдено"}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((v) => {
                        const sev = severityConfig[v.severity] || severityConfig.warning;
                        const st = statusConfig[v.status] || statusConfig.open;
                        const userFullName = [v.user.displayName, v.user.surname].filter(Boolean).join(" ") || v.user.username;

                        return (
                            <div key={v.id} className="bg-[#282828] border border-[#3a3a3a] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        {/* Title row */}
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span
                                                className="text-[9px] px-1.5 py-0.5 border font-bold"
                                                style={{ color: sev.color, borderColor: sev.color }}
                                            >
                                                {sev.label}
                                            </span>
                                            <span
                                                className="text-[9px] px-1.5 py-0.5"
                                                style={{ color: st.color, background: `${st.color}15` }}
                                            >
                                                {st.label}
                                            </span>
                                            <span className="text-gray-600 text-[10px]">#{v.id}</span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-white text-sm font-semibold mb-1">{v.title}</h3>

                                        {/* Description */}
                                        {v.description && (
                                            <p className="text-gray-400 text-[11px] leading-relaxed mb-2">{v.description}</p>
                                        )}

                                        {/* Constitution article */}
                                        {v.constitutionArticle && (
                                            <p className="text-[10px] text-[#9C27B0] mb-2">
                                                📜 Статья: {v.constitutionArticle}
                                            </p>
                                        )}

                                        {/* Meta */}
                                        <div className="flex items-center gap-4 text-[9px] text-gray-600 flex-wrap">
                                            <span>
                                                Нарушитель: <span className="text-gray-400">{userFullName}</span>
                                            </span>
                                            <span>
                                                Нарушитель: <span className="text-gray-400">@{v.user.username}</span>
                                            </span>
                                            <span>
                                                Добавил: <span className="text-gray-400">
                                                    {[v.reporter.displayName, v.reporter.surname].filter(Boolean).join(" ") || v.reporter.username}
                                                </span>
                                            </span>
                                            <span>{formatDate(v.createdAt)}</span>
                                            {v.resolvedAt && (
                                                <span className="text-[#4CAF50]">Решено: {formatShortDate(v.resolvedAt)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {v.status === "open" && (
                                            <>
                                                <button
                                                    onClick={() => resolveViolation(v.id)}
                                                    className="text-[9px] px-2 py-1 border border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50]/10 transition-colors"
                                                    title="Решено"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => dismissViolation(v.id)}
                                                    className="text-[9px] px-2 py-1 border border-[#888] text-[#888] hover:bg-[#888]/10 transition-colors"
                                                    title="Отклонить"
                                                >
                                                    ✕
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => openEdit(v)}
                                            className="text-[9px] px-2 py-1 border border-[#3a3a3a] text-gray-400 hover:text-[#FA6814] hover:border-[#FA6814] transition-colors"
                                            title="Редактировать"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => deleteViolation(v.id)}
                                            className="text-[9px] px-2 py-1 border border-[#3a3a3a] text-gray-400 hover:text-[#D32F2F] hover:border-[#D32F2F] transition-colors"
                                            title="Удалить"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
                    <div
                        className="bg-[#212121] border border-[#3a3a3a] w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-[#3a3a3a]">
                            <h3 className="text-[#FA6814] text-xs font-bold">
                                {editViolation ? "Редактировать нарушение" : "Новое нарушение"}
                            </h3>
                            <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white text-lg">✕</button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* User selector (only for create) */}
                            {!editViolation && (
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">Пользователь *</label>
                                    <select
                                        value={formUserId}
                                        onChange={(e) => setFormUserId(Number(e.target.value))}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                                    >
                                        <option value={0}>Выберите пользователя</option>
                                        {allUsers.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {[u.displayName, u.surname].filter(Boolean).join(" ") || u.username} (@{u.username})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Название *</label>
                                <input
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Краткое описание нарушения"
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Описание</label>
                                <textarea
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Подробное описание..."
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] resize-none"
                                />
                            </div>

                            {/* Severity */}
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-2">Тип</label>
                                <div className="flex gap-3">
                                    {Object.entries(severityConfig).map(([key, cfg]) => (
                                        <button
                                            key={key}
                                            onClick={() => setFormSeverity(key)}
                                            className="text-[10px] px-3 py-1.5 border transition-colors"
                                            style={{
                                                borderColor: formSeverity === key ? cfg.color : "#3a3a3a",
                                                color: formSeverity === key ? cfg.color : "#666",
                                                background: formSeverity === key ? `${cfg.color}15` : "transparent",
                                            }}
                                        >
                                            {cfg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Constitution article */}
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Статья конституции</label>
                                <input
                                    value={formArticle}
                                    onChange={(e) => setFormArticle(e.target.value)}
                                    placeholder="Номер или название статьи (необязательно)"
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-4 border-t border-[#3a3a3a]">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="text-[10px] px-4 py-2 border border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#555] transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={saveViolation}
                                disabled={saving}
                                className="text-[10px] px-4 py-2 bg-[#FA6814] text-white hover:bg-[#FF7D30] transition-colors disabled:opacity-50"
                            >
                                {saving ? "Сохранение..." : editViolation ? "Обновить" : "Создать"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-[#282828] border border-[#3a3a3a] px-4 py-3 text-xs text-white z-50 animate-fade-in">
                    {toast.includes("Ошибка") || toast.includes("Введите") || toast.includes("Выберите") ? (
                        <span className="text-[#D32F2F]">✕ {toast}</span>
                    ) : (
                        <span className="text-[#4CAF50]">✓ {toast}</span>
                    )}
                </div>
            )}
        </div>
    );
}
