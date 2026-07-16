import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";

const API = import.meta.env.VITE_API_URL;

interface LogEntry {
    time: string;
    category: string;
    message: string;
    level: "info" | "success" | "error" | "warn";
}

interface CapabilityCheck {
    name: string;
    supported: boolean;
}

interface User {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
}

interface StunResult {
    type: string;
    candidateCount: number;
    hasHost: boolean;
    hasSrflx: boolean;
    hasRelay: boolean;
    publicIp: string | null;
    natType: string;
    gathered: boolean;
}

interface P2PResult {
    state: string;
    connected: boolean;
    iceCandidateTypes: string[];
    connectionTime: number | null;
    remoteCandidateCount: number;
}

function now(): string {
    return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function parseCandidateType(c: string): string {
    if (c.includes("typ host")) return "host";
    if (c.includes("typ srflx")) return "srflx";
    if (c.includes("typ relay")) return "relay";
    if (c.includes("typ prflx")) return "prflx";
    return "unknown";
}

function parseCandidateIp(c: string): string | null {
    const parts = c.split(" ");
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "typ" && i >= 4) return parts[i - 1];
    }
    return null;
}

function determineNatType(hasHost: boolean, hasSrflx: boolean, hasRelay: boolean): string {
    if (hasRelay) return "TURN (relay only)";
    if (hasHost && hasSrflx) return "NAT Cone (P2P OK)";
    if (hasHost && !hasSrflx) return "No NAT (LAN/Direct)";
    if (!hasHost && hasSrflx) return "Symmetric NAT (may need TURN)";
    return "Unknown";
}

const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

type Phase = "idle" | "browser" | "stun" | "p2p";

