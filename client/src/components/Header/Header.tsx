import UserMenu from "./UserMenu";

export default function Header() {
    return (
        <header className="border-b border-[#393939] bg-[#252525]">
            <div className="max-w-[1600px] h-14 mx-auto flex items-center justify-between px-6">
                <h1
                    className="text-[#FA6814] text-[10px] leading-tight whitespace-nowrap"
                    style={{ fontFamily: '"Press Start 2P", system-ui' }}
                >
                    Рога и Копыта
                </h1>

                <div className="flex items-center gap-6">
                    <input
                        type="text"
                        placeholder="Поиск..."
                        className="w-56 bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-1.5 outline-none focus:border-[#FA6814] transition-colors"
                    />
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}
