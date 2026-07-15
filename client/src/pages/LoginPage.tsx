import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";

type LoginState = "idle" | "loading" | "granted" | "error";

export default function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useUser();
    const [key, setKey] = useState("");
    const [state, setState] = useState<LoginState>("idle");
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async () => {
        if (!key) return;
        setState("loading");
        setProgress(0);
        setErrorMsg("");

        let p = 0;
        const interval = setInterval(async () => {
            p += Math.random() * 15 + 5;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setProgress(100);

                try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/key-login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ key }),
                    });
                    const data = await res.json();
                    if (data.token && data.user) {
                        localStorage.setItem("token", data.token);
                        // Fetch full profile after login
                        try {
                            const meRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
                                headers: { Authorization: `Bearer ${data.token}` },
                            });
                            if (meRes.ok) {
                                const profile = await meRes.json();
                                setUser(profile);
                            }
                        } catch {}
                        setState("granted");
                        setTimeout(() => navigate("/"), 1200);
                        return;
                    } else {
                        setState("error");
                        setErrorMsg(data.error || "Неверный ключ");
                        setProgress(0);
                    }
                } catch {
                    setState("error");
                    setErrorMsg("Ошибка сети");
                    setProgress(0);
                    return;
                }
            }
            setProgress(Math.min(p, 100));
        }, 120);
    };

    const handleReset = () => {
        setState("idle");
        setKey("");
        setErrorMsg("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#212121]">
            <div
                className="w-full max-w-[600px] mx-4 p-6 sm:p-10"
                style={{ background: "#292929", border: "1px solid #3a3a3a", borderRadius: 4 }}
            >
                <h1
                    className="text-center text-3xl uppercase mb-2"
                    style={{ color: "#FA6814", fontFamily: '"Press Start 2P", system-ui' }}
                >
                    Контора
                    <br />
                    <span className="whitespace-nowrap">"Рога и Копыта"</span>
                </h1>

                {(state === "idle" || state === "error") && (
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
                        {errorMsg && (
                            <p className="text-xs text-[#D32F2F] mt-2">{errorMsg}</p>
                        )}
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
