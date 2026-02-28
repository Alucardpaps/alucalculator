import { useState, useMemo } from 'react';
import { useCadStore } from '@/cad/store/cadStore';
import { useFlowStore } from '@/store/flowStore';
import { useI18nStore } from '@/store/i18nStore';
// MusicPlayerStore removed
import { useOSStore, Theme } from '@/store/osStore';
import { commandProcessor } from '@/cad/commands/CommandProcessor';
import { getAllCalculators } from '@/calculators/registry'; // Removed DOMAIN_INFO if unused
import { zoomViewportAt, resetViewport } from '@/cad/kernel/CoordinateSystem';
import type { CalculatorSchema } from '@/types/calculator-schema';
import {
    LucideIcon, MousePointer2, Minus, Square, Circle, Pencil,
    Scissors, Maximize, CornerUpRight, Slash, Scan, Ruler, Type, Variable, Magnet, Grid3X3,
    ZoomIn, ZoomOut, RotateCcw, Move, Download, Undo2, Redo2,
    StickyNote, Eye, BookOpen, ChevronDown, Plus, Search,
    Wrench, Box, Settings, Upload, Trash2, Eraser, Highlighter,
    Palette, ArrowRight, FileSpreadsheet, FileText, Presentation, Image as ImageIcon,
    HelpCircle, Layout, Sun, Moon, Cloud, Droplets, Book as BookIcon, Cpu, FileCode, Box as Box3D, Play,
    Link, ArrowLeftRight, ArrowUpDown, AlignHorizontalJustifyStart, Copy, RotateCw, FlipHorizontal,
    Youtube, Music, Calculator // Added Calculator
} from 'lucide-react';
import { useCADCanvasStore } from '@/store/CADCanvasStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

/**
 * RibbonBar - Unified CAD + Flow Tools
 */
