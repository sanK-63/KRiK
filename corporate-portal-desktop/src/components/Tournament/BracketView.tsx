import type { BracketMatch } from "../../pages/tournamentData";
import MatchCard from "./MatchCard";

interface Props {
    matches: BracketMatch[];
    tournamentId: number;
    onRefresh?: () => void;
}

export default function BracketView({ matches, tournamentId, onRefresh }: Props) {
    if (matches.length === 0) {
        return (
            <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-8 text-center">
                <p className="text-gray-400 text-sm">Сетка ещё не сгенерирована.</p>
            </div>
        );
    }

    const rounds = matches.reduce<Record<number, BracketMatch[]>>((acc, m) => {
        if (!acc[m.roundId]) acc[m.roundId] = [];
        acc[m.roundId].push(m);
        return acc;
    }, {});

    const sortedRoundIds = Object.keys(rounds).map(Number).sort((a, b) => a - b);
    const totalRounds = sortedRoundIds.length;

    const roundNames: Record<number, string> = {};
    sortedRoundIds.forEach((id, i) => {
        if (i === totalRounds - 1) roundNames[id] = "Финал";
        else if (i === totalRounds - 2) roundNames[id] = "Полуфинал";
        else roundNames[id] = `Раунд ${i + 1}`;
    });

    return (
        <div className="overflow-x-auto">
            <div className="flex gap-8 min-w-max pb-4">
                {sortedRoundIds.map((roundId) => (
                    <div key={roundId} className="flex flex-col gap-4">
                        <h4 className="text-xs uppercase text-gray-400 text-center mb-2">
                            {roundNames[roundId] || `Раунд ${roundId}`}
                        </h4>
                        <div className="flex flex-col gap-4" style={{ marginTop: `${sortedRoundIds.indexOf(roundId) * 20}px` }}>
                            {rounds[roundId].map((m) => (
                                <MatchCard
                                    key={m.id}
                                    match={m}
                                    tournamentId={tournamentId}
                                    onRefresh={onRefresh}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
