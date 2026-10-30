'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Layers, Sparkles, ArrowRight } from 'lucide-react';
import {
    ENGINEERING_TEMPLATES,
    TEMPLATE_CATEGORY_META,
    type FlowTemplate,
    type FlowTemplateCategory,
} from '@/flow/templates/engineeringTemplates';

interface TemplateGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (templateId: string) => void;
}

const TABS: Array<FlowTemplateCategory | 'all'> = [
    'all',
    'powertrain',
    'gears',
    'structural',
    'fasteners',
    'pressure_vessels',
    'manufacturing',
    'physics_dynamics',
    'chemistry_thermo',
    'metallurgy_materials',
];

function TemplateGlyph({
    templateId,
    category,
    featured,
}: {
    templateId?: string;
    category: FlowTemplateCategory;
    featured?: boolean;
}) {
    if (featured) {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <circle cx="20" cy="35" r="9" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <circle cx="20" cy="35" r="3" fill="#22d3ee" />
                <circle cx="50" cy="35" r="12" fill="none" stroke="#22d3ee" strokeWidth="1.6" />
                <rect x="70" y="25" width="28" height="20" rx="3" fill="none" stroke="#34d399" strokeWidth="1.6" />
                <circle cx="84" cy="35" r="5" fill="none" stroke="#34d399" strokeWidth="1.3" />
                <circle cx="118" cy="35" r="10" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
                <path d="M29 35 H38 M62 35 H70 M98 35 H108 M128 35 H136" stroke="#00e5ff" strokeWidth="1.6" />
                <line x1="118" y1="20" x2="118" y2="50" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
        );
    }

    if (templateId === 'template-spur-gear-dxf') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <circle cx="70" cy="35" r="26" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <circle cx="70" cy="35" r="22" fill="none" stroke="#00e5ff" strokeWidth="1.2" strokeDasharray="3 2" />
                <circle cx="70" cy="35" r="17" fill="none" stroke="#334155" strokeWidth="1.2" />
                <circle cx="70" cy="35" r="9" fill="none" stroke="#64748b" strokeWidth="1.6" />
                <path d="M68 26 H72 V30 H68 Z" fill="#64748b" />
                <line x1="38" y1="35" x2="102" y2="35" stroke="#475569" strokeWidth="0.9" strokeDasharray="3 2" />
                <line x1="70" y1="5" x2="70" y2="65" stroke="#475569" strokeWidth="0.9" strokeDasharray="3 2" />
            </svg>
        );
    }

    if (templateId === 'template-helical-gear-pair') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <circle cx="48" cy="35" r="18" fill="none" stroke="#22d3ee" strokeWidth="1.6" />
                <circle cx="92" cy="35" r="25" fill="none" stroke="#22d3ee" strokeWidth="1.6" />
                <path d="M42 21 L54 49 M48 19 L60 47 M86 14 L98 56 M94 12 L106 54" stroke="#00e5ff" strokeWidth="1.3" opacity="0.85" />
                <circle cx="48" cy="35" r="6" fill="none" stroke="#64748b" strokeWidth="1.4" />
                <circle cx="92" cy="35" r="8" fill="none" stroke="#64748b" strokeWidth="1.4" />
                <line x1="22" y1="35" x2="124" y2="35" stroke="#334155" strokeWidth="0.9" strokeDasharray="3 2" />
            </svg>
        );
    }

    if (templateId === 'template-bearing-life-iso281') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <circle cx="70" cy="35" r="27" fill="none" stroke="#22d3ee" strokeWidth="2" />
                <circle cx="70" cy="35" r="22" fill="none" stroke="#334155" strokeWidth="1.2" />
                <circle cx="70" cy="35" r="14" fill="none" stroke="#334155" strokeWidth="1.2" />
                <circle cx="70" cy="35" r="9" fill="none" stroke="#64748b" strokeWidth="2" />
                <circle cx="70" cy="17" r="3.5" fill="#38bdf8" />
                <circle cx="70" cy="53" r="3.5" fill="#38bdf8" />
                <circle cx="52" cy="35" r="3.5" fill="#38bdf8" />
                <circle cx="88" cy="35" r="3.5" fill="#38bdf8" />
                <circle cx="57" cy="22" r="3.5" fill="#38bdf8" />
                <circle cx="83" cy="22" r="3.5" fill="#38bdf8" />
                <circle cx="57" cy="48" r="3.5" fill="#38bdf8" />
                <circle cx="83" cy="48" r="3.5" fill="#38bdf8" />
            </svg>
        );
    }

    if (templateId === 'template-beam-deflection-analysis') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <line x1="22" y1="40" x2="118" y2="40" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 2" />
                <path d="M 22 40 Q 70 54 118 40" fill="none" stroke="#22d3ee" strokeWidth="2.5" />
                <polygon points="22,40 28,52 16,52" fill="none" stroke="#94a3b8" strokeWidth="1.6" />
                <circle cx="118" cy="46" r="4.5" fill="none" stroke="#94a3b8" strokeWidth="1.6" />
                <line x1="70" y1="12" x2="70" y2="42" stroke="#fbbf24" strokeWidth="2" />
                <polygon points="70,45 66,36 74,36" fill="#fbbf24" />
                <line x1="52" y1="18" x2="52" y2="40" stroke="#fbbf24" strokeWidth="1.3" opacity="0.75" />
                <polygon points="52,42 49,35 55,35" fill="#fbbf24" opacity="0.75" />
                <line x1="88" y1="18" x2="88" y2="40" stroke="#fbbf24" strokeWidth="1.3" opacity="0.75" />
                <polygon points="88,42 85,35 91,35" fill="#fbbf24" opacity="0.75" />
            </svg>
        );
    }

    if (templateId === 'template-bolted-joint-vdi2230') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <rect x="35" y="26" width="70" height="9" fill="none" stroke="#64748b" strokeWidth="1.5" />
                <rect x="35" y="35" width="70" height="9" fill="none" stroke="#64748b" strokeWidth="1.5" />
                <rect x="61" y="15" width="18" height="8" rx="1" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.5" />
                <line x1="66" y1="23" x2="66" y2="52" stroke="#fbbf24" strokeWidth="1.5" />
                <line x1="74" y1="23" x2="74" y2="52" stroke="#fbbf24" strokeWidth="1.5" />
                <path d="M66 30 H74 M66 35 H74 M66 40 H74 M66 45 H74" stroke="#fbbf24" strokeWidth="1" />
                <rect x="61" y="47" width="18" height="8" rx="1" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.5" />
                <line x1="70" y1="6" x2="70" y2="13" stroke="#ef4444" strokeWidth="1.6" />
                <line x1="70" y1="64" x2="70" y2="57" stroke="#ef4444" strokeWidth="1.6" />
            </svg>
        );
    }

    if (templateId === 'template-shaft-torsion-din743') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <rect x="20" y="24" width="45" height="22" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <rect x="65" y="27" width="55" height="16" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <rect x="80" y="29" width="22" height="5" rx="2" fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.2" />
                <line x1="12" y1="35" x2="128" y2="35" stroke="#475569" strokeWidth="0.9" strokeDasharray="3 2" />
                <path d="M 36 16 A 11 11 0 1 1 27 26" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
                <polygon points="27,26 24,19 30,22" fill="#fbbf24" />
            </svg>
        );
    }

    if (templateId === 'template-pressure-vessel-asme') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <path d="M 40 20 C 24 20 24 50 40 50 H 100 C 116 50 116 20 100 20 Z" fill="none" stroke="#a78bfa" strokeWidth="2" />
                <path d="M 40 23 C 27 23 27 47 40 47 H 100 C 113 47 113 23 100 23 Z" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.4" />
                <line x1="70" y1="20" x2="70" y2="10" stroke="#a78bfa" strokeWidth="1.6" />
                <line x1="64" y1="10" x2="76" y2="10" stroke="#a78bfa" strokeWidth="2.2" />
                <line x1="22" y1="35" x2="118" y2="35" stroke="#64748b" strokeWidth="0.9" strokeDasharray="3 2" />
                <path d="M 58 35 L 48 35 M 82 35 L 92 35 M 70 28 L 70 23 M 70 42 L 70 47" stroke="#38bdf8" strokeWidth="1.2" />
            </svg>
        );
    }

    if (templateId === 'template-compression-spring-din13906' || templateId === 'template-heavy-duty-die-spring') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <line x1="24" y1="19" x2="24" y2="51" stroke="#94a3b8" strokeWidth="1.8" />
                <line x1="116" y1="19" x2="116" y2="51" stroke="#94a3b8" strokeWidth="1.8" />
                <path d="M 24 35 L 34 22 L 46 48 L 58 22 L 70 48 L 82 22 L 94 48 L 106 22 L 116 35" fill="none" stroke="#22d3ee" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="18" y1="35" x2="122" y2="35" stroke="#475569" strokeWidth="0.9" strokeDasharray="3 2" />
            </svg>
        );
    }

    if (templateId === 'template-sheet-metal-bend-din6935' || templateId === 'template-sheet-metal-enclosure') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <path d="M 30 24 H 68 Q 78 24 78 34 V 58" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 30 29 H 65 Q 73 29 73 37 V 58" fill="none" stroke="#34d399" strokeWidth="1.2" opacity="0.5" />
                <path d="M 30 26.5 H 66.5 Q 75.5 26.5 75.5 35.5 V 58" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="3 2" />
                <circle cx="68" cy="34" r="2.5" fill="#22d3ee" />
                <line x1="68" y1="34" x2="68" y2="24" stroke="#22d3ee" strokeWidth="0.9" strokeDasharray="1 1" />
            </svg>
        );
    }

    if (templateId === 'template-column-buckling' || templateId === 'template-chs-tubular-mast') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <line x1="70" y1="13" x2="70" y2="57" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 2" />
                <path d="M 70 13 Q 86 35 70 57" fill="none" stroke="#22d3ee" strokeWidth="2.6" strokeLinecap="round" />
                <circle cx="70" cy="13" r="4" fill="none" stroke="#94a3b8" strokeWidth="1.6" />
                <circle cx="70" cy="57" r="4" fill="none" stroke="#94a3b8" strokeWidth="1.6" />
                <line x1="70" y1="3" x2="70" y2="10" stroke="#ef4444" strokeWidth="2" />
                <polygon points="70,11 67,7 73,7" fill="#ef4444" />
                <line x1="70" y1="67" x2="70" y2="60" stroke="#ef4444" strokeWidth="2" />
                <polygon points="70,59 67,63 73,63" fill="#ef4444" />
                <rect x="28" y="26" width="16" height="18" fill="none" stroke="#38bdf8" strokeWidth="1.3" />
            </svg>
        );
    }

    if (templateId === 'template-weld-joint') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <rect x="30" y="42" width="80" height="10" fill="none" stroke="#64748b" strokeWidth="1.5" />
                <rect x="65" y="16" width="10" height="26" fill="none" stroke="#64748b" strokeWidth="1.5" />
                <polygon points="65,32 65,42 53,42" fill="#34d399" fillOpacity="0.4" stroke="#34d399" strokeWidth="1.5" />
                <polygon points="75,32 75,42 87,42" fill="#34d399" fillOpacity="0.4" stroke="#34d399" strokeWidth="1.5" />
                <line x1="53" y1="42" x2="65" y2="32" stroke="#00e5ff" strokeWidth="1.3" strokeDasharray="2 1" />
                <line x1="75" y1="32" x2="87" y2="42" stroke="#00e5ff" strokeWidth="1.3" strokeDasharray="2 1" />
                <path d="M 75 25 H 100 L 107 18" fill="none" stroke="#fbbf24" strokeWidth="1.2" />
                <polygon points="100,25 100,20 106,25" fill="#fbbf24" />
            </svg>
        );
    }

    if (templateId === 'template-roller-chain-conveyor' || templateId === 'template-chain-drive') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <circle cx="42" cy="35" r="14" fill="none" stroke="#22d3ee" strokeWidth="1.6" />
                <circle cx="98" cy="35" r="21" fill="none" stroke="#22d3ee" strokeWidth="1.6" />
                <line x1="42" y1="21" x2="98" y2="14" stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="3 3" />
                <line x1="42" y1="49" x2="98" y2="56" stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="3 3" />
                <circle cx="56" cy="19.5" r="2.5" fill="#fbbf24" />
                <circle cx="70" cy="17.5" r="2.5" fill="#fbbf24" />
                <circle cx="84" cy="15.5" r="2.5" fill="#fbbf24" />
                <circle cx="56" cy="50.5" r="2.5" fill="#fbbf24" />
                <circle cx="70" cy="52.5" r="2.5" fill="#fbbf24" />
                <circle cx="84" cy="54.5" r="2.5" fill="#fbbf24" />
                <line x1="20" y1="35" x2="120" y2="35" stroke="#475569" strokeWidth="0.9" strokeDasharray="3 2" />
            </svg>
        );
    }

    if (templateId === 'template-industrial-vbelt-drive' || templateId === 'template-belt-drive') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <circle cx="40" cy="35" r="13" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <circle cx="40" cy="35" r="5" fill="none" stroke="#64748b" strokeWidth="1.3" />
                <circle cx="98" cy="35" r="22" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <circle cx="98" cy="35" r="7" fill="none" stroke="#64748b" strokeWidth="1.3" />
                <path d="M 40 22 L 98 13 A 22 22 0 0 1 98 57 L 40 48 A 13 13 0 0 1 40 22 Z" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <line x1="20" y1="35" x2="124" y2="35" stroke="#475569" strokeWidth="0.9" strokeDasharray="3 2" />
            </svg>
        );
    }

    if (templateId === 'template-hydraulic-clamp-actuator' || templateId === 'template-hydraulic-cylinder') {
        return (
            <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
                <rect x="25" y="23" width="58" height="24" rx="2" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <rect x="27" y="25" width="54" height="20" fill="#0c1d2e" opacity="0.6" />
                <rect x="48" y="25" width="9" height="20" fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.2" />
                <rect x="57" y="29" width="52" height="12" fill="#64748b" fillOpacity="0.4" stroke="#94a3b8" strokeWidth="1.6" />
                <circle cx="114" cy="35" r="5.5" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <circle cx="114" cy="35" r="2" fill="#22d3ee" />
                <circle cx="18" cy="35" r="5.5" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <circle cx="18" cy="35" r="2" fill="#22d3ee" />
                <rect x="32" y="17" width="7" height="6" fill="none" stroke="#fbbf24" strokeWidth="1.3" />
                <rect x="70" y="17" width="7" height="6" fill="none" stroke="#fbbf24" strokeWidth="1.3" />
                <line x1="8" y1="35" x2="132" y2="35" stroke="#475569" strokeWidth="0.9" strokeDasharray="3 2" />
            </svg>
        );
    }

    // Default category fallback SVGs (Precision CAD blueprint style)
    const paths: Record<FlowTemplateCategory, React.ReactNode> = {
        powertrain: (
            <>
                <circle cx="44" cy="35" r="12" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <circle cx="96" cy="35" r="16" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                <line x1="56" y1="35" x2="80" y2="35" stroke="#00e5ff" strokeWidth="1.6" />
                <path d="M 44 23 L 96 19 M 44 47 L 96 51" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="3 2" />
            </>
        ),
        gears: (
            <>
                <circle cx="70" cy="35" r="19" fill="none" stroke="#22d3ee" strokeWidth="1.7" />
                <circle cx="70" cy="35" r="10" fill="none" stroke="#64748b" strokeWidth="1.2" />
                <circle cx="70" cy="35" r="24" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="38" y1="35" x2="102" y2="35" stroke="#00e5ff" strokeWidth="1" strokeDasharray="2 2" />
            </>
        ),
        structural: (
            <>
                <line x1="24" y1="48" x2="116" y2="48" stroke="#94a3b8" strokeWidth="2.2" />
                <polygon points="24,48 31,57 17,57" fill="none" stroke="#22d3ee" strokeWidth="1.4" />
                <polygon points="116,48 123,57 109,57" fill="none" stroke="#22d3ee" strokeWidth="1.4" />
                <line x1="70" y1="18" x2="70" y2="48" stroke="#fbbf24" strokeWidth="1.8" />
                <polygon points="70,48 66,39 74,39" fill="#fbbf24" />
            </>
        ),
        fasteners: (
            <>
                <circle cx="70" cy="35" r="19" fill="none" stroke="#f59e0b" strokeWidth="1.8" />
                <circle cx="70" cy="35" r="10" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                <circle cx="70" cy="35" r="5" fill="none" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 60 35 H 80 M 70 25 V 45" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 2" />
            </>
        ),
        pressure_vessels: (
            <>
                <rect x="32" y="20" width="76" height="30" rx="12" fill="none" stroke="#a78bfa" strokeWidth="1.8" />
                <line x1="32" y1="35" x2="108" y2="35" stroke="#64748b" strokeWidth="1.1" strokeDasharray="3 2" />
                <line x1="70" y1="20" x2="70" y2="12" stroke="#a78bfa" strokeWidth="1.5" />
            </>
        ),
        manufacturing: (
            <>
                <path d="M35 52 Q70 14 105 52" fill="none" stroke="#34d399" strokeWidth="1.8" />
                <line x1="35" y1="52" x2="105" y2="52" stroke="#64748b" strokeWidth="1.2" />
                <circle cx="70" cy="33" r="3" fill="#fbbf24" />
            </>
        ),
        physics_dynamics: (
            <>
                <circle cx="70" cy="35" r="16" fill="none" stroke="#eab308" strokeWidth="1.7" />
                <ellipse cx="70" cy="35" rx="26" ry="10" fill="none" stroke="#ca8a04" strokeWidth="1.2" strokeDasharray="3 2" />
                <circle cx="70" cy="35" r="4" fill="#eab308" />
            </>
        ),
        chemistry_thermo: (
            <>
                <path d="M63 18 L63 32 L46 54 L94 54 L77 32 L77 18 Z" fill="none" stroke="#14b8a6" strokeWidth="1.7" />
                <line x1="58" y1="18" x2="82" y2="18" stroke="#14b8a6" strokeWidth="1.7" />
                <circle cx="70" cy="45" r="2.5" fill="#2dd4bf" />
            </>
        ),
        metallurgy_materials: (
            <>
                <polygon points="70,16 104,35 70,54 36,35" fill="none" stroke="#fb923c" strokeWidth="1.7" />
                <line x1="36" y1="35" x2="36" y2="50" stroke="#f97316" strokeWidth="1.3" />
                <line x1="104" y1="35" x2="104" y2="50" stroke="#f97316" strokeWidth="1.3" />
                <line x1="70" y1="54" x2="70" y2="68" stroke="#f97316" strokeWidth="1.3" />
                <polygon points="70,32 104,50 70,68 36,50" fill="#ea580c" strokeWidth="1.3" />
            </>
        ),
    };

    return (
        <svg viewBox="0 0 140 70" className="w-full h-28 relative z-0 p-2">
            {paths[category]}
        </svg>
    );
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [category, setCategory] = useState<FlowTemplateCategory | 'all'>('all');
    const [query, setQuery] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    // Precompute category counts
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: ENGINEERING_TEMPLATES.length };
        for (const t of ENGINEERING_TEMPLATES) {
            counts[t.category] = (counts[t.category] || 0) + 1;
        }
        return counts;
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return ENGINEERING_TEMPLATES.filter((t) => {
            if (category !== 'all' && t.category !== category) return false;
            if (!q) return true;
            const hay = [t.title, t.titleTr, t.description, t.descriptionTr, t.standard, ...(t.tags ?? [])]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(q);
        });
    }, [category, query]);

    if (!isOpen || !mounted) return null;

    const handlePick = (t: FlowTemplate) => {
        onSelect(t.id);
        onClose();
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-3 sm:p-6 select-none animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-6xl h-[90vh] max-h-[900px] bg-[var(--bg-1)] border border-cyan-500/35 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
                {/* 1. Modal Top Bar */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[var(--bg-1)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] ">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-2">
                                <span>Mühendislik Şablon Galerisi</span>
                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                                    {ENGINEERING_TEMPLATES.length} Pipeline
                                </span>
                            </div>
                            <div className="text-[11px] font-mono text-cyan-500/80 tracking-wide mt-0.5">
                                Endüstriyel İş Akışları · ISO / DIN / ASME / VDI / Eurocode Standartları
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-white/10 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
                        title="Kapat (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 2. Search & Category Filters */}
                <div className="px-6 py-3.5 border-b border-white/5 flex flex-col gap-3 bg-[var(--bg-1)] shrink-0">
                    <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Şablon veya standart ara: ISO 281, redüktör, helisel, DIN, ASME, yay, kaynak, kolon…"
                            className="w-full bg-[var(--bg-2)] border border-slate-700/80 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 font-mono transition-all placeholder:text-slate-500"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                        {TABS.map((id) => {
                            const meta = TEMPLATE_CATEGORY_META[id];
                            const active = category === id;
                            const count = categoryCounts[id] ?? 0;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setCategory(id)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                                        active
                                            ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 '
                                            : 'bg-[var(--bg-1)] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-[var(--bg-2)]'
                                    }`}
                                >
                                    <span>{meta.labelTr}</span>
                                    <span
                                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                                            active ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                        <span>
                            Gösterilen: <strong className="text-cyan-400 font-semibold">{filtered.length}</strong> / {ENGINEERING_TEMPLATES.length} pipeline
                        </span>
                        <span>Düğüm üzerine tıklayarak çalışma alanına aktarın</span>
                    </div>
                </div>

                {/* 3. Cards Scroll Container & Grid (Isolated for smooth scrolling) */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 bg-[var(--bg-0)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
                        {filtered.map((t) => (
                            <div
                                key={t.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handlePick(t)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handlePick(t);
                                    }
                                }}
                                className={`group cursor-pointer rounded-xl border flex flex-col min-h-[300px] overflow-hidden transition-all duration-200 select-none ${
                                    t.featured
                                        ? 'border-cyan-500/50 bg-[var(--bg-1)] shadow-[0_4px_24px_rgba(0,229,255,0.08)] hover:border-cyan-400 hover:bg-[var(--bg-2)] hover:shadow-[0_8px_32px_rgba(0,229,255,0.18)] hover:-translate-y-0.5'
                                        : 'border-slate-800/90 bg-[var(--bg-1)] hover:border-cyan-500/40 hover:bg-[var(--bg-2)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:-translate-y-0.5'
                                }`}
                            >
                                {/* Blueprint CAD Banner (h-28) */}
                                <div className="relative h-28 w-full border-b border-white/10 overflow-hidden flex items-center justify-center bg-[var(--bg-0)] shrink-0">
                                    {/* Blueprint Grid Background Pattern */}
                                    <div
                                        className="absolute inset-0 opacity-25 pointer-events-none"
                                        style={{
                                            backgroundImage: 'radial-gradient(circle, #22d3ee 0.75px, transparent 0.75px)',
                                            backgroundSize: '12px 12px',
                                        }}
                                    />
                                    <div
                                        className="absolute inset-0 opacity-10 pointer-events-none"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(to right, #22d3ee 1px, transparent 1px), linear-gradient(to bottom, #22d3ee 1px, transparent 1px)',
                                            backgroundSize: '48px 48px',
                                        }}
                                    />

                                    {/* Blueprint SVG Vector Drawing */}
                                    <TemplateGlyph templateId={t.id} category={t.category} featured={t.featured} />

                                    {/* Badges on Banner */}
                                    {t.featured ? (
                                        <span className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[8.5px] font-mono font-bold tracking-wider uppercase text-cyan-300 bg-cyan-950/90 border border-cyan-400/50 px-2 py-0.5 rounded z-10">
                                            <Sparkles size={10} className="text-cyan-400" />
                                            Vitrin
                                        </span>
                                    ) : (
                                        <span className="absolute top-2.5 left-2.5 text-[8.5px] font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-slate-300 z-10">
                                            {TEMPLATE_CATEGORY_META[t.category]?.labelTr ?? t.category}
                                        </span>
                                    )}

                                    <span className="absolute top-2.5 right-2.5 text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-cyan-300 z-10 shadow-sm">
                                        {t.standard.split(' ')[0]}
                                    </span>

                                    <span className="absolute bottom-2 right-2.5 text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-black/70 border border-slate-800 text-slate-400 z-10">
                                        {t.nodes.length} düğüm · {t.edges.length} hat
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                    <div className="space-y-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-[13px] font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug font-sans">
                                                {t.titleTr || t.title}
                                            </h3>
                                        </div>
                                        <div className="text-[10px] font-mono text-cyan-400/80 font-medium">
                                            {t.standard}
                                        </div>
                                        <p className="text-[11px] text-slate-400 group-hover:text-slate-300 leading-relaxed line-clamp-2">
                                            {t.descriptionTr || t.description}
                                        </p>
                                    </div>

                                    {/* Footer / Tags & Action CTA */}
                                    <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-1 overflow-hidden max-h-5">
                                                {(t.tags ?? []).slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800/90 text-slate-400"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all shrink-0">
                                                <span>Yükle</span>
                                                <ArrowRight size={12} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center text-xs text-slate-500 py-24 font-mono flex flex-col items-center gap-2">
                            <Layers className="w-8 h-8 text-slate-700" />
                            <span>Aranan kritere uygun mühendislik şablonu bulunamadı.</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery('');
                                    setCategory('all');
                                }}
                                className="mt-2 px-3 py-1 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs hover:bg-cyan-900 transition-all cursor-pointer"
                            >
                                Filtreleri Temizle
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
