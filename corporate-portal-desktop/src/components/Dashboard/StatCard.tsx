interface Props {
    title: string;
    value: number;
}

export default function StatCard({ title, value }: Props) {
    return (
        <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-6">
            <div className="text-gray-400 uppercase text-xs">
                {title}
            </div>
            <div className="text-4xl text-[#FA6814] mt-4">
                {value}
            </div>
        </div>
    );
}
