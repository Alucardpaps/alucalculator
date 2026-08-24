"use client";

import { LogOut, User, Settings, ChevronDown } from "lucide-react";
import { useState } from "react";

/**
 * UserMenu Component
 * Handles session status display and logout flow.
 */

export function UserMenu() {
    const session = null as any; // Static export: auth disabled
    const [isOpen, setIsOpen] = useState(false);

    if (!session) return null;

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pl-3 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all group"
            >
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                    {session.user?.name?.split(' ')[0]}
                </span>
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white uppercase shadow-lg shadow-blue-600/20">
                    {session.user?.name?.[0]}
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 border-b border-slate-800 mb-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signed in as</p>
                            <p className="text-xs text-white truncate">{session.user?.email}</p>
                        </div>
                        
                        <button className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors">
                            <User size={14} /> Profile
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors">
                            <Settings size={14} /> Settings
                        </button>
                        
                        <div className="h-[1px] bg-slate-800 my-2"></div>
                        
                        <button 
                            onClick={() => { window.location.href = '/login'; }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-950/20 transition-colors"
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
