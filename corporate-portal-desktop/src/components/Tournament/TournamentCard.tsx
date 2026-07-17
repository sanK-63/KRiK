import type { TournamentListItem } from "../../pages/tournamentData";
import { STATUS_LABELS, FORMAT_LABELS } from "../../pages/tournamentData";

const statusColors: Record<string, string> = {
    draft: "#9C27B0",
    registration: "#4CAF50",
    active: "#FA6814",
    completed: "#6b7280",
};

interface Props {
    tournament: TournamentListItem;
    onClick: () => void;
}

export default function TournamentCard({ tournament, onClick }: Props) {
    const t = tournament;

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
                    {STATUS_LABELS[t.status]}
                </span>
                <span className="text-xs text-gray-500">{t.gameName}</span>
            </div>

            <h3 className="text-base font-semibold mb-2">{t.title}</h3>
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">{t.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                    <span className="text-gray-500">Формат</span>
                    <p className="text-gray-300">{FORMAT_LABELS[t.format]}</p>
                </div>
                <div>
                    <span className="text-gray-500">Тип</span>
                    <p className="text-gray-300">{t.participantType === "team" ? "Команды" : "Игроки"}</p>
                </div>
                <div>
                    <span className="text-gray-500">Регистрация</span>
                    <p className="text-gray-300">
                        {t.registrationOpen ? new Date(t.registrationOpen).toLocaleDateString("ru-RU") : "—"}
                    </p>
                </div>
                <div>
                    <span className="text-gray-500">Старт</span>
                    <p className="text-gray-300">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString("ru-RU") : "—"}
                    </p>
                </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
                <span>Заявок: {t.registrationCount}</span>
                <span>Матчей: {t.matchCount}</span>
            </div>

            {t.creatorName && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#3a3a3a]">
                    {t.creatorAvatar && <img src={t.creatorAvatar} className="w-5 h-5" style={{ borderRadius: 4, objectFit: "cover" }} />}
                    <span className="text-[10px] text-gray-500">Создатель: {t.creatorName}</span>
                </div>
            )}
        </div>
    );
}
