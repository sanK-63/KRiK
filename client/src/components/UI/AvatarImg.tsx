interface AvatarImgProps {
    src: string | null | undefined;
    name?: string;
    size?: string;
    className?: string;
}

export default function AvatarImg({ src, name, size = "w-8 h-8", className = "" }: AvatarImgProps) {
    const initial = (name?.[0] || "?").toUpperCase();

    if (src) {
        return (
            <img
                src={src}
                alt=""
                className={`${size} object-cover object-top shrink-0 ${className}`}
            />
        );
    }

    return (
        <div className={`${size} bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center text-[10px] text-[#FA6814] font-bold shrink-0 ${className}`}>
            {initial}
        </div>
    );
}
