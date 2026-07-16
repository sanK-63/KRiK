import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

interface SearchResult {
    category: string;
    categoryColor: string;
    title: string;
    excerpt: string;
    link: string;
}

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get("q") || "";
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        fetch(`${API}/api/search?q=${encodeURIComponent(query)}`)
            .then((r) => r.json())
            .then((data) => setResults(data.results || []))
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    }, [query]);

    const grouped = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-[#FA6814] text-sm mb-1" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Поиск</h2>

            {query && (
                <p className="text-xs text-gray-500 mb-6">
                    Запрос: <span className="text-[#FA6814]">"{query}"</span>
                    {loading ? " — поиск..." : ` — найдено ${results.length}`}
                </p>
            )}

            {!query && (
                <div className="bg-[#282828] border border-[#3a3a3a] p-8 text-center">
                    <p className="text-gray-500 text-sm">Введите запрос в поле поиска в шапке</p>
                    <p className="text-gray-600 text-xs mt-2">Поиск по пользователям, форуму, кино, турнирам, ивентам, софту, рецептам, мемам</p>
                </div>
            )}

            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#282828] border border-[#3a3a3a] p-4 animate-pulse">
                            <div className="h-3 bg-[#3a3a3a] w-1/3 mb-2" />
                            <div className="h-2 bg-[#3a3a3a] w-2/3" />
                        </div>
                    ))}
                </div>
            )}

            {!loading && query && results.length === 0 && (
                <div className="bg-[#282828] border border-[#3a3a3a] p-8 text-center">
                    <p className="text-gray-500 text-sm">Ничего не найдено по запросу «{query}»</p>
                </div>
            )}

            {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-6">
                    <h3
                        className="text-xs uppercase font-bold mb-3 pb-2 border-b border-[#3a3a3a]"
                        style={{ color: items[0].categoryColor }}
                    >
                        {category} ({items.length})
                    </h3>
                    <div className="space-y-2">
                        {items.map((item, i) => (
                            <div
                                key={i}
                                className="bg-[#282828] border border-[#3a3a3a] p-4 hover:border-[#FA6814] transition-colors cursor-pointer"
                                onClick={() => navigate(item.link)}
                            >
                                <h4 className="text-white text-sm font-semibold mb-1">{item.title}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">{item.excerpt}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
