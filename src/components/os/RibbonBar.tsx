import { useState, useMemo } from 'react';
import { useCadStore } from '@/cad/store/cadStore';
import { useI18nStore } from '@/store/i18nStore';
import { useOSStore, Theme, WorkspaceMode } from '@/store/osStore';
import { commandProcessor } from '@/cad/commands/CommandProcessor';

import { zoomViewportAt, resetViewport } from '@/cad/kernel/CoordinateSystem';
import { Constraint } from '@/cad/kernel/types';
import {
    LucideIcon, MousePointer2, Minus, Square, Circle, Pencil,
    Scissors, Maximize, CornerUpRight, Slash, Scan, Ruler, Type, Variable, Magnet, Grid3X3,
    ZoomIn, ZoomOut, RotateCcw, Move, Download, Undo2, Redo2,
    StickyNote, Eye, BookOpen, ChevronDown, Plus, Search,
    Wrench, Box, Settings, Upload, Trash2, Eraser, Highlighter,
    Palette, ArrowRight, FileSpreadsheet, FileText, Presentation, Image as ImageIcon,
    HelpCircle, Layout, Sun, Moon, Cloud, Droplets, Book as BookIcon, Cpu, FileCode, Box as Box3D, Play,
    Link, ArrowLeftRight, ArrowUpDown, AlignHorizontalJustifyStart, Copy, RotateCw, FlipHorizontal,
    Youtube, Music, Calculator, Gamepad2, Hammer 
} from 'lucide-react';
import { useCADCanvasStore } from '@/store/CADCanvasStore';

/**
 * RibbonBar - Unified Functional Interface
 * Dynamically adapts to the current engineering workspace.
 */
