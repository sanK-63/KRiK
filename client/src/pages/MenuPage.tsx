import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
    Newspaper,
    BookOpen,
    MessageSquare,
    Calendar,
    Swords,
    Castle,
    Download,
    Trophy,
    Film,
    Beer,
    Laugh,
    BarChart3,
    FlaskConical,
    BookMarked,
    Archive,
    Mail,
    Shield,
    LogOut,
    type LucideIcon,
} from "lucide-react";

interface MenuItem {
    to: string;
    label: string;
    desc: string;
    icon: LucideIcon;
}

const menuItems: MenuItem[] = [
    { to: "/", label: "О нас", desc: "Информация о сообществе", icon: Newspaper },
    { to: "/feed", label: "Лента", desc: "Последние публикации", icon: Newspaper },
    { to: "/constitution", label: "Конституция", desc: "Правила и устав", icon: BookOpen },
    { to: "/forum", label: "Форум", desc: "Обсуждения", icon: MessageSquare },
    { to: "/events", label: "Ивенты", desc: "Мероприятия", icon: Calendar },
    { to: "/workers", label: "Работяги", desc: "Команда", icon: Swords },
    { to: "/portal", label: "Портал", desc: "Навигация", icon: Castle },
    { to: "/software", label: "Софт", desc: "Полезные программы", icon: Download },
    { to: "/tournament", label: "Турниры", desc: "Соревнования", icon: Trophy },
    { to: "/cinema", label: "Кинотека", desc: "Фильмы и сериалы", icon: Film },
    { to: "/tavern", label: "Таверна", desc: "Чат-бар", icon: Beer },
    { to: "/memes", label: "Мемы", desc: "Юмор", icon: Laugh },
    { to: "/leaderboard", label: "Лидеры", desc: "Рейтинг", icon: BarChart3 },
    { to: "/research", label: "Исследования", desc: "Научные проекты", icon: FlaskConical },
    { to: "/library", label: "Библиотека", desc: "Книги и материалы", icon: BookMarked },
    { to: "/archive", label: "Архив", desc: "История", icon: Archive },
    { to: "/messages", label: "Сообщения", desc: "Личные сообщения", icon: Mail },
];

export default function MenuPage() {
    const { user, logout } = useUser();
    const navigate = useNavigate();
    const isAdmin = user?.username === "tunev";

    const items = isAdmin
        ? [...menuItems, { to: "/admin", label: "Админ", desc: "Панель управления", icon: Shield }]
        : menuItems;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="py-2">
            <h2
                className="text-[#FA6814] text-[10px] sm:text-xs mb-4"
                style={{ fontFamily: '"Press Start 2P", system-ui' }}
            >
                Разделы
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map(({ to, label, desc, icon: Icon }) => (
                    <Link
                        key={to}
                        to={to}
                        className="flex flex-col items-center gap-2 p-4 bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#FA6814] hover:bg-[#2f2f2f] transition-all text-center"
                    >
                        <Icon size={24} className="text-[#FA6814]" />
                        <span className="text-[11px] text-white font-medium">{label}</span>
                        <span className="text-[9px] text-gray-500 leading-tight">{desc}</span>
                    </Link>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-2 p-4 bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#D32F2F] hover:bg-[#2f2f2f] transition-all text-center cursor-pointer"
                >
                    <LogOut size={24} className="text-[#D32F2F]" />
                    <span className="text-[11px] text-white font-medium">Выход</span>
                    <span className="text-[9px] text-gray-500 leading-tight">Выйти из аккаунта</span>
                </button>
            </div>
        </div>
    );
}
