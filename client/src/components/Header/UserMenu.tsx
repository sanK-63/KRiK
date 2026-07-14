import { useNavigate } from "react-router-dom";

export default function UserMenu() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">Александр</span>
            <button
                onClick={handleLogout}
                className="text-[10px] uppercase text-gray-500 hover:text-[#D32F2F] transition-colors cursor-pointer"
            >
                Выход
            </button>
        </div>
    );
}
