import { useState, useEffect } from "react";
import type { Game } from "./tournamentData";
import { gamesApi } from "../services/tournaments";

interface Props {
    embedded?: boolean;
}

const GAME_COLORS: Record<string, string> = {
    cs2: "#F0A500",
    dota2: "#AB1B1B",
    valorant: "#FF4655",
    bf6: "#D4621B",
    bf5: "#8B6914",
    pubg: "#F2A900",
    minecraft: "#45A136",
    wot: "#C4A62A",
    acc: "#1B8FAB",
    ac: "#E63946",
};

function getGameColor(slug: string): string {
    return GAME_COLORS[slug] || "#FA6814";
}

export default function GamesPage({ embedded = false }: Props) {
    const [games, setGames] = useState<Game[]>([]);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newGame, setNewGame] = useState({ name: "", slug: "", platforms: "PC", maps: "", modes: "" });

    useEffect(() => {
        gamesApi.list().then(setGames).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const handleAdd = async () => {
        if (!newGame.name.trim() || !newGame.slug.trim()) return;
        try {
            await gamesApi.create({
                name: newGame.name,
                slug: newGame.slug,
                platforms: newGame.platforms.split(",").map((s) => s.trim()).filter(Boolean),
                maps: newGame.maps ? newGame.maps.split(",").map((s) => s.trim()).filter(Boolean) : [],
                modes: newGame.modes ? newGame.modes.split(",").map((s) => s.trim()).filter(Boolean) : [],
            });
            const updated = await gamesApi.list();
            setGames(updated);
            setNewGame({ name: "", slug: "", platforms: "PC", maps: "", modes: "" });
            setShowAdd(false);
        } catch {}
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
                        className="w-16 h-16 flex items-center justify-center text-base font-bold overflow-hidden"
                        style={{ background: `${getGameColor(selectedGame.slug)}20`, color: getGameColor(selectedGame.slug), border: `2px solid ${getGameColor(selectedGame.slug)}`, borderRadius: 8 }}
                    >
                        {selectedGame.logo || selectedGame.name.substring(0, 4).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{selectedGame.name}</h2>
                        <p className="text-sm text-gray-400">{selectedGame.description || ""}</p>
                        <p className="text-sm text-gray-500 mt-1">Платформы: {selectedGame.platforms.join(", ") || "—"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <h3 className="text-sm uppercase text-gray-400 mb-3">Карты ({selectedGame.maps.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedGame.maps.map((m) => (
                                <span key={m.id} className="text-xs px-3 py-1.5 bg-[#1e1e1e] border border-[#3a3a3a] text-gray-300">{m.name}</span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <h3 className="text-sm uppercase text-gray-400 mb-3">Режимы ({selectedGame.modes.length})</h3>
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

    return (
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

            {loading ? (
                <div className="text-center py-10 text-gray-500 text-sm">Загрузка...</div>
            ) : (
                <div className="grid grid-cols-4 gap-4">
                    {games.map((game) => {
                        const color = getGameColor(game.slug);
                        return (
                            <div
                                key={game.id}
                                className="bg-[#2a2a2a] border border-[#3b3b3b] p-5 hover:border-[#4a4a4a] transition-colors cursor-pointer"
                                onClick={() => setSelectedGame(game)}
                            >
                                <div
                                    className="w-12 h-12 flex items-center justify-center text-[11px] font-bold mb-3 overflow-hidden"
                                    style={{ background: `${color}20`, color, border: `2px solid ${color}`, borderRadius: 6 }}
                                >
                                    {game.logo || game.name.substring(0, 4).toUpperCase()}
                                </div>
                                <h3 className="font-semibold mb-1">{game.name}</h3>
                                <p className="text-xs text-gray-500">{game.platforms.join(", ") || "—"}</p>
                                <p className="text-xs text-gray-500 mt-1">{game.maps.length} карт · {game.modes.length} режимов</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {showAdd && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                    onClick={() => setShowAdd(false)}
                >
                    <div className="w-[500px] bg-[#2a2a2a] border border-[#3b3b3b] p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-5">Добавить игру</h3>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Название *</label>
                        <input type="text" placeholder="Counter-Strike 2" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4" />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Slug *</label>
                        <input type="text" placeholder="cs2" value={newGame.slug} onChange={(e) => setNewGame({ ...newGame, slug: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4" />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Платформы (через запятую)</label>
                        <input type="text" placeholder="PC, Xbox, PlayStation" value={newGame.platforms} onChange={(e) => setNewGame({ ...newGame, platforms: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4" />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Карты (через запятую)</label>
                        <input type="text" placeholder="Dust2, Mirage, Inferno" value={newGame.maps} onChange={(e) => setNewGame({ ...newGame, maps: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4" />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Режимы (через запятую)</label>
                        <input type="text" placeholder="Competitive, Casual" value={newGame.modes} onChange={(e) => setNewGame({ ...newGame, modes: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-5" />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowAdd(false)} className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">Отмена</button>
                            <button onClick={handleAdd} disabled={!newGame.name || !newGame.slug} className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">Добавить</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
