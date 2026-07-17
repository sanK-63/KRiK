interface Event {
    icon: string;
    text: string;
    color: string;
}

const events: Event[] = [
    { icon: "✔", text: "Создано обращение #241", color: "#4CAF50" },
    { icon: "✔", text: "Пользователь вошел в систему", color: "#4CAF50" },
    { icon: "✔", text: "Добавлена новая тема форума", color: "#4CAF50" },
];

export default function ActivityFeed() {
    return (
        <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-6 mt-6">
            <h2 className="text-sm uppercase text-gray-400 mb-4">
                Последние события
            </h2>
            <div className="space-y-3">
                {events.map((event, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                        <span style={{ color: event.color }}>{event.icon}</span>
                        <span className="text-gray-300">{event.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
