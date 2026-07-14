import { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className = "", ...props }: Props) {
    return (
        <input
            className={`w-full bg-[#252525] border border-[#3a3a3a] text-white px-4 py-3 outline-none focus:border-[#FA6814] transition-colors ${className}`}
            {...props}
        />
    );
}