export function RibbonBar({ mode, dock = false }: { mode?: WorkspaceMode, dock?: boolean }) {
    const { t } = useI18nStore();

    if (dock) {
        return (
            <div className="w-full z-50 transition-all duration-300">
                <div className="bg-[#0a0e14]/90 backdrop-blur-xl border-b border-white/10 px-4 py-1 flex items-center gap-2">
                    {mode === 'cad' ? <CADRibbon dock={true} /> :
                        mode === 'cam' ? <CAMRibbon dock={true} /> :
                            mode === 'desk' ? <DeskRibbon dock={true} /> :
                                mode === 'fea' ? <FEARibbon dock={true} /> :
                                    <WorkstationRibbon dock={true} />}
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col shrink-0 border-b border-cyan-900/50"
            style={{ backgroundColor: 'rgba(5, 9, 14, 0.90)', backdropFilter: 'blur(16px)' }}
        >
            {mode === 'cad' ? <CADRibbon /> :
                mode === 'cam' ? <CAMRibbon /> :
                    mode === 'desk' ? <DeskRibbon /> :
                        mode === 'fea' ? <FEARibbon /> :
                            <WorkstationRibbon />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SHARED: THEME & HELP CONTROLS
// ═══════════════════════════════════════════════════════════════

function SystemControls() {
    const { t } = useI18nStore();
    const { theme, setTheme, openWelcome } = useOSStore();
    const [showTheme, setShowTheme] = useState(false);

    const themes: { id: Theme; label: string; icon: LucideIcon; color: string }[] = [
        { id: 'dark', label: t.themeDark, icon: Moon, color: '#0a0e14' },
        { id: 'light', label: t.themeLight, icon: Sun, color: '#f8fafc' },
        { id: 'paper', label: t.themePaper, icon: BookIcon, color: '#2c5ea8' },
        { id: 'sea', label: t.themeSea, icon: Droplets, color: '#001e2b' },
        { id: 'sky', label: t.themeSky, icon: Cloud, color: '#e0f2fe' },
    ];

    return (
        <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-2">
            <div className="relative">
                <RibbonBtn
                    icon={Palette}
                    label={t.theme}
                    onClick={() => setShowTheme(!showTheme)}
                    isActive={showTheme}
                    hasDropdown
                />
                {showTheme && (
                    <DropdownPanel onClose={() => setShowTheme(false)} width={200}>
                        <div className="p-1">
                            <div className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                {t.theme}
                            </div>
                            {themes.map(tOption => (
                                <button
                                    key={tOption.id}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 rounded transition-all ${theme === tOption.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                    onClick={() => { setTheme(tOption.id); setShowTheme(false); }}
                                >
                                    <div className="w-3 h-3 rounded-full border border-slate-600 shadow-inner" style={{ backgroundColor: tOption.color }} />
                                    {tOption.label}
                                </button>
                            ))}
                        </div>
                    </DropdownPanel>
                )}
            </div>

            <RibbonBtn
                icon={HelpCircle}
                label={t.ribbon.guide}
                onClick={openWelcome}
            />

            <RibbonBtn
                icon={Variable}
                label={t.ribbon.variables}
                onClick={() => useOSStore.getState().openWindow('project-variables')}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// CAD RIBBON (Drawing Mode)
// ═══════════════════════════════════════════════════════════════

type CADCommand = 'SELECT' | 'PAN' | 'LINE' | 'PLINE' | 'RECTANGLE' | 'CIRCLE' | 'ARC' |
    'TRIM' | 'EXTEND' | 'FILLET' | 'CHAMFER' | 'OFFSET' |
    'DIMENSION' | 'DIMENSION_LINEAR' | 'TEXT' | 'COPY' | 'ROTATE' | 'MIRROR';

interface CADToolDef {
    id: CADCommand;
    labelKey: string;
    Icon: LucideIcon;
}

const CAD_DRAW_TOOLS: CADToolDef[] = [
    { id: 'SELECT', labelKey: 'select', Icon: MousePointer2 },
    { id: 'PAN', labelKey: 'pan', Icon: Move },
    { id: 'LINE', labelKey: 'line', Icon: Minus },
    { id: 'PLINE', labelKey: 'polyline', Icon: Pencil },
    { id: 'RECTANGLE', labelKey: 'rectangle', Icon: Square },
    { id: 'CIRCLE', labelKey: 'circle', Icon: Circle },
    { id: 'ARC', labelKey: 'arc', Icon: CornerUpRight },
];

const CAD_MODIFY_TOOLS: CADToolDef[] = [
    { id: 'COPY', labelKey: 'copy', Icon: Copy },
    { id: 'ROTATE', labelKey: 'rotate', Icon: RotateCw },
    { id: 'MIRROR', labelKey: 'mirror', Icon: FlipHorizontal },
    { id: 'TRIM', labelKey: 'trim', Icon: Scissors },
    { id: 'EXTEND', labelKey: 'extend', Icon: Maximize },
    { id: 'OFFSET', labelKey: 'offset', Icon: ArrowRight },
    { id: 'FILLET', labelKey: 'fillet', Icon: Slash },
    { id: 'CHAMFER', labelKey: 'chamfer', Icon: Box },
];

const CAD_DIM_TOOLS: CADToolDef[] = [
    { id: 'DIMENSION', labelKey: 'smartDim', Icon: Scan },
    { id: 'DIMENSION_LINEAR', labelKey: 'linear', Icon: Ruler },
    { id: 'TEXT', labelKey: 'text', Icon: Type },
];

const CAD_CONSTRAINT_TOOLS: { id: string; labelKey: string; Icon: LucideIcon; type: string }[] = [
    { id: 'CONSTRAINT_COINCIDENT', labelKey: 'coincident', Icon: Link, type: 'coincident' },
    { id: 'CONSTRAINT_HORIZONTAL', labelKey: 'horizontal', Icon: ArrowLeftRight, type: 'horizontal' },
    { id: 'CONSTRAINT_VERTICAL', labelKey: 'vertical', Icon: ArrowUpDown, type: 'vertical' },
    { id: 'CONSTRAINT_PARALLEL', labelKey: 'parallel', Icon: AlignHorizontalJustifyStart, type: 'parallel' },
    { id: 'CONSTRAINT_PERPENDICULAR', labelKey: 'perpendicular', Icon: Box, type: 'perpendicular' },
    { id: 'CONSTRAINT_TANGENT', labelKey: 'tangent', Icon: Circle, type: 'tangent' },
    { id: 'CONSTRAINT_EQUAL', labelKey: 'equal', Icon: Minus, type: 'equal_length' },
    { id: 'CONSTRAINT_ANGLE', labelKey: 'angle', Icon: RotateCcw, type: 'angle' },
    { id: 'CONSTRAINT_DISTANCE', labelKey: 'dist', Icon: Ruler, type: 'distance' },
];

export function CADRibbon({ dock }: { dock?: boolean }) {
    const {
        activeCommand,
        cancelCommand,
        snapEnabled,
        toggleSnap,
        showGrid,
        toggleGrid,
        viewport,
        setViewport,
        undo,
        redo,
        entities,
        undoStack,
        redoStack,
        addEntity
    } = useCadStore();

    const { t } = useI18nStore();

    const handleToolClick = (command: CADCommand) => {
        if (command === 'SELECT' || command === 'PAN') {
            commandProcessor.setActiveCommand(null);
            cancelCommand();
        } else {
            commandProcessor.startCommand(command);
        }
    };

    const handleApplyConstraint = (type: string) => {
        const { selectedIds, addConstraint } = useCadStore.getState();
        if (selectedIds.length < 2) {
            alert(t.ribbon.alertSelect2 || "Please select at least 2 entities");
            return;
        }
        addConstraint({
            id: `const-${Date.now()}`,
            type: type.toUpperCase() as any,
            entityIds: selectedIds,
            active: true,
            value: undefined
        });
    };

    const containerClass = dock
        ? "flex items-center gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        : "flex items-center h-12 sm:h-16 px-2 sm:px-4 gap-2 sm:gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden";

    return (
        <div className={containerClass}>
            <ToolGroup>
                <RibbonBtn icon={Undo2} label={t.ribbon.undo} onClick={undo} disabled={undoStack.length === 0} />
                <RibbonBtn icon={Redo2} label={t.ribbon.redo} onClick={redo} disabled={redoStack.length === 0} />
            </ToolGroup>

            {!dock && <Divider />}

            <ToolGroup label={dock ? undefined : t.ribbon.groupDraw}>
                {CAD_DRAW_TOOLS.map(tOption => (
                    <RibbonBtn key={tOption.id} icon={tOption.Icon} label={(t.ribbon as any)[tOption.labelKey] || tOption.labelKey}
                        isActive={activeCommand === tOption.id || (tOption.id === 'SELECT' && !activeCommand)}
                        onClick={() => handleToolClick(tOption.id)} />
                ))}
            </ToolGroup>

            {!dock && <Divider />}

            <ToolGroup label={dock ? undefined : t.ribbon.groupModify}>
                {CAD_MODIFY_TOOLS.map(tOption => (
                    <RibbonBtn key={tOption.id} icon={tOption.Icon} label={(t.ribbon as any)[tOption.labelKey] || tOption.labelKey}
                        isActive={activeCommand === tOption.id} onClick={() => handleToolClick(tOption.id)} />
                ))}
            </ToolGroup>

            {!dock && <Divider />}

            <ToolGroup label={dock ? undefined : t.ribbon.groupDim}>
                {CAD_DIM_TOOLS.map(tOption => (
                    <RibbonBtn key={tOption.id} icon={tOption.Icon} label={(t.ribbon as any)[tOption.labelKey] || tOption.labelKey}
                        isActive={activeCommand === tOption.id} onClick={() => handleToolClick(tOption.id)} />
                ))}
            </ToolGroup>

            {!dock && <Divider />}

            <ToolGroup>
                <RibbonBtn icon={Magnet} label={t.ribbon.osnap} isActive={snapEnabled} onClick={toggleSnap} />
                <RibbonBtn icon={Grid3X3} label={t.ribbon.grid} isActive={showGrid} onClick={toggleGrid} />
            </ToolGroup>

            {!dock && <div className="flex-1" />}
            {!dock && <SystemControls />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// WORKSTATION RIBBON (New Workstation Mode)
// ═══════════════════════════════════════════════════════════════

function WorkstationRibbon({ dock }: { dock?: boolean }) {
    const { t } = useI18nStore();
    const { openWindow } = useOSStore();

    const moduleLabel = (slug: string, fallback: string) =>
        t.modules?.[slug]?.title ?? fallback;
    
    const containerClass = dock
        ? "flex items-center gap-4"
        : "flex items-center h-16 px-4 gap-3";

    return (
        <div className={containerClass}>
            {!dock && (
                <>
                    <div className="flex items-center gap-2 text-cyan-500">
                        <Monitor size={20} />
                        <span className="text-sm font-bold tracking-wider">{t.ribbon.labelWorkstation}</span>
                    </div>
                    <Divider />
                </>
            )}

            <ToolGroup label={dock ? undefined : t.ribbon.groupContent}>
                <RibbonBtn icon={Calculator} label={moduleLabel('calculator', 'All Calculators')} onClick={() => openWindow('calculator')} />
                <RibbonBtn icon={BarChart3} label={moduleLabel('analytics-dashboard', 'Analytics')} onClick={() => openWindow('analytics-dashboard')} />
                <RibbonBtn icon={Box} label={moduleLabel('materials-explorer', 'Materials')} onClick={() => openWindow('materials-explorer')} />
                <RibbonBtn icon={Database} label={moduleLabel('handbook', 'Handbook')} onClick={() => openWindow('handbook')} />
                <RibbonBtn icon={FileText} label={moduleLabel('engineering-notes', 'Notes')} onClick={() => openWindow('engineering-notes')} />
            </ToolGroup>

            {!dock && <div className="flex-1" />}
            {!dock && <SystemControls />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// DESK RIBBON (Whiteboard Mode)
// ═══════════════════════════════════════════════════════════════

function DeskRibbon({ dock }: { dock?: boolean }) {
    const { t } = useI18nStore();
    
    const containerClass = dock
        ? "flex items-center gap-4"
        : "flex items-center h-16 px-4 gap-3";

    return (
        <div className={containerClass}>
            {!dock && (
                <>
                    <div className="flex items-center gap-2 text-purple-500">
                        <Presentation size={20} />
                        <span className="text-sm font-bold tracking-wider">{t.ribbon.labelCreativeDesk}</span>
                    </div>
                    <Divider />
                </>
            )}

            <ToolGroup label={dock ? undefined : t.ribbon.groupCanvas}>
                <RibbonBtn icon={Type} label={t.ribbon.labelNote} onClick={() => {}} />
                <RibbonBtn icon={ImageIcon} label={t.ribbon.labelImage} onClick={() => {}} />
            </ToolGroup>

            {!dock && <div className="flex-1" />}
            {!dock && <SystemControls />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// CAM RIBBON (Nesting Mode)
// ═══════════════════════════════════════════════════════════════

function CAMRibbon({ dock }: { dock?: boolean }) {
    const { t } = useI18nStore();
    
    return (
        <div className={dock ? "flex items-center gap-4" : "flex items-center h-16 px-4 gap-3"}>
            {!dock && (
                <>
                    <div className="flex items-center gap-2 text-amber-500">
                        <Layout size={20} />
                        <span className="text-sm font-bold tracking-wider">{t.ribbon.labelMfgCam}</span>
                    </div>
                    <Divider />
                </>
            )}

            <ToolGroup label={t.ribbon.groupJob}>
                <RibbonBtn icon={Play} label={t.ribbon.labelStartNesting} onClick={() => {}} />
                <RibbonBtn icon={RotateCcw} label={t.ribbon.labelResetJob} onClick={() => {}} />
            </ToolGroup>

            {!dock && <div className="flex-1" />}
            {!dock && <SystemControls />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// FEA RIBBON (Simulation Mode)
// ═══════════════════════════════════════════════════════════════

function FEARibbon({ dock }: { dock?: boolean }) {
    const { t } = useI18nStore();
    return (
        <div className={dock ? "flex items-center gap-4" : "flex items-center h-16 px-4 gap-3"}>
            {!dock && (
                <>
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Cpu size={20} />
                        <span className="text-sm font-bold tracking-wider">{t.ribbon.labelFeaSim}</span>
                    </div>
                    <Divider />
                </>
            )}

            {!dock && <div className="flex-1" />}
            {!dock && <SystemControls />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ToolGroup({ label, children }: { label?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-1 shrink-0">
            {label && <span className="hidden sm:inline text-[10px] uppercase tracking-wider mr-1.5 font-semibold text-slate-500">{label}</span>}
            {children}
        </div>
    );
}

function Divider() {
    return <div className="w-px h-8 bg-white/10 mx-1 rounded-full" />;
}

function RibbonBtn({ icon: Icon, label, isActive, onClick, disabled, hasDropdown }: {
    icon: LucideIcon;
    label: string;
    isActive?: boolean;
    onClick: () => void;
    disabled?: boolean;
    hasDropdown?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center justify-center gap-1.5 px-2 sm:px-3 h-8 sm:h-10 rounded transition-all text-sm
                ${disabled ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] drop-shadow-md'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                }
            `}
            title={label}
        >
            <Icon size={18} />
            {hasDropdown && <ChevronDown size={10} />}
        </button>
    );
}

function DropdownPanel({ children, onClose, width = 280 }: { children: React.ReactNode; onClose: () => void; width?: number }) {
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className="absolute top-full left-0 mt-2 bg-[#0f1419] border border-[#2a3a4a] rounded-lg shadow-2xl z-50 overflow-hidden"
                style={{ width }}
            >
                {children}
            </div>
        </>
    );
}

import { BarChart3, Monitor, Database } from 'lucide-react';
