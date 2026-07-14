import type { Tournament } from "../../pages/tournamentData";

const statusColors: Record<string, string> = {
    "Регистрация": "#4CAF50",
    "Идёт": "#FA6814",
    "Завершён": "#6b7280",
    "Черновик": "#9C27B0",
};

interface Props {
    tournament: Tournament;
    onClick: () => void;
}

export default function TournamentCard({ tournament, onClick }: Props) {
    const t = tournament;
    const progress = Math.round((t.currentParticipants / t.maxParticipants) * 100);

    return (
        <div
            className="bg-[#2a2a2a] border border-[#3b3b3b] p-5 hover:border-[#4a4a4a] transition-colors cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-3">
                <span
                    className="text-[10px] uppercase font-semibold px-2 py-0.5"
                    style={{
                        color: statusColors[t.status],
                        background: `${statusColors[t.status]}15`,
                        border: `1px solid ${statusColors[t.status]}30`,
                    }}
                >
                    {t.status}
                </span>
                <span className="text-xs text-gray-500">{t.game}</span>
            </div>

            <h3 className="text-base font-semibold mb-2">{t.name}</h3>
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">{t.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                    <span className="text-gray-500">Формат</span>
                    <p className="text-gray-300">{t.format}</p>
                </div>
                <div>
                    <span className="text-gray-500">Дата</span>
                    <p className="text-gray-300">{t.date} {t.time}</p>
                </div>
                <div>
                    <span className="text-gray-500">Приз</span>
                    <p className="text-[#FA6814] font-semibold">{t.prize}</p>
                </div>
                <div>
                    <span className="text-gray-500">Организатор</span>
                    <p className="text-gray-300">{t.organizer}</p>
                </div>
            </div>

            <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t.participantType === "Команды" ? "Команды" : "Участники"}</span>
                    <span>{t.currentParticipants} / {t.maxParticipants}</span>
                </div>
                <div className="w-full h-1.5 bg-[#1e1e1e] overflow-hidden">
                    <div
                        className="h-full transition-all"
                        style={{ width: `${progress}%`, background: progress >= 90 ? "#D32F2F" : "#FA6814" }}
                    />
                </div>
            </div>
        </div>
    );
}
