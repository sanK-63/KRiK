import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import ChatAssistant from "../components/ChatAssistant/ChatAssistant";

function useScreenWidth() {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);
    return width;
}

export default function MainLayout() {
    const width = useScreenWidth();
    const isSmallScreen = width < 1280;
    const [sidebarOpen, setSidebarOpen] = useState(!isSmallScreen);

    useEffect(() => {
        setSidebarOpen(!isSmallScreen);
    }, [isSmallScreen]);

    return (
        <div className="flex flex-col h-screen">
            <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex flex-1 overflow-hidden relative">
                {isSmallScreen && sidebarOpen && (
                    <div
                        className="absolute inset-0 bg-black/50 z-30"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                <div
                    className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out z-40 ${
                        isSmallScreen && sidebarOpen ? "absolute top-0 left-0 h-full" : ""
                    }`}
                    style={{ width: sidebarOpen ? 224 : 0 }}
                >
                    <Sidebar />
                </div>
                <main
                    className={`flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 xl:pb-6 pb-20`}
                    style={{ background: "#212121" }}
                >
                    <div className="max-w-[1600px] 2xl:max-w-[2000px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
            <BottomNav />
            <ChatAssistant />
        </div>
    );
}
