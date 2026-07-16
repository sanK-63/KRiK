import { useState, useEffect, useRef, useCallback } from "react";

const TABS = ["ИМТ", "Колесо Фартуны", "Рандомайзер", "Кости", "Метроном", "Тюнер", "Генератор частот", "WebRTC", "Электрика", "Гармоники", "Видео", "Конвертер", "Пароли", "Хеши", "Подсеть"] as const;
type Tab = typeof TABS[number];

const TAB_META: Record<Tab, { icon: string; subtitle: string; color: string; category: string }> = {
    "ИМТ": { icon: "ИМТ", subtitle: "Калькулятор веса", color: "#4CAF50", category: "Здоровье" },
    "Колесо Фартуны": { icon: "КОЛЕСО", subtitle: "Случайный выбор", color: "#FFB020", category: "Игры" },
    "Рандомайзер": { icon: "RNG", subtitle: "Генератор чисел", color: "#5B9BD5", category: "Игры" },
    "Кости": { icon: "D6", subtitle: "D4–D100", color: "#FA6814", category: "Игры" },
    "Метроном": { icon: "BPM", subtitle: "20–300 BPM", color: "#D32F2F", category: "Аудио" },
    "Тюнер": { icon: "A4", subtitle: "Настройка по звуку", color: "#9C27B0", category: "Аудио" },
    "Генератор частот": { icon: "Гц", subtitle: "20–20 000 Гц", color: "#00BCD4", category: "Аудио" },
    "WebRTC": { icon: "WEB", subtitle: "Диагностика P2P", color: "#5B9BD5", category: "Сеть" },
    "Электрика": { icon: "V/A", subtitle: "Электрические расчёты", color: "#FFB020", category: "Инженерия" },
    "Гармоники": { icon: "≈", subtitle: "Гармонический анализ", color: "#9C27B0", category: "Инженерия" },
    "Видео": { icon: "HD", subtitle: "Объём видеофайлов", color: "#00BCD4", category: "Медиа" },
    "Конвертер": { icon: "⇄", subtitle: "Конвертер единиц", color: "#4CAF50", category: "Инструменты" },
    "Пароли": { icon: "", subtitle: "Генератор паролей", color: "#D32F2F", category: "Инструменты" },
    "Хеши": { icon: "#", subtitle: "Хеши и кодирование", color: "#FFB020", category: "Инструменты" },
    "Подсеть": { icon: "IP", subtitle: "Подсети CIDR", color: "#5B9BD5", category: "Инструменты" },
};

const CATEGORIES = ["Все", ...Array.from(new Set(Object.values(TAB_META).map((m) => m.category)))];

const INPUT_CLASS = "w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none";

// ═══════════════════════════════════════════════════════════════
// ИМТ (BMI Calculator)
// ═══════════════════════════════════════════════════════════════

type Gender = "male" | "female";

interface BMICategory {
    label: string;
    min: number;
    max: number;
    color: string;
    description: string;
}

const bmiCategories: BMICategory[] = [
    { label: "Дефицит массы", min: 0, max: 18.5, color: "#5B9BD5", description: "Вес ниже нормы. Рекомендуется консультация врача для корректировки питания и набора массы." },
    { label: "Норма", min: 18.5, max: 25, color: "#4CAF50", description: "Вес в пределах нормы. Поддерживайте здоровый образ жизни и регулярную физическую активность." },
    { label: "Избыточный", min: 25, max: 30, color: "#FFB020", description: "Небольшой избыток веса. Рекомендуется увеличить физическую активность и пересмотреть рацион." },
    { label: "Ожирение", min: 30, max: 100, color: "#D32F2F", description: "Значительный избыток веса. Рекомендуется обратиться к специалисту для разработки плана по снижению веса." },
];

const genderInfo: Record<Gender, { label: string; icon: string; idealBMI: string; description: string }> = {
    male: { label: "Мужской", icon: "♂", idealBMI: "22–25", description: "Идеальный ИМТ для мужчин составляет 22–25. Учитывается мышечная масса, которая обычно выше." },
    female: { label: "Женский", icon: "♀", idealBMI: "19–23", description: "Идеальный ИМТ для женщин составляет 19–23. Учитывается естественный процент жировой ткани." },
};

function getBMICategory(bmi: number): BMICategory {
    return bmiCategories.find((c) => bmi >= c.min && bmi < c.max) || bmiCategories[bmiCategories.length - 1];
}

function getPointerPosition(bmi: number): number {
    if (bmi <= 0) return 0;
    if (bmi < 15) return 0;
    if (bmi > 40) return 100;
    return ((bmi - 15) / 25) * 100;
}

