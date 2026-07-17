import { NavLink } from "react-router-dom";
import { Newspaper, MessageSquare, Calendar, Mail, Menu } from "lucide-react";

const items = [
    { to: "/feed", label: "Лента", icon: Newspaper },
    { to: "/forum", label: "Форум", icon: MessageSquare },
    { to: "/events", label: "Ивенты", icon: Calendar },
    { to: "/messages", label: "Сообщения", icon: Mail },
    { to: "/menu", label: "Ещё", icon: Menu },
];

export default function BottomNav() {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t xl:hidden"
            style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
                paddingBottom: "env(safe-area-inset-bottom)",
            }}
        >
            {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === "/menu"}
                    className={({ isActive }) =>
                        `flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[9px] transition-colors ${
                            isActive
                                ? "text-[#FA6814]"
                                : "text-gray-500 active:text-[#FA6814]"
                        }`
                    }
                >
                    <Icon size={20} />
                    {label}
                </NavLink>
            ))}
        </nav>
    );
}
