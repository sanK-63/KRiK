import { useState } from "react";
import type { BracketMatch } from "../../pages/tournamentData";
import { tournamentsApi } from "../../services/tournaments";

const statusColors: Record<string, string> = {
    pending: "#6b7280",
    scheduled: "#9ca3af",
    live: "#FA6814",
    completed: "#4CAF50",
    bye: "#9C27B0",
};

const statusLabels: Record<string, string> = {
    pending: "Ожидает",
    scheduled: "Запланирован",
    live: "LIVE",
    completed: "Завершён",
    bye: "BYE",
};

interface Props {
    match: BracketMatch;
    tournamentId: number;
    onRefresh?: () => void;
}

export default function MatchCard({ match, tournamentId, onRefresh }: Props) {
    const m = match;
    const [editing, setEditing] = useState(false);
    const [score1, setScore1] = useState(m.score1 ?? 0);
    const [score2, setScore2] = useState(m.score2 ?? 0);
    const [saving, setSaving] = useState(false);

    const isFinished = m.status === "completed";
    const isLive = m.status === "live";
    const hasTeams = m.team1 != null && m.team2 != null;
    const isBye = m.status === "bye";

    const handleStart = async () => {
        try {
            setSaving(true);
            await tournamentsApi.updateMatch(tournamentId, m.id, { status: "live" });
            onRefresh?.();
        } catch {}
        setSaving(false);
    };

    const handleFinish = async () => {
        if (!hasTeams) return;
        const winnerTeamId = (score1 > score2) ? m.team1 : (score2 > score1) ? m.team2 : null;
        if (winnerTeamId == null) return;
        try {
            setSaving(true);
            await tournamentsApi.updateMatch(tournamentId, m.id, {
                score1,
                score2,
                winnerTeamId,
                status: "completed",
            });
            setEditing(false);
            onRefresh?.();
        } catch {}
        setSaving(false);
    };

    const handleSetWinner = async (winnerTeamId: number) => {
        try {
            setSaving(true);
            await tournamentsApi.updateMatch(tournamentId, m.id, {
                winnerTeamId,
                score1: score1,
                score2: score2,
                status: "completed",
            });
            setEditing(false);
            onRefresh?.();
        } catch {}
        setSaving(false);
    };

    return (
        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">Матч #{m.id}</span>
                <div className="flex items-center gap-2">
                    {m.scheduledAt && (
                        <span className="text-[10px] text-gray-600">
                            {new Date(m.scheduledAt).toLocaleDateString("ru-RU")}
                        </span>
                    )}
                    <span
                        className="text-[10px] uppercase font-semibold px-2 py-0.5"
                        style={{
                            color: statusColors[m.status] || "#6b7280",
                            background: `${statusColors[m.status] || "#6b7280"}15`,
                            border: `1px solid ${statusColors[m.status] || "#6b7280"}30`,
                        }}
                    >
                        {isLive ? "● " : ""}{statusLabels[m.status] || m.status}
                    </span>
                </div>
            </div>

            {/* Teams & Score */}
            <div className="flex items-center justify-between mb-3">
                <div className={`flex-1 text-right pr-3 ${isFinished && (m.score1 ?? 0) > (m.score2 ?? 0) ? "text-white font-semibold" : "text-gray-400"}`}>
                    {m.team1Name || "TBD"}
                </div>
                <div className="px-3 text-center shrink-0">
                    {editing && hasTeams ? (
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min={0}
                                value={score1}
                                onChange={(e) => setScore1(Number(e.target.value))}
                                className="w-12 bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-white text-center px-1 py-1 outline-none focus:border-[#FA6814]"
                            />
                            <span className="text-gray-500 mx-1">:</span>
                            <input
                                type="number"
                                min={0}
                                value={score2}
                                onChange={(e) => setScore2(Number(e.target.value))}
                                className="w-12 bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-white text-center px-1 py-1 outline-none focus:border-[#FA6814]"
                            />
                        </div>
                    ) : (
                        <div>
                            <span className="text-xl font-bold" style={{ color: isLive ? "#FA6814" : "white" }}>
                                {m.score1 ?? "—"}
                            </span>
                            <span className="text-gray-500 mx-1">:</span>
                            <span className="text-xl font-bold" style={{ color: isLive ? "#FA6814" : "white" }}>
                                {m.score2 ?? "—"}
                            </span>
                        </div>
                    )}
                </div>
                <div className={`flex-1 text-left pl-3 ${isFinished && (m.score2 ?? 0) > (m.score1 ?? 0) ? "text-white font-semibold" : "text-gray-400"}`}>
                    {m.team2Name || "TBD"}
                </div>
            </div>

            {/* Winner indicator */}
            {isFinished && m.team1 != null && m.team2 != null && (
                <div className="text-center text-[10px] text-[#4CAF50] mb-2">
                    Победитель: {(m.score1 ?? 0) > (m.score2 ?? 0) ? m.team1Name : m.team2Name}
                </div>
            )}

            {/* Action buttons */}
            {!isBye && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2f2f2f]">
                    {m.status === "scheduled" && hasTeams && (
                        <button
                            onClick={handleStart}
                            disabled={saving}
                            className="bg-[#FA6814] text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer"
                        >
                            Начать матч
                        </button>
                    )}

                    {isLive && !editing && (
                        <button
                            onClick={() => setEditing(true)}
                            disabled={saving}
                            className="bg-[#303030] border border-[#404040] text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-[#3a3a3a] disabled:opacity-30 transition-colors cursor-pointer"
                        >
                            Ввести счёт
                        </button>
                    )}

                    {editing && hasTeams && (
                        <>
                            <button
                                onClick={handleFinish}
                                disabled={saving || score1 === score2}
                                className="bg-[#4CAF50] text-white px-3 py-1.5 text-[10px] font-semibold hover:opacity-90 disabled:opacity-30 transition-colors cursor-pointer"
                            >
                                {saving ? "..." : "Подтвердить"}
                            </button>
                            <button
                                onClick={() => { setEditing(false); setScore1(m.score1 ?? 0); setScore2(m.score2 ?? 0); }}
                                disabled={saving}
                                className="bg-[#303030] border border-[#404040] text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-[#3a3a3a] disabled:opacity-30 transition-colors cursor-pointer"
                            >
                                Отмена
                            </button>
                        </>
                    )}

                    {isLive && !editing && (
                        <>
                            <button
                                onClick={() => handleSetWinner(m.team1!)}
                                disabled={saving || m.team1 == null}
                                className="bg-[#303030] border border-[#404040] text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-[#3a3a3a] disabled:opacity-30 transition-colors cursor-pointer"
                            >
                                {m.team1Name || "Team 1"} ★
                            </button>
                            <button
                                onClick={() => handleSetWinner(m.team2!)}
                                disabled={saving || m.team2 == null}
                                className="bg-[#303030] border border-[#404040] text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-[#3a3a3a] disabled:opacity-30 transition-colors cursor-pointer"
                            >
                                {m.team2Name || "Team 2"} ★
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
