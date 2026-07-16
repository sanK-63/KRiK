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
    const avatarUrl = user?.avatar ? `${import.meta.env.VITE_API_URL}${user.avatar}` : null;

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
            >
                <div className="w-9 h-9 sm:w-7 sm:h-7 bg-[#2a2a2a] border border-[#3b3b3b] flex items-center justify-center text-[10px] text-[#FA6814] font-bold overflow-hidden shrink-0">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover object-top" />
                    ) : (
                        initial
                    )}
                </div>
                <span className="text-xs text-gray-300 hover:text-white transition-colors hidden sm:inline">{name}</span>
            </button>
            <button
                onClick={handleLogout}
                className="text-[10px] uppercase text-gray-500 hover:text-[#D32F2F] transition-colors cursor-pointer hidden sm:block"
            >
                Выход
            </button>
        </div>
    );
}
