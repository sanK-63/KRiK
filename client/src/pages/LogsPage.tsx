import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

interface LogEntry {
    id: number;
    userId: number | null;
    username: string | null;
    userDisplayName: string | null;
    userSurname: string | null;
    userAvatar: string | null;
    action: string;
    targetType: string | null;
    targetId: number | null;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
}

function getAuthHeaders(): Record<string, string> {
    return {};
}

function formatDate(d: string | null) {
    if (!d) return "—";
    const date = new Date(d.replace(" ", "T"));
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatShortDate(d: string | null) {
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

const actionColors: Record<string, string> = {
    "user.login": "#4CAF50",
    "user.logout": "#888",
    "user.created": "#2196F3",
    "user.banned": "#D32F2F",
    "user.role_changed": "#FFB020",
    "violation.created": "#D32F2F",
    "violation.resolved": "#4CAF50",
    "violation.dismissed": "#888",
    "tournament.created": "#9C27B0",
    "tournament.deleted": "#D32F2F",
    "forum.post_created": "#2196F3",
    "forum.comment_created": "#2196F3",
    "movie.created": "#FF9800",
    "movie.deleted": "#D32F2F",
    "event.created": "#E91E63",
    "software.created": "#00BCD4",
    "recipe.created": "#FF5722",
    "meme.created": "#FFC107",
};

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionFilter, setActionFilter] = useState("");
    const [userIdFilter, setUserIdFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [distinctActions, setDistinctActions] = useState<string[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    function fetchLogs(p: number) {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("limit", "50");
        if (actionFilter) params.set("action", actionFilter);
        if (userIdFilter) params.set("userId", userIdFilter);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        fetch(`${API}/api/logs?${params.toString()}`, { headers: getAuthHeaders(), credentials: "include" })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
                setLogs(data.logs);
                setTotalPages(data.totalPages);
                setTotal(data.total);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }

    useEffect(() => { fetchLogs(page); }, [page]);
    useEffect(() => {
        fetch(`${API}/api/logs/actions`, { headers: getAuthHeaders(), credentials: "include" })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setDistinctActions(data))
            .catch(() => {});
    }, []);

    function applyFilters() {
        setPage(1);
        fetchLogs(1);
    }

    function clearFilters() {
        setActionFilter("");
        setUserIdFilter("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
        setTimeout(() => fetchLogs(1), 0);
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-[#FA6814] text-sm" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        Логи
                    </h2>
                    <span className="text-[10px] text-gray-500">{total} записей</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-[9px] text-gray-600 mb-1">Действие</label>
                    <input
                        type="text"
                        placeholder="Фильтр по действию..."
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        list="action-list"
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                    />
                    <datalist id="action-list">
                        {distinctActions.map((a) => <option key={a} value={a} />)}
                    </datalist>
                </div>
                <div className="w-32">
                    <label className="block text-[9px] text-gray-600 mb-1">User ID</label>
                    <input
                        type="number"
                        placeholder="ID"
                        value={userIdFilter}
                        onChange={(e) => setUserIdFilter(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                    />
                </div>
                <div className="w-36">
                    <label className="block text-[9px] text-gray-600 mb-1">От</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                    />
                </div>
                <div className="w-36">
                    <label className="block text-[9px] text-gray-600 mb-1">До</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                    />
                </div>
                <button
                    onClick={applyFilters}
                    className="text-[10px] px-3 py-2 bg-[#FA6814] text-white hover:bg-[#FF7D30] transition-colors"
                >
                    Применить
                </button>
                <button
                    onClick={clearFilters}
                    className="text-[10px] px-3 py-2 border border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#555] transition-colors"
                >
                    Сбросить
                </button>
            </div>

            {/* Log entries */}
            {loading ? (
                <div className="space-y-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-[#282828] border border-[#3a3a3a] px-4 py-3 animate-pulse">
                            <div className="h-2 bg-[#3a3a3a] w-2/3 mb-1" />
                            <div className="h-2 bg-[#3a3a3a] w-1/3" />
                        </div>
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-[#282828] border border-[#3a3a3a] p-8 text-center">
                    <p className="text-gray-500 text-sm">Логов пока нет</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {logs.map((log) => {
                        const color = actionColors[log.action] || "#888";
                        const isExpanded = expandedId === log.id;
                        let parsedDetails: any = null;
                        try { parsedDetails = log.details ? JSON.parse(log.details) : null; } catch {}

                        return (
                            <div
                                key={log.id}
                                className="bg-[#282828] border border-[#3a3a3a] cursor-pointer hover:border-[#4a4a4a] transition-colors"
                                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            >
                                <div className="px-4 py-2.5 flex items-center gap-3">
                                    {/* Timestamp */}
                                    <span className="text-[9px] text-gray-600 w-[120px] shrink-0 font-mono">
                                        {formatDate(log.createdAt)}
                                    </span>

                                    {/* Action badge */}
                                    <span
                                        className="text-[9px] px-1.5 py-0.5 border shrink-0"
                                        style={{ color, borderColor: color }}
                                    >
                                        {log.action}
                                    </span>

                                    {/* User */}
                                    <span className="text-[10px] text-gray-400 truncate flex-1">
                                        {log.username ? (
                                            <>
                                                <span className="text-gray-300">{[log.userDisplayName, log.userSurname].filter(Boolean).join(" ") || log.username}</span>
                                                <span className="text-gray-600 ml-1">@{log.username}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-600">Система</span>
                                        )}
                                    </span>

                                    {/* Entity */}
                                    {log.targetType && (
                                        <span className="text-[9px] text-gray-600 shrink-0">
                                            {log.targetType}{log.targetId ? `#${log.targetId}` : ""}
                                        </span>
                                    )}

                                    {/* Relative time */}
                                    <span className="text-[9px] text-gray-600 shrink-0 w-[80px] text-right">
                                        {formatShortDate(log.createdAt)}
                                    </span>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="px-4 pb-3 border-t border-[#2a2a2a] pt-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                            <div>
                                                <span className="text-gray-600">ID: </span>
                                                <span className="text-gray-400">{log.id}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">User ID: </span>
                                                <span className="text-gray-400">{log.userId || "—"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">IP: </span>
                                                <span className="text-gray-400">{log.ipAddress || "—"}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Цель: </span>
                                                <span className="text-gray-400">
                                                    {log.targetType}{log.targetId ? ` #${log.targetId}` : ""}
                                                </span>
                                            </div>
                                        </div>
                                        {parsedDetails && (
                                            <div className="mt-2">
                                                <span className="text-[9px] text-gray-600">Данные:</span>
                                                <pre className="text-[9px] text-gray-400 bg-[#1e1e1e] p-2 mt-1 overflow-x-auto border border-[#2a2a2a]">
                                                    {JSON.stringify(parsedDetails, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="text-[10px] px-3 py-1.5 border border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#555] transition-colors disabled:opacity-30"
                    >
                        ← Назад
                    </button>
                    <span className="text-[10px] text-gray-500">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="text-[10px] px-3 py-1.5 border border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#555] transition-colors disabled:opacity-30"
                    >
                        Вперёд →
                    </button>
                </div>
            )}
        </div>
    );
}
