import { Outlet } from "react-router-dom";
import { useState } from "react";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex flex-col h-screen">
            <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1 overflow-hidden">
                <div
                    className="shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ width: sidebarOpen ? 224 : 0 }}
                >
                    <Sidebar />
                </div>
                <main className="flex-1 overflow-y-auto p-8" style={{ background: "#212121" }}>
                    <div className="max-w-[1400px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
