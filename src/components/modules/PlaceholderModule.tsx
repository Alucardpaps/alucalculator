import { Construction } from 'lucide-react';

export function PlaceholderModule({ lang, dict, title }: { lang?: string, dict?: any, title?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-slate-400 p-8 text-center select-none">
            <Construction size={48} className="mb-4 text-amber-500 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-2">
                {title || "Under Construction"}
            </h3>
            <p className="text-sm max-w-[250px] text-slate-500">
                This engineering tool is currently being ported to the new OS architecture.
                <br /><br />
                Check back in the next release!
            </p>
        </div>
    );
}
