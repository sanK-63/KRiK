export default function AboutSection() {
    return (
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 space-y-2">
                <h1 className="text-base text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                    Контора Рога и Копыта
                </h1>
                <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
                    Контора — это территория безупречного порядка и математической точности. Мы не просто управляем проектами; мы возводим цифровые и управленческие инфраструктуры, которые работают как швейцарские часы. В нашей системе нет места хаосу, лени или полумерам. Каждый элемент нашей структуры — от регламента до человека — является частью единого механизма, нацеленного на достижение результата, недоступного для тех, кто привык работать «на авось». Мы строим стандарты, по которым будет жить остальной мир.
                </p>
            </div>
            <img
                src="/герб.png"
                alt="Герб Конторы"
                className="max-w-[460px] w-full h-auto object-contain select-none"
            />
        </section>
    );
}
