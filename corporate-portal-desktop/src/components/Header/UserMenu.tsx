import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function UserMenu() {
    const navigate = useNavigate();
    const { user, logout } = useUser();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const name = user?.displayName || user?.username || "—";
    const initial = (user?.displayName?.[0] || user?.username?.[0] || "?").toUpperCase();

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
            >
                <div className="w-7 h-7 bg-[#2a2a2a] border border-[#3b3b3b] flex items-center justify-center text-[10px] text-[#FA6814] font-bold">
                    {initial}
                </div>
                <span className="text-xs text-gray-300 hover:text-white transition-colors">{name}</span>
            </button>
            <button
                onClick={handleLogout}
                className="text-[10px] uppercase text-gray-500 hover:text-[#D32F2F] transition-colors cursor-pointer"
            >
                Выход
            </button>
        </div>
    );
}
