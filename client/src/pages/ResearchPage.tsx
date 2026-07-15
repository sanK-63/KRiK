import { useState, useEffect, useRef, useCallback } from "react";

const TABS = ["ИМТ", "Колесо Фартуны", "Рандомайзер", "Кости", "Метроном", "Тюнер"] as const;
type Tab = typeof TABS[number];

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
                <p className="text-[11px] text-gray-500 leading-relaxed">Простой показатель соотношения роста и веса для классификации веса.</p>
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
                    <input type="number" min={100} max={250} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Вес (кг)</label>
                    <input type="number" min={30} max={250} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Возраст</label>
                    <input type="number" min={10} max={120} value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
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
                <p className="text-[11px] text-gray-500">Добавьте сегменты и крутите колесо!</p>
            </div>

            <div className="px-4 flex gap-2">
                <input type="text" value={newSegment} onChange={(e) => setNewSegment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSegment()} placeholder="Новый сегмент..." className="flex-1 bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
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

            <div className="px-4 flex justify-center">
                <div className="relative" style={{ width: 320, height: 320 }}>
                    <svg width={320} height={320} style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none" }}>
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
                    {/* Arrow */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0" style={{ borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "20px solid #FA6814" }} />
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
                <p className="text-[11px] text-gray-500">Генерируйте случайные числа в заданном диапазоне.</p>
            </div>

            <div className="px-4 grid grid-cols-3 gap-3">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">От</label>
                    <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">До</label>
                    <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
                </div>
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Количество</label>
                    <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2 text-sm focus:border-[#FA6814] outline-none" />
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

            {/* Quick presets */}
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
// Игральные Кости (Dice)
// ═══════════════════════════════════════════════════════════════

const DICE_FACES = [4, 6, 8, 10, 12, 20, 100];
const DICE_COLORS: Record<number, string> = { 4: "#5B9BD5", 6: "#4CAF50", 8: "#FA6814", 10: "#D32F2F", 12: "#9C27B0", 20: "#FFB020", 100: "#00BCD4" };

function DiceSVG({ faces, value, rolling }: { faces: number; value: number | null; rolling: boolean }) {
    const color = DICE_COLORS[faces] || "#FA6814";
    if (faces === 6) {
        const dotPositions: Record<number, [number, number][]> = {
            1: [[50, 50]],
            2: [[30, 30], [70, 70]],
            3: [[30, 30], [50, 50], [70, 70]],
            4: [[30, 30], [70, 30], [30, 70], [70, 70]],
            5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
            6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
        };
        const dots = value ? dotPositions[Math.min(value, 6)] || [] : [];
        return (
            <svg width={100} height={100} viewBox="0 0 100 100" style={{ animation: rolling ? "diceRoll 0.15s infinite" : "none" }}>
                <rect x={4} y={4} width={92} height={92} rx={12} fill={color} stroke="#1e1e1e" strokeWidth={3} />
                {dots.map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r={7} fill="white" />)}
            </svg>
        );
    }

    return (
        <svg width={100} height={100} viewBox="0 0 100 100" style={{ animation: rolling ? "diceRoll 0.15s infinite" : "none" }}>
            {faces <= 4 ? (
                <polygon points="50,8 92,90 8,90" fill={color} stroke="#1e1e1e" strokeWidth={3} />
            ) : faces <= 8 ? (
                <polygon points="50,5 95,35 80,90 20,90 5,35" fill={color} stroke="#1e1e1e" strokeWidth={3} />
            ) : faces <= 12 ? (
                <polygon points="50,3 97,38 82,95 18,95 3,38" fill={color} stroke="#1e1e1e" strokeWidth={3} />
            ) : (
                <polygon points="50,3 93,20 98,68 72,97 28,97 2,68 7,20" fill={color} stroke="#1e1e1e" strokeWidth={3} />
            )}
            {value !== null && (
                <text x={50} y={58} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={faces >= 100 ? 22 : 28} fontWeight={900} style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.4)" }}>
                    {value}
                </text>
            )}
        </svg>
    );
}

