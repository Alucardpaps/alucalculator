"use strict";
import { useEffect, useState } from 'react';
import { History, Trash2, ChevronRight } from 'lucide-react';

export interface HistoryItem {
    id: string;
    description: string;
    weight: string;
    timestamp: number;
}

export const HistorySidebar = ({ onSelect }: { onSelect?: (item: HistoryItem) => void }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const loadHistory = () => {
        try {
            const stored = localStorage.getItem('calc_history');
            if (stored) {
                setHistory(JSON.parse(stored).slice(0, 20)); // Limit to 20
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    useEffect(() => {
        loadHistory();

        // Listen for updates from other components
        const handleStorageChange = () => loadHistory();
        window.addEventListener('storage-local-update', handleStorageChange);

        return () => {
            window.removeEventListener('storage-local-update', handleStorageChange);
        };
    }, []);

    const clearHistory = () => {
        localStorage.removeItem('calc_history');
        setHistory([]);
        // Dispatch event to sync
        window.dispatchEvent(new Event('storage-local-update'));
    };

    return (
        <>
            {/* Trigger Button (Fixed position) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed left-0 top-1/3 z-40 bg-white border border-slate-200 shadow-lg p-2 rounded-r-xl transition-transform duration-300 flex flex-col items-center gap-1 ${isOpen ? '-translate-x-full' : 'translate-x-0'}`}
                title="Recent History"
            >
                <History size={20} className="text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase writing-vertical-lr rotate-180">History</span>
            </button>

            {/* Sidebar Panel */}
            <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl border-r border-slate-100 transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-blue-600" />
                        <h3 className="font-bold text-slate-800">Recent Calculations</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                        <ChevronRight size={20} className="text-slate-500 rotate-180" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center text-slate-400 py-10 text-sm">
                            No history yet.<br />Start calculating!
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="group relative bg-white border border-slate-100 rounded-lg p-3 hover:border-blue-300 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="text-xs font-bold text-slate-700 mb-1">{item.description}</div>
                                    <div className="text-xs text-slate-400 font-mono">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div className="text-lg font-mono font-bold text-blue-600">{item.weight}</div>
                            </div>
                        ))
                    )}
                </div>

                {history.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <button
                            onClick={clearHistory}
                            className="w-full py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold uppercase transition-colors"
                        >
                            <Trash2 size={14} />
                            Clear History
                        </button>
                    </div>
                )}
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            )}
        </>
    );
};