function BMICalculator() {
    const [gender, setGender] = useState<Gender>("male");
    const [height, setHeight] = useState(175);
    const [weight, setWeight] = useState(70);
    const [age, setAge] = useState(25);

    const bmi = height > 0 ? Math.round(weight / Math.pow(height / 100, 2) * 10) / 10 : 0;
    const cat = getBMICategory(bmi);
    const info = genderInfo[gender];
    const idealWeightMin = Math.round(Math.pow(height / 100, 2) * (gender === "male" ? 20 : 18.5) * 10) / 10;
    const idealWeightMax = Math.round(Math.pow(height / 100, 2) * (gender === "male" ? 25 : 23) * 10) / 10;
    const weightDiff = Math.round((weight - ((idealWeightMin + idealWeightMax) / 2)) * 10) / 10;

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Индекс Массы Тела (ИМТ)</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Калькулятор ИМТ — вычисляет соотношение роста и веса для оценки массы тела. Формула: ИМТ = вес (кг) / рост² (м²). Результат классифицирует вес по категориям: дефицит, норма, избыток или ожирение, и показывает идеальный диапазон веса для вашего роста и пола.</p>
            </div>

            <div className="px-4">
                <label className="text-[10px] uppercase text-gray-500 mb-2 block">Пол</label>
                <div className="flex gap-2">
                    {(Object.keys(genderInfo) as Gender[]).map((g) => (
                        <button key={g} onClick={() => setGender(g)} className="flex-1 py-2.5 text-xs font-semibold transition-all cursor-pointer border" style={{ background: gender === g ? "#FA681415" : "#1a1a1a", borderColor: gender === g ? "#FA6814" : "#3a3a3a", color: gender === g ? "#FA6814" : "#808080" }}>
                            <span className="text-base">{genderInfo[g].icon}</span> {genderInfo[g].label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 grid grid-cols-3 gap-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Рост (см)</label>
                    <input type="number" min={100} max={250} value={height} onChange={(e) => setHeight(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Вес (кг)</label>
                    <input type="number" min={30} max={250} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Возраст</label>
                    <input type="number" min={10} max={120} value={age} onChange={(e) => setAge(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
            </div>

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-4 text-center">
                    <p className="text-[10px] uppercase text-gray-500 mb-1" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Ваш ИМТ</p>
                    <p className="text-4xl font-bold mb-1" style={{ color: cat.color }}>{bmi}</p>
                    <p className="text-sm font-semibold mb-2" style={{ color: cat.color }}>{cat.label}</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed max-w-md mx-auto">{cat.description}</p>
                    <div className="mt-4 relative">
                        <div className="h-3 flex overflow-hidden">
                            <div className="h-full" style={{ width: "35%", background: "#5B9BD5" }} />
                            <div className="h-full" style={{ width: "25%", background: "#4CAF50" }} />
                            <div className="h-full" style={{ width: "20%", background: "#FFB020" }} />
                            <div className="h-full" style={{ width: "20%", background: "#D32F2F" }} />
                        </div>
                        <div className="absolute top-0 w-0.5 h-5 bg-white -mt-1 transition-all duration-300" style={{ left: `${getPointerPosition(bmi)}%` }} />
                        <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                            <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                    <p className="text-[9px] uppercase text-gray-500 mb-1">Идеальный ИМТ</p>
                    <p className="text-xs text-white font-semibold">{info.idealBMI}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                    <p className="text-[9px] uppercase text-gray-500 mb-1">Норма веса</p>
                    <p className="text-xs text-white font-semibold">{idealWeightMin}–{idealWeightMax}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                    <p className="text-[9px] uppercase text-gray-500 mb-1">Отклонение</p>
                    <p className="text-xs font-semibold" style={{ color: Math.abs(weightDiff) < 1 ? "#4CAF50" : weightDiff > 0 ? "#FFB020" : "#5B9BD5" }}>
                        {weightDiff > 0 ? "+" : ""}{weightDiff} кг
                    </p>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Колесо Фартуны (Wheel of Fortune)
// ═══════════════════════════════════════════════════════════════

const WHEEL_COLORS = ["#FA6814", "#4CAF50", "#5B9BD5", "#D32F2F", "#FFB020", "#9C27B0", "#00BCD4", "#FF5722", "#607D8B", "#E91E63"];

function FortuneWheel() {
    const [segments, setSegments] = useState(["Приз 1", "Приз 2", "Приз 3", "Приз 4", "Приз 5", "Приз 6"]);
    const [newSegment, setNewSegment] = useState("");
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const spin = () => {
        if (spinning || segments.length < 2) return;
        setResult(null);
        setSpinning(true);
        const segAngle = 360 / segments.length;
        const extraSpins = 5 + Math.floor(Math.random() * 5);
        const randomIndex = Math.floor(Math.random() * segments.length);
        const targetAngle = extraSpins * 360 + (360 - randomIndex * segAngle - segAngle / 2);
        setRotation((prev) => prev + targetAngle);
        setTimeout(() => {
            setResult(segments[randomIndex]);
            setSpinning(false);
        }, 4500);
    };

    const addSegment = () => {
        if (newSegment.trim() && segments.length < 12) {
            setSegments([...segments, newSegment.trim()]);
            setNewSegment("");
        }
    };

    const removeSegment = (i: number) => {
        if (segments.length > 2) setSegments(segments.filter((_, idx) => idx !== i));
    };

    const segAngle = 360 / segments.length;
    const radius = 140;
    const cx = 160;
    const cy = 160;

    const getSlicePath = (i: number) => {
        const startAngle = (i * segAngle - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180);
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        const largeArc = segAngle > 180 ? 1 : 0;
        return `M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`;
    };

    const getTextTransform = (i: number) => {
        const angle = (i * segAngle + segAngle / 2 - 90) * (Math.PI / 180);
        const textR = radius * 0.65;
        const tx = cx + textR * Math.cos(angle);
        const ty = cy + textR * Math.sin(angle);
        const rot = i * segAngle + segAngle / 2;
        return `translate(${tx},${ty}) rotate(${rot})`;
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Колесо Фартуны</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Интерактивное колесо удачи с настраиваемыми сегментами. Добавьте от 2 до 12 вариантов, крутите колесо — оно сделает 5–9 полных оборотов и случайно остановится на одном из сегментов. Идеально для розыгрышей, выбора победителя или случайного решения.</p>
            </div>

            <div className="px-4 flex gap-2">
                <input type="text" value={newSegment} onChange={(e) => setNewSegment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSegment()} placeholder="Новый сегмент..." className={INPUT_CLASS} />
                <button onClick={addSegment} disabled={!newSegment.trim() || segments.length >= 12} className="bg-[#FA6814] text-white px-4 py-2 text-xs font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer">+</button>
            </div>

            <div className="px-4">
                <div className="flex flex-wrap gap-1.5">
                    {segments.map((s, i) => (
                        <span key={i} className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#3a3a3a] px-2.5 py-1 text-[11px] text-gray-300">
                            <span className="w-2 h-2 shrink-0" style={{ background: WHEEL_COLORS[i % WHEEL_COLORS.length] }} />
                            {s}
                            <button onClick={() => removeSegment(i)} className="text-gray-600 hover:text-[#D32F2F] ml-1 cursor-pointer">✕</button>
                        </span>
                    ))}
                </div>
            </div>

            <div className="px-4 flex justify-center overflow-hidden">
                <div className="relative w-full max-w-[300px]">
                    <svg viewBox="0 0 320 320" className="w-full h-auto" style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none" }}>
                        {segments.map((_, i) => (
                            <path key={i} d={getSlicePath(i)} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="#1e1e1e" strokeWidth={2} />
                        ))}
                        {segments.map((s, i) => (
                            <text key={`t${i}`} transform={getTextTransform(i)} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={11} fontWeight={700} style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
                                {s.length > 12 ? s.slice(0, 12) + "…" : s}
                            </text>
                        ))}
                        <circle cx={cx} cy={cy} r={18} fill="#1e1e1e" stroke="#FA6814" strokeWidth={3} />
                    </svg>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0" style={{ borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "20px solid #FA6814" }} />
                </div>
            </div>

            <div className="px-4 flex justify-center">
                <button onClick={spin} disabled={spinning || segments.length < 2} className="bg-[#FA6814] text-white px-8 py-3 text-sm font-bold uppercase hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer">
                    {spinning ? "Крутится..." : "Крутить!"}
                </button>
            </div>

            {result && (
                <div className="px-4">
                    <div className="bg-[#FA681415] border border-[#FA681440] p-4 text-center">
                        <p className="text-[10px] uppercase text-gray-500 mb-1">Выпало:</p>
                        <p className="text-xl font-bold text-[#FA6814]">{result}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Рандомайзер (Randomizer)
// ═══════════════════════════════════════════════════════════════

function Randomizer() {
    const [min, setMin] = useState(1);
    const [max, setMax] = useState(100);
    const [count, setCount] = useState(1);
    const [results, setResults] = useState<number[]>([]);
    const [animating, setAnimating] = useState(false);

    const generate = () => {
        if (min > max || count < 1) return;
        setAnimating(true);
        let iterations = 0;
        const maxIter = 15;
        const interval = setInterval(() => {
            const temp: number[] = [];
            for (let i = 0; i < count; i++) temp.push(Math.floor(Math.random() * (max - min + 1)) + min);
            setResults(temp);
            iterations++;
            if (iterations >= maxIter) {
                clearInterval(interval);
                const final: number[] = [];
                for (let i = 0; i < count; i++) final.push(Math.floor(Math.random() * (max - min + 1)) + min);
                setResults(final);
                setAnimating(false);
            }
        }, 60);
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Генератор Случайных Чисел</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Генератор случайных чисел с настраиваемым диапазоном и количеством результатов. Задайте минимальное и максимальное значение, укажите сколько чисел нужно сгенерировать (до 20 за раз). Результаты появляются с анимацией гонки. Встроенные пресеты: D6, D20, проценты, лотерея 5 из 36.</p>
            </div>

            <div className="px-4 grid grid-cols-3 gap-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">От</label>
                    <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">До</label>
                    <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Количество</label>
                    <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
            </div>

            <div className="px-4 flex justify-center">
                <button onClick={generate} disabled={animating || min > max} className="bg-[#FA6814] text-white px-8 py-3 text-sm font-bold uppercase hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer">
                    {animating ? "Генерация..." : "Сгенерировать"}
                </button>
            </div>

            {results.length > 0 && (
                <div className="px-4">
                    <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-5">
                        <p className="text-[10px] uppercase text-gray-500 mb-3 text-center">Результат</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {results.map((r, i) => (
                                <span key={i} className="text-3xl font-bold text-[#FA6814] transition-all" style={{ fontFamily: '"Press Start 2P", system-ui', animation: animating ? "pulse 0.1s infinite" : "none" }}>
                                    {r}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 pb-4">
                <p className="text-[10px] uppercase text-gray-500 mb-2">Быстрые варианты</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: "D6 (1–6)", min: 1, max: 6, count: 1 },
                        { label: "D20 (1–20)", min: 1, max: 20, count: 1 },
                        { label: "Процент (0–100)", min: 0, max: 100, count: 1 },
                        { label: "Лотерея 5 из 36", min: 1, max: 36, count: 5 },
                    ].map((p) => (
                        <button key={p.label} onClick={() => { setMin(p.min); setMax(p.max); setCount(p.count); }} className="bg-[#1a1a1a] border border-[#3a3a3a] text-gray-400 px-3 py-1.5 text-[11px] hover:border-[#FA6814] hover:text-[#FA6814] transition-colors cursor-pointer">
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// 3D Игральные Кости (Dice)
// ═══════════════════════════════════════════════════════════════

const DICE_3D_TYPES = [
    { type: "d4", faces: 4, cssClass: "tetra", label: "D4", color: "#5B9BD5" },
    { type: "d6", faces: 6, cssClass: "cube", label: "D6", color: "#4CAF50" },
    { type: "d8", faces: 8, cssClass: "octa", label: "D8", color: "#FA6814" },
    { type: "d10", faces: 10, cssClass: "pentrap", label: "D10", color: "#D32F2F" },
    { type: "d12", faces: 12, cssClass: "dodec", label: "D12", color: "#9C27B0" },
    { type: "d20", faces: 20, cssClass: "icosa", label: "D20", color: "#FFB020" },
] as const;

const MINUS_SVG = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="10" height="10"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const PLUS_SVG = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="10" height="10"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

function getDiceFaces(type: string) {
    const triU = (
        <svg viewBox="0 0 200 174" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,173.205l100,-173.205l100,173.205l-200,0Z" />
        </svg>
    );
    const triD = (
        <svg viewBox="0 0 200 174" xmlns="http://www.w3.org/2000/svg">
            <path d="M200,0l-100,173.205l-100,-173.205l200,0Z" />
        </svg>
    );
    const square = (
        <svg className="square" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="100%" height="100%" />
        </svg>
    );
    const pentrapPenta = (
        <svg viewBox="0 0 88.167 121.331" xmlns="http://www.w3.org/2000/svg">
            <polygon points="44.083,0 88.167,98.157 44.083,121.331 0,98.157" />
        </svg>
    );
    const dodecPenta = (
        <svg viewBox="0 0 200 190.211" xmlns="http://www.w3.org/2000/svg">
            <polygon points="38.197,190.211 0,72.655 100,0 200,72.655 161.803,190.211 " />
        </svg>
    );

    switch (type) {
        case "d4":
            return [triU, triU, triU, triU];
        case "d6":
            return [square, square, square, square, square, square];
        case "d8":
            return [triU, triU, triU, triD, triD, triD, triD, triU];
        case "d10":
            return Array.from({ length: 10 }, () => pentrapPenta);
        case "d12":
            return Array.from({ length: 12 }, () => dodecPenta);
        case "d20":
            return Array.from({ length: 20 }, () => triU);
        default:
            return [];
    }
}

function getDiceInitialTransform(type: string): string {
    switch (type) {
        case "d4": return "rotateX(0deg) rotateY(180deg) rotateZ(0deg)";
        case "d6": return "rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
        case "d8": return "rotateX(90deg) rotateY(0deg) rotateZ(0deg)";
        case "d10": return "rotateX(90deg) rotateY(0deg) rotateZ(0deg)";
        case "d12": return "rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
        case "d20": return "rotateX(90deg) rotateY(0deg) rotateZ(0deg)";
        default: return "rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
    }
}

function Dice3D() {
    const [selectedType, setSelectedType] = useState("d6");
    const [diceCount, setDiceCount] = useState(1);
    const [modifier, setModifier] = useState(0);
    const [outcome, setOutcome] = useState<number | null>(null);
    const [rolling, setRolling] = useState(false);
    const [history, setHistory] = useState<{ type: string; result: number }[]>([]);
    const diceRef = useRef<HTMLButtonElement>(null);

    const diceInfo = DICE_3D_TYPES.find((d) => d.type === selectedType)!;

    const roll = () => {
        if (rolling) return;
        setRolling(true);

        const el = diceRef.current;
        if (el) {
            const isZ = selectedType === "d8" || selectedType === "d10" || selectedType === "d20";
            const axis = isZ ? "Z" : "Y";
            const reg = isZ ? /Z\((.*?)\)/ : /Y\((.*?)\)/;
            let transform = el.style.transform;
            if (!transform) transform = `rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
            const match = transform.match(reg);
            if (match) {
                const currentDeg = Number(match[0].match(/[0-9]+/));
                const newDeg = 360 + currentDeg;
                el.style.transform = transform.replace(reg, `${axis}(${newDeg}deg)`);
            }
        }

        const totalFaces = diceInfo.faces;
        const totalDice = diceCount;

        setTimeout(() => {
            let sum = 0;
            const rolls: number[] = [];
            for (let i = 0; i < totalDice; i++) {
                const r = Math.floor(Math.random() * totalFaces) + 1;
                rolls.push(r);
                sum += r;
            }
            const finalResult = sum + modifier;
            setOutcome(finalResult);
            setRolling(false);
            setHistory((prev) => [{ type: selectedType, result: finalResult }, ...prev].slice(0, 20));

            if (el) {
                const isZ = selectedType === "d8" || selectedType === "d10" || selectedType === "d20";
                const axis = isZ ? "Z" : "Y";
                const reg = isZ ? /Z\((.*?)\)/ : /Y\((.*?)\)/;
                let transform = el.style.transform;
                if (!transform) transform = `rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
                const match = transform.match(reg);
                if (match) {
                    const currentDeg = Number(match[0].match(/[0-9]+/));
                    const newDeg = 360 + currentDeg;
                    el.style.transform = transform.replace(reg, `${axis}(${newDeg}deg)`);
                }
            }
        }, 900);
    };

    const faces = getDiceFaces(selectedType);

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Игральные Кости</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">3D виртуальные игральные кости для настольных игр и RPG. Выберите тип кости: d4 (тетраэдр), d6 (кубик), d8 (октаэдр), d10 (децагонал), d12 (додекаэдр), d20 (икосаэдр). CSS 3D-трансформации, модификатор, история бросков.</p>
            </div>

            <div className="px-4">
                <label className="text-[10px] uppercase text-gray-500 mb-2 block">Тип кости</label>
                <div className="flex flex-wrap gap-2">
                    {DICE_3D_TYPES.map((d) => (
                        <button key={d.type} onClick={() => { setSelectedType(d.type); setOutcome(null); }} className={`dice-type-btn ${selectedType === d.type ? "active" : ""}`}>
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 flex justify-center overflow-hidden">
                <div className="relative" style={{ width: "var(--dc-size, 100px)", height: "var(--dc-size, 100px)" }}>
                    <span className="outcome-cont">
                        <h3 className={`outcome ${selectedType === "d4" ? "d4" : ""}`}>{outcome !== null ? outcome : ""}</h3>
                    </span>
                    <button
                        ref={diceRef}
                        className={`roll-button ${diceInfo.cssClass}`}
                        data-min="1"
                        data-max={String(diceInfo.faces)}
                        style={{ transform: getDiceInitialTransform(selectedType) }}
                        onClick={roll}
                        disabled={rolling}
                    >
                        {faces.map((faceSvg, i) => (
                            <div className="face" key={i}>{faceSvg}</div>
                        ))}
                    </button>
                </div>
            </div>

            <div className="px-4">
                <div className="flex flex-wrap gap-6 justify-center">
                    <div>
                        <div className="dice-increment-label">Кол-во</div>
                        <div className="dice-increment-group">
                            <button onClick={() => setDiceCount(Math.max(1, diceCount - 1))}>{MINUS_SVG}</button>
                            <span>{diceCount}</span>
                            <button onClick={() => setDiceCount(Math.min(10, diceCount + 1))}>{PLUS_SVG}</button>
                        </div>
                    </div>
                    <div>
                        <div className="dice-increment-label">Модификатор</div>
                        <div className="dice-increment-group">
                            <button onClick={() => setModifier(modifier - 1)}>{MINUS_SVG}</button>
                            <span>{modifier > 0 ? `+${modifier}` : modifier}</span>
                            <button onClick={() => setModifier(modifier + 1)}>{PLUS_SVG}</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 flex justify-center">
                <button onClick={roll} disabled={rolling} className="bg-[#FA6814] text-white px-8 py-2.5 text-sm font-bold uppercase hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer">
                    {rolling ? "Бросок..." : "Бросить!"}
                </button>
            </div>

            {history.length > 0 && (
                <div className="px-4 pb-4">
                    <p className="text-[10px] uppercase text-gray-500 mb-2">История бросков</p>
                    <div className="space-y-1">
                        {history.map((h, i) => (
                            <div key={i} className="flex items-center justify-between bg-[#1a1a1a] border border-[#3a3a3a] px-3 py-1.5 text-[11px]">
                                <span className="text-gray-400">{h.type}</span>
                                <span className="text-[#FA6814] font-bold">= {h.result}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Метроном (Metronome)
// ═══════════════════════════════════════════════════════════════

const TIME_SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8"];

function Metronome() {
    const [bpm, setBpm] = useState(120);
    const [playing, setPlaying] = useState(false);
    const [timeSignature, setTimeSignature] = useState("4/4");
    const [beat, setBeat] = useState(0);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const nextNoteRef = useRef(0);
    const beatsPerMeasure = parseInt(timeSignature.split("/")[0]);

    const playClick = useCallback((accent: boolean) => {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = accent ? 1000 : 700;
        gain.gain.setValueAtTime(accent ? 0.6 : 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
    }, []);

    const start = useCallback(() => {
        if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
        setPlaying(true);
        setBeat(0);
        nextNoteRef.current = performance.now();
        let currentBeat = 0;

        const schedule = () => {
            const interval = (60 / bpm) * 1000;
            const now = performance.now();
            while (nextNoteRef.current <= now) {
                playClick(currentBeat === 0);
                setBeat(currentBeat);
                currentBeat = (currentBeat + 1) % beatsPerMeasure;
                nextNoteRef.current += interval;
            }
            intervalRef.current = setTimeout(schedule, 10);
        };
        schedule();
    }, [bpm, playClick, beatsPerMeasure]);

    const stop = useCallback(() => {
        setPlaying(false);
        setBeat(0);
        if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = null; }
    }, []);

    useEffect(() => {
        if (playing) { stop(); setTimeout(start, 50); }
    }, [bpm, timeSignature]);

    useEffect(() => () => { stop(); if (audioCtxRef.current) audioCtxRef.current.close(); }, []);

    const tempoLabel = bpm < 60 ? "Largo" : bpm < 80 ? "Adagio" : bpm < 100 ? "Andante" : bpm < 120 ? "Moderato" : bpm < 140 ? "Allegro" : bpm < 176 ? "Vivace" : "Presto";

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Метроном</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Цифровой метроном для поддержания ровного темпа. Диапазон: 20–300 BPM с ползунком и кнопками ±1. Выбор размера: 2/4, 3/4, 4/4, 5/4, 6/8, 7/8. Визуальный индикатор подсвечивает текущий бит (первая доля — акцент). Итальянские обозначения темпа: от Largo (медленно) до Presto (очень быстро). Звуковые щелчки через Web Audio API.</p>
            </div>

            <div className="px-4 text-center">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-6">
                    <p className="text-[10px] uppercase text-gray-500 mb-2">BPM</p>
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => setBpm(Math.max(20, bpm - 1))} className="bg-[#282828] border border-[#3a3a3a] text-white w-10 h-10 flex items-center justify-center text-lg hover:border-[#FA6814] transition-colors cursor-pointer">−</button>
                        <input type="number" min={20} max={300} value={bpm} onChange={(e) => setBpm(Math.max(20, Math.min(300, Number(e.target.value))))} className="w-24 bg-transparent border-b-2 border-[#FA6814] text-[#FA6814] text-4xl font-bold text-center outline-none" style={{ fontFamily: '"Press Start 2P", system-ui' }} />
                        <button onClick={() => setBpm(Math.min(300, bpm + 1))} className="bg-[#282828] border border-[#3a3a3a] text-white w-10 h-10 flex items-center justify-center text-lg hover:border-[#FA6814] transition-colors cursor-pointer">+</button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">{tempoLabel}</p>
                </div>
            </div>

            <div className="px-4">
                <input type="range" min={20} max={300} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-[#FA6814] h-2 cursor-pointer" />
                <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                    <span>20</span><span>100</span><span>200</span><span>300</span>
                </div>
            </div>

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-4 flex items-center justify-center gap-3">
                    {Array.from({ length: beatsPerMeasure }, (_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full transition-all duration-75 flex items-center justify-center text-[10px] font-bold" style={{
                            background: beat === i ? (i === 0 ? "#FA6814" : "#FA681480") : "#282828",
                            border: `2px solid ${beat === i ? "#FA6814" : "#3a3a3a"}`,
                            color: beat === i ? "white" : "#555",
                            transform: beat === i ? "scale(1.2)" : "scale(1)",
                        }}>
                            {i + 1}
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-4">
                <label className="text-[10px] uppercase text-gray-500 mb-2 block">Размер</label>
                <div className="flex gap-2">
                    {TIME_SIGNATURES.map((ts) => (
                        <button key={ts} onClick={() => setTimeSignature(ts)} className="px-3 py-2 text-xs font-semibold border transition-colors cursor-pointer" style={{ background: timeSignature === ts ? "#FA681415" : "#1a1a1a", borderColor: timeSignature === ts ? "#FA6814" : "#3a3a3a", color: timeSignature === ts ? "#FA6814" : "#808080" }}>
                            {ts}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 flex justify-center pb-4">
                <button onClick={playing ? stop : start} className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold transition-all cursor-pointer border-2" style={{ background: playing ? "#D32F2F" : "#FA6814", borderColor: playing ? "#D32F2F" : "#FA6814", color: "white", boxShadow: playing ? "0 0 20px #D32F2F40" : "0 0 20px #FA681440" }}>
                    {playing ? "⏹" : "▶"}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Тюнер (Tuner)
// ═══════════════════════════════════════════════════════════════

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_FREQUENCIES: Record<string, number> = {};
NOTES.forEach((note, i) => { NOTE_FREQUENCIES[note] = 440 * Math.pow(2, (i - 9) / 12); });

function detectPitch(analyser: AnalyserNode, sampleRate: number): number | null {
    const bufLen = analyser.fftSize;
    const buf = new Float32Array(bufLen);
    analyser.getFloatTimeDomainData(buf);

    let maxCorrelation = 0;
    let bestOffset = -1;
    const minSamples = Math.floor(sampleRate / 1000);
    const maxSamples = Math.floor(sampleRate / 60);

    for (let offset = minSamples; offset < maxSamples; offset++) {
        let correlation = 0;
        for (let i = 0; i < bufLen - offset; i++) {
            correlation += buf[i] * buf[i + offset];
        }
        if (correlation > maxCorrelation) {
            maxCorrelation = correlation;
            bestOffset = offset;
        }
    }

    if (maxCorrelation > 0.01 && bestOffset > 0) {
        return sampleRate / bestOffset;
    }
    return null;
}

function getNoteFromFrequency(freq: number): { note: string; octave: number; cents: number } {
    const A4 = 440;
    const semitones = 12 * Math.log2(freq / A4);
    const rounded = Math.round(semitones);
    const cents = Math.round((semitones - rounded) * 100);
    const noteIndex = ((rounded % 12) + 12 + 9) % 12;
    const octave = 4 + Math.floor((rounded + 9) / 12);
    return { note: NOTES[noteIndex], octave, cents };
}

function Tuner() {
    const [listening, setListening] = useState(false);
    const [currentNote, setCurrentNote] = useState<string | null>(null);
    const [octave, setOctave] = useState(4);
    const [frequency, setFrequency] = useState<number | null>(null);
    const [cents, setCents] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animRef = useRef<number>(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    const startListening = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 4096;
            source.connect(analyser);
            analyserRef.current = analyser;
            setListening(true);

            const detect = () => {
                if (!analyserRef.current) return;
                const freq = detectPitch(analyserRef.current, ctx.sampleRate);
                if (freq && freq > 50 && freq < 4000) {
                    const { note, octave: oct, cents: c } = getNoteFromFrequency(freq);
                    setCurrentNote(note);
                    setOctave(oct);
                    setFrequency(Math.round(freq * 10) / 10);
                    setCents(c);
                } else {
                    setCurrentNote(null);
                    setFrequency(null);
                    setCents(0);
                }
                animRef.current = requestAnimationFrame(detect);
            };
            detect();
        } catch {
            setError("Микрофон недоступен. Разрешите доступ к микрофону.");
        }
    };

    const stopListening = () => {
        setListening(false);
        cancelAnimationFrame(animRef.current);
        if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
        if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
        setCurrentNote(null);
        setFrequency(null);
        setCents(0);
    };

    useEffect(() => () => { stopListening(); }, []);

    const centsPercent = Math.min(100, Math.abs(cents));
    const centsDir = cents > 0 ? "sharp" : cents < 0 ? "flat" : "perfect";

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Тюнер</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Хроматический тюнер с определением высоты звука через микрофон. Детектирует ноту (C–B), октаву и отклонение в центах (±50). Эталонная частота A4 = 440 Гц. Визуальный индикатор показывает расстройку: в бемоль (♭) — нота ниже нормы, в диез (♯) — выше, по центру — настроено точно. Работает с гитарой, фортепиано, вокалом и другими инструментами.</p>
            </div>

            {error && (
                <div className="px-4">
                    <div className="bg-[#D32F2F15] border border-[#D32F2F40] p-3 text-[11px] text-[#D32F2F]">{error}</div>
                </div>
            )}

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-8 text-center">
                    {currentNote ? (
                        <>
                            <div className="flex items-center justify-center gap-1 mb-2">
                                <span className="text-6xl font-bold text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>{currentNote}</span>
                                <span className="text-2xl text-gray-500 font-semibold">{octave}</span>
                            </div>
                            {frequency && <p className="text-sm text-gray-400 mb-3">{frequency} Гц</p>}

                            <div className="relative mx-auto" style={{ width: 280 }}>
                                <div className="h-2 bg-[#282828] rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-75 rounded-full" style={{
                                        width: `${centsPercent}%`,
                                        marginLeft: cents < 0 ? `${50 - centsPercent}%` : "50%",
                                        background: centsDir === "perfect" ? "#4CAF50" : centsDir === "sharp" ? "#FFB020" : "#5B9BD5",
                                    }} />
                                </div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-white" />
                                <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                                    <span>♭ −50</span>
                                    <span className="text-[#4CAF50]">✓ 0</span>
                                    <span>♯ +50</span>
                                </div>
                            </div>
                            <p className="text-[10px] mt-2" style={{ color: centsDir === "perfect" ? "#4CAF50" : "#808080" }}>
                                {centsDir === "perfect" ? "На вершине!" : centsDir === "sharp" ? `Выше на ${Math.abs(cents)} центов` : `Ниже на ${Math.abs(cents)} центов`}
                            </p>
                        </>
                    ) : (
                        <div>
                            <div className="text-4xl mb-3"></div>
                            <p className="text-gray-500 text-sm">{listening ? "Играйте в инструмент..." : "Нажмите для начала настройки"}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 flex items-center justify-between">
                    <span className="text-[10px] uppercase text-gray-500">Эталонная частота A4</span>
                    <span className="text-sm font-bold text-[#FA6814]">440 Гц</span>
                </div>
            </div>

            <div className="px-4 flex justify-center pb-4">
                <button onClick={listening ? stopListening : startListening} className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold transition-all cursor-pointer border-2" style={{ background: listening ? "#D32F2F" : "#FA6814", borderColor: listening ? "#D32F2F" : "#FA6814", color: "white", boxShadow: listening ? "0 0 20px #D32F2F40" : "0 0 20px #FA681440" }}>
                    {listening ? "■" : "♪"}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Генератор частот (Tone Generator)
// ═══════════════════════════════════════════════════════════════

const WAVEFORMS = ["sine", "square", "sawtooth", "triangle"] as const;
type Waveform = typeof WAVEFORMS[number];
const WAVEFORM_LABELS: Record<Waveform, string> = { sine: "Синус", square: "Пила", sawtooth: "Зуб", triangle: "Треугольник" };

const FREQ_PRESETS = [
    { label: "Суб-бас", freq: 40, desc: "20–60 Гц — физически ощутимый гул" },
    { label: "Бас", freq: 100, desc: "60–250 Гц — глубокий бас" },
    { label: "Низ mid", freq: 400, desc: "250–500 Гц — тёплый тон" },
    { label: "Mid", freq: 1000, desc: "500–2000 Гц — основной тон" },
    { label: "High mid", freq: 3000, desc: "2–4 кГц — присутствие" },
    { label: "Высокие", freq: 8000, desc: "4–12 кГц — яркость" },
    { label: "Верх", freq: 16000, desc: "12–20 кГц — эрцитет" },
    { label: "A4 (тест)", freq: 440, desc: "Эталон ноты ля" },
];

function ToneGenerator() {
    const [frequency, setFrequency] = useState(440);
    const [waveform, setWaveform] = useState<Waveform>("sine");
    const [volume, setVolume] = useState(0.3);
    const [playing, setPlaying] = useState(false);
    const [activePreset, setActivePreset] = useState<number | null>(7);
    const oscRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const ctxRef = useRef<AudioContext | null>(null);

    const startTone = useCallback(() => {
        if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
        if (!ctxRef.current) ctxRef.current = new AudioContext();
        const ctx = ctxRef.current;

        if (oscRef.current) { try { oscRef.current.stop(); } catch {} }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = waveform;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscRef.current = osc;
        gainRef.current = gain;
        setPlaying(true);
    }, [frequency, waveform, volume]);

    const stopTone = useCallback(() => {
        if (oscRef.current) { try { oscRef.current.stop(); } catch {} oscRef.current = null; }
        setPlaying(false);
    }, []);

    const updateFrequency = useCallback((freq: number) => {
        setFrequency(freq);
        if (oscRef.current && ctxRef.current) {
            oscRef.current.frequency.setValueAtTime(freq, ctxRef.current.currentTime);
        }
    }, []);

    const updateWaveform = useCallback((wf: Waveform) => {
        setWaveform(wf);
        if (oscRef.current) oscRef.current.type = wf;
    }, []);

    const updateVolume = useCallback((vol: number) => {
        setVolume(vol);
        if (gainRef.current && ctxRef.current) {
            gainRef.current.gain.setValueAtTime(vol, ctxRef.current.currentTime);
        }
    }, []);

    useEffect(() => () => { stopTone(); if (ctxRef.current) ctxRef.current.close(); }, []);

    const getNoteLabel = (freq: number) => {
        const A4 = 440;
        const semitones = 12 * Math.log2(freq / A4);
        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const idx = Math.round(semitones) % 12;
        const octave = 4 + Math.floor((Math.round(semitones) + 9) / 12);
        return `${notes[(idx + 12) % 12]}${octave}`;
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Генератор частот</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Генератор звуковых тонов для тестирования аудиооборудования, настройки инструментов и проверки слуха. Задайте частоту (20–20 000 Гц), форму волны и громкость. Используйте пресеты для быстрого переключения между диапазонами.</p>
            </div>

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-6 text-center">
                    <p className="text-[10px] uppercase text-gray-500 mb-2" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Частота</p>
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => updateFrequency(Math.max(20, frequency - (frequency < 100 ? 1 : frequency < 1000 ? 10 : 100)))} className="bg-[#282828] border border-[#3a3a3a] text-white w-10 h-10 flex items-center justify-center text-lg hover:border-[#FA6814] transition-colors cursor-pointer">−</button>
                        <div>
                            <input type="number" min={20} max={20000} value={frequency} onChange={(e) => updateFrequency(Math.max(20, Math.min(20000, Number(e.target.value))))} className="w-28 bg-transparent border-b-2 border-[#FA6814] text-[#FA6814] text-4xl font-bold text-center outline-none" style={{ fontFamily: '"Press Start 2P", system-ui' }} />
                            <p className="text-xs text-gray-500 mt-1">Гц · {getNoteLabel(frequency)}</p>
                        </div>
                        <button onClick={() => updateFrequency(Math.min(20000, frequency + (frequency < 100 ? 1 : frequency < 1000 ? 10 : 100)))} className="bg-[#282828] border border-[#3a3a3a] text-white w-10 h-10 flex items-center justify-center text-lg hover:border-[#FA6814] transition-colors cursor-pointer">+</button>
                    </div>
                </div>
            </div>

            <div className="px-4">
                <input type="range" min={20} max={20000} value={frequency} onChange={(e) => updateFrequency(Number(e.target.value))} className="w-full accent-[#FA6814] h-2 cursor-pointer" />
                <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                    <span>20 Гц</span><span>100</span><span>1 кГц</span><span>10 кГц</span><span>20 кГц</span>
                </div>
            </div>

            <div className="px-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase text-gray-500 w-20">Громкость</span>
                    <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => updateVolume(Number(e.target.value))} className="flex-1 accent-[#FA6814] h-2 cursor-pointer" />
                    <span className="text-xs text-gray-400 w-10 text-right">{Math.round(volume * 100)}%</span>
                </div>
            </div>

            <div className="px-4">
                <label className="text-[10px] uppercase text-gray-500 mb-2 block">Форма волны</label>
                <div className="flex gap-2">
                    {WAVEFORMS.map((wf) => (
                        <button key={wf} onClick={() => updateWaveform(wf)} className="flex-1 py-2.5 text-xs font-semibold border transition-colors cursor-pointer" style={{ background: waveform === wf ? "#FA681415" : "#1a1a1a", borderColor: waveform === wf ? "#FA6814" : "#3a3a3a", color: waveform === wf ? "#FA6814" : "#808080" }}>
                            {WAVEFORM_LABELS[wf]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 flex justify-center">
                <button onClick={playing ? stopTone : startTone} className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold transition-all cursor-pointer border-2" style={{ background: playing ? "#D32F2F" : "#FA6814", borderColor: playing ? "#D32F2F" : "#FA6814", color: "white", boxShadow: playing ? "0 0 20px #D32F2F40" : "0 0 20px #FA681440" }}>
                    {playing ? "⏹" : "▶"}
                </button>
            </div>

            <div className="px-4 pb-4">
                <p className="text-[10px] uppercase text-gray-500 mb-2">Пресеты</p>
                <div className="grid grid-cols-2 gap-2">
                    {FREQ_PRESETS.map((p, i) => (
                        <button key={i} onClick={() => { updateFrequency(p.freq); setActivePreset(i); }} className="text-left bg-[#1a1a1a] border border-[#3a3a3a] p-2.5 hover:border-[#FA6814] transition-colors cursor-pointer" style={{ borderColor: activePreset === i ? "#FA6814" : undefined }}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white font-semibold">{p.label}</span>
                                <span className="text-[10px] text-[#FA6814] font-bold">{p.freq} Гц</span>
                            </div>
                            <p className="text-[9px] text-gray-500 mt-0.5">{p.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// WebRTC Diagnostic (simplified, no socket)
// ═══════════════════════════════════════════════════════════════

interface RTCLogEntry {
    time: string;
    category: string;
    message: string;
    level: "info" | "success" | "error" | "warn";
}

interface RTCCapability {
    name: string;
    supported: boolean;
}

interface StunResult {
    natType: string;
    candidateCount: number;
    hasHost: boolean;
    hasSrflx: boolean;
    hasRelay: boolean;
    publicIp: string | null;
}

const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

function rtcNow(): string {
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
    if (!hasHost && hasSrflx) return "Symmetric NAT";
    return "Unknown";
}

function WebRTCTestPage() {
    const [logs, setLogs] = useState<RTCLogEntry[]>([]);
    const [capabilities, setCapabilities] = useState<RTCCapability[]>([]);
    const [stunResult, setStunResult] = useState<StunResult | null>(null);
    const [stunRunning, setStunRunning] = useState(false);
    const logRef = useRef<HTMLDivElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    const addLog = useCallback((category: string, message: string, level: RTCLogEntry["level"] = "info") => {
        setLogs((prev) => [...prev, { time: rtcNow(), category, message, level }]);
    }, []);

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [logs]);

    useEffect(() => () => { if (pcRef.current) { pcRef.current.close(); pcRef.current = null; } }, []);

    const checkBrowser = () => {
        addLog("Browser", "Проверка возможностей браузера...", "info");
        const checks: RTCCapability[] = [
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
        addLog("Browser", checks.every((c) => c.supported) ? "Все проверки пройдены" : "Некоторые API недоступны", checks.every((c) => c.supported) ? "success" : "warn");
    };

    const runStunTest = async () => {
        setStunRunning(true);
        setStunResult(null);
        addLog("STUN", "Запуск STUN-теста...", "info");

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        let hasHost = false;
        let hasSrflx = false;
        let hasRelay = false;
        let publicIp: string | null = null;
        let candidateCount = 0;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            addLog("STUN", "getUserMedia: OK", "success");
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        } catch {
            addLog("STUN", "getUserMedia недоступен — тест с data channel", "warn");
        }

        pc.createDataChannel("stun-test");

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                const c = e.candidate.candidate;
                const type = parseCandidateType(c);
                candidateCount++;
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
            setStunResult({ natType, candidateCount, hasHost, hasSrflx, hasRelay, publicIp });
            addLog("STUN", `Собрано кандидатов: ${candidateCount}`, "info");
            addLog("STUN", `Host: ${hasHost ? "Y" : "N"}, Srflx: ${hasSrflx ? "Y" : "N"}, Relay: ${hasRelay ? "Y" : "N"}`, "info");
            if (publicIp) addLog("STUN", `Public IP: ${publicIp}`, "success");
            addLog("STUN", `NAT Type: ${natType}`, hasRelay ? "warn" : "success");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            addLog("STUN", `Ошибка: ${msg}`, "error");
        }

        pc.close();
        pcRef.current = null;
        setStunRunning(false);
    };

    const downloadLog = () => {
        const content = [
            "WebRTC Diagnostic Log",
            `Date: ${new Date().toISOString()}`,
            `Browser: ${navigator.userAgent}`,
            "=".repeat(60),
            "",
            ...logs.map((l) => `[${l.time}] [${l.category}] ${l.level.toUpperCase().padEnd(7)} ${l.message}`),
        ].join("\n");
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `webrtc-log-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearLogs = () => { setLogs([]); setCapabilities([]); setStunResult(null); };

    const getNatColor = (type: string) => {
        if (type.includes("LAN") || type.includes("No NAT")) return "#4CAF50";
        if (type.includes("Cone")) return "#5B9BD5";
        if (type.includes("Symmetric")) return "#FFB020";
        if (type.includes("TURN")) return "#D32F2F";
        return "#808080";
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">WebRTC Diagnostic</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Проверка поддержки WebRTC API браузером и определение типа NAT через STUN-серверы Google. Тест определяет доступность getUserMedia, RTCPeerConnection, MediaRecorder и других API. STUN-тест собирает ICE-кандидатов и определяет тип NAT.</p>
            </div>

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] uppercase text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Browser</p>
                        <button onClick={checkBrowser} className="bg-[#FA6814] text-white px-4 py-1.5 text-xs font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer">
                            {capabilities.length > 0 ? "Повторить" : "Проверить"}
                        </button>
                    </div>
                    {capabilities.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5">
                            {capabilities.map((c) => (
                                <div key={c.name} className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] border ${c.supported ? "bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#4CAF50]" : "bg-[#D32F2F]/10 border-[#D32F2F]/30 text-[#D32F2F]"}`}>
                                    <span>{c.supported ? "Y" : "X"}</span>
                                    <span>{c.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] uppercase text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>STUN Test</p>
                        <button onClick={runStunTest} disabled={stunRunning} className="bg-[#FA6814] text-white px-4 py-1.5 text-xs font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer">
                            {stunRunning ? "Тестирование..." : "Запустить"}
                        </button>
                    </div>
                    {stunResult && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-3 border text-center" style={{ borderColor: getNatColor(stunResult.natType), background: `${getNatColor(stunResult.natType)}15`, minWidth: 160 }}>
                                    <p className="text-[9px] text-gray-500 mb-1">NAT Type</p>
                                    <p className="text-xs font-bold" style={{ color: getNatColor(stunResult.natType) }}>{stunResult.natType}</p>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 flex-1">
                                    <div className="bg-[#282828] border border-[#3a3a3a] p-2 text-center">
                                        <p className="text-sm font-bold text-white">{stunResult.candidateCount}</p>
                                        <p className="text-[9px] text-gray-500">Кандидатов</p>
                                    </div>
                                    <div className="bg-[#282828] border border-[#3a3a3a] p-2 text-center">
                                        <p className="text-sm font-bold" style={{ color: stunResult.hasHost ? "#4CAF50" : "#D32F2F" }}>{stunResult.hasHost ? "Y" : "N"}</p>
                                        <p className="text-[9px] text-gray-500">Host</p>
                                    </div>
                                    <div className="bg-[#282828] border border-[#3a3a3a] p-2 text-center">
                                        <p className="text-sm font-bold" style={{ color: stunResult.hasSrflx ? "#4CAF50" : "#D32F2F" }}>{stunResult.hasSrflx ? "Y" : "N"}</p>
                                        <p className="text-[9px] text-gray-500">Srflx</p>
                                    </div>
                                    <div className="bg-[#282828] border border-[#3a3a3a] p-2 text-center">
                                        <p className="text-sm font-bold" style={{ color: stunResult.hasRelay ? "#FFB020" : "#4CAF50" }}>{stunResult.hasRelay ? "!" : "-"}</p>
                                        <p className="text-[9px] text-gray-500">Relay</p>
                                    </div>
                                </div>
                            </div>
                            {stunResult.publicIp && (
                                <p className="text-[11px] text-gray-400">Public IP: <span className="text-white">{stunResult.publicIp}</span></p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a]">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3a3a3a]">
                        <p className="text-[10px] uppercase text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Log ({logs.length})</p>
                        <div className="flex gap-2">
                            <button onClick={clearLogs} className="bg-[#282828] border border-[#3a3a3a] text-gray-400 px-3 py-1 text-[11px] hover:text-white hover:border-[#FA6814] transition-colors cursor-pointer">Очистить</button>
                            <button onClick={downloadLog} disabled={logs.length === 0} className="bg-[#FA6814] text-white px-3 py-1 text-[11px] hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer">Скачать</button>
                        </div>
                    </div>
                    <div ref={logRef} className="h-60 overflow-y-auto font-mono text-[11px] leading-5 px-4 py-3 bg-[#1a1a1a]">
                        {logs.length === 0 ? (
                            <p className="text-gray-600 text-center py-8">Нажмите "Проверить" для начала диагностики</p>
                        ) : (
                            logs.map((l, i) => {
                                const lc = l.level === "success" ? "#4CAF50" : l.level === "error" ? "#D32F2F" : l.level === "warn" ? "#FFB020" : "#808080";
                                return (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-gray-600 shrink-0">[{l.time}]</span>
                                        <span className="shrink-0 text-[#FA6814]" style={{ minWidth: 60 }}>{l.category}</span>
                                        <span className="shrink-0" style={{ color: lc, minWidth: 45 }}>{l.level.toUpperCase()}</span>
                                        <span style={{ color: lc }}>{l.message}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {(capabilities.length > 0 || stunResult) && (
                <div className="px-4 pb-4">
                    <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-4">
                        <p className="text-[10px] uppercase text-gray-500 mb-3" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Summary</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Браузер</span>
                                <span className={capabilities.length > 0 && capabilities.every((c) => c.supported) ? "text-[#4CAF50]" : "text-gray-500"}>
                                    {capabilities.length > 0 ? (capabilities.every((c) => c.supported) ? "OK" : "Есть ограничения") : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">NAT Type</span>
                                <span style={{ color: stunResult ? getNatColor(stunResult.natType) : "#808080" }}>{stunResult ? stunResult.natType : "—"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Электрические расчёты (Electrical Calculator)
// ═══════════════════════════════════════════════════════════════

const ELEC_TABS = ["Закон Ома", "Мощность", "Резисторы", "Конденсатор", "Сила тока", "Расход"] as const;
type ElecTab = typeof ELEC_TABS[number];

function ElectricalCalc() {
    const [tab, setTab] = useState<ElecTab>("Закон Ома");

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Электрические расчёты</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Набор калькуляторов для электрических и физических расчётов: закон Ома, мощность, резисторы, энергия конденсатора, сила и расчёт расхода электроэнергии.</p>
            </div>

            <div className="px-4">
                <div className="flex flex-wrap gap-1.5">
                    {ELEC_TABS.map((t) => (
                        <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 text-[11px] font-semibold border transition-colors cursor-pointer" style={{ background: tab === t ? "#FA681415" : "#1a1a1a", borderColor: tab === t ? "#FA6814" : "#3a3a3a", color: tab === t ? "#FA6814" : "#808080" }}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {tab === "Закон Ома" && <OhmLawCalc />}
            {tab === "Мощность" && <PowerCalc />}
            {tab === "Резисторы" && <ResistorCalc />}
            {tab === "Конденсатор" && <CapacitorCalc />}
            {tab === "Сила тока" && <ForceCalc />}
            {tab === "Расход" && <PowerCostCalc />}
        </div>
    );
}

function OhmLawCalc() {
    const [mode, setMode] = useState<"V" | "I" | "R">("V");
    const [v, setV] = useState(12);
    const [i, setI] = useState(2);
    const [r, setR] = useState(6);

    useEffect(() => {
        if (mode === "V") setV(Math.round(i * r * 100) / 100);
        if (mode === "I") setI(r > 0 ? Math.round((v / r) * 100) / 100 : 0);
        if (mode === "R") setR(i > 0 ? Math.round((v / i) * 100) / 100 : 0);
    }, [mode, v, i, r]);

    return (
        <div className="px-4 space-y-3">
            <p className="text-[10px] uppercase text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>V = I x R</p>
            <div className="flex gap-2">
                {(["V", "I", "R"] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)} className="px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer" style={{ background: mode === m ? "#FA681415" : "#1a1a1a", borderColor: mode === m ? "#FA6814" : "#3a3a3a", color: mode === m ? "#FA6814" : "#808080" }}>
                        {m === "V" ? "Напряжение (V)" : m === "I" ? "Ток (I)" : "Сопротивление (R)"}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">V (Вольты)</label>
                    <input type="number" step="0.01" value={v} onChange={(e) => setV(Number(e.target.value))} disabled={mode === "V"} className={INPUT_CLASS + (mode === "V" ? " opacity-50" : "")} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">I (Амперы)</label>
                    <input type="number" step="0.01" value={i} onChange={(e) => setI(Number(e.target.value))} disabled={mode === "I"} className={INPUT_CLASS + (mode === "I" ? " opacity-50" : "")} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">R (Омы)</label>
                    <input type="number" step="0.01" value={r} onChange={(e) => setR(Number(e.target.value))} disabled={mode === "R"} className={INPUT_CLASS + (mode === "R" ? " opacity-50" : "")} />
                </div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Результат</p>
                <p className="text-lg font-bold text-[#FA6814]">
                    {mode === "V" && `V = ${v} В`}
                    {mode === "I" && `I = ${i} А`}
                    {mode === "R" && `R = ${r} Ом`}
                </p>
            </div>
        </div>
    );
}

function PowerCalc() {
    const [mode, setMode] = useState<"VI" | "IR" | "VR">("VI");
    const [v, setV] = useState(12);
    const [i, setI] = useState(2);
    const [r, setR] = useState(6);
    const [p, setP] = useState(24);

    useEffect(() => {
        if (mode === "VI") setP(Math.round(v * i * 100) / 100);
        if (mode === "IR") setP(Math.round(i * i * r * 100) / 100);
        if (mode === "VR") setP(r > 0 ? Math.round((v * v / r) * 100) / 100 : 0);
    }, [mode, v, i, r]);

    return (
        <div className="px-4 space-y-3">
            <div className="flex gap-2">
                {([["VI", "P = V x I"], ["IR", "P = I^2 x R"], ["VR", "P = V^2 / R"]] as const).map(([m, label]) => (
                    <button key={m} onClick={() => setMode(m as "VI" | "IR" | "VR")} className="px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer" style={{ background: mode === m ? "#FA681415" : "#1a1a1a", borderColor: mode === m ? "#FA6814" : "#3a3a3a", color: mode === m ? "#FA6814" : "#808080" }}>
                        {label}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
                {mode !== "IR" && (
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 mb-1 block">V (Вольты)</label>
                        <input type="number" step="0.01" value={v} onChange={(e) => setV(Number(e.target.value))} className={INPUT_CLASS} />
                    </div>
                )}
                {mode !== "VR" && (
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 mb-1 block">I (Амперы)</label>
                        <input type="number" step="0.01" value={i} onChange={(e) => setI(Number(e.target.value))} className={INPUT_CLASS} />
                    </div>
                )}
                {mode !== "VI" && (
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 mb-1 block">R (Омы)</label>
                        <input type="number" step="0.01" value={r} onChange={(e) => setR(Number(e.target.value))} className={INPUT_CLASS} />
                    </div>
                )}
            </div>
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Мощность</p>
                <p className="text-lg font-bold text-[#FA6814]">P = {p} Вт</p>
            </div>
        </div>
    );
}

function ResistorCalc() {
    const [resistors, setResistors] = useState<number[]>([100, 200]);
    const [parallel, setParallel] = useState(false);
    const [newR, setNewR] = useState(100);

    const total = parallel
        ? resistors.length > 0 ? 1 / resistors.reduce((sum, r) => sum + (r > 0 ? 1 / r : 0), 0) : 0
        : resistors.reduce((sum, r) => sum + r, 0);

    const add = () => { if (newR > 0 && resistors.length < 20) setResistors([...resistors, newR]); };
    const remove = (idx: number) => setResistors(resistors.filter((_, i) => i !== idx));

    return (
        <div className="px-4 space-y-3">
            <div className="flex gap-2">
                <button onClick={() => setParallel(false)} className="flex-1 py-2 text-xs font-semibold border transition-colors cursor-pointer" style={{ background: !parallel ? "#FA681415" : "#1a1a1a", borderColor: !parallel ? "#FA6814" : "#3a3a3a", color: !parallel ? "#FA6814" : "#808080" }}>Последовательное</button>
                <button onClick={() => setParallel(true)} className="flex-1 py-2 text-xs font-semibold border transition-colors cursor-pointer" style={{ background: parallel ? "#FA681415" : "#1a1a1a", borderColor: parallel ? "#FA6814" : "#3a3a3a", color: parallel ? "#FA6814" : "#808080" }}>Параллельное</button>
            </div>
            <div className="flex gap-2">
                <input type="number" min={0.01} step="0.01" value={newR} onChange={(e) => setNewR(Number(e.target.value))} placeholder="R (Ом)" className={INPUT_CLASS} />
                <button onClick={add} className="bg-[#FA6814] text-white px-4 py-2 text-xs font-semibold hover:bg-[#ff7a2a] cursor-pointer">+</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {resistors.map((r, i) => (
                    <span key={i} className="flex items-center gap-1 bg-[#1a1a1a] border border-[#3a3a3a] px-2.5 py-1 text-[11px] text-gray-300">
                        R{i + 1}: {r} Ом
                        <button onClick={() => remove(i)} className="text-gray-600 hover:text-[#D32F2F] ml-1 cursor-pointer">X</button>
                    </span>
                ))}
            </div>
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Итого</p>
                <p className="text-lg font-bold text-[#FA6814]">R = {Math.round(total * 100) / 100} Ом</p>
            </div>
        </div>
    );
}

function CapacitorCalc() {
    const [c, setC] = useState(100);
    const [v, setV] = useState(12);
    const e = 0.5 * (c / 1000000) * v * v;
    return (
        <div className="px-4 space-y-3">
            <p className="text-[10px] uppercase text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>E = 0.5 * C * V^2</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">C (мкФ)</label>
                    <input type="number" step="0.01" min={0} value={c} onChange={(e) => setC(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">V (Вольты)</label>
                    <input type="number" step="0.01" min={0} value={v} onChange={(e) => setV(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Энергия</p>
                <p className="text-lg font-bold text-[#FA6814]">E = {e < 0.001 ? e.toExponential(3) : Math.round(e * 10000) / 10000} Дж</p>
            </div>
        </div>
    );
}

function ForceCalc() {
    const [m, setM] = useState(10);
    const [a, setA] = useState(9.81);
    const f = Math.round(m * a * 100) / 100;
    return (
        <div className="px-4 space-y-3">
            <p className="text-[10px] uppercase text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>F = m * a</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">m (кг)</label>
                    <input type="number" step="0.01" min={0} value={m} onChange={(e) => setM(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">a (м/с^2)</label>
                    <input type="number" step="0.01" value={a} onChange={(e) => setA(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Сила</p>
                <p className="text-lg font-bold text-[#FA6814]">F = {f} Н</p>
            </div>
        </div>
    );
}

function PowerCostCalc() {
    const [watts, setWatts] = useState(100);
    const [hours, setHours] = useState(8);
    const [days, setDays] = useState(30);
    const [price, setPrice] = useState(16);
    const kwh = Math.round(watts * hours * days / 1000 * 100) / 100;
    const cost = Math.round(kwh * price * 100) / 100;
    return (
        <div className="px-4 space-y-3">
            <p className="text-[10px] uppercase text-gray-500" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Расход</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Мощность (Вт)</label>
                    <input type="number" min={0} value={watts} onChange={(e) => setWatts(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Часов в день</label>
                    <input type="number" min={0} max={24} value={hours} onChange={(e) => setHours(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Дней в месяц</label>
                    <input type="number" min={1} max={31} value={days} onChange={(e) => setDays(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Цена за кВтч (тенге)</label>
                    <input type="number" min={0} step="0.1" value={price} onChange={(e) => setPrice(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                    <p className="text-[10px] uppercase text-gray-500 mb-1">Потребление</p>
                    <p className="text-lg font-bold text-[#5B9BD5]">{kwh} кВтч</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                    <p className="text-[10px] uppercase text-gray-500 mb-1">Стоимость</p>
                    <p className="text-lg font-bold text-[#FA6814]">{cost} тенге</p>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Гармоники (Harmonic Analyzer)
// ═══════════════════════════════════════════════════════════════

const HARM_COLORS = ["#FA6814", "#4CAF50", "#5B9BD5", "#D32F2F", "#FFB020", "#9C27B0", "#00BCD4", "#E91E63", "#FF5722", "#607D8B"];

function HarmonicAnalyzer() {
    const [frequency, setFrequency] = useState(200);
    const [harmonics, setHarmonics] = useState(8);
    const [decay, setDecay] = useState(0.5);
    const [showIndividual, setShowIndividual] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const specCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "#3a3a3a";
        ctx.lineWidth = 0.5;
        for (let y = 0; y <= h; y += h / 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

        const periods = 3;
        const T = periods / frequency;
        const numPoints = w;
        const dt = T / numPoints;

        const calcY = (t: number, maxH: number, d: number) => {
            let sum = 0;
            for (let n = 1; n <= maxH; n++) {
                const amp = 1 / Math.pow(n, d);
                sum += amp * Math.sin(2 * Math.PI * n * frequency * t);
            }
            return sum;
        };

        let maxAmp = 0;
        for (let x = 0; x < numPoints; x++) {
            const t = x * dt;
            const val = Math.abs(calcY(t, harmonics, decay));
            if (val > maxAmp) maxAmp = val;
        }
        if (maxAmp === 0) maxAmp = 1;

        const scaleY = (val: number) => h / 2 - (val / maxAmp) * (h / 2 - 10);

        if (showIndividual) {
            for (let n = 1; n <= harmonics; n++) {
                ctx.strokeStyle = HARM_COLORS[(n - 1) % HARM_COLORS.length] + "40";
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let x = 0; x < numPoints; x++) {
                    const t = x * dt;
                    const amp = 1 / Math.pow(n, decay);
                    const val = amp * Math.sin(2 * Math.PI * n * frequency * t);
                    const y = scaleY(val);
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }

        ctx.strokeStyle = "#FA6814";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < numPoints; x++) {
            const t = x * dt;
            const val = calcY(t, harmonics, decay);
            const y = scaleY(val);
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        const specCanvas = specCanvasRef.current;
        if (!specCanvas) return;
        const sctx = specCanvas.getContext("2d");
        if (!sctx) return;
        const sw = specCanvas.width;
        const sh = specCanvas.height;
        sctx.fillStyle = "#1a1a1a";
        sctx.fillRect(0, 0, sw, sh);

        const barW = Math.max(4, (sw - harmonics * 4) / harmonics);
        const gap = 4;
        const maxBarH = sh - 20;

        for (let n = 1; n <= harmonics; n++) {
            const amp = 1 / Math.pow(n, decay);
            const barH = (amp / 1) * maxBarH;
            const x = (n - 1) * (barW + gap) + gap;
            sctx.fillStyle = HARM_COLORS[(n - 1) % HARM_COLORS.length];
            sctx.fillRect(x, sh - barH - 16, barW, barH);
            sctx.fillStyle = "#808080";
            sctx.font = "9px sans-serif";
            sctx.textAlign = "center";
            sctx.fillText(`${n}`, x + barW / 2, sh - 2);
        }
    }, [frequency, harmonics, decay, showIndividual]);

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Гармонический анализатор</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Визуализация гармонического ряда на основе базовой частоты. Формула: y(t) = Sum(A_n * sin(2pi * n * f * t)), где A_n = 1/n^decay. Показывает составную форму волны и индивидуальные гармоники, а также спектральный анализ амплитуд.</p>
            </div>

            <div className="px-4 space-y-3">
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] uppercase text-gray-500">Базовая частота</label>
                        <span className="text-[10px] text-[#FA6814] font-bold">{frequency} Гц</span>
                    </div>
                    <input type="range" min={50} max={1000} value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full accent-[#FA6814] h-2 cursor-pointer" />
                </div>
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] uppercase text-gray-500">Количество гармоник</label>
                        <span className="text-[10px] text-[#FA6814] font-bold">{harmonics}</span>
                    </div>
                    <input type="range" min={1} max={20} value={harmonics} onChange={(e) => setHarmonics(Number(e.target.value))} className="w-full accent-[#FA6814] h-2 cursor-pointer" />
                </div>
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] uppercase text-gray-500">Затухание амплитуды</label>
                        <span className="text-[10px] text-[#FA6814] font-bold">{decay.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0.1} max={1} step={0.01} value={decay} onChange={(e) => setDecay(Number(e.target.value))} className="w-full accent-[#FA6814] h-2 cursor-pointer" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer" onClick={() => setShowIndividual(!showIndividual)}>
                    <div
                        className="w-5 h-5 border flex items-center justify-center transition-colors shrink-0"
                        style={{
                            borderColor: showIndividual ? "#FA6814" : "#3a3a3a",
                            background: showIndividual ? "#FA6814" : "transparent",
                        }}
                    >
                        {showIndividual && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <span className="text-[11px] text-gray-400">Показать отдельные гармоники</span>
                </label>
            </div>

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3">
                    <p className="text-[10px] uppercase text-gray-500 mb-2">Форма волны</p>
                    <canvas ref={canvasRef} width={600} height={200} className="w-full" style={{ imageRendering: "auto" }} />
                </div>
            </div>

            <div className="px-4 pb-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3">
                    <p className="text-[10px] uppercase text-gray-500 mb-2">Спектр</p>
                    <canvas ref={specCanvasRef} width={600} height={120} className="w-full" style={{ imageRendering: "auto" }} />
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Объём видео (Video Volume Calculator)
// ═══════════════════════════════════════════════════════════════

const VIDEO_QUALITIES = [
    { label: "SD (480p)", bitrate: 1000 },
    { label: "HD (720p)", bitrate: 2500 },
    { label: "Full HD (1080p)", bitrate: 5000 },
    { label: "4K (2160p)", bitrate: 20000 },
    { label: "8K (4320p)", bitrate: 50000 },
];

const VIDEO_CODECS = [
    { label: "H.264", mult: 1.0 },
    { label: "H.265/HEVC", mult: 0.7 },
    { label: "AV1", mult: 0.5 },
    { label: "VP9", mult: 0.6 },
];

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${Math.round(bytes)} Б`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} КБ`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} МБ`;
    return `${(bytes / 1073741824).toFixed(3)} ГБ`;
}

function VideoVolumeCalc() {
    const [qualityIdx, setQualityIdx] = useState(2);
    const [bitrate, setBitrate] = useState(5000);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(30);
    const [seconds, setSeconds] = useState(0);
    const [codecIdx, setCodecIdx] = useState(0);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const codec = VIDEO_CODECS[codecIdx];
    const effectiveBitrate = bitrate * codec.mult;
    const bytes = (effectiveBitrate * 1000 * totalSeconds) / 8;

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h}ч ${m}м ${sec}с`;
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Объём видео</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Калькулятор объёма видеофайла на основе битрейта, длительности и кодека. Выберите качество, настройте битрейт, укажите длительность и кодек — получите расчётный размер файла.</p>
            </div>

            <div className="px-4">
                <label className="text-[10px] uppercase text-gray-500 mb-2 block">Качество</label>
                <div className="flex flex-wrap gap-1.5">
                    {VIDEO_QUALITIES.map((q, i) => (
                        <button key={i} onClick={() => { setQualityIdx(i); setBitrate(q.bitrate); }} className="px-3 py-1.5 text-[11px] font-semibold border transition-colors cursor-pointer" style={{ background: qualityIdx === i ? "#FA681415" : "#1a1a1a", borderColor: qualityIdx === i ? "#FA6814" : "#3a3a3a", color: qualityIdx === i ? "#FA6814" : "#808080" }}>
                            {q.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4">
                <label className="text-[10px] uppercase text-gray-500 mb-1 block">Битрейт (кбит/с)</label>
                <input type="number" min={1} value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))} className={INPUT_CLASS} />
            </div>

            <div className="px-4 grid grid-cols-3 gap-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Часы</label>
                    <input type="number" min={0} max={999} value={hours} onChange={(e) => setHours(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Минуты</label>
                    <input type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Секунды</label>
                    <input type="number" min={0} max={59} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className={INPUT_CLASS} />
                </div>
            </div>

            <div className="px-4">
                <label className="text-[10px] uppercase text-gray-500 mb-2 block">Кодек</label>
                <div className="flex gap-2">
                    {VIDEO_CODECS.map((c, i) => (
                        <button key={i} onClick={() => setCodecIdx(i)} className="flex-1 py-2 text-xs font-semibold border transition-colors cursor-pointer" style={{ background: codecIdx === i ? "#FA681415" : "#1a1a1a", borderColor: codecIdx === i ? "#FA6814" : "#3a3a3a", color: codecIdx === i ? "#FA6814" : "#808080" }}>
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 pb-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-4">
                    <p className="text-[10px] uppercase text-gray-500 mb-3 text-center" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Результат</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center">
                            <p className="text-[9px] text-gray-500 mb-1">Размер файла</p>
                            <p className="text-xl font-bold text-[#FA6814]">{totalSeconds > 0 ? formatBytes(bytes) : "0 Б"}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] text-gray-500 mb-1">Длительность</p>
                            <p className="text-xl font-bold text-[#5B9BD5]">{formatTime(totalSeconds)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-[#282828] border border-[#3a3a3a] p-2">
                            <p className="text-[9px] text-gray-500">Базовый</p>
                            <p className="text-xs text-white font-bold">{bitrate} кбит/с</p>
                        </div>
                        <div className="bg-[#282828] border border-[#3a3a3a] p-2">
                            <p className="text-[9px] text-gray-500">Эффективный</p>
                            <p className="text-xs text-white font-bold">{Math.round(effectiveBitrate)} кбит/с</p>
                        </div>
                        <div className="bg-[#282828] border border-[#3a3a3a] p-2">
                            <p className="text-[9px] text-gray-500">Кодек</p>
                            <p className="text-xs text-white font-bold">{codec.label} ({codec.mult}x)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Конвертер единиц (Unit Converter)
// ═══════════════════════════════════════════════════════════════

const UNIT_CATEGORIES = ["Температура", "Длина", "Вес", "Скорость"] as const;
type UnitCategory = typeof UNIT_CATEGORIES[number];

interface UnitDef {
    label: string;
    toBase: (v: number) => number;
    fromBase: (v: number) => number;
}

const UNIT_DEFS: Record<UnitCategory, UnitDef[]> = {
    "Температура": [
        { label: "°C", toBase: (v) => v, fromBase: (v) => v },
        { label: "°F", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
        { label: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
    "Длина": [
        { label: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { label: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
        { label: "m", toBase: (v) => v, fromBase: (v) => v },
        { label: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        { label: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
        { label: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
        { label: "yd", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
        { label: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
    "Вес": [
        { label: "mg", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        { label: "g", toBase: (v) => v, fromBase: (v) => v },
        { label: "kg", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        { label: "t", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
        { label: "lb", toBase: (v) => v * 453.592, fromBase: (v) => v / 453.592 },
        { label: "oz", toBase: (v) => v * 28.3495, fromBase: (v) => v / 28.3495 },
    ],
    "Скорость": [
        { label: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
        { label: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
        { label: "m/s", toBase: (v) => v, fromBase: (v) => v },
        { label: "knots", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
        { label: "ft/s", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    ],
};

function UnitConverter() {
    const [cat, setCat] = useState<UnitCategory>("Температура");
    const units = UNIT_DEFS[cat];
    const [unitIdx1, setUnitIdx1] = useState(0);
    const [unitIdx2, setUnitIdx2] = useState(1);
    const [val1, setVal1] = useState("100");
    const [val2, setVal2] = useState("");

    const convert = (fromIdx: number, toIdx: number, value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "";
        const base = units[fromIdx].toBase(num);
        const result = units[toIdx].fromBase(base);
        return Math.round(result * 1000000) / 1000000;
    };

    const handleVal1 = (v: string) => {
        setVal1(v);
        setVal2(String(convert(unitIdx1, unitIdx2, v)));
    };

    const handleVal2 = (v: string) => {
        setVal2(v);
        setVal1(String(convert(unitIdx2, unitIdx1, v)));
    };

    const handleCat = (c: UnitCategory) => {
        setCat(c);
        setUnitIdx1(0);
        setUnitIdx2(1);
        setVal1("100");
        setVal2(String(convert(0, 1, "100")));
    };

    useEffect(() => {
        handleVal1(val1);
    }, [cat, unitIdx1, unitIdx2]);

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Конвертер единиц</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Двунаправленный конвертер единиц измерения. Поддерживает температуру, длину, вес и скорость. Введите значение в одно поле — второе рассчитывается автоматически.</p>
            </div>

            <div className="px-4">
                <div className="flex gap-2">
                    {UNIT_CATEGORIES.map((c) => (
                        <button key={c} onClick={() => handleCat(c)} className="flex-1 py-2 text-xs font-semibold border transition-colors cursor-pointer" style={{ background: cat === c ? "#FA681415" : "#1a1a1a", borderColor: cat === c ? "#FA6814" : "#3a3a3a", color: cat === c ? "#FA6814" : "#808080" }}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-4 space-y-3">
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 mb-1 block">Из</label>
                        <div className="flex gap-2">
                            <input type="number" step="any" value={val1} onChange={(e) => handleVal1(e.target.value)} className={INPUT_CLASS} />
                            <select value={unitIdx1} onChange={(e) => setUnitIdx1(Number(e.target.value))} className="bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none cursor-pointer">
                                {units.map((u, i) => <option key={i} value={i}>{u.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="text-center text-[#FA6814] text-lg">⇄</div>
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 mb-1 block">В</label>
                        <div className="flex gap-2">
                            <input type="number" step="any" value={val2} onChange={(e) => handleVal2(e.target.value)} className={INPUT_CLASS} />
                            <select value={unitIdx2} onChange={(e) => setUnitIdx2(Number(e.target.value))} className="bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none cursor-pointer">
                                {units.map((u, i) => <option key={i} value={i}>{u.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Генератор паролей (Password Generator)
// ═══════════════════════════════════════════════════════════════

function PasswordGenerator() {
    const [length, setLength] = useState(16);
    const [uppercase, setUppercase] = useState(true);
    const [lowercase, setLowercase] = useState(true);
    const [numbers, setNumbers] = useState(true);
    const [symbols, setSymbols] = useState(true);
    const [password, setPassword] = useState("");
    const [copied, setCopied] = useState(false);

    const generate = () => {
        let chars = "";
        if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
        if (numbers) chars += "0123456789";
        if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
        if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

        const arr = new Uint32Array(length);
        crypto.getRandomValues(arr);
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars[arr[i] % chars.length];
        }
        setPassword(result);
        setCopied(false);
    };

    const copy = async () => {
        if (!password) return;
        await navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const types = [uppercase, lowercase, numbers, symbols].filter(Boolean).length;
    let strength = "Слабый";
    let strengthColor = "#D32F2F";
    if (length >= 16 && types >= 4) { strength = "Очень сильный"; strengthColor = "#4CAF50"; }
    else if (length >= 12 && types >= 3) { strength = "Сильный"; strengthColor = "#5B9BD5"; }
    else if (length >= 8 && types >= 2) { strength = "Средний"; strengthColor = "#FFB020"; }

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Генератор паролей</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Генератор криптографически стойких паролей с настройкой длины и состава символов. Использует crypto.getRandomValues() для генерации. Оценка надёжности на основе длины и разнообразия символов.</p>
            </div>

            <div className="px-4 space-y-3">
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] uppercase text-gray-500">Длина</label>
                        <span className="text-[10px] text-[#FA6814] font-bold">{length}</span>
                    </div>
                    <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full accent-[#FA6814] h-2 cursor-pointer" />
                    <div className="flex justify-between text-[9px] text-gray-600 mt-1"><span>8</span><span>32</span><span>64</span></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {([
                        ["Заглавные (A-Z)", uppercase, setUppercase],
                        ["Строчные (a-z)", lowercase, setLowercase],
                        ["Цифры (0-9)", numbers, setNumbers],
                        ["Символы (!@#)", symbols, setSymbols],
                    ] as const).map(([label, val, setter]) => (
                        <label key={label} className="flex items-center gap-2 bg-[#1a1a1a] border border-[#3a3a3a] px-3 py-2 cursor-pointer hover:border-[#FA6814] transition-colors" onClick={() => setter(!val)}>
                            <div
                                className="w-5 h-5 border flex items-center justify-center transition-colors shrink-0"
                                style={{
                                    borderColor: val ? "#FA6814" : "#3a3a3a",
                                    background: val ? "#FA6814" : "transparent",
                                }}
                            >
                                {val && (
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-[11px] text-gray-300">{label}</span>
                        </label>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button onClick={generate} className="flex-1 bg-[#FA6814] text-white py-2.5 text-sm font-bold hover:bg-[#ff7a2a] transition-colors cursor-pointer">Сгенерировать</button>
                    <button onClick={copy} disabled={!password} className="bg-[#282828] border border-[#3a3a3a] text-gray-400 px-4 py-2.5 text-xs hover:text-white hover:border-[#FA6814] disabled:opacity-30 transition-colors cursor-pointer">{copied ? "Скопировано!" : "Копировать"}</button>
                </div>
            </div>

            {password && (
                <div className="px-4 pb-4">
                    <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-4">
                        <p className="text-[10px] uppercase text-gray-500 mb-2">Пароль</p>
                        <p className="text-sm font-mono text-white break-all leading-relaxed mb-3" style={{ wordBreak: "break-all" }}>{password}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase text-gray-500">Надёжность</span>
                            <span className="text-xs font-bold" style={{ color: strengthColor }}>{strength}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-[#282828] overflow-hidden">
                            <div className="h-full transition-all" style={{ width: strength === "Очень сильный" ? "100%" : strength === "Сильный" ? "75%" : strength === "Средний" ? "50%" : "25%", background: strengthColor }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Хеши и кодирование (Hash & Encode Tool)
// ═══════════════════════════════════════════════════════════════

async function hashText(text: string, algo: string): Promise<string> {
    const data = new TextEncoder().encode(text);
    const buffer = await crypto.subtle.digest(algo, data);
    return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function HashTool() {
    const [input, setInput] = useState("");
    const [results, setResults] = useState<Record<string, string>>({});
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const computeHash = async (algo: string) => {
        if (!input) return;
        const hash = await hashText(input, algo);
        setResults((prev) => ({ ...prev, [algo]: hash }));
    };

    const computeAll = async () => {
        const algos = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
        const newResults: Record<string, string> = {};
        for (const algo of algos) {
            newResults[algo] = await hashText(input, algo);
        }
        setResults(newResults);
    };

    const b64Encode = () => {
        if (!input) return;
        try {
            const encoded = btoa(unescape(encodeURIComponent(input)));
            setResults((prev) => ({ ...prev, "Base64 Encode": encoded }));
        } catch { setResults((prev) => ({ ...prev, "Base64 Encode": "Ошибка кодирования" })); }
    };

    const b64Decode = () => {
        if (!input) return;
        try {
            const decoded = decodeURIComponent(escape(atob(input)));
            setResults((prev) => ({ ...prev, "Base64 Decode": decoded }));
        } catch { setResults((prev) => ({ ...prev, "Base64 Decode": "Ошибка декодирования" })); }
    };

    const urlEncode = () => {
        if (!input) return;
        setResults((prev) => ({ ...prev, "URL Encode": encodeURIComponent(input) }));
    };

    const urlDecode = () => {
        if (!input) return;
        try {
            setResults((prev) => ({ ...prev, "URL Decode": decodeURIComponent(input) }));
        } catch { setResults((prev) => ({ ...prev, "URL Decode": "Ошибка декодирования" })); }
    };

    const copyResult = async (key: string) => {
        const val = results[key];
        if (!val) return;
        await navigator.clipboard.writeText(val);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Хеши и кодирование</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Вычисление хеш-сумм (SHA-1, SHA-256, SHA-384, SHA-512) через Web Crypto API, кодирование/декодирование Base64 и URL.</p>
            </div>

            <div className="px-4 space-y-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Входные данные</label>
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3} placeholder="Введите текст..." className={INPUT_CLASS + " resize-none"} />
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {["SHA-1", "SHA-256", "SHA-384", "SHA-512"].map((algo) => (
                        <button key={algo} onClick={() => computeHash(algo)} className="bg-[#FA6814] text-white px-3 py-1.5 text-[11px] font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer">{algo}</button>
                    ))}
                    <button onClick={computeAll} className="bg-[#282828] border border-[#3a3a3a] text-gray-400 px-3 py-1.5 text-[11px] hover:text-white hover:border-[#FA6814] transition-colors cursor-pointer">Все</button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    <button onClick={b64Encode} className="bg-[#282828] border border-[#3a3a3a] text-gray-400 px-3 py-1.5 text-[11px] hover:text-white hover:border-[#FA6814] transition-colors cursor-pointer">Base64 Encode</button>
                    <button onClick={b64Decode} className="bg-[#282828] border border-[#3a3a3a] text-gray-400 px-3 py-1.5 text-[11px] hover:text-white hover:border-[#FA6814] transition-colors cursor-pointer">Base64 Decode</button>
                    <button onClick={urlEncode} className="bg-[#282828] border border-[#3a3a3a] text-gray-400 px-3 py-1.5 text-[11px] hover:text-white hover:border-[#FA6814] transition-colors cursor-pointer">URL Encode</button>
                    <button onClick={urlDecode} className="bg-[#282828] border border-[#3a3a3a] text-gray-400 px-3 py-1.5 text-[11px] hover:text-white hover:border-[#FA6814] transition-colors cursor-pointer">URL Decode</button>
                </div>
            </div>

            {Object.keys(results).length > 0 && (
                <div className="px-4 pb-4 space-y-2">
                    {Object.entries(results).map(([key, val]) => (
                        <div key={key} className="bg-[#1a1a1a] border border-[#3a3a3a] p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase text-gray-500">{key}</span>
                                <button onClick={() => copyResult(key)} className="text-[10px] text-gray-600 hover:text-[#FA6814] transition-colors cursor-pointer">{copiedKey === key ? "Скопировано!" : "Копировать"}</button>
                            </div>
                            <p className="text-[11px] font-mono text-white break-all">{val}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Подсеть (Subnet Calculator)
// ═══════════════════════════════════════════════════════════════

function ipToNum(ip: string): number {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return 0;
    return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

function numToIp(n: number): string {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function cidrToMask(cidr: number): number {
    return cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
}

function ipClass(firstOctet: number): string {
    if (firstOctet >= 1 && firstOctet <= 126) return "A";
    if (firstOctet >= 128 && firstOctet <= 191) return "B";
    if (firstOctet >= 192 && firstOctet <= 223) return "C";
    if (firstOctet >= 224 && firstOctet <= 239) return "D (Multicast)";
    if (firstOctet >= 240) return "E (Reserved)";
    return "N/A";
}

function SubnetCalculator() {
    const [ip, setIp] = useState("192.168.1.100");
    const [cidr, setCidr] = useState(24);

    const ipNum = ipToNum(ip);
    const mask = cidrToMask(cidr);
    const network = (ipNum & mask) >>> 0;
    const broadcast = (network | ~mask) >>> 0;
    const wildcard = (~mask) >>> 0;
    const hostBits = 32 - cidr;
    const totalHosts = Math.pow(2, hostBits);
    const usableHosts = cidr >= 31 ? (cidr === 32 ? 1 : 2) : totalHosts - 2;
    const firstHost = cidr >= 31 ? (cidr === 32 ? network : network + 1) : network + 1;
    const lastHost = cidr >= 31 ? (cidr === 32 ? network : broadcast - 1) : broadcast - 1;

    const firstOctet = (ipNum >>> 24) & 255;

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Калькулятор подсетей</h2>
                <p className="text-[11px] text-gray-500 leading-relaxed">Расчёт параметров IP-подсети по адресу и CIDR-префиксу. Определяет адрес сети, broadcast, маску, диапазон хостов и класс адреса.</p>
            </div>

            <div className="px-4 space-y-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">IP-адрес</label>
                    <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.100" className={INPUT_CLASS} />
                </div>
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-[10px] uppercase text-gray-500">CIDR префикс</label>
                        <span className="text-[10px] text-[#FA6814] font-bold">/{cidr}</span>
                    </div>
                    <input type="range" min={0} max={32} value={cidr} onChange={(e) => setCidr(Number(e.target.value))} className="w-full accent-[#FA6814] h-2 cursor-pointer" />
                    <div className="flex justify-between text-[9px] text-gray-600 mt-1"><span>/0</span><span>/8</span><span>/16</span><span>/24</span><span>/32</span></div>
                </div>
            </div>

            <div className="px-4 pb-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-4 space-y-2">
                    {([
                        ["Адрес сети", numToIp(network)],
                        ["Broadcast", numToIp(broadcast)],
                        ["Маска подсети", numToIp(mask)],
                        ["Wildcard маска", numToIp(wildcard)],
                        ["Первый хост", numToIp(firstHost)],
                        ["Последний хост", numToIp(lastHost)],
                        ["Всего хостов", String(totalHosts)],
                        ["Используемых", String(usableHosts)],
                        ["Класс", ipClass(firstOctet)],
                    ] as const).map(([label, val]) => (
                        <div key={label} className="flex items-center justify-between py-1 border-b border-[#3a3a3a] last:border-b-0">
                            <span className="text-[11px] text-gray-400">{label}</span>
                            <span className="text-[11px] text-white font-mono font-bold">{val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════

export default function ResearchPage() {
    const [tab, setTab] = useState<Tab | null>(null);
    const [activeCategory, setActiveCategory] = useState("Все");

    const filteredTabs = activeCategory === "Все"
        ? TABS
        : TABS.filter((t) => TAB_META[t].category === activeCategory);

    const renderTab = () => {
        switch (tab) {
            case "ИМТ": return <BMICalculator />;
            case "Колесо Фартуны": return <FortuneWheel />;
            case "Рандомайзер": return <Randomizer />;
            case "Кости": return <Dice3D />;
            case "Метроном": return <Metronome />;
            case "Тюнер": return <Tuner />;
            case "Генератор частот": return <ToneGenerator />;
            case "WebRTC": return <WebRTCTestPage />;
            case "Электрика": return <ElectricalCalc />;
            case "Гармоники": return <HarmonicAnalyzer />;
            case "Видео": return <VideoVolumeCalc />;
            case "Конвертер": return <UnitConverter />;
            case "Пароли": return <PasswordGenerator />;
            case "Хеши": return <HashTool />;
            case "Подсеть": return <SubnetCalculator />;
            default: return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-[#FA6814] text-sm" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Исследования</h1>
                <p className="text-xs text-gray-500 mt-2">Калькуляторы, генераторы, игровые и музыкальные инструменты — всё в одном месте</p>
            </div>

            {tab ? (
                <div>
                    <button onClick={() => setTab(null)} className="flex items-center gap-2 text-gray-400 hover:text-[#FA6814] text-xs mb-4 transition-colors cursor-pointer bg-transparent border-none">
                        <span className="text-base">&larr;</span> Все инструменты
                    </button>
                    <div className="bg-[#282828] border border-[#3a3a3a] overflow-hidden">
                        {renderTab()}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {CATEGORIES.map((c) => (
                            <button key={c} onClick={() => setActiveCategory(c)} className="px-3 py-1.5 text-[11px] font-semibold border transition-colors cursor-pointer" style={{ background: activeCategory === c ? "#FA681415" : "#1a1a1a", borderColor: activeCategory === c ? "#FA6814" : "#3a3a3a", color: activeCategory === c ? "#FA6814" : "#808080" }}>
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filteredTabs.map((t) => {
                            const m = TAB_META[t];
                            return (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className="bg-[#282828] border border-[#3a3a3a] p-5 text-left hover:border-[#FA6814] transition-all cursor-pointer group"
                                >
                                    <div className="w-10 h-10 flex items-center justify-center text-[11px] font-bold mb-3" style={{ background: m.color + "20", color: m.color }}>{m.icon}</div>
                                    <h3 className="text-sm font-bold text-white group-hover:text-[#FA6814] transition-colors mb-1">{t}</h3>
                                    <p className="text-[11px] text-gray-500">{m.subtitle}</p>
                                    <div className="w-full h-0.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: m.color }} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
