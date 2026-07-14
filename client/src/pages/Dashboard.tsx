import Card from "../components/UI/Card";

export default function Dashboard() {
    return (
        <>
            <h2 className="text-3xl mb-8">Добро пожаловать</h2>
            <div className="grid grid-cols-4 gap-6">
                <Card title="Обращения" value={12} />
                <Card title="Темы форума" value={64} />
                <Card title="Нарушения" value={2} />
                <Card title="Пользователи" value={41} />
            </div>
        </>
    );
}
