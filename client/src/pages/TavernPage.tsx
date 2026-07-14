import { useState, useEffect } from "react";

interface Recipe {
    id: number;
    name: string;
    description: string | null;
    ingredients: string;
    instructions: string;
    category: string;
    image: string | null;
    createdAt: string;
    author: { id: number; displayName: string | null; username: string; avatar: string | null } | null;
}

const categories = ["Все", "Блюдо", "Напиток", "Закуска", "Десерт", "Соус"];

export default function TavernPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Recipe | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState("Все");
    const token = localStorage.getItem("token");

    const [form, setForm] = useState({
        name: "",
        description: "",
        ingredients: "",
        instructions: "",
        category: "Блюдо",
        image: "",
    });

    const load = () => {
        fetch(`${import.meta.env.VITE_API_URL}/api/recipes`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : []))
            .then(setRecipes)
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!form.name || !form.ingredients || !form.instructions || !token) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/recipes`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...form, image: form.image || null }),
        });
        setForm({ name: "", description: "", ingredients: "", instructions: "", category: "Блюдо", image: "" });
        setShowForm(false);
        load();
    };

    const handleDelete = async (id: number) => {
        if (!token) return;
        await fetch(`${import.meta.env.VITE_API_URL}/api/recipes/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (selected?.id === id) setSelected(null);
        load();
    };

    const filtered = filter === "Все" ? recipes : recipes.filter((r) => r.category === filter);

    const categoryColors: Record<string, string> = {
        Блюдо: "#FA6814",
        Напиток: "#4CAF50",
        Закуска: "#FFB020",
        Десерт: "#E91E63",
        Соус: "#A5A5A5",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                    Таверна
                </h1>
                <button
                    onClick={() => { setShowForm(!showForm); setSelected(null); }}
                    className="text-[10px] uppercase px-4 py-2 bg-[#FA6814] text-white font-medium hover:bg-[#FF7D30] transition-colors cursor-pointer"
                >
                    {showForm ? "Закрыть" : "+ Рецепт"}
                </button>
            </div>

            <div className="flex gap-1 border-b border-[#3b3b3b]">
                {categories.map((c) => (
                    <button
                        key={c}
                        onClick={() => setFilter(c)}
                        className="px-4 py-2.5 text-xs uppercase transition-colors cursor-pointer"
                        style={{
                            color: filter === c ? "#FA6814" : "#6b7280",
                            borderBottom: filter === c ? "2px solid #FA6814" : "2px solid transparent",
                        }}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {showForm && (
                <div className="p-4 space-y-3" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b" }}>
                    <h3 className="text-[10px] uppercase text-gray-400">Новый рецепт</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Название*"
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            className="bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                        />
                        <select
                            value={form.category}
                            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                            className="bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors cursor-pointer"
                        >
                            {categories.filter((c) => c !== "Все").map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <input
                        type="text"
                        placeholder="Описание (кратко)"
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="Ссылка на фото (опционально)"
                        value={form.image}
                        onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                    />
                    <textarea
                        placeholder="Ингредиенты* (каждый с новой строки)"
                        value={form.ingredients}
                        onChange={(e) => setForm((p) => ({ ...p, ingredients: e.target.value }))}
                        rows={3}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors resize-none"
                    />
                    <textarea
                        placeholder="Приготовление*"
                        value={form.instructions}
                        onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
                        rows={5}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors resize-none"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!form.name || !form.ingredients || !form.instructions}
                        className="w-full text-[10px] uppercase px-4 py-3 bg-[#FA6814] text-white font-medium hover:bg-[#FF7D30] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        Добавить рецепт
                    </button>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-5 space-y-2">
                    {loading ? (
                        <p className="text-xs text-gray-500">Загрузка...</p>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b" }}>
                            <p className="text-xs text-gray-500">Нет рецептов</p>
                        </div>
                    ) : (
                        filtered.map((r) => (
                            <div
                                key={r.id}
                                onClick={() => { setSelected(r); setShowForm(false); }}
                                className="p-3 cursor-pointer transition-colors flex items-start gap-3 group"
                                style={{
                                    background: selected?.id === r.id ? "#333" : "#2a2a2a",
                                    border: `1px solid ${selected?.id === r.id ? "#FA6814" : "#3b3b3b"}`,
                                    borderRadius: 4,
                                }}
                            >
                                {r.image && (
                                    <div className="w-12 h-12 shrink-0 bg-[#1e1e1e] border border-[#3b3b3b] overflow-hidden">
                                        <img src={r.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-white font-medium truncate">{r.name}</p>
                                        <span
                                            className="text-[8px] px-1.5 py-0.5 border shrink-0"
                                            style={{ color: categoryColors[r.category] || "#888", borderColor: categoryColors[r.category] || "#888" }}
                                        >
                                            {r.category}
                                        </span>
                                    </div>
                                    {r.description && (
                                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{r.description}</p>
                                    )}
                                    <p className="text-[9px] text-gray-600 mt-0.5">
                                        {r.author?.displayName || r.author?.username || "Аноним"}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                                    className="text-[10px] text-gray-600 hover:text-[#D32F2F] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer px-1 shrink-0"
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="col-span-7">
                    {selected ? (
                        <div className="p-5 space-y-4" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b" }}>
                            {selected.image && (
                                <img src={selected.image} alt={selected.name} className="w-full max-h-64 object-cover" style={{ borderRadius: 4 }} />
                            )}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-sm text-white font-bold">{selected.name}</h2>
                                    <span
                                        className="text-[8px] px-1.5 py-0.5 border"
                                        style={{ color: categoryColors[selected.category] || "#888", borderColor: categoryColors[selected.category] || "#888" }}
                                    >
                                        {selected.category}
                                    </span>
                                </div>
                                {selected.description && (
                                    <p className="text-xs text-gray-400">{selected.description}</p>
                                )}
                                <p className="text-[9px] text-gray-600 mt-1">
                                    {selected.author?.displayName || selected.author?.username || "Аноним"} · {selected.createdAt}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-[10px] uppercase text-gray-400 mb-2" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                                    Ингредиенты
                                </h3>
                                <div className="p-3" style={{ background: "#1e1e1e", border: "1px solid #3a3a3a" }}>
                                    {selected.ingredients.split("\n").map((line, i) => (
                                        <p key={i} className="text-xs text-gray-300">{line}</p>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] uppercase text-gray-400 mb-2" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                                    Приготовление
                                </h3>
                                <div className="p-3" style={{ background: "#1e1e1e", border: "1px solid #3a3a3a" }}>
                                    {selected.instructions.split("\n").map((line, i) => (
                                        <p key={i} className="text-xs text-gray-300 leading-relaxed">{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center h-full min-h-[400px]"
                            style={{ background: "#2a2a2a", border: "1px solid #3b3b3b" }}
                        >
                            <p className="text-xs text-gray-500">Выберите рецепт из списка</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
