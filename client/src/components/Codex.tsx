import { useEffect, useState } from "react";

export const Codex = () => {
    const [data, setData] = useState({ content: "", version: "" });

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/constitution`, {
            headers: {
                Authorization: localStorage.getItem("token") || "",
            },
        })
            .then((res) => res.json())
            .then(setData);
    }, []);

    return (
        <div className="card p-6">
            <div
                className="flex justify-between items-center mb-4 pb-3"
                style={{ borderBottom: "1px solid var(--color-border)" }}
            >
                <h2
                    className="text-xs uppercase tracking-widest"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    Конституция
                </h2>
                <span className="text-xs font-mono" style={{ color: "var(--color-accent)" }}>
                    v{data.version}
                </span>
            </div>
            <pre
                className="font-mono whitespace-pre-wrap leading-relaxed text-sm"
                style={{ color: "var(--color-text-primary)" }}
            >
                {data.content}
            </pre>
        </div>
    );
};
