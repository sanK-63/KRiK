export function parseDate(s: string): Date {
    const normalized = s.includes("T") ? s : s.replace(" ", "T");
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;
    return new Date(s);
}

export function fmtTime(dateStr: string): string {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function fmtFullDate(dateStr: string): string {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(dateStr: string): string {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Сегодня";
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Вчера";
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function dateKey(dateStr: string): string {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return "unknown";
    return d.toDateString();
}

export function isVoiceMessage(name: string | null): boolean {
    if (!name) return false;
    return /\.(webm|ogg|mp3|wav|m4a|opus)$/i.test(name);
}

export function isImageFile(name: string | null): boolean {
    if (!name) return false;
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif)$/i.test(name);
}

export function formatRecordTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function playNotificationSound() {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = "sine";
        gain.gain.value = 0.1;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.stop(ctx.currentTime + 0.2);
    } catch {}
}
