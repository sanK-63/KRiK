import type { Match } from "../../pages/tournamentData";

const statusColors: Record<string, string> = {
    "pending": "#6b7280",
    "live": "#FA6814",
    "finished": "#4CAF50",
};

const statusLabels: Record<string, string> = {
    "pending": "Ожидает",
    "live": "LIVE",
    "finished": "Завершён",
};

interface Props {
    match: Match;
}

export default function MatchCard({ match }: Props) {
    const m = match;
    const isFinished = m.status === "finished";
    const isLive = m.status === "live";

    return (
        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">Раунд {m.round}</span>
                <span
                    className="text-[10px] uppercase font-semibold px-2 py-0.5"
                    style={{
                        color: statusColors[m.status],
                        background: `${statusColors[m.status]}15`,
                        border: `1px solid ${statusColors[m.status]}30`,
                    }}
                >
                    {isLive ? "● " : ""}{statusLabels[m.status]}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className={`flex-1 text-right ${isFinished && m.score1 > m.score2 ? "text-white font-semibold" : "text-gray-400"}`}>
                    {m.player1}
                </div>
                <div className="px-4 text-center">
                    <span className="text-xl font-bold" style={{ color: isLive ? "#FA6814" : "white" }}>
                        {m.score1}
                    </span>
                    <span className="text-gray-500 mx-1">:</span>
                    <span className="text-xl font-bold" style={{ color: isLive ? "#FA6814" : "white" }}>
                        {m.score2}
                    </span>
                </div>
                <div className={`flex-1 text-left ${isFinished && m.score2 > m.score1 ? "text-white font-semibold" : "text-gray-400"}`}>
                    {m.player2}
                </div>
            </div>

            {m.maps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#3b3b3b] space-y-1">
                    {m.maps.map((map, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{map.name}</span>
                            <span className="text-gray-400">{map.winner}</span>
                        </div>
                    ))}
                </div>
            )}

            {m.judge && (
                <div className="mt-2 text-xs text-gray-500">
                    Судья: {m.judge}
                </div>
            )}
        </div>
    );
}