export default function WebRTCTestPage() {
    const { user } = useUser();
    const socket = useSocket();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [capabilities, setCapabilities] = useState<CapabilityCheck[]>([]);
    const [stunResult, setStunResult] = useState<StunResult | null>(null);
    const [stunRunning, setStunRunning] = useState(false);
    const [p2pResult, setP2pResult] = useState<P2PResult | null>(null);
    const [p2pRunning, setP2pRunning] = useState(false);
    const [p2pTarget, setP2pTarget] = useState<number | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [phase, setPhase] = useState<Phase>("idle");
    const logRef = useRef<HTMLDivElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const p2pTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addLog = useCallback((category: string, message: string, level: LogEntry["level"] = "info") => {
        setLogs((prev) => [...prev, { time: now(), category, message, level }]);
    }, []);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        fetch(`${API}/api/users`, {
            credentials: "include",
        })
            .then((r) => r.json())
            .then((data: any[]) => {
                const filtered = data.filter((u) => u.id !== user?.id).map((u) => ({
                    id: u.id,
                    username: u.username,
                    displayName: u.displayName,
                    avatar: u.avatar,
                }));
                setUsers(filtered);
            })
            .catch(() => {});
    }, [user]);

    const checkBrowser = () => {
        setPhase("browser");
        addLog("Browser", "Начало проверки возможностей браузера...", "info");

        const checks: CapabilityCheck[] = [
            { name: "getUserMedia", supported: !!navigator.mediaDevices?.getUserMedia },
            { name: "getDisplayMedia", supported: !!navigator.mediaDevices?.getDisplayMedia },
            { name: "RTCPeerConnection", supported: typeof RTCPeerConnection !== "undefined" },
            { name: "RTCDataChannel", supported: typeof RTCDataChannel !== "undefined" },
            { name: "MediaRecorder", supported: typeof MediaRecorder !== "undefined" },
            { name: "Web Workers", supported: typeof Worker !== "undefined" },
            { name: "WebSocket", supported: typeof WebSocket !== "undefined" },
        ];

        setCapabilities(checks);

        for (const c of checks) {
            addLog("Browser", `${c.name}: ${c.supported ? "Supported" : "NOT SUPPORTED"}`, c.supported ? "success" : "error");
        }

        const allOk = checks.every((c) => c.supported);
        addLog("Browser", allOk ? "Все проверки пройдены" : "Некоторые API недоступны", allOk ? "success" : "warn");

        checkCodecs();
    };

    const checkCodecs = async () => {
        addLog("Codec", "Проверка поддержки видео/аудио кодеков...", "info");
        try {
            const codecs = RTCRtpReceiver.getCapabilities?.("video")?.codecs || [];
            const audioCodecs = RTCRtpReceiver.getCapabilities?.("audio")?.codecs || [];

            const h264 = codecs.some((c) => c.mimeType.toLowerCase().includes("h264"));
            const vp8 = codecs.some((c) => c.mimeType.toLowerCase().includes("vp8"));
            const vp9 = codecs.some((c) => c.mimeType.toLowerCase().includes("vp9"));
            const av1 = codecs.some((c) => c.mimeType.toLowerCase().includes("av1"));
            const opus = audioCodecs.some((c) => c.mimeType.toLowerCase().includes("opus"));

            addLog("Codec", `H264: ${h264 ? "OK" : "NO"}`, h264 ? "success" : "warn");
            addLog("Codec", `VP8: ${vp8 ? "OK" : "NO"}`, vp8 ? "success" : "warn");
            addLog("Codec", `VP9: ${vp9 ? "OK" : "NO"}`, vp9 ? "success" : "warn");
            addLog("Codec", `AV1: ${av1 ? "OK" : "NO"}`, av1 ? "success" : "warn");
            addLog("Codec", `Opus: ${opus ? "OK" : "NO"}`, opus ? "success" : "warn");
            addLog("Codec", `Видео кодеков: ${codecs.length}, Аудио кодеков: ${audioCodecs.length}`, "info");
        } catch (e) {
            addLog("Codec", "Не удалось проверить кодеки (не критично)", "warn");
        }
    };

    const runStunTest = async () => {
        setStunRunning(true);
        setStunResult(null);
        setPhase("stun");
        addLog("STUN", "Запуск STUN-теста...", "info");

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        const candidateTypes: string[] = [];
        let publicIp: string | null = null;
        let hasHost = false;
        let hasSrflx = false;
        let hasRelay = false;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            addLog("STUN", "getUserMedia: OK", "success");
            stream.getTracks().forEach((t) => {
                pc.addTrack(t, stream);
            });
        } catch (e) {
            addLog("STUN", "getUserMedia не удался — тест продолжается с data channel", "warn");
        }

        pc.createDataChannel("stun-test");

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                const c = e.candidate.candidate;
                const type = parseCandidateType(c);
                candidateTypes.push(type);
                const ip = parseCandidateIp(c);

                if (type === "host") hasHost = true;
                if (type === "srflx") { hasSrflx = true; if (ip) publicIp = ip; }
                if (type === "relay") hasRelay = true;

                addLog("STUN", `ICE candidate: ${type} ${ip ? `(${ip})` : ""}`, "info");
            }
        };

        const gatheringDone = new Promise<void>((resolve) => {
            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === "complete") resolve();
            };
            setTimeout(resolve, 6000);
        });

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            addLog("STUN", "Offer создан, сбор ICE candidates...", "info");

            await gatheringDone;

            const natType = determineNatType(hasHost, hasSrflx, hasRelay);
            const result: StunResult = {
                type: natType,
                candidateCount: candidateTypes.length,
                hasHost,
                hasSrflx,
                hasRelay,
                publicIp,
                natType,
                gathered: true,
            };
            setStunResult(result);

            addLog("STUN", `Собрано кандидатов: ${candidateTypes.length}`, "info");
            addLog("STUN", `Host: ${hasHost ? "OK" : "NO"}, Srflx: ${hasSrflx ? "OK" : "NO"}, Relay: ${hasRelay ? "OK" : "NO"}`, "info");
            if (publicIp) addLog("STUN", `Public IP: ${publicIp}`, "success");
            addLog("STUN", `NAT Type: ${natType}`, hasRelay ? "warn" : "success");

            if (!hasSrflx && !hasRelay) {
                addLog("STUN", "Нет srflx/relay кандидатов — P2P может не работать через NAT", "error");
            } else if (hasRelay) {
                addLog("STUN", "Есть relay — TURN сервер может потребоваться", "warn");
            } else {
                addLog("STUN", "P2P должен работать без TURN", "success");
            }
        } catch (e: any) {
            addLog("STUN", `Ошибка: ${e.message}`, "error");
            setStunResult({ type: "Error", candidateCount: 0, hasHost: false, hasSrflx: false, hasRelay: false, publicIp: null, natType: "Error", gathered: false });
        }

        pc.close();
        pcRef.current = null;
        setStunRunning(false);
    };

    const runP2PTest = async () => {
        if (!p2pTarget || !socket) return;
        setP2pRunning(true);
        setP2pResult(null);
        setPhase("p2p");

        const startTime = Date.now();
        const iceCandidateTypes: string[] = [];
        let remoteCandidateCount = 0;

        addLog("P2P", `Начало теста с пользователем #${p2pTarget}...`, "info");

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            addLog("P2P", "getUserMedia: OK", "success");
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        } catch (e: any) {
            addLog("P2P", `getUserMedia ошибка: ${e.message}`, "warn");
            addLog("P2P", "Пробуем только аудио...", "info");
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            } catch (e2: any) {
                addLog("P2P", `Аудио тоже не удалось: ${e2.message}`, "error");
                setP2pRunning(false);
                return;
            }
        }

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                const type = parseCandidateType(e.candidate.candidate);
                iceCandidateTypes.push(type);
                addLog("P2P", `Local ICE: ${type}`, "info");
                socket.emit("call:test-ice", { targetUserId: p2pTarget, candidate: e.candidate.toJSON() });
            }
        };

        pc.ontrack = (e) => {
            addLog("P2P", `Remote track: ${e.track.kind}`, "success");
        };

        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            addLog("P2P", `ICE state: ${state}`, state === "connected" || state === "completed" ? "success" : state === "failed" ? "error" : "info");

            if (state === "connected" || state === "completed") {
                const elapsed = Date.now() - startTime;
                addLog("P2P", `P2P соединение установлено за ${(elapsed / 1000).toFixed(1)}с`, "success");
                setP2pResult({
                    state,
                    connected: true,
                    iceCandidateTypes: [...new Set(iceCandidateTypes)],
                    connectionTime: elapsed,
                    remoteCandidateCount,
                });
                if (p2pTimerRef.current) clearTimeout(p2pTimerRef.current);
                pc.close();
                pcRef.current = null;
                setP2pRunning(false);
            } else if (state === "failed") {
                const elapsed = Date.now() - startTime;
                addLog("P2P", "P2P соединение НЕ установлено — нужен TURN сервер", "error");
                setP2pResult({
                    state,
                    connected: false,
                    iceCandidateTypes: [...new Set(iceCandidateTypes)],
                    connectionTime: elapsed,
                    remoteCandidateCount,
                });
                if (p2pTimerRef.current) clearTimeout(p2pTimerRef.current);
                pc.close();
                pcRef.current = null;
                setP2pRunning(false);
            }
        };

        const handleTestOffer = async (data: { fromUserId: number; sdp: RTCSessionDescriptionInit }) => {
            if (data.fromUserId !== p2pTarget) return;
            addLog("P2P", "Получен offer, создание answer...", "info");
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("call:test-answer", { targetUserId: data.fromUserId, sdp: answer });
                addLog("P2P", "Answer отправлен", "success");
            } catch (e: any) {
                addLog("P2P", `Ошибка answer: ${e.message}`, "error");
            }
        };

        const handleTestAnswer = async (data: { fromUserId: number; sdp: RTCSessionDescriptionInit }) => {
            if (data.fromUserId !== p2pTarget) return;
            addLog("P2P", "Получен answer", "success");
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                addLog("P2P", "Remote description установлен", "info");
            } catch (e: any) {
                addLog("P2P", `Ошибка setRemoteDescription: ${e.message}`, "error");
            }
        };

        const handleTestIce = async (data: { fromUserId: number; candidate: RTCIceCandidateInit }) => {
            if (data.fromUserId !== p2pTarget) return;
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                remoteCandidateCount++;
                const type = parseCandidateType(JSON.stringify(data.candidate));
                addLog("P2P", `Remote ICE: ${type}`, "info");
            } catch (e: any) {
                addLog("P2P", `Ошибка ICE candidate: ${e.message}`, "warn");
            }
        };

        socket.on("call:test-offer", handleTestOffer);
        socket.on("call:test-answer", handleTestAnswer);
        socket.on("call:test-ice", handleTestIce);

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            addLog("P2P", "Offer создан, отправка...", "info");
            socket.emit("call:test-offer", { targetUserId: p2pTarget, sdp: offer });

            p2pTimerRef.current = setTimeout(() => {
                if (pcRef.current) {
                    const elapsed = Date.now() - startTime;
                    addLog("P2P", "Таймаут 15с — P2P не установлен", "error");
                    setP2pResult({
                        state: "timeout",
                        connected: false,
                        iceCandidateTypes: [...new Set(iceCandidateTypes)],
                        connectionTime: elapsed,
                        remoteCandidateCount,
                    });
                    pc.close();
                    pcRef.current = null;
                    setP2pRunning(false);
                }
            }, 15000);
        } catch (e: any) {
            addLog("P2P", `Ошибка: ${e.message}`, "error");
            pc.close();
            pcRef.current = null;
            setP2pRunning(false);
        }

        return () => {
            socket.off("call:test-offer", handleTestOffer);
            socket.off("call:test-answer", handleTestAnswer);
            socket.off("call:test-ice", handleTestIce);
        };
    };

    useEffect(() => {
        return () => {
            if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
            if (p2pTimerRef.current) clearTimeout(p2pTimerRef.current);
        };
    }, []);

    const downloadLog = () => {
        const header = [
            `WebRTC Diagnostic Log`,
            `User: ${user?.username || "unknown"} (ID: ${user?.id})`,
            `Date: ${new Date().toISOString()}`,
            `Browser: ${navigator.userAgent}`,
            `Platform: ${navigator.platform}`,
            `=`.repeat(60),
            "",
        ].join("\n");

        const sections: string[] = [];

        if (capabilities.length > 0) {
            sections.push("--- Browser Capabilities ---");
            for (const c of capabilities) {
                sections.push(`  ${c.supported ? "[OK]" : "[!!]"} ${c.name}`);
            }
            sections.push("");
        }

        if (stunResult) {
            sections.push("--- STUN Test Result ---");
            sections.push(`  NAT Type: ${stunResult.natType}`);
            sections.push(`  Candidates: ${stunResult.candidateCount}`);
            sections.push(`  Host: ${stunResult.hasHost}, Srflx: ${stunResult.hasSrflx}, Relay: ${stunResult.hasRelay}`);
            if (stunResult.publicIp) sections.push(`  Public IP: ${stunResult.publicIp}`);
            sections.push("");
        }

        if (p2pResult) {
            sections.push("--- P2P Test Result ---");
            sections.push(`  Connected: ${p2pResult.connected}`);
            sections.push(`  State: ${p2pResult.state}`);
            sections.push(`  Connection Time: ${p2pResult.connectionTime ? (p2pResult.connectionTime / 1000).toFixed(1) + "s" : "N/A"}`);
            sections.push(`  ICE Types: ${p2pResult.iceCandidateTypes.join(", ")}`);
            sections.push(`  Remote Candidates: ${p2pResult.remoteCandidateCount}`);
            sections.push("");
        }

        sections.push("--- Full Log ---");
        for (const l of logs) {
            sections.push(`[${l.time}] [${l.category}] ${l.level.toUpperCase().padEnd(7)} ${l.message}`);
        }

        const content = header + sections.join("\n");
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `webrtc-log-${user?.username || "unknown"}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        addLog("System", "Лог скачан", "success");
    };

    const clearLogs = () => {
        setLogs([]);
        setCapabilities([]);
        setStunResult(null);
        setP2pResult(null);
        setPhase("idle");
    };

    const getNatColor = (type: string) => {
        if (type.includes("LAN") || type.includes("No NAT")) return "#4CAF50";
        if (type.includes("Cone")) return "#5B9BD5";
        if (type.includes("Symmetric")) return "#FFB020";
        if (type.includes("TURN")) return "#D32F2F";
        return "#808080";
    };

    const getLogLevelColor = (level: string) => {
        switch (level) {
            case "success": return "#4CAF50";
            case "error": return "#D32F2F";
            case "warn": return "#FFB020";
            default: return "#808080";
        }
    };

    return (
        <div className="max-w-5xl space-y-5">
            <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                WebRTC Test
            </h1>

            {/* Section 1: Browser Capabilities */}
            <div className="bg-[#282828] border border-[#3a3a3a] p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[10px] text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        Browser Capabilities
                    </h2>
                    <button
                        onClick={checkBrowser}
                        disabled={phase === "browser"}
                        className="text-xs px-4 py-2 bg-[#FA6814] text-white hover:bg-[#e55a0f] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        style={{ borderRadius: 4 }}
                    >
                        {capabilities.length > 0 ? "Повторить" : "Проверить"}
                    </button>
                </div>
                {capabilities.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {capabilities.map((c) => (
                            <div
                                key={c.name}
                                className={`flex items-center gap-2 px-3 py-2 text-xs border ${
                                    c.supported
                                        ? "bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#4CAF50]"
                                        : "bg-[#D32F2F]/10 border-[#D32F2F]/30 text-[#D32F2F]"
                                }`}
                                style={{ borderRadius: 4 }}
                            >
                                <span>{c.supported ? "OK" : "NO"}</span>
                                <span className="truncate">{c.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Section 2: STUN Test */}
            <div className="bg-[#282828] border border-[#3a3a3a] p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[10px] text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        STUN Test
                    </h2>
                    <button
                        onClick={runStunTest}
                        disabled={stunRunning}
                        className="text-xs px-4 py-2 bg-[#FA6814] text-white hover:bg-[#e55a0f] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        style={{ borderRadius: 4 }}
                    >
                        {stunRunning ? "Тестирование..." : "Запустить"}
                    </button>
                </div>
                {stunResult && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div
                                className="px-4 py-3 border text-center"
                                style={{ borderColor: getNatColor(stunResult.natType), background: `${getNatColor(stunResult.natType)}15`, borderRadius: 4, minWidth: 200 }}
                            >
                                <div className="text-[10px] text-gray-500 mb-1">NAT Type</div>
                                <div className="text-sm font-bold" style={{ color: getNatColor(stunResult.natType) }}>
                                    {stunResult.natType}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                                    <div className="text-lg font-bold text-white">{stunResult.candidateCount}</div>
                                    <div className="text-[10px] text-gray-500">Кандидатов</div>
                                </div>
                                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                                    <div className="text-lg font-bold" style={{ color: stunResult.hasHost ? "#4CAF50" : "#D32F2F" }}>
                                        {stunResult.hasHost ? "OK" : "NO"}
                                    </div>
                                    <div className="text-[10px] text-gray-500">Host</div>
                                </div>
                                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                                    <div className="text-lg font-bold" style={{ color: stunResult.hasSrflx ? "#4CAF50" : "#D32F2F" }}>
                                        {stunResult.hasSrflx ? "OK" : "NO"}
                                    </div>
                                    <div className="text-[10px] text-gray-500">Srflx</div>
                                </div>
                                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                                    <div className="text-lg font-bold" style={{ color: stunResult.hasRelay ? "#FFB020" : "#4CAF50" }}>
                                        {stunResult.hasRelay ? "!" : "—"}
                                    </div>
                                    <div className="text-[10px] text-gray-500">Relay</div>
                                </div>
                            </div>
                        </div>
                        {stunResult.publicIp && (
                            <div className="text-xs text-gray-400">
                                Public IP: <span className="text-white">{stunResult.publicIp}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Section 3: P2P Test */}
            <div className="bg-[#282828] border border-[#3a3a3a] p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[10px] text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        P2P Connection Test
                    </h2>
                    <button
                        onClick={runP2PTest}
                        disabled={p2pRunning || !p2pTarget}
                        className="text-xs px-4 py-2 bg-[#FA6814] text-white hover:bg-[#e55a0f] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        style={{ borderRadius: 4 }}
                    >
                        {p2pRunning ? "Подключение..." : "Начать тест"}
                    </button>
                </div>
                <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1">Пользователь</label>
                    <select
                        value={p2pTarget || ""}
                        onChange={(e) => setP2pTarget(Number(e.target.value) || null)}
                        className="w-full max-w-xs bg-[#1a1a1a] border border-[#3a3a3a] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#FA6814] transition-colors cursor-pointer"
                        style={{ borderRadius: 4 }}
                    >
                        <option value="">Выберите...</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.displayName || u.username} (@{u.username})
                            </option>
                        ))}
                    </select>
                    {users.length === 0 && (
                        <p className="text-[10px] text-gray-500 mt-1">Нет других пользователей в сети</p>
                    )}
                </div>
                {p2pRunning && (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-[#FA6814] animate-pulse" />
                        <span className="text-xs text-[#FA6814]">Установка P2P соединения...</span>
                    </div>
                )}
                {p2pResult && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div
                                className="px-4 py-3 border text-center"
                                style={{
                                    borderColor: p2pResult.connected ? "#4CAF50" : "#D32F2F",
                                    background: p2pResult.connected ? "#4CAF5015" : "#D32F2F15",
                                    borderRadius: 4,
                                    minWidth: 200,
                                }}
                            >
                                <div className="text-[10px] text-gray-500 mb-1">P2P Status</div>
                                <div className="text-sm font-bold" style={{ color: p2pResult.connected ? "#4CAF50" : "#D32F2F" }}>
                                    {p2pResult.connected ? "Connected OK" : "Failed NO"}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                                    <div className="text-lg font-bold text-white">
                                        {p2pResult.connectionTime ? `${(p2pResult.connectionTime / 1000).toFixed(1)}s` : "—"}
                                    </div>
                                    <div className="text-[10px] text-gray-500">Время</div>
                                </div>
                                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                                    <div className="text-lg font-bold text-white">{p2pResult.state}</div>
                                    <div className="text-[10px] text-gray-500">State</div>
                                </div>
                                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                                    <div className="text-lg font-bold text-white">{p2pResult.remoteCandidateCount}</div>
                                    <div className="text-[10px] text-gray-500">Remote ICE</div>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">
                            ICE types: {p2pResult.iceCandidateTypes.length > 0 ? p2pResult.iceCandidateTypes.map((t) => (
                                <span key={t} className="inline-block px-2 py-0.5 bg-[#1a1a1a] border border-[#3a3a3a] text-white mr-1">
                                    {t}
                                </span>
                            )) : "—"}
                        </div>
                    </div>
                )}
            </div>

            {/* Log Panel */}
            <div className="bg-[#282828] border border-[#3a3a3a]">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#3a3a3a]">
                    <h2 className="text-[10px] text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        Log ({logs.length})
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={clearLogs}
                            className="text-xs px-3 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#FA6814] transition-colors cursor-pointer"
                            style={{ borderRadius: 4 }}
                        >
                            Очистить
                        </button>
                        <button
                            onClick={downloadLog}
                            disabled={logs.length === 0}
                            className="text-xs px-3 py-1.5 bg-[#FA6814] text-white hover:bg-[#e55a0f] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            style={{ borderRadius: 4 }}
                        >
                            Скачать лог
                        </button>
                    </div>
                </div>
                <div
                    ref={logRef}
                    className="h-80 overflow-y-auto font-mono text-[11px] leading-5 px-5 py-3"
                    style={{ background: "#1a1a1a" }}
                >
                    {logs.length === 0 ? (
                        <div className="text-gray-600 text-center py-10">
                            Нажмите "Проверить" для начала диагностики
                        </div>
                    ) : (
                        logs.map((l, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-gray-600 shrink-0">[{l.time}]</span>
                                <span className="shrink-0" style={{ color: "#FA6814", minWidth: 70 }}>{l.category}</span>
                                <span className="shrink-0" style={{ color: getLogLevelColor(l.level), minWidth: 50 }}>
                                    {l.level.toUpperCase()}
                                </span>
                                <span style={{ color: getLogLevelColor(l.level) }}>{l.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Summary */}
            {(capabilities.length > 0 || stunResult || p2pResult) && (
                <div className="bg-[#282828] border border-[#3a3a3a] p-5">
                    <h2 className="text-[10px] text-gray-500 mb-3" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        Summary
                    </h2>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Браузер</span>
                            <span className={capabilities.length > 0 && capabilities.every((c) => c.supported) ? "text-[#4CAF50]" : "text-gray-500"}>
                                {capabilities.length > 0 ? (capabilities.every((c) => c.supported) ? "OK Готов" : "! Есть ограничения") : "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">NAT Type</span>
                            <span style={{ color: stunResult ? getNatColor(stunResult.natType) : "#808080" }}>
                                {stunResult ? stunResult.natType : "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">P2P Звонки</span>
                            <span className={
                                p2pResult?.connected ? "text-[#4CAF50]"
                                : p2pResult && !p2pResult.connected ? "text-[#D32F2F]"
                                : "text-gray-500"
                            }>
                                {p2pResult?.connected
                                    ? `OK Работают (${(p2pResult.connectionTime! / 1000).toFixed(1)}с)`
                                    : p2pResult && !p2pResult.connected ? "NO Не работают — нужен TURN"
                                    : "—"
                                }
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">TURN сервер</span>
                            <span className={
                                p2pResult?.connected ? "text-[#4CAF50]"
                                : stunResult?.hasRelay ? "text-[#FFB020]"
                                : p2pResult && !p2pResult.connected ? "text-[#D32F2F]"
                                : "text-gray-500"
                            }>
                                {p2pResult?.connected
                                    ? "Не нужен"
                                    : stunResult?.hasRelay
                                        ? "Рекомендуется"
                                        : p2pResult && !p2pResult.connected
                                            ? "Нужен"
                                            : "—"
                                }
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
