'use client';

/**
 * AluCalc OS — Taskbar
 * Shows active flow nodes instead of windows.
 * Click to focus/select, X to delete node.
 */

import { useFlowStore, FlowNode, CalculatorNodeData } from '@/store/flowStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Grid3X3, Wifi, Volume2, Battery, Calculator, FileText, StickyNote, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getModuleIcon, MODULE_REGISTRY } from '@/config/modules';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';


export function Taskbar() {
    const { nodes, selectedNodeId, setSelectedNode, removeNode } = useFlowStore();
    const { dictionary, workspaceMode } = useOSStore();
    const { t, language } = useI18nStore();
    const [time, setTime] = useState(new Date());



    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(language, { hour: 'numeric', minute: '2-digit', hour12: false });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(language, { month: 'short', day: 'numeric' });
    };


    // Get node display info
    const getNodeInfo = (node: FlowNode) => {
        if (node.data.type === 'calculator') {
            const data = node.data as CalculatorNodeData;
            const moduleInfo = MODULE_REGISTRY[data.schemaId as keyof typeof MODULE_REGISTRY];
            return {
                title: t.modules[data.schemaId as keyof typeof t.modules]?.title || data.schemaId,
                Icon: moduleInfo ? getModuleIcon(moduleInfo.iconName) : Calculator
            };
        } else if (node.data.type === 'note') {
            return { title: t.nodeTypeNote, Icon: StickyNote };
        } else if (node.data.type === 'media') {
            return { title: t.nodeTypeMedia, Icon: FileText };
        }
        return { title: t.nodeTypeNode, Icon: Calculator };

    };

    // Focus on node — selection triggers FlowCanvas to center on it
    const handleNodeClick = (nodeId: string) => {
        setSelectedNode(nodeId);
    };

    if (workspaceMode !== 'flow') return null;

    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-auto pointer-events-none">
            <div className="bg-[#05090e]/60 backdrop-blur-3xl border border-white/5 rounded-2xl px-2 py-1.5 flex items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto ring-1 ring-white/10">
                {/* Start Button Replacement (System Indicator) */}
                <div className="px-3 border-r border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase font-sans">{t.systemReadyStatus}</span>
                </div>


                {/* Node List */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[70vw] px-1">
                    <AnimatePresence mode="popLayout">
                        {nodes.map((node, i) => {
                            const { title, Icon } = getNodeInfo(node);
                            const isActive = selectedNodeId === node.id;
                            const safeKey = `taskbar-node-${node.id}-${i}`;

                            return (
                                <motion.button
                                    key={safeKey}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => handleNodeClick(node.id)}
                                    className={`
                                        group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all whitespace-nowrap overflow-hidden
                                        ${isActive
                                            ? 'bg-white/10 border-white/20 text-white shadow-xl'
                                            : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
                                        }
                                    `}
                                >
                                    <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
                                    <span className={`text-[10px] font-bold tracking-wide font-sans ${isActive ? 'text-white' : 'text-inherit'}`}>
                                        {String(title)}
                                    </span>

                                    {/* Active Glow */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="taskbar-active-glow"
                                            className="absolute inset-0 bg-cyan-500/5 pointer-events-none"
                                        />
                                    )}

                                    {/* Hover Delete */}
                                    <div
                                        className="ml-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeNode(node.id);
                                        }}
                                    >
                                        <X size={12} />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>

                    {nodes.length === 0 && (
                        <div className="text-[10px] text-slate-600 font-medium px-4 tracking-wide italic">
                            {t.noActiveNodes}
                        </div>
                    )}

                </div>

                {/* Status Bar */}
                <div className="border-l border-white/10 pl-3 pr-2 flex items-center gap-4 text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <Grid3X3 size={12} className="text-cyan-500/50" />
                        <span className="text-[10px] font-mono font-bold text-cyan-500/70">{nodes.length}</span>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm(t.confirmClearWorkspace)) useFlowStore.getState().clearFlow();
                        }}

                        className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}
