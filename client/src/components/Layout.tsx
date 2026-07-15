import type { ReactNode } from "react";

const navItems = [
    { key: "home", label: "Главная" },
    { key: "forum", label: "Форум" },
    { key: "portal", label: "Портал" },
    { key: "constitution", label: "Конституция" },
    { key: "violations", label: "Нарушения" },
    { key: "users", label: "Пользователи" },
];

interface LayoutProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    children: ReactNode;
    onLogout: () => void;
}

export const Layout = ({ activeTab, onTabChange, children, onLogout }: LayoutProps) => {
    return (
        <div className="flex flex-col h-screen">
            {/* Top Panel */}
            <header
                className="flex items-center h-12 px-4 shrink-0"
                style={{
                    background: "var(--color-bg-secondary)",
                    borderBottom: "1px solid var(--color-border)",
                }}
            >
                {/* Logo */}
                <span
                    className="mr-8 text-[9px] leading-tight whitespace-nowrap"
                    style={{ color: "var(--color-accent)", fontFamily: '"Press Start 2P", system-ui' }}
                >
                    Рога и Копыта
                </span>

                {/* Nav */}
                <nav className="flex items-center gap-1 h-full">
                    {navItems.map((item) => {
                        const active = activeTab === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => onTabChange(item.key)}
                                className="relative h-full px-3 text-xs font-medium transition-colors"
                                style={{
                                    color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                                }}
                                onMouseEnter={(e) => {
                                    if (!active) e.currentTarget.style.color = "#FFFFFF";
                                }}
                                onMouseLeave={(e) => {
                                    if (!active) e.currentTarget.style.color = "var(--color-text-secondary)";
                                }}
                            >
                                {item.label}
                                {active && (
                                    <span
                                        className="absolute bottom-0 left-0 right-0 h-[3px]"
                                        style={{ background: "var(--color-accent)" }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Separator */}
                <div
                    className="h-5 mx-4"
                    style={{ borderLeft: "1px solid var(--color-border)" }}
                />

                {/* User + Logout */}
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Александр
                </span>
                <button
                    onClick={onLogout}
                    className="text-[10px] ml-3 px-2 py-1 transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-error)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                >
                    Выход
                </button>
            </header>

            {/* Content */}
            <main
                className="flex-1 overflow-y-auto p-6"
                style={{ background: "var(--color-bg-primary)" }}
            >
                {children}
            </main>
        </div>
    );
};
