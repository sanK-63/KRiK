import type { Tournament } from "../../pages/tournamentData";

const statusColors: Record<string, string> = {
    "Регистрация": "#4CAF50",
    "Идёт": "#FA6814",
    "Завершён": "#6b7280",
    "Черновик": "#9C27B0",
};

interface Props {
    tournament: Tournament;
    onBack: () => void;
}

export default function TournamentControlPanel({ tournament, onBack }: Props) {
    const t = tournament;

    return (
        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm"
                    >
                        ← Назад
                    </button>
                    <h2 className="text-xl font-bold">{t.name}</h2>
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
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-5">
                <div className="bg-[#1e1e1e] border border-[#3a3a3a] p-3">
                    <div className="text-[10px] uppercase text-gray-500">Участники</div>
                    <div className="text-xl font-bold text-[#FA6814]">{t.currentParticipants}/{t.maxParticipants}</div>
                </div>
                <div className="bg-[#1e1e1e] border border-[#3a3a3a] p-3">
                    <div className="text-[10px] uppercase text-gray-500">Команды</div>
                    <div className="text-xl font-bold text-[#FA6814]">{t.teams.length}</div>
                </div>
                <div className="bg-[#1e1e1e] border border-[#3a3a3a] p-3">
                    <div className="text-[10px] uppercase text-gray-500">Матчи</div>
                    <div className="text-xl font-bold text-[#FA6814]">{t.matches.length}</div>
                </div>
                <div className="bg-[#1e1e1e] border border-[#3a3a3a] p-3">
                    <div className="text-[10px] uppercase text-gray-500">Приз</div>
                    <div className="text-xl font-bold text-[#FA6814]">{t.prize || "—"}</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {t.status === "Черновик" && (
                    <button className="bg-[#4CAF50] text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer">
                        Опубликовать
                    </button>
                )}
                {t.status === "Регистрация" && (
                    <>
                        <button className="bg-[#D32F2F] text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer">
                            Закрыть регистрацию
                        </button>
                        <button className="bg-[#FA6814] text-white px-4 py-2 text-xs font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer">
                            Сгенерировать сетку
                        </button>
                    </>
                )}
                {t.status === "Идёт" && (
                    <button className="bg-[#4CAF50] text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer">
                        Завершить турнир
                    </button>
                )}
                <button className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-xs font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">
                    Экспорт
                </button>
                <button className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-xs font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">
                    Настройки
                </button>
                <button className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-xs font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">
                    Удалить
                </button>
            </div>
        </div>
    );
}
