interface Post {
    id: number;
    category: string;
    categoryColor: string;
    title: string;
    excerpt: string;
    author: string;
    date: string;
    pinned?: boolean;
    comments: number;
}

const posts: Post[] = [
    {
        id: 1,
        category: "Объявление",
        categoryColor: "#FA6814",
        title: "Изменение графика работы",
        excerpt: "Начиная с понедельника изменяется порядок смен. Все сотрудники обязаны ознакомиться с новым расписанием в разделе «Документы».",
        author: "Александр",
        date: "Сегодня 12:20",
        pinned: true,
        comments: 8,
    },
    {
        id: 2,
        category: "Приказ",
        categoryColor: "#D32F2F",
        title: "Приказ №47 — Усиление контроля",
        excerpt: "В связи с последними инцидентами вводится усиленный контроль за перемещением сотрудников между корпусами.",
        author: "Руководство",
        date: "Сегодня 10:05",
        pinned: true,
        comments: 12,
    },
    {
        id: 3,
        category: "Новость",
        categoryColor: "#4CAF50",
        title: "Обновление систем безопасности",
        excerpt: "Завершена модернизация системы пропусков. Новые карты доступа будут выданы до конца недели.",
        author: "ИТ-отдел",
        date: "Вчера 18:30",
        comments: 5,
    },
    {
        id: 4,
        category: "Форум",
        categoryColor: "#2196F3",
        title: "Обсуждение: условия труда в 3-м корпусе",
        excerpt: "Поднимаю вопрос о состоянии вентиляции в серверной. Температура стабильно выше нормы.",
        author: "Дмитрий",
        date: "Вчера 14:15",
        comments: 23,
    },
    {
        id: 5,
        category: "Документ",
        categoryColor: "#9C27B0",
        title: "Конституция Синдиката v2.1",
        excerpt: "Опубликована обновлённая версия Конституции. Основные изменения касаются раздела «Дисциплинарные меры».",
        author: "Александр",
        date: "12 июля 16:40",
        comments: 3,
    },
    {
        id: 6,
        category: "Новость",
        categoryColor: "#4CAF50",
        title: "Плановый ремонт лифтов",
        excerpt: "С 15 по 18 июля planned профилактика лифтов в Блоке А. Используйте лестницы.",
        author: "Хозяйственный отдел",
        date: "12 июля 09:00",
        comments: 1,
    },
];

export default function ForumPage() {
    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl">Форум</h2>
                <button className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold uppercase hover:bg-[#ff7a2a] transition-colors cursor-pointer">
                    Новая тема
                </button>
            </div>

            <div className="space-y-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="bg-[#2a2a2a] border border-[#3b3b3b] p-6 hover:border-[#4a4a4a] transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            {post.pinned && (
                                <span className="text-xs text-[#FA6814] uppercase font-semibold">
                                    📌 Закреплено
                                </span>
                            )}
                            <span
                                className="text-xs uppercase font-semibold px-2 py-0.5"
                                style={{
                                    color: post.categoryColor,
                                    background: `${post.categoryColor}15`,
                                    border: `1px solid ${post.categoryColor}30`,
                                }}
                            >
                                {post.category}
                            </span>
                        </div>

                        <h3 className="text-lg font-semibold mb-2">
                            {post.title}
                        </h3>

                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                            {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                                <span>{post.author}</span>
                                <span>{post.date}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span>💬 {post.comments}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
