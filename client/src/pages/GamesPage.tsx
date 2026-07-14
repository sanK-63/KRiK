import { useState } from "react";

export interface Game {
    id: number;
    name: string;
    logo: string;
    color: string;
    platforms: string[];
    maps: string[];
    modes: string[];
}

const defaultGames: Game[] = [
    { id: 1, name: "Battlefield 6", logo: "BF6", color: "#D4621B", platforms: ["PC", "Xbox", "PlayStation"], maps: ["Firestorm", "Locker", "Metro", "Operation Locker"], modes: ["Conquest", "Rush", "Breakthrough"] },
    { id: 2, name: "Counter Strike 2", logo: "CS2", color: "#F0A500", platforms: ["PC"], maps: ["Dust2", "Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis"], modes: ["Competitive", "wingman"] },
    { id: 3, name: "Dota 2", logo: "DOTA", color: "#AB1B1B", platforms: ["PC"], maps: ["Captain's Mode"], modes: ["Ranked", "Captain's Mode"] },
    { id: 4, name: "Valorant", logo: "VAL", color: "#FF4655", platforms: ["PC"], maps: ["Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze", "Fracture"], modes: ["Competitive", "Spike Rush"] },
    { id: 5, name: "PUBG", logo: "PUBG", color: "#F2A900", platforms: ["PC", "Xbox", "PlayStation"], maps: ["Erangel", "Miramar", "Sanhok", "Vikendi"], modes: ["Solo", "Duo", "Squad"] },
    { id: 6, name: "Rainbow Six", logo: "R6", color: "#CF0A2C", platforms: ["PC", "Xbox", "PlayStation"], maps: ["Oregon", "Club House", "Kafe", "Bank"], modes: ["Bomb", "Hostage"] },
    { id: 7, name: "Escape From Tarkov", logo: "EFT", color: "#4A6741", platforms: ["PC"], maps: ["Customs", "Woods", "Shoreline", "Interchange", "Labs"], modes: ["PMC", "Scav"] },
    { id: 8, name: "Call of Duty", logo: "COD", color: "#2A2A2A", platforms: ["PC", "Xbox", "PlayStation"], maps: ["Shipment", "Rust", "Terminal", "Highrise"], modes: ["TDM", "Domination", "Search & Destroy"] },
];

interface Props {
    embedded?: boolean;
}

export default function GamesPage({ embedded = false }: Props) {
    const [games, setGames] = useState<Game[]>(defaultGames);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newGame, setNewGame] = useState({ name: "", color: "#FA6814", platforms: "PC", maps: "", modes: "" });

    const handleAdd = () => {
        if (!newGame.name.trim()) return;
        const game: Game = {
            id: Date.now(),
            name: newGame.name,
            logo: newGame.name.substring(0, 4).toUpperCase(),
            color: newGame.color,
            platforms: newGame.platforms.split(",").map((s) => s.trim()),
            maps: newGame.maps ? newGame.maps.split(",").map((s) => s.trim()) : [],
            modes: newGame.modes ? newGame.modes.split(",").map((s) => s.trim()) : [],
        };
        setGames([...games, game]);
        setNewGame({ name: "", color: "#FA6814", platforms: "PC", maps: "", modes: "" });
        setShowAdd(false);
    };

    if (selectedGame) {
        return (
            <div>
                <button
                    onClick={() => setSelectedGame(null)}
                    className="text-sm text-gray-400 hover:text-white transition-colors mb-6 cursor-pointer"
                >
                    ← Назад к играм
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div
                        className="w-16 h-16 flex items-center justify-center text-lg font-bold"
                        style={{ background: `${selectedGame.color}20`, color: selectedGame.color, border: `2px solid ${selectedGame.color}`, borderRadius: 8 }}
                    >
                        {selectedGame.logo}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{selectedGame.name}</h2>
                        <p className="text-sm text-gray-400">Платформы: {selectedGame.platforms.join(", ")}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <h3 className="text-sm uppercase text-gray-400 mb-3">Карты</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedGame.maps.map((m) => (
                                <span key={m} className="text-xs px-3 py-1.5 bg-[#1e1e1e] border border-[#3a3a3a] text-gray-300">{m}</span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <h3 className="text-sm uppercase text-gray-400 mb-3">Режимы</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedGame.modes.map((m) => (
                                <span key={m} className="text-xs px-3 py-1.5 bg-[#1e1e1e] border border-[#3a3a3a] text-gray-300">{m}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const content = (
        <>
            {!embedded && (
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl">Игры</h2>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold uppercase hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                    >
                        Добавить игру
                    </button>
                </div>
            )}

            <div className="grid grid-cols-4 gap-4">
                {games.map((game) => (
                    <div
                        key={game.id}
                        className="bg-[#2a2a2a] border border-[#3b3b3b] p-5 hover:border-[#4a4a4a] transition-colors cursor-pointer"
                        onClick={() => setSelectedGame(game)}
                    >
                        <div
                            className="w-12 h-12 flex items-center justify-center text-sm font-bold mb-3"
                            style={{ background: `${game.color}20`, color: game.color, border: `2px solid ${game.color}`, borderRadius: 6 }}
                        >
                            {game.logo}
                        </div>
                        <h3 className="font-semibold mb-1">{game.name}</h3>
                        <p className="text-xs text-gray-500">{game.platforms.join(", ")}</p>
                        <p className="text-xs text-gray-500 mt-1">{game.maps.length} карт · {game.modes.length} режимов</p>
                    </div>
                ))}
            </div>

            {showAdd && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                    onClick={() => setShowAdd(false)}
                >
                    <div className="w-[500px] bg-[#2a2a2a] border border-[#3b3b3b] p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-5">Добавить игру</h3>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Название</label>
                        <input type="text" placeholder="Название игры" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4" />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Цвет</label>
                        <input type="color" value={newGame.color} onChange={(e) => setNewGame({ ...newGame, color: e.target.value })} className="w-full h-10 bg-[#1e1e1e] border border-[#3a3a3a] mb-4 cursor-pointer" />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Платформы (через запятую)</label>
                        <input type="text" placeholder="PC, Xbox, PlayStation" value={newGame.platforms} onChange={(e) => setNewGame({ ...newGame, platforms: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4" />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Карты (через запятую)</label>
                        <input type="text" placeholder="Dust2, Mirage, Inferno" value={newGame.maps} onChange={(e) => setNewGame({ ...newGame, maps: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4" />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Режимы (через запятую)</label>
                        <input type="text" placeholder="Competitive, Casual" value={newGame.modes} onChange={(e) => setNewGame({ ...newGame, modes: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-5" />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowAdd(false)} className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">Отмена</button>
                            <button onClick={handleAdd} className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer">Добавить</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return content;
}