function Dice() {
    const [selectedFaces, setSelectedFaces] = useState(6);
    const [diceCount, setDiceCount] = useState(1);
    const [values, setValues] = useState<(number | null)[]>([null]);
    const [rolling, setRolling] = useState(false);
    const [history, setHistory] = useState<{ faces: number; values: number[]; sum: number }[]>([]);

    const roll = () => {
        setRolling(true);
        const count = diceCount;
        const newValues: number[] = [];
        setTimeout(() => {
            for (let i = 0; i < count; i++) newValues.push(Math.floor(Math.random() * selectedFaces) + 1);
            setValues(newValues);
            setRolling(false);
            setHistory((prev) => [{ faces: selectedFaces, values: newValues, sum: newValues.reduce((a, b) => a + b, 0) }, ...prev].slice(0, 20));
        }, 400);
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border-b border-[#3a3a3a]">
                <h2 className="text-white font-bold text-sm mb-1">Игральные Кости</h2>
                <p className="text-[11px] text-gray-500">Выберите тип кости и количество и бросьте!</p>
            </div>

            <div className="px-4">
                <label className="text-[10px] uppercase text-gray-500 mb-2 block">Тип кости (количество граней)</label>
                <div className="flex flex-wrap gap-2">
                    {DICE_FACES.map((f) => (
                        <button key={f} onClick={() => setSelectedFaces(f)} className="px-4 py-2.5 text-sm font-bold transition-all cursor-pointer border" style={{ background: selectedFaces === f ? DICE_COLORS[f] + "25" : "#1a1a1a", borderColor: selectedFaces === f ? DICE_COLORS[f] : "#3a3a3a", color: selectedFaces === f ? DICE_COLORS[f] : "#808080" }}>
                            d{f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 flex items-end gap-4">
                <div>
                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Количество</label>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDiceCount(Math.max(1, diceCount - 1))} className="bg-[#1a1a1a] border border-[#3a3a3a] text-white w-8 h-8 flex items-center justify-center text-sm hover:border-[#FA6814] transition-colors cursor-pointer">−</button>
                        <span className="text-white text-lg font-bold w-8 text-center">{diceCount}</span>
                        <button onClick={() => setDiceCount(Math.min(10, diceCount + 1))} className="bg-[#1a1a1a] border border-[#3a3a3a] text-white w-8 h-8 flex items-center justify-center text-sm hover:border-[#FA6814] transition-colors cursor-pointer">+</button>
                    </div>
                </div>
                <button onClick={roll} disabled={rolling} className="bg-[#FA6814] text-white px-8 py-2.5 text-sm font-bold uppercase hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer">
                    {rolling ? "Бросок..." : "Бросить!"}
                </button>
            </div>

            {/* Dice display */}
            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-5">
                    <div className="flex flex-wrap justify-center gap-4 mb-3">
                        {values.map((v, i) => <DiceSVG key={i} faces={selectedFaces} value={v} rolling={rolling} />)}
                    </div>
                    {values.some((v) => v !== null) && (
                        <div className="text-center">
                            {diceCount > 1 && (
                                <p className="text-[10px] uppercase text-gray-500">
                                    Сумма: <span className="text-[#FA6814] font-bold text-sm">{values.reduce((a, b) => (a || 0) + (b || 0), 0)}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* History */}
            {history.length > 0 && (
                <div className="px-4 pb-4">
                    <p className="text-[10px] uppercase text-gray-500 mb-2">История бросков</p>
                    <div className="space-y-1">
                        {history.map((h, i) => (
                            <div key={i} className="flex items-center justify-between bg-[#1a1a1a] border border-[#3a3a3a] px-3 py-1.5 text-[11px]">
                                <span className="text-gray-400">d{h.faces} × {h.values.length}</span>
                                <span className="text-white font-semibold">{h.values.join(" + ")}</span>
                                <span className="text-[#FA6814] font-bold">= {h.sum}</span>
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
    const [swing, setSwing] = useState(0);
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
                <p className="text-[11px] text-gray-500">Ритм-мейкер для музыкантов.</p>
            </div>

            {/* BPM display */}
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

            {/* BPM slider */}
            <div className="px-4">
                <input type="range" min={20} max={300} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-[#FA6814] h-2 cursor-pointer" />
                <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                    <span>20</span><span>100</span><span>200</span><span>300</span>
                </div>
            </div>

            {/* Beat indicator */}
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

            {/* Time signature */}
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

            {/* Play button */}
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
                <p className="text-[11px] text-gray-500">Настройте инструмент по микрофону.</p>
            </div>

            {error && (
                <div className="px-4">
                    <div className="bg-[#D32F2F15] border border-[#D32F2F40] p-3 text-[11px] text-[#D32F2F]">{error}</div>
                </div>
            )}

            {/* Note display */}
            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-8 text-center">
                    {currentNote ? (
                        <>
                            <div className="flex items-center justify-center gap-1 mb-2">
                                <span className="text-6xl font-bold text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>{currentNote}</span>
                                <span className="text-2xl text-gray-500 font-semibold">{octave}</span>
                            </div>
                            {frequency && <p className="text-sm text-gray-400 mb-3">{frequency} Гц</p>}

                            {/* Cents indicator */}
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
                            <div className="text-4xl mb-3">🎵</div>
                            <p className="text-gray-500 text-sm">{listening ? "Играйте в инструмент..." : "Нажмите для начала настройки"}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reference note */}
            <div className="px-4">
                <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 flex items-center justify-between">
                    <span className="text-[10px] uppercase text-gray-500">Эталонная частота A4</span>
                    <span className="text-sm font-bold text-[#FA6814]">440 Гц</span>
                </div>
            </div>

            {/* Start/Stop */}
            <div className="px-4 flex justify-center pb-4">
                <button onClick={listening ? stopListening : startListening} className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold transition-all cursor-pointer border-2" style={{ background: listening ? "#D32F2F" : "#FA6814", borderColor: listening ? "#D32F2F" : "#FA6814", color: "white", boxShadow: listening ? "0 0 20px #D32F2F40" : "0 0 20px #FA681440" }}>
                    {listening ? "⏹" : "🎤"}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════

export default function ResearchPage() {
    const [tab, setTab] = useState<Tab>("ИМТ");

    const renderTab = () => {
        switch (tab) {
            case "ИМТ": return <BMICalculator />;
            case "Колесо Фартуны": return <FortuneWheel />;
            case "Рандомайзер": return <Randomizer />;
            case "Кости": return <Dice />;
            case "Метроном": return <Metronome />;
            case "Тюнер": return <Tuner />;
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-[#FA6814] text-sm" style={{ fontFamily: '"Press Start 2P", system-ui' }}>Исследования</h1>
                <p className="text-xs text-gray-500 mt-2">Инструменты, калькуляторы и генераторы</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mb-6 bg-[#1e1e1e] border border-[#3a3a3a] p-1 overflow-x-auto">
                {TABS.map((t) => (
                    <button key={t} onClick={() => setTab(t)} className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer" style={{ background: tab === t ? "#FA6814" : "transparent", color: tab === t ? "white" : "#808080" }}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Active tab content */}
            <div className="bg-[#282828] border border-[#3a3a3a] overflow-hidden">
                {renderTab()}
            </div>
        </div>
    );
}
