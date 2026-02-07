import Link from 'next/link';
import {
    LayoutDashboard, Ruler, Cog, Zap, Anchor,
    Flame, Layers, Droplets, Settings, ArrowRightLeft, Database, Newspaper, Scissors, Grid2x2
} from 'lucide-react';

const modules = [
    {
        id: 'aluminum',
        label: 'Aluminum Weight',
        desc: 'Mass & Cost Estimation',
        icon: Database,
        color: 'bg-blue-600',
        path: '/aluminum'
    },
    {
        id: 'fits',
        label: 'Fits & Tolerances',
        desc: 'ISO 286 Shaft/Hole',
        icon: Ruler,
        color: 'bg-emerald-600',
        path: '/fits'
    },
    {
        id: 'gears',
        label: 'Gear Calculator',
        desc: 'Spur & Helical Geometry',
        icon: Cog,
        color: 'bg-purple-600',
        path: '/gears'
    },
    {
        id: 'strength',
        label: 'Strength (Mohr)',
        desc: 'Stress Analysis',
        icon: Zap,
        color: 'bg-amber-600',
        path: '/strength'
    },
    {
        id: 'bearings',
        label: 'Bearings (L10)',
        desc: 'Life Expectancy',
        icon: Anchor,
        color: 'bg-cyan-600',
        path: '/bearings'
    },
    {
        id: 'welding',
        label: 'Welding Heat',
        desc: 'Process Inputs',
        icon: Flame,
        color: 'bg-red-600',
        path: '/welding'
    },
    {
        id: 'sheetMetal',
        label: 'Sheet Metal',
        desc: 'Bending Force',
        icon: Layers,
        color: 'bg-indigo-600',
        path: '/sheet-metal'
    },
    {
        id: 'pumps',
        label: 'Pumps',
        desc: 'Power & NPSH',
        icon: Droplets,
        color: 'bg-sky-600',
        path: '/pumps'
    },
    {
        id: 'fasteners',
        label: 'Fasteners',
        desc: 'ISO Metric Threads',
        icon: Settings,
        color: 'bg-slate-600',
        path: '/fasteners'
    },
    {
        id: 'converter',
        label: 'Converter',
        desc: 'Units & Power',
        icon: ArrowRightLeft,
        color: 'bg-pink-600',
        path: '/converter'
    },
    {
        id: 'handbook', // Added id to match existing structure
        label: 'Handbook', // Changed title to label to match existing structure
        desc: 'Bearing tables, ISO Tolerances, G-Code reference.',
        icon: Database, // Changed icon to a Lucide icon to match existing structure
        color: 'bg-emerald-600',
        path: '/handbook'
    },
];

export const ModuleGrid = ({ lang, dict }: { lang: string, dict: any }) => {
    const modules = [
        {
            id: 'aluminum',
            label: dict.modules.aluminum.title,
            desc: dict.modules.aluminum.desc,
            icon: Database,
            color: 'bg-blue-600',
            path: '/aluminum'
        },
        {
            id: 'fits',
            label: dict.modules.fits.title,
            desc: dict.modules.fits.desc,
            icon: Ruler,
            color: 'bg-emerald-600',
            path: '/fits'
        },
        {
            id: 'gears',
            label: dict.modules.gears.title,
            desc: dict.modules.gears.desc,
            icon: Cog,
            color: 'bg-purple-600',
            path: '/gears'
        },
        {
            id: 'strength',
            label: dict.modules.strength.title,
            desc: dict.modules.strength.desc,
            icon: Zap,
            color: 'bg-amber-600',
            path: '/strength'
        },
        {
            id: 'bearings',
            label: dict.modules.bearings.title,
            desc: dict.modules.bearings.desc,
            icon: Anchor,
            color: 'bg-cyan-600',
            path: '/bearings'
        },
        {
            id: 'welding',
            label: dict.modules.welding.title,
            desc: dict.modules.welding.desc,
            icon: Flame,
            color: 'bg-red-600',
            path: '/welding'
        },
        {
            id: 'sheetMetal',
            label: dict.modules.sheetMetal.title,
            desc: dict.modules.sheetMetal.desc,
            icon: Layers,
            color: 'bg-indigo-600',
            path: '/sheet-metal'
        },
        {
            id: 'pumps',
            label: dict.modules.pumps.title,
            desc: dict.modules.pumps.desc,
            icon: Droplets,
            color: 'bg-sky-600',
            path: '/pumps'
        },
        {
            id: 'fasteners',
            label: dict.modules.fasteners.title,
            desc: dict.modules.fasteners.desc,
            icon: Settings,
            color: 'bg-slate-600',
            path: '/fasteners'
        },
        {
            id: 'converter',
            label: dict.modules.converter.title,
            desc: dict.modules.converter.desc,
            icon: ArrowRightLeft,
            color: 'bg-pink-600',
            path: '/converter'
        },
        {
            id: 'handbook',
            label: dict.modules.handbook.title,
            desc: dict.modules.handbook.desc,
            icon: Database,
            color: 'bg-emerald-600',
            path: '/handbook'
        },
        {
            id: 'news',
            label: dict.nav?.news || 'News',
            desc: 'Latest Industry Updates',
            icon: Newspaper,
            color: 'bg-orange-600',
            path: '/news'
        },
        {
            id: 'nesting',
            label: dict.nesting?.title || 'Cutting Optimizer',
            desc: dict.nesting?.subtitle || '1D Linear Nesting',
            icon: Scissors,
            color: 'bg-teal-600',
            path: '/nesting'
        },
        {
            id: 'nesting2d',
            label: dict.nesting2d?.title || '2D Nesting',
            desc: dict.nesting2d?.subtitle || 'True Shape Nesting',
            icon: Grid2x2,
            color: 'bg-violet-600',
            path: '/nesting2d'
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((m) => {
                const Icon = m.icon;
                return (
                    <Link
                        prefetch={false}
                        key={m.id}
                        href={`/${lang}${m.path}`}
                        className="group relative overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        {/* Hover Gradient Background */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 ${m.color} transition-opacity`}></div>

                        <div className={`w-12 h-12 ${m.color} text-white rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                            <Icon size={24} />
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {m.label}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            {m.desc}
                        </p>
                    </Link>
                );
            })}
        </div>
    );
};
