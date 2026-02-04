import { Info } from 'lucide-react';

export const TheorySection = ({ title, children }: { title: string, children: React.ReactNode }) => {
    return (
        <div className="w-full max-w-6xl mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white border-l-4 border-blue-600 rounded-r-xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Info size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600">
                    {children}
                </div>
            </div>
        </div>
    );
};
