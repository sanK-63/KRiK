import type { Match } from "../../pages/tournamentData";

interface Props {
    matches: Match[];
}

export default function BracketView({ matches }: Props) {
    if (matches.length === 0) {
        return (
            <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-8 text-center">
                <p className="text-gray-400 text-sm">Сетка ещё не сгенерирована.</p>
            </div>
        );
    }

    const rounds = matches.reduce<Record<number, Match[]>>((acc, m) => {
        if (!acc[m.round]) acc[m.round] = [];
        acc[m.round].push(m);
        return acc;
    }, {});

    const roundNames: Record<number, string> = {};
    const totalRounds = Math.max(...Object.keys(rounds).map(Number));
    Object.keys(rounds).forEach((r) => {
        const rn = Number(r);
        if (rn === totalRounds) roundNames[rn] = "Финал";
        else if (rn === totalRounds - 1) roundNames[rn] = "Полуфинал";
        else roundNames[rn] = `Раунд ${rn}`;
    });

    return (
        <div className="overflow-x-auto">
            <div className="flex gap-8 min-w-max pb-4">
                {Object.entries(rounds)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([round, roundMatches]) => (
                        <div key={round} className="flex flex-col gap-4">
                            <h4 className="text-xs uppercase text-gray-400 text-center mb-2">
                                {roundNames[Number(round)] || `Раунд ${round}`}
                            </h4>
                            <div className="flex flex-col gap-4" style={{ marginTop: `${Number(round) * 20}px` }}>
                                {roundMatches.map((m) => (
                                    <div
                                        key={m.id}
                                        className="bg-[#2a2a2a] border border-[#3b3b3b] w-56"
                                    >
                                        <div
                                            className="flex items-center justify-between px-3 py-2 border-b border-[#3b3b3b]"
                                            style={{
                                                color: m.status === "finished" && m.score1 > m.score2 ? "#FA6814" : "#9ca3af",
                                            }}
                                        >
                                            <span className="text-xs truncate">{m.player1}</span>
                                            <span className="text-xs font-semibold">{m.score1}</span>
                                        </div>
                                        <div
                                            className="flex items-center justify-between px-3 py-2"
                                            style={{
                                                color: m.status === "finished" && m.score2 > m.score1 ? "#FA6814" : "#9ca3af",
                                            }}
                                        >
                                            <span className="text-xs truncate">{m.player2}</span>
                                            <span className="text-xs font-semibold">{m.score2}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
