import type { ReactNode, ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary";
}

export default function Button({ children, variant = "primary", className = "", ...props }: Props) {
    const base = "px-5 py-2.5 font-semibold text-sm uppercase transition-colors cursor-pointer";

    const variants = {
        primary: "bg-[#FA6814] text-white hover:bg-[#ff7a2a]",
        secondary: "bg-[#303030] border border-[#404040] text-white hover:bg-[#3a3a3a]",
    };

    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}
