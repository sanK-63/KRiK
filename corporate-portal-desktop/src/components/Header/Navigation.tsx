import { NavLink } from "react-router-dom";

const links: [string, string][] = [
    ["/", "Главная"],
    ["/forum", "Форум"],
    ["/portal", "Портал"],
    ["/constitution", "Конституция"],
    ["/violations", "Нарушения"],
    ["/users", "Пользователи"],
    ["/logs", "Логи"],
];

export default function Navigation() {
    return (
        <nav className="flex gap-6">
            {links.map(([url, name]) => (
                <NavLink
                    key={url}
                    to={url}
                    className={({ isActive }) =>
                        `uppercase text-sm transition ${
                            isActive
                                ? "text-[#FA6814]"
                                : "text-gray-400 hover:text-white"
                        }`
                    }
                >
                    {name}
                </NavLink>
            ))}
        </nav>
    );
}
