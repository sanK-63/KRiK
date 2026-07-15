import { useState } from "react";

type Gender = "male" | "female";

interface BMICategory {
    label: string;
    min: number;
    max: number;
    color: string;
    description: string;
}

const categories: BMICategory[] = [
    { label: "Дефицит массы", min: 0, max: 18.5, color: "#5B9BD5", description: "Вес ниже нормы. Рекомендуется консультация врача для корректировки питания и набора массы." },
    { label: "Норма", min: 18.5, max: 25, color: "#4CAF50", description: "Вес в пределах нормы. Поддерживайте здоровый образ жизни и регулярную физическую активность." },
    { label: "Избыточный", min: 25, max: 30, color: "#FFB020", description: "Небольшой избыток веса. Рекомендуется увеличить физическую активность и пересмотреть рацион." },
    { label: "Ожирение", min: 30, max: 100, color: "#D32F2F", description: "Значительный избыток веса. Рекомендуется обратиться к специалисту для разработки плана по снижению веса." },
];

const genderInfo: Record<Gender, { label: string; icon: string; idealBMI: string; description: string }> = {
    male: {
        label: "Мужской",
        icon: "♂",
        idealBMI: "22–25",
        description: "Идеальный ИМТ для мужчин составляет 22–25. Учитывается мышечная масса, которая обычно выше, чем у женщин.",
    },
    female: {
        label: "Женский",
        icon: "♀",
        idealBMI: "19–23",
        description: "Идеальный ИМТ для женщин составляет 19–23. Учитывается естественный процент жировой ткани.",
    },
};

function getCategory(bmi: number): BMICategory {
    return categories.find((c) => bmi >= c.min && bmi < c.max) || categories[categories.length - 1];
}

function getPointerPosition(bmi: number): number {
    if (bmi <= 0) return 0;
    if (bmi < 15) return 0;
    if (bmi > 40) return 100;
    return ((bmi - 15) / 25) * 100;
}

