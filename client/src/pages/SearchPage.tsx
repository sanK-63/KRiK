import { useSearchParams, useNavigate } from "react-router-dom";

interface SearchResult {
    category: string;
    categoryColor: string;
    title: string;
    excerpt: string;
    link: string;
}

const allData: SearchResult[] = [
    { category: "Форум", categoryColor: "#2196F3", title: "Изменение графика работы", excerpt: "Начиная с понедельника изменяется порядок смен...", link: "/forum" },
    { category: "Форум", categoryColor: "#2196F3", title: "Приказ №47 — Усиление контроля", excerpt: "В связи с последними инцидентами вводится усиленный контроль...", link: "/forum" },
    { category: "Форум", categoryColor: "#2196F3", title: "Обновление систем безопасности", excerpt: "Завершена модернизация системы пропусков...", link: "/forum" },
    { category: "Форум", categoryColor: "#2196F3", title: "Условия труда в 3-м корпусе", excerpt: "Поднимаю вопрос о состоянии вентиляции в серверной...", link: "/forum" },
    { category: "Обращение", categoryColor: "#FA6814", title: "Обращение #241 — Замена оборудования", excerpt: "Прошу рассмотреть замену устаревшего серверного оборудования...", link: "/appeals" },
    { category: "Обращение", categoryColor: "#FA6814", title: "Обращение #239 — Вопрос по отпуску", excerpt: "Хочу уточнить порядок оформления дополнительного отпуска...", link: "/appeals" },
    { category: "Пользователь", categoryColor: "#4CAF50", title: "Александр", excerpt: "Lord-Generalissimo · admin@admin.com", link: "/users" },
    { category: "Пользователь", categoryColor: "#4CAF50", title: "Дмитрий", excerpt: "Сотрудник · dmitriy@company.com", link: "/users" },
    { category: "Пользователь", categoryColor: "#4CAF50", title: "Елена", excerpt: "Модератор · elena@company.com", link: "/users" },
    { category: "Конституция", categoryColor: "#9C27B0", title: "Конституция Синдиката v2.1", excerpt: "1. Устав Синдиката: Непрекословное подчинение...", link: "/constitution" },
    { category: "Конституция", categoryColor: "#9C27B0", title: "Приказы руководства", excerpt: "Сборник текущих приказов и распоряжений...", link: "/constitution" },
    { category: "Нарушение", categoryColor: "#D32F2F", title: "Нарушение #12 — Опоздание", excerpt: "Систематические опоздания сотрудника Дмитрия...", link: "/violations" },
];

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get("q") || "";

    const results = query
        ? allData.filter(
            (item) =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.excerpt.toLowerCase().includes(query.toLowerCase()) ||
                item.category.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    const grouped = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <>
            <h2 className="text-3xl mb-2">Поиск</h2>
            {query && (
                <p className="text-sm text-gray-400 mb-8">
                    Запрос: <span className="text-[#FA6814]">"{query}"</span> — найдено {results.length}
                </p>
            )}

            {!query && (
                <p className="text-gray-400">Введите запрос в поле поиска в шапке.</p>
            )}

            {query && results.length === 0 && (
                <p className="text-gray-400">Ничего не найдено.</p>
            )}

            {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-8">
                    <h3
                        className="text-sm uppercase font-semibold mb-3 pb-2 border-b border-[#3b3b3b]"
                        style={{ color: items[0].categoryColor }}
                    >
                        {category}
                    </h3>
                    <div className="space-y-3">
                        {items.map((item, i) => (
                            <div
                                key={i}
                                className="bg-[#2a2a2a] border border-[#3b3b3b] p-4 hover:border-[#4a4a4a] transition-colors cursor-pointer"
                                onClick={() => navigate(item.link)}
                            >
                                <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                                <p className="text-xs text-gray-400">{item.excerpt}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
}
