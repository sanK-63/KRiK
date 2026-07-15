import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./UserMenu";

interface Props {
    onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: Props) {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <header className="border-b border-[#393939] bg-[#252525]">
            <div className="max-w-[1600px] 2xl:max-w-[2000px] h-14 mx-auto flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer text-lg"
                    >
                        ☰
                    </button>
                    <h1
                        className="text-[#FA6814] text-xs sm:text-sm leading-tight whitespace-nowrap"
                        style={{ fontFamily: '"Press Start 2P", system-ui' }}
                    >
                        Рога и Копыта
                    </h1>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Поиск..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-36 sm:w-56 lg:w-72 bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-1.5 outline-none focus:border-[#FA6814] transition-colors"
                        />
                    </form>
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}
