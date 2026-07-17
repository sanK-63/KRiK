interface Props {
    title: string;
    value: string | number;
}

export default function Card({ title, value }: Props) {
    return (
        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-6">
            <div className="text-xs uppercase text-gray-400">
                {title}
            </div>
            <div className="text-4xl text-[#FA6814] mt-4">
                {value}
            </div>
        </div>
    );
}
