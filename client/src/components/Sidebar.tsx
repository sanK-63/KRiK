import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
    Newspaper,
    MessageSquare,
    Calendar,
    Mail,
    BookOpen,
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
    Shield,
    type LucideIcon,
} from "lucide-react";

const links: [string, string, LucideIcon][] = [
    ["/", "О нас", Newspaper],
    ["/feed", "Лента", Newspaper],
    ["/constitution", "Конституция", BookOpen],
    ["/forum", "Форум", MessageSquare],
    ["/events", "Ивенты", Calendar],
    ["/workers", "Работяги", Swords],
    ["/portal", "Портал", Castle],
    ["/software", "Софт", Download],
    ["/tournament", "Турниры", Trophy],
    ["/cinema", "Кинотека", Film],
    ["/tavern", "Таверна", Beer],
    ["/memes", "Мемы", Laugh],
    ["/leaderboard", "Лидеры", BarChart3],
    ["/research", "Исследования", FlaskConical],
    ["/library", "Библиотека", BookMarked],
    ["/archive", "Архив", Archive],
    ["/messages", "Сообщения", Mail],
];

export default function Sidebar() {
    const { user } = useUser();
    const isAdmin = user?.username === "tunev";
    return (
        <aside
            className="w-56 h-full py-4 overflow-y-auto"
            style={{ background: "#252525", borderRight: "1px solid #393939" }}
        >
            {links.map(([url, name, Icon]) => (
                <NavLink
                    key={url}
                    to={url}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors relative ${
                            isActive
                                ? "text-[#FA6814] bg-[#2a2a2a]"
                                : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#FA6814]" />
                            )}
                            <Icon size={16} />
                            {name}
                        </>
                    )}
                </NavLink>
            ))}
            {isAdmin && (
                <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors relative ${
                            isActive
                                ? "text-[#FA6814] bg-[#2a2a2a]"
                                : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#FA6814]" />
                            )}
                            <Shield size={16} />
                            Админ
                        </>
                    )}
                </NavLink>
            )}
        </aside>
    );
}
