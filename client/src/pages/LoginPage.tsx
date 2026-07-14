import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";

type LoginState = "idle" | "loading" | "granted";

export default function LoginPage() {
    const navigate = useNavigate();
    const [key, setKey] = useState("");
    const [state, setState] = useState<LoginState>("idle");
    const [progress, setProgress] = useState(0);

    const handleSubmit = async () => {
        if (!key) return;
        setState("loading");
        setProgress(0);

        let p = 0;
        const interval = setInterval(async () => {
            p += Math.random() * 15 + 5;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setProgress(100);

                try {
                    const res = await fetch("http://localhost:5000/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: "admin@admin.com", password: key }),
                    });
                    const data = await res.json();
                    if (data.token) {
                        localStorage.setItem("token", data.token);
                        setState("granted");
                        setTimeout(() => navigate("/"), 1200);
                        return;
                    }
                } catch {
                    setState("idle");
                    setProgress(0);
                    return;
                }
            }
            setProgress(Math.min(p, 100));
        }, 120);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#212121]">
            <div
                className="w-[600px] p-10"
                style={{ background: "#292929", border: "1px solid #3a3a3a", borderRadius: 4 }}
            >
                <h1
                    className="text-center text-3xl uppercase mb-10"
                    style={{ color: "#FA6814", fontFamily: '"Press Start 2P", system-ui' }}
                >
                    Контора
                    <br />
                    <span className="whitespace-nowrap">"Рога и Копыта"</span>
                </h1>

                {state === "idle" && (
                    <>
                        <p className="text-center text-gray-400 mb-8 text-sm">
                            Введите персональный ключ доступа
                        </p>

                        <label className="block mb-2 uppercase text-sm">Ключ</label>
                        <Input
                            type="password"
                            placeholder="Введите ключ..."
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        />
                        <Button className="mt-8 w-full" onClick={handleSubmit}>
                            Войти
                        </Button>
                    </>
                )}

                {state === "loading" && (
                    <div className="mt-4">
                        <p className="text-sm mb-4 uppercase tracking-widest text-gray-400">
                            Проверка ключа...
                        </p>
                        <div className="w-full h-4 bg-[#252525] border border-[#3a3a3a] overflow-hidden">
                            <div
                                className="h-full transition-all duration-100 bg-[#FA6814]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs mt-2 font-mono text-gray-400">
                            {Math.round(progress)}%
                        </p>
                    </div>
                )}

                {state === "granted" && (
                    <div className="mt-4 text-center">
                        <p className="text-sm uppercase tracking-widest text-[#4CAF50]">
                            Доступ разрешен
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