export function RibbonBar({ mode, dock = false }: { mode?: 'cad' | 'flow' | 'cam' | 'desk' | 'fea', dock?: boolean }) {
    const { t } = useI18nStore(); // Added useI18nStore

    if (dock) {
        return (
            <div className="w-full z-50 transition-all duration-300">
                <div className="bg-[#0a0e14]/90 backdrop-blur-xl border-b border-white/10 px-4 py-1 flex items-center gap-2">
                    {mode === 'cad' ? <CADRibbon dock={true} /> :
                        mode === 'cam' ? <CAMRibbon dock={true} /> :
                            mode === 'desk' ? <DeskRibbon dock={true} /> :
                                mode === 'fea' ? <FEARibbon dock={true} /> : <FlowRibbon dock={true} />}
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col shrink-0 border-b border-cyan-900/50"
            style={{ backgroundColor: 'rgba(5, 9, 14, 0.90)', backdropFilter: 'blur(16px)' }}
        >
            {mode === 'cad' ? <CADRibbon /> : mode === 'cam' ? <CAMRibbon /> : mode === 'desk' ? <DeskRibbon /> : mode === 'fea' ? <FEARibbon /> : <FlowRibbon />}
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
            {/* Theme Switcher */}
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

            {/* Help / Welcome */}
            <RibbonBtn
                icon={HelpCircle}
                label={t.ribbon.guide}
                onClick={openWelcome}
            />

            {/* Variable Manager (New) */}
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
];

const CAD_MODIFY_TOOLS: CADToolDef[] = [
    { id: 'COPY', labelKey: 'copy', Icon: Copy },
    { id: 'ROTATE', labelKey: 'rotate', Icon: RotateCw },
    { id: 'MIRROR', labelKey: 'mirror', Icon: FlipHorizontal },
    { id: 'TRIM', labelKey: 'trim', Icon: Scissors },
    { id: 'EXTEND', labelKey: 'extend', Icon: Maximize },
    { id: 'OFFSET', labelKey: 'offset', Icon: CornerUpRight },
    { id: 'FILLET', labelKey: 'fillet', Icon: Slash },
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
        setActiveCommand, // unused but kept for destructuring safety if needed later
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

    const handleZoomIn = () => {
        const center = { x: viewport.width / 2, y: viewport.height / 2 };
        setViewport(zoomViewportAt(viewport, center, 1.25));
    };

    const handleZoomOut = () => {
        const center = { x: viewport.width / 2, y: viewport.height / 2 };
        setViewport(zoomViewportAt(viewport, center, 0.8));
    };

    const handleZoomExtents = () => {
        if (entities.length === 0) {
            setViewport(resetViewport(viewport));
            return;
        }

        // Calculate Extents
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        entities.forEach(ent => {
            const g = ent.geometry;
            if (g.type === 'LINE') {
                minX = Math.min(minX, g.start.x, g.end.x);
                minY = Math.min(minY, g.start.y, g.end.y);
                maxX = Math.max(maxX, g.start.x, g.end.x);
                maxY = Math.max(maxY, g.start.y, g.end.y);
            } else if (g.type === 'CIRCLE') {
                minX = Math.min(minX, g.center.x - g.radius);
                minY = Math.min(minY, g.center.y - g.radius);
                maxX = Math.max(maxX, g.center.x + g.radius);
                maxY = Math.max(maxY, g.center.y + g.radius);
            } else if (g.type === 'POLYLINE') {
                g.vertices.forEach(v => {
                    minX = Math.min(minX, v.x);
                    minY = Math.min(minY, v.y);
                    maxX = Math.max(maxX, v.x);
                    maxY = Math.max(maxY, v.y);
                });
            }
        });

        if (minX === Infinity) return;

        // Add padding (10%)
        const width = maxX - minX;
        const height = maxY - minY;
        const cx = minX + width / 2;
        const cy = minY + height / 2;

        // Determine scale
        const padding = 1.1;
        const scaleX = viewport.width / (width * padding);
        const scaleY = viewport.height / (height * padding);
        const newZoom = Math.min(scaleX, scaleY);

        setViewport({
            ...viewport,
            center: { x: cx, y: cy },
            zoom: newZoom
        });
    };

    const handleToolClick = (command: CADCommand) => {
        if (command === 'SELECT' || command === 'PAN') {
            commandProcessor.setActiveCommand(null);
            cancelCommand();
        } else {
            commandProcessor.startCommand(command);
        }
    };

    const handleApplyConstraint = (type: string) => {
        // ... (constraint logic same as before)
        const { selectedIds, solverInterface } = useCadStore.getState();

        if (!solverInterface) {
            console.warn('Solver interface not ready');
            return;
        }

        if (selectedIds.length < 2) {
            alert(t.ribbon.alertSelect2);
            return;
        }


        // Simple prompt for now if distance
        let val: number | undefined = undefined;
        if (type === 'distance') {
            // Logic placeholder
        }

        console.log(`Applying constraint: ${type} to`, selectedIds);
        solverInterface.addConstraint(type, selectedIds, val);
    };

    const handleExportDXF = async () => {
        // ... (export logic same as before)
        try {
            const { entities, layers } = useCadStore.getState();
            // Checking if module exists before import to avoid errors if missing
            // assuming it exists based on previous file content
            const { generateDXF } = await import('../../cad/dxf/DxfGenerator');
            const dxfString = generateDXF(entities, layers);

            const blob = new Blob([dxfString], { type: 'application/dxf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `alucad_drawing_${Date.now()}.dxf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(t.ribbon.exportFailed, e);
            alert(t.ribbon.dxfExportFailed);
        }

    };

    const handleExportSTEP = async () => {
        // ... (export logic same as before)
        try {
            const { entities } = useCadStore.getState();
            if (entities.length === 0) {
                alert(t.ribbon.noGeometry);
                return;
            }


            // Import STEP writer and standalone helper functions
            const stepModule = await import('@/engines/export/step.writer');
            const writer = new stepModule.STEPWriter({
                filename: 'AluCAD_Export',
                author: 'AluCalculator',
                description: 'CAD geometry export'
            });

            // Convert CAD entities to STEP
            let entityCount = 0;
            entities.forEach(ent => {
                const g = ent.geometry;
                if (g.type === 'LINE') {
                    // Add line as edge
                    const p1 = stepModule.addCartesianPoint(writer, g.start.x, g.start.y, 0);
                    const p2 = stepModule.addCartesianPoint(writer, g.end.x, g.end.y, 0);
                    const v1 = stepModule.addVertexPoint(writer, p1);
                    const v2 = stepModule.addVertexPoint(writer, p2);
                    const dx = g.end.x - g.start.x;
                    const dy = g.end.y - g.start.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const dir = stepModule.addDirection(writer, dx / len, dy / len, 0);
                    const vec = stepModule.addVector(writer, dir, len);
                    const line = stepModule.addLine(writer, p1, vec);
                    stepModule.addEdgeCurve(writer, v1, v2, line, true);
                    entityCount++;
                } else if (g.type === 'CIRCLE') {
                    // Add circle
                    const center = stepModule.addCartesianPoint(writer, g.center.x, g.center.y, 0);
                    const zAxis = stepModule.addDirection(writer, 0, 0, 1);
                    const xRef = stepModule.addDirection(writer, 1, 0, 0);
                    const axis2 = stepModule.addAxis2Placement3D(writer, center, zAxis, xRef);
                    stepModule.addCircle(writer, axis2, g.radius);
                    entityCount++;
                }
            });

            if (entityCount === 0) {
                alert(t.ribbon.noExportableGeometry);
                return;
            }


            const stepString = writer.generate();

            const blob = new Blob([stepString], { type: 'application/step' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `alucad_model_${Date.now()}.step`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert(t.ribbon.stepExportComplete.replace('{count}', String(entityCount)));

        } catch (e) {
            console.error(t.ribbon.stepExportFailed, e);
            alert(t.ribbon.stepExportFailed + ': ' + (e as Error).message);
        }

    };

    const handleImportDXF = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.dxf';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                // Dynamic import
                const { simpleParseDXF } = await import('../../cad/dxf/DxfParser');
                const newEntities = simpleParseDXF(text);

                if (newEntities.length > 0) {
                    newEntities.forEach(e => addEntity(e));
                    alert(t.ribbon.importedEntities.replace('{count}', String(newEntities.length)));
                } else {

                    alert(t.ribbon.noExportableGeometry);
                }
            } catch (err) {
                console.error(err);
                alert(t.ribbon.exportFailed);
            }

        };
        input.click();
    };

    const containerClass = dock
        ? "flex items-center gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        : "flex items-center h-12 sm:h-16 px-2 sm:px-4 gap-2 sm:gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden";

    const containerStyle = dock
        ? {}
        : { background: 'transparent' };

    return (
        <div className={containerClass} style={containerStyle}>
            {/* Undo/Redo */}
            <ToolGroup>
                <RibbonBtn icon={Undo2} label={t.ribbon.undo} onClick={undo} disabled={undoStack.length === 0} />
                <RibbonBtn icon={Redo2} label={t.ribbon.redo} onClick={redo} disabled={redoStack.length === 0} />
            </ToolGroup>

            {!dock && <Divider />}

            {/* Draw */}
            <ToolGroup label={dock ? undefined : t.ribbon.groupDraw}>
                {CAD_DRAW_TOOLS.map(tOption => (
                    <RibbonBtn key={tOption.id} icon={tOption.Icon} label={(t.ribbon as any)[tOption.labelKey] || tOption.labelKey}
                        isActive={activeCommand === tOption.id || (tOption.id === 'SELECT' && !activeCommand)}
                        onClick={() => handleToolClick(tOption.id)} />
                ))}
            </ToolGroup>

            {!dock && <Divider />}

            {/* Modify */}
            <ToolGroup label={dock ? undefined : t.ribbon.groupModify}>
                {CAD_MODIFY_TOOLS.map(tOption => (
                    <RibbonBtn key={tOption.id} icon={tOption.Icon} label={(t.ribbon as any)[tOption.labelKey] || tOption.labelKey}
                        isActive={activeCommand === tOption.id} onClick={() => handleToolClick(tOption.id)} />
                ))}
            </ToolGroup>

            {!dock && <Divider />}

            {/* Dimension */}
            <ToolGroup label={dock ? undefined : t.ribbon.groupDim}>
                {CAD_DIM_TOOLS.map(tOption => (
                    <RibbonBtn key={tOption.id} icon={tOption.Icon} label={(t.ribbon as any)[tOption.labelKey] || tOption.labelKey}
                        isActive={activeCommand === tOption.id} onClick={() => handleToolClick(tOption.id)} />
                ))}
            </ToolGroup>

            {!dock && <Divider />}

            {/* Constraints */}
            {!dock && <ToolGroup label={dock ? undefined : t.ribbon.groupConstraints}>
                {CAD_CONSTRAINT_TOOLS.map(tOption => (
                    <RibbonBtn key={tOption.id} icon={tOption.Icon} label={(t.ribbon as any)[tOption.labelKey] || tOption.labelKey}
                        onClick={() => handleApplyConstraint(tOption.type)} />
                ))}
            </ToolGroup>}

            {/* Snap & Grid */}
            <ToolGroup>
                <RibbonBtn icon={Magnet} label={t.ribbon.osnap} isActive={snapEnabled} onClick={toggleSnap} />
                <RibbonBtn icon={Grid3X3} label={t.ribbon.grid} isActive={showGrid} onClick={toggleGrid} />
            </ToolGroup>

            {/* Zoom - Hide in Dock to save space */}
            {!dock && (
                <>
                    <Divider />
                    <ToolGroup>
                        <RibbonBtn icon={ZoomOut} label={t.ribbon.zoomOut} onClick={handleZoomOut} />
                        <RibbonBtn icon={ZoomIn} label={t.ribbon.zoomIn} onClick={handleZoomIn} />
                        <RibbonBtn icon={Maximize} label={t.ribbon.zoomExtents} onClick={handleZoomExtents} />
                    </ToolGroup>
                </>
            )}

            {!dock && <div className="flex-1" />}

            {/* Engineering Export Section */}
            {!dock && (
                <ToolGroup label={t.ribbon.groupExport}>
                    <RibbonBtn icon={Upload} label={t.ribbon.importDxf} onClick={handleImportDXF} />
                    <RibbonBtn icon={FileCode} label={t.ribbon.exportDxf} onClick={handleExportDXF} />
                    <RibbonBtn icon={Box3D} label={t.ribbon.exportStep} onClick={handleExportSTEP} />
                </ToolGroup>
            )}

            {/* System Controls - Hide in Dock */}
            {!dock && <SystemControls />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// DESK RIBBON (Whiteboard Mode)
// ═══════════════════════════════════════════════════════════════

function DeskRibbon({ dock }: { dock?: boolean }) {
    const { t } = useI18nStore();
    const dispatchShape = (type: string, label: string, color: string) => {

        const event = new CustomEvent('desk:add-shape', {
            detail: {
                type: 'create-shape',
                payload: {
                    type: type,
                    props: {
                        w: 120, h: 160,
                        text: label,
                        fill: 'solid',
                        color: color
                    }
                }
            }
        });
        window.dispatchEvent(event);
    };

    const containerClass = dock
        ? "flex items-center gap-4"
        : "flex items-center h-16 px-4 gap-3";

    const containerStyle = dock
        ? {}
        : { background: 'transparent' };

    return (
        <div className={containerClass} style={containerStyle}>
            {!dock && (
                <>
                    <div className="flex items-center gap-2 text-purple-500">
                        <Presentation size={20} />
                        <span className="text-sm font-bold tracking-wider">{t.ribbon.labelCreativeDesk}</span>
                    </div>
                    <Divider />

                </>
            )}

            {/* Creative Tools - Simplified */}
            <ToolGroup label={dock ? undefined : t.ribbon.groupCanvas}>
                <RibbonBtn icon={Type} label={t.ribbon.labelNote} onClick={() => dispatchShape('text', t.ribbon.labelNewNote || 'New Note', 'black')} />
                <RibbonBtn icon={ImageIcon} label={t.ribbon.labelImage} onClick={() => {

                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const url = URL.createObjectURL(file);
                            dispatchShape('image', file.name, 'grey');
                        }
                    };
                    input.click();
                }} />
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
    const dispatchCam = (action: string) => {

        const event = new CustomEvent('cam:action', { detail: { action } });
        window.dispatchEvent(event);
    };

    const containerClass = dock
        ? "flex items-center gap-4"
        : "flex items-center h-16 px-4 gap-3";

    const containerStyle = dock
        ? {}
        : { background: 'transparent' };

    return (
        <div className={containerClass} style={containerStyle}>
            {!dock && (
                <>
                    <div className="flex items-center gap-2 text-amber-500">
                        <Layout size={20} />
                        <span className="text-sm font-bold tracking-wider">{t.ribbon.labelMfgCam}</span>
                    </div>
                    <Divider />

                </>
            )}

            {/* Actions */}
            <ToolGroup label={t.ribbon.groupJob}>
                <RibbonBtn icon={Play} label={t.ribbon.labelStartNesting} onClick={() => dispatchCam('start')} />
                <RibbonBtn icon={RotateCcw} label={t.ribbon.labelResetJob} onClick={() => dispatchCam('reset')} />
            </ToolGroup>


            {!dock && <Divider />}

            {/* Reports */}
            <ToolGroup label={t.ribbon.groupOutput}>
                <RibbonBtn icon={FileText} label={t.ribbon.labelFullReport} onClick={() => dispatchCam('report')} />
                <RibbonBtn icon={Download} label={t.ribbon.labelExportNc} onClick={() => dispatchCam('export')} />
            </ToolGroup>


            {!dock && <div className="flex-1" />}
            {!dock && (
                <div className="text-xs text-amber-500/50 uppercase font-mono mr-4">
                    {t.ribbon.labelAlgorithm}
                </div>

            )}
            {!dock && <SystemControls />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// FLOW RIBBON (Node-based Mode)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// FEA RIBBON (Simulation Mode)
// ═══════════════════════════════════════════════════════════════

function FEARibbon({ dock }: { dock?: boolean }) {
    const { t } = useI18nStore();
    const containerClass = dock

        ? "flex items-center gap-4"
        : "flex items-center h-16 px-4 gap-3";

    const containerStyle = dock
        ? {}
        : { background: 'transparent' };

    return (
        <div className={containerClass} style={containerStyle}>
            {!dock && (
                <>
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Cpu size={20} />
                        <span className="text-sm font-bold tracking-wider">{t.ribbon.labelFeaSim}</span>
                    </div>
                    <Divider />
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono uppercase">
                        <span className="flex items-center gap-1"><Circle size={8} className="fill-green-500 text-green-500" /> {t.ribbon.labelSolverReady}</span>
                        <span className="flex items-center gap-1 opacity-50">{t.ribbon.labelMatrixSparse}</span>
                    </div>

                </>
            )}

            {!dock && <div className="flex-1" />}
            {!dock && <SystemControls />}
        </div>
    );
}

const TOOL_ITEMS = (t: any) => [
    { id: 'sheet-metal', label: t.modules['sheet-metal'].title, icon: Grid3X3, calcId: 'sheet-metal' },
    { id: 'box-profile', label: t.modules['profile-weight'].title, icon: Box, calcId: 'profile-weight' },
    // Thermal removed as no calculator exists yet
    { id: 'gear', label: t.modules['gear-spur'].title, icon: Settings, calcId: 'gear-spur' },
    { id: 'fasteners', label: t.modules['bolt-stress'].title, icon: Wrench, calcId: 'bolt-stress' },
    { id: 'nesting', label: t.modules['nesting'].title, icon: Layout, calcId: null, isNesting: true },
    { id: 'cutting', label: t.modules['cutting-optimizer'].title, icon: Scissors, calcId: null, isCAM: true },
    { id: 'handbook', label: t.modules['handbook'].title, icon: BookOpen, calcId: null, isHandbook: true },
    { id: 'news', label: t.allApps, icon: FileText, calcId: null, isNews: true },
];

function FlowRibbon({ dock }: { dock?: boolean }) {
    const { t } = useI18nStore();
    const { addCalculatorNode, addMediaNode, addNoteNode, addNestingNode, clearFlow } = useFlowStore();
    const {
        currentTool, setCurrentTool,
        isDrawing, setIsDrawing,
        currentShapeStyle, setCurrentShapeStyle
    } = useCADCanvasStore();
    const [showNodeDropdown, setShowNodeDropdown] = useState(false);
    const [showVizDropdown, setShowVizDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Paint State
    const [showColorPicker, setShowColorPicker] = useState(false);

    const calculators = getAllCalculators();
    const groupedCalculators = useMemo(() => {
        const groups: Record<string, CalculatorSchema[]> = {};
        calculators.forEach(calc => {
            if (!groups[calc.domain]) groups[calc.domain] = [];
            groups[calc.domain].push(calc);
        });
        return groups;
    }, [calculators]);

    const filteredGroups = useMemo(() => {
        if (!searchQuery) return groupedCalculators;
        const filtered: Record<string, CalculatorSchema[]> = {};
        Object.entries(groupedCalculators).forEach(([domain, calcs]) => {
            const matching = calcs.filter(c =>
                c.metadata.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (matching.length > 0) filtered[domain] = matching;
        });
        return filtered;
    }, [groupedCalculators, searchQuery]);

    const handleAddCalculator = (schemaId: string) => {
        addCalculatorNode(schemaId, { x: 150 + Math.random() * 100, y: 100 + Math.random() * 100 });
        setShowNodeDropdown(false);
        setSearchQuery('');
    };

    const handleToolClick = (tool: any) => {
        if (tool.calcId) handleAddCalculator(tool.calcId);
        else if (tool.isNesting) {
            addNestingNode({ x: 200, y: 150 });
        }
        else if (tool.isCAM) {
            useOSStore.getState().setWorkspaceMode('cam');
        }
        else if (tool.isHandbook) {
            addMediaNode('pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', { x: 300, y: 150 }, t.ribbon.handbookPdf || 'Engineering Handbook.pdf');
        }
        else if (tool.isNews) {
            addNoteNode(`📰 ${t.ribbon.newsFeedTitle || 'Engineering News Feed'}\n\n• ${t.ribbon.newsItem1}\n• ${t.ribbon.newsItem2}\n• ${t.ribbon.newsItem3}`, { x: 400, y: 150 });
        }
        else {
            addNoteNode(`📘 ${tool.label}\n\n${t.ribbon.comingSoon || 'Coming soon...'}`, { x: 200, y: 200 });
        }
        setShowNodeDropdown(false);
    };

    const containerClass = dock
        ? "flex items-center gap-4"
        : "flex items-center h-16 px-4 gap-3";

    const containerStyle = dock
        ? {}
        : { background: 'transparent' };

    return (
        <div className={containerClass} style={containerStyle}>
            {/* Sketching Tools */}
            <ToolGroup label={dock ? undefined : t.ribbon.groupPaint}>
                <div className="flex items-center gap-2">
                    {/* Tools */}
                    <div className="flex items-center gap-1 bg-[#0a0e14] rounded-md p-0.5 border border-[#2a3a4a]">
                        <RibbonBtn icon={Pencil} label={t.ribbon.labelPen} isActive={currentTool === 'pen'} onClick={() => { setCurrentTool('pen'); setIsDrawing(true); }} />
                        <RibbonBtn icon={Highlighter} label={t.ribbon.labelMarker} isActive={currentTool === 'highlighter'} onClick={() => { setCurrentTool('highlighter'); setIsDrawing(true); }} />
                        <RibbonBtn icon={Eraser} label={t.ribbon.labelEraser} isActive={currentTool === 'eraser'} onClick={() => { setCurrentTool('eraser'); setIsDrawing(false); }} />
                    </div>

                    {/* Shapes */}
                    <div className="flex items-center gap-1 border-l border-[#2a3a4a] pl-2">
                        <RibbonBtn icon={Minus} label={t.ribbon.labelLine} isActive={currentTool === 'line'} onClick={() => { setCurrentTool('line'); setIsDrawing(true); }} />
                        <RibbonBtn icon={ArrowRight} label={t.ribbon.labelArrow} isActive={currentTool === 'arrow'} onClick={() => { setCurrentTool('arrow'); setIsDrawing(true); }} />
                        <RibbonBtn icon={Square} label={t.ribbon.labelRect} isActive={currentTool === 'rectangle'} onClick={() => { setCurrentTool('rectangle'); setIsDrawing(true); }} />
                        <RibbonBtn icon={Circle} label={t.ribbon.labelCircle} isActive={currentTool === 'circle'} onClick={() => { setCurrentTool('circle'); setIsDrawing(true); }} />
                    </div>


                    {/* Style Controls */}
                    <div className="flex items-center gap-2 border-l border-[#2a3a4a] pl-2">
                        <div className="relative">
                            <button
                                className="w-5 h-5 rounded-full border border-gray-600 shadow-sm transition-transform hover:scale-110"
                                style={{ backgroundColor: currentShapeStyle.strokeColor }}
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                title={t.ribbon.labelStrokeColor}
                            />
                            {showColorPicker && (
                                <div className="absolute top-full left-0 mt-2 p-2 bg-[#0f1419] border border-[#2a3a4a] rounded shadow-xl z-50 grid grid-cols-4 gap-1 w-32">
                                    {['#ffffff', '#000000', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#881337', '#713f12'].map(c => (
                                        <button
                                            key={c}
                                            className="w-5 h-5 rounded-full border border-gray-700 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: c }}
                                            onClick={() => {
                                                setCurrentShapeStyle({ strokeColor: c });
                                                setShowColorPicker(false);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 w-20">
                            <input
                                type="range"
                                min="1" max="20"
                                value={currentShapeStyle.strokeWidth}
                                onChange={(e) => setCurrentShapeStyle({ strokeWidth: parseInt(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <RibbonBtn
                            icon={Trash2}
                            label={t.ribbon.labelClear}
                            onClick={() => {
                                if (confirm(t.ribbon.confirmClearSketches)) useCADCanvasStore.getState().clearCanvas();
                            }}
                        />

                    </div>
                </div>
            </ToolGroup>

            {!dock && <Divider />}

            {/* Nodes Picker */}
            <div className="relative">
                <RibbonBtn icon={Plus} label={t.allApps} onClick={() => setShowNodeDropdown(!showNodeDropdown)} isActive={showNodeDropdown} hasDropdown />
                {showNodeDropdown && (
                    <DropdownPanel onClose={() => setShowNodeDropdown(false)} width={280}>
                        <div className="p-2">
                            <div className="relative mb-2">
                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={t.searchApps}
                                    className="w-full bg-black/40 border border-white/10 rounded px-8 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                {/* Quick Tools */}
                                {!searchQuery && (
                                    <div className="grid grid-cols-2 gap-1 mb-4">
                                        {TOOL_ITEMS(t).map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleToolClick(item)}
                                                className="flex items-center gap-2 p-2 hover:bg-white/5 rounded transition-colors text-left"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-[#0a0e14] border border-white/5 flex items-center justify-center shrink-0">
                                                    <item.icon size={16} className="text-cyan-400" />
                                                </div>
                                                <span className="text-[10px] text-slate-300 font-medium leading-tight">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Calculators */}
                                {Object.entries(filteredGroups).map(([domain, calcs]) => (
                                    <div key={domain} className="mb-4">
                                        <h3 className="text-[10px] uppercase text-slate-400 font-bold mb-1 px-2">{domain}</h3>
                                        <div className="grid grid-cols-2 gap-1">
                                            {calcs.map(calc => (
                                                <button
                                                    key={calc.id}
                                                    onClick={() => handleAddCalculator(calc.id)}
                                                    className="flex items-center gap-2 p-2 hover:bg-white/5 rounded transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-[#0a0e14] border border-white/5 flex items-center justify-center shrink-0">
                                                        <Calculator size={16} className="text-cyan-400" />
                                                    </div>
                                                    <span className="text-[10px] text-slate-300 font-medium leading-tight">{calc.metadata.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {searchQuery && Object.keys(filteredGroups).length === 0 && (
                                    <p className="text-center text-slate-500 text-xs py-4">{t.noResults}</p>
                                )}
                            </div>
                        </div>
                    </DropdownPanel>
                )}
            </div>

            {!dock && <Divider />}

            {/* Content Tools */}
            <ToolGroup label={dock ? undefined : t.ribbon.groupContent}>
                <div className="flex items-center gap-0.5">
                    <RibbonBtn icon={StickyNote} label={t.ribbon.labelNote} onClick={() => addNoteNode(t.ribbon.defaultNote, { x: 300, y: 200 })} />
                    <RibbonBtn icon={Youtube} label={t.ribbon.labelVideo} onClick={() => {
                        const url = prompt(t.ribbon.promptYoutubeUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                        if (url) addMediaNode('youtube', url, { x: 350, y: 200 });
                    }} />
                    <RibbonBtn icon={Music} label={t.ribbon.labelMusic} onClick={() => {
                        const url = prompt('Enter Music URL:', 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
                        if (url) addMediaNode('music', url, { x: 400, y: 200 });
                    }} />
                    <RibbonBtn icon={ImageIcon} label={t.ribbon.labelImage} onClick={() => addMediaNode('image', 'https://images.unsplash.com/photo-1518770660439-4636190af475', { x: 450, y: 200 })} />
                    <div className="w-px h-4 bg-[#2a3a4a] mx-1" />
                    <RibbonBtn icon={FileSpreadsheet} label={t.ribbon.labelExcel} onClick={() => addMediaNode('excel', '', { x: 300, y: 250 }, 'C:/Project/Sheet.xlsx')} />
                    <RibbonBtn icon={FileText} label={t.ribbon.labelWord} onClick={() => addMediaNode('word', '', { x: 350, y: 250 }, 'C:/Project/Doc.docx')} />
                    <RibbonBtn icon={Presentation} label={t.ribbon.labelPpt} onClick={() => addMediaNode('powerpoint', '', { x: 400, y: 250 }, 'C:/Project/Slides.pptx')} />
                    <RibbonBtn icon={FileText} label={t.ribbon.labelPdf} onClick={() => addMediaNode('pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', { x: 400, y: 200 })} />
                </div>
            </ToolGroup>


            {!dock && <div className="flex-1" />}

            {/* Clear All Flow */}
            {!dock && (
                <div className="flex items-center gap-1">
                    <RibbonBtn
                        icon={Trash2}
                        label={t.ribbon.clearAll}
                        onClick={() => {
                            if (confirm(t.ribbon.confirmClearFlow)) {
                                clearFlow();
                            }
                        }}

                    />
                </div>
            )}

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