export default function ResearchPage() {
    const [gender, setGender] = useState<Gender>("male");
    const [height, setHeight] = useState(175);
    const [weight, setWeight] = useState(70);
    const [age, setAge] = useState(25);

    const bmi = height > 0 ? Math.round(weight / Math.pow(height / 100, 2) * 10) / 10 : 0;
    const cat = getCategory(bmi);
    const info = genderInfo[gender];

    const idealWeightMin = Math.round(Math.pow(height / 100, 2) * (gender === "male" ? 20 : 18.5) * 10) / 10;
    const idealWeightMax = Math.round(Math.pow(height / 100, 2) * (gender === "male" ? 25 : 23) * 10) / 10;
    const weightDiff = Math.round((weight - ((idealWeightMin + idealWeightMax) / 2)) * 10) / 10;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-[#FA6814] text-sm" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                    Исследования
                </h1>
                <p className="text-xs text-gray-500">Научные инструменты для анализа здоровья и физических показателей</p>
            </div>

            {/* BMI Calculator */}
            <div className="bg-[#282828] border border-[#3a3a3a] overflow-hidden">
                {/* Title */}
                <div className="p-5 border-b border-[#3a3a3a]">
                    <h2 className="text-white font-bold text-sm mb-1">Индекс Массы Тела (ИМТ)</h2>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        ИМТ — это простой показатель, основанный на соотношении роста и веса. Он широко используется для классификации избыточного веса и ожирения у взрослых.
                    </p>
                </div>

                {/* Gender toggle */}
                <div className="px-5 pt-4">
                    <label className="text-[10px] uppercase text-gray-500 mb-2 block">Пол</label>
                    <div className="flex gap-2">
                        {(Object.keys(genderInfo) as Gender[]).map((g) => (
                            <button
                                key={g}
                                onClick={() => setGender(g)}
                                className="flex-1 py-3 text-xs font-semibold transition-all cursor-pointer border"
                                style={{
                                    background: gender === g ? "#FA681415" : "#1a1a1a",
                                    borderColor: gender === g ? "#FA6814" : "#3a3a3a",
                                    color: gender === g ? "#FA6814" : "#808080",
                                }}
                            >
                                <span className="text-base">{genderInfo[g].icon}</span>{" "}
                                {genderInfo[g].label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">{info.description}</p>
                </div>

                {/* Inputs */}
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 mb-1.5 block">Рост (см)</label>
                            <input
                                type="number"
                                min={100}
                                max={250}
                                value={height}
                                onChange={(e) => setHeight(Number(e.target.value))}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2.5 text-sm focus:border-[#FA6814] outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 mb-1.5 block">Вес (кг)</label>
                            <input
                                type="number"
                                min={30}
                                max={250}
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2.5 text-sm focus:border-[#FA6814] outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 mb-1.5 block">Возраст</label>
                            <input
                                type="number"
                                min={10}
                                max={120}
                                value={age}
                                onChange={(e) => setAge(Number(e.target.value))}
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-white px-3 py-2.5 text-sm focus:border-[#FA6814] outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Result */}
                <div className="px-5 pb-5">
                    <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-5 text-center">
                        <p className="text-[10px] uppercase text-gray-500 mb-2" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                            Ваш ИМТ
                        </p>
                        <p className="text-5xl font-bold mb-1" style={{ color: cat.color }}>{bmi}</p>
                        <p className="text-sm font-semibold mb-3" style={{ color: cat.color }}>{cat.label}</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed max-w-md mx-auto">{cat.description}</p>

                        {/* BMI Scale bar */}
                        <div className="mt-5 relative">
                            <div className="h-3 flex overflow-hidden" style={{ borderRadius: 0 }}>
                                <div className="h-full" style={{ width: "35%", background: "#5B9BD5" }} />
                                <div className="h-full" style={{ width: "25%", background: "#4CAF50" }} />
                                <div className="h-full" style={{ width: "20%", background: "#FFB020" }} />
                                <div className="h-full" style={{ width: "20%", background: "#D32F2F" }} />
                            </div>
                            {/* Pointer */}
                            <div
                                className="absolute top-0 w-0.5 h-5 bg-white -mt-1 transition-all duration-300"
                                style={{ left: `${getPointerPosition(bmi)}%` }}
                            />
                            <div className="flex justify-between text-[9px] text-gray-500 mt-1.5">
                                <span>15</span>
                                <span>18.5</span>
                                <span>25</span>
                                <span>30</span>
                                <span>40</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="px-5 pb-5">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                            <p className="text-[9px] uppercase text-gray-500 mb-1">Идеальный диапазон</p>
                            <p className="text-xs text-white font-semibold">{info.idealBMI}</p>
                        </div>
                        <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                            <p className="text-[9px] uppercase text-gray-500 mb-1">Норма веса</p>
                            <p className="text-xs text-white font-semibold">{idealWeightMin}–{idealWeightMax} кг</p>
                        </div>
                        <div className="bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-center">
                            <p className="text-[9px] uppercase text-gray-500 mb-1">Отклонение</p>
                            <p className="text-xs font-semibold" style={{ color: Math.abs(weightDiff) < 1 ? "#4CAF50" : weightDiff > 0 ? "#FFB020" : "#5B9BD5" }}>
                                {weightDiff > 0 ? "+" : ""}{weightDiff} кг
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#282828] border border-[#3a3a3a] p-4">
                    <h3 className="text-xs text-white font-semibold mb-2">Как рассчитывается ИМТ?</h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                        Формула: ИМТ = вес (кг) / рост² (м²). Для роста 175 см и веса 70 кг: 70 / (1.75)² = 22.9
                    </p>
                </div>
                <div className="bg-[#282828] border border-[#3a3a3a] p-4">
                    <h3 className="text-xs text-white font-semibold mb-2">Ограничения ИМТ</h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                        ИМТ не учитывает мышечную массу, плотность костей и распределение жира. Спортсмены могут иметь высокий ИМТ при низком проценте жира.
                    </p>
                </div>
            </div>
        </div>
    );
}
