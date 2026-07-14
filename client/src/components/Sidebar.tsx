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

export default function Sidebar() {
    return (
        <aside
            className="w-56 shrink-0 py-6 overflow-y-auto"
            style={{ background: "#252525", borderRight: "1px solid #393939" }}
        >
            {links.map(([url, name]) => (
                <NavLink
                    key={url}
                    to={url}
                    className={({ isActive }) =>
                        `block px-5 py-3 text-sm transition-colors relative ${
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
                            {name}
                        </>
                    )}
                </NavLink>
            ))}
        </aside>
    );
}
