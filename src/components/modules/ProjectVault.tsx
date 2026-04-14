'use client';

import { useState } from 'react';
import { Folder, File, GitBranch, GitCommit, HardDrive, Search, Plus, MoreVertical, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ProjectVault() {
  const [files] = useState([
    { name: 'cad_models', type: 'dir', date: '2 saat önce' },
    { name: 'simulations', type: 'dir', date: 'Dün' },
    { name: 'main_assembly.step', type: 'file', date: '1 saat önce', size: '4.2 MB' },
    { name: 'load_calculation.js', type: 'file', date: '15 dk önce', size: '12 KB' },
    { name: 'bom_report.xlsx', type: 'file', date: '3 saat önce', size: '85 KB' },
  ]);

  return (
    <div className="flex h-full bg-[#05070a] text-slate-300 font-sans overflow-hidden">
      {/* Sidebar: Branches & Remotes */}
      <div className="w-64 bg-slate-900/20 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                    <Shield size={16} className="text-white" />
                </div>
                <span className="font-black text-sm uppercase tracking-tighter text-white">Project Vault</span>
            </div>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2">Dallar</div>
                    <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs border border-blue-500/20 font-medium">
                            <GitBranch size={14} /> main
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-slate-500 rounded-lg text-xs transition-colors">
                            <GitBranch size={14} /> structural-fix
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2">Depolar</div>
                    <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-slate-500 rounded-lg text-xs transition-colors">
                            <HardDrive size={14} /> local-storage
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-auto p-4 border-t border-white/5">
            <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="text-[9px] font-bold text-slate-600 uppercase mb-2">Git Status</div>
                <div className="flex items-center gap-2 text-[10px] text-green-500">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Up to date with origin/main
                </div>
            </div>
        </div>
      </div>

      {/* Main Content: File Explorer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header / Breadcrumbs */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20">
            <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">projects</span>
                <span className="text-slate-700">/</span>
                <span className="text-white font-medium">alucalc-main</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                    <input 
                        type="text" 
                        placeholder="Dosya ara..." 
                        className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:border-blue-500/50 outline-none w-48 transition-all"
                    />
                </div>
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
                    <Plus size={16} />
                </button>
            </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-600 border-b border-white/5">
                        <th className="pb-4 font-black tracking-widest">İsim</th>
                        <th className="pb-4 font-black tracking-widest">Son Değişiklik</th>
                        <th className="pb-4 font-black tracking-widest">Boyut</th>
                        <th className="pb-4 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {files.map((file, i) => (
                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                            <td className="py-4">
                                <div className="flex items-center gap-3">
                                    {file.type === 'dir' ? (
                                        <Folder size={18} className="text-blue-400 fill-blue-400/10" />
                                    ) : (
                                        <File size={18} className="text-slate-500" />
                                    )}
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{file.name}</span>
                                </div>
                            </td>
                            <td className="py-4 text-xs text-slate-500">{file.date}</td>
                            <td className="py-4 text-xs text-slate-500 font-mono">{file.size || '--'}</td>
                            <td className="py-4 text-right">
                                <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all text-slate-500">
                                    <MoreVertical size={14} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Bottom Actions */}
        <div className="h-20 bg-slate-950 border-t border-white/5 flex items-center justify-end px-8 gap-4 shrink-0">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all border border-white/5">
                <GitCommit size={14} /> STAGE ALL
            </button>
            <button className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all active:scale-95">
                COMMIT CHANGES
            </button>
        </div>
      </div>
    </div>
  );
}
