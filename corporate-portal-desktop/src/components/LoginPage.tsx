import { useState } from "react";

type LoginState = "idle" | "loading" | "granted";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
    const [key, setKey] = useState("");
    const [state, setState] = useState<LoginState>("idle");
    const [progress, setProgress] = useState(0);

    const handleSubmit = () => {
        if (!key) return;
        setState("loading");
        setProgress(0);

        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 15 + 5;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setProgress(100);
                setState("granted");
                setTimeout(() => onLogin(), 1200);
            }
            setProgress(Math.min(p, 100));
        }, 120);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: "var(--color-bg-primary)" }}
        >
            <div
                className="w-[600px] p-10"
                style={{
                    background: "#292929",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                }}
            >
                <h1
                    className="text-center text-3xl uppercase mb-10"
                    style={{ color: "var(--color-accent)", fontFamily: '"Press Start 2P", system-ui' }}
                >
                    Контора
                    <br />
                    <span className="whitespace-nowrap">"Рога и Копыта"</span>
                </h1>

                {state === "idle" && (
                    <>
                        <p
                            className="text-center mb-8 text-sm"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            Введите персональный ключ доступа
                        </p>

                        <label className="block mb-2 uppercase text-sm">
                            Ключ
                        </label>

                        <input
                            type="password"
                            placeholder="Введите ключ..."
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        />

                        <button
                            className="btn-primary mt-8 w-full h-12"
                            onClick={handleSubmit}
                        >
                            Войти
                        </button>
                    </>
                )}

                {state === "loading" && (
                    <div className="mt-4">
                        <p
                            className="text-sm mb-4 uppercase tracking-widest"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            Проверка ключа...
                        </p>
                        <div
                            className="w-full h-4 overflow-hidden"
                            style={{ background: "var(--color-input-bg)", border: "1px solid var(--color-border)" }}
                        >
                            <div
                                className="h-full transition-all duration-100"
                                style={{
                                    width: `${progress}%`,
                                    background: "var(--color-accent)",
                                }}
                            />
                        </div>
                        <p
                            className="text-xs mt-2 font-mono"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            {Math.round(progress)}%
                        </p>
                    </div>
                )}

                {state === "granted" && (
                    <div className="mt-4 text-center">
                        <p
                            className="text-sm uppercase tracking-widest"
                            style={{ color: "var(--color-success)" }}
                        >
                            Доступ разрешен
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
