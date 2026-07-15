import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface LeaderboardEntry {
    rank: number;
    userId: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
    elo: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winrate: number;
}

interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    total: number;
    page: number;
    limit: number;
}

function getEloColor(elo: number): string {
    if (elo >= 1400) return "#FFD700";
    if (elo >= 1200) return "#FA6814";
    if (elo >= 1000) return "#3CB371";
    if (elo >= 800) return "#5B9BD5";
    return "#A5A5A5";
}

function getEloRank(elo: number): string {
    if (elo >= 1600) return "Гроссмейстер";
    if (elo >= 1400) return "Мастер";
    if (elo >= 1200) return "Эксперт";
    if (elo >= 1000) return "Боец";
    if (elo >= 800) return "Новичок";
    return "Рекрут";
}

function getMedal(rank: number): string {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
}

function toRoman(num: number): string {
    const lookup: [number, string][] = [
        [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
        [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
        [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
    ];
    let result = "";
    for (const [val, sym] of lookup) {
        while (num >= val) { result += sym; num -= val; }
    }
    return result;
}

export default function LeaderboardPage() {
    const navigate = useNavigate();
    const [data, setData] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const limit = 20;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/elo/leaderboard?page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [page, navigate]);

    const totalPages = data ? Math.ceil(data.total / limit) : 1;

    return (
        <div className="max-w-4xl space-y-6">
            <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                Таблица лидеров
            </h1>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <span className="text-xs text-gray-500">Загрузка...</span>
                </div>
            ) : !data || data.leaderboard.length === 0 ? (
                <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-8 text-center">
                    <p className="text-xs text-gray-500">Пока нет данных. Сыграйте в турнирах, чтобы попасть в рейтинг!</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">
                            Всего игроков: {data.total}
                        </span>
                    </div>

                    <div
                        className="overflow-hidden"
                        style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                    >
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: "1px solid #3b3b3b" }}>
                                    <th className="px-4 py-3 text-left text-[10px] text-gray-500 font-medium uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-[10px] text-gray-500 font-medium uppercase">Игрок</th>
                                    <th className="px-4 py-3 text-center text-[10px] text-gray-500 font-medium uppercase">ELO</th>
                                    <th className="px-4 py-3 text-center text-[10px] text-gray-500 font-medium uppercase">Ранг</th>
                                    <th className="px-4 py-3 text-center text-[10px] text-gray-500 font-medium uppercase">Матчи</th>
                                    <th className="px-4 py-3 text-center text-[10px] text-gray-500 font-medium uppercase">W / L</th>
                                    <th className="px-4 py-3 text-center text-[10px] text-gray-500 font-medium uppercase">Winrate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.leaderboard.map((entry) => {
                                    const medal = getMedal(entry.rank);
                                    const eloColor = getEloColor(entry.elo);
                                    const eloRank = getEloRank(entry.elo);
                                    const initials = (entry.displayName?.[0] || entry.username?.[0] || "?").toUpperCase();

                                    return (
                                        <tr
                                            key={entry.userId}
                                            style={{ borderBottom: "1px solid #2f2f2f" }}
                                            className="hover:bg-[#2f2f2f] transition-colors cursor-pointer"
                                            onClick={() => navigate(`/user/${entry.userId}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <span
                                                    className={entry.rank <= 3 ? "text-xs" : "text-xs text-gray-400"}
                                                    style={entry.rank <= 3 ? { fontFamily: '"Press Start 2P", system-ui', color: getEloColor(entry.elo) } : undefined}
                                                >
                                                    {medal || toRoman(entry.rank)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-[#1e1e1e] border border-[#3b3b3b] overflow-hidden shrink-0">
                                                        {entry.avatar ? (
                                                            <img src={entry.avatar} alt="" className="w-full h-full object-cover object-top" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-[#FA6814] font-bold">
                                                                {initials}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-white font-medium">
                                                            {entry.displayName || entry.username}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 ml-2">
                                                            @{entry.username}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-sm font-bold" style={{ color: eloColor }}>
                                                    {entry.elo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className="text-[10px] px-2 py-0.5 font-medium"
                                                    style={{
                                                        color: eloColor,
                                                        border: `1px solid ${eloColor}`,
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    {eloRank}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs text-gray-300">{entry.gamesPlayed}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-[10px]">
                                                    <span className="text-[#4CAF50]">{entry.wins}</span>
                                                    <span className="text-gray-600 mx-1">/</span>
                                                    <span className="text-[#D32F2F]">{entry.losses}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs text-gray-300">{entry.winrate}%</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="text-[10px] px-3 py-1.5 bg-[#2a2a2a] border border-[#3b3b3b] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Назад
                            </button>
                            <span className="text-[10px] text-gray-500">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="text-[10px] px-3 py-1.5 bg-[#2a2a2a] border border-[#3b3b3b] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Далее
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
