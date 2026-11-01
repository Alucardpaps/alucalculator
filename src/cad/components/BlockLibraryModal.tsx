/**
 * 🧱 AluCAD — AutoCAD-Grade Block Library & Template Manager Modal
 * 
 * Complies with AGENTS.md Industrial Instrument design system:
 * Dark chassis (#07090c, #0c1016, #121821), cyan accents (#3ad0e6), JetBrains Mono typography.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { polygonVertices } from '../kernel/shapes';
import { BlockDefinition, CadEntity, Point, BlockCategory } from '../kernel/types';
import { BlockManager, STANDARD_BLOCKS } from '../blocks/BlockManager';
import { useCadStore } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import { InsertTool } from '../commands/tools/InsertTool';
import { useI18nStore } from '@/store/i18nStore';
import { getCadTranslations } from '@/locales/cadTranslations';
import { t12 } from '@/locales/t12';
import {
    X,
    Search,
    Plus,
    Download,
    Upload,
    Trash2,
    Layers,
    Box,
    Check,
    FolderOpen,
    Shapes,
    RotateCw,
    Maximize2,
    FileText,
    Tag,
    Sliders,
    Sparkles
} from 'lucide-react';
import { SurfaceFinishBuilderModal } from './SurfaceFinishBuilderModal';
import { DynamicBlockConfigurator } from './DynamicBlockConfigurator';

interface BlockLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CategoryMeta {
    id: string;
    label: string;
    description: string;
}

export function BlockLibraryModal({ isOpen, onClose }: BlockLibraryModalProps) {
    const { language } = useI18nStore();
    const tCad = getCadTranslations(language);

    const categories: CategoryMeta[] = useMemo(() => [
        { id: 'Dynamic', label: '⚡ ' + t12(language, 'Dynamic Blocks', 'Dinamik Bloklar'), description: t12(language, 'AutoCAD-grade parametric blocks with stretch, flip, arrays & standard sizes', 'Genişletilebilir, aynalanabilir, çoğalan ve standart ebatlı AutoCAD dinamik blokları') },
        { id: 'All', label: tCad.blockManager.allBlocks, description: t12(language, 'Complete library of ISO/DIN and custom blocks', 'ISO/DIN ve özel blokların eksiksiz kütüphanesi') },
        { id: 'Mechanical', label: '⚙️ ' + t12(language, 'Mechanical & Gears', 'Makine & Dişliler'), description: t12(language, 'Involute gears, chain sprockets, timing pulleys and transmission elements', 'Evolvent dişliler, makaralı zincir dişlileri, triger kasnakları ve aktarma elemanları') },
        { id: 'Fasteners', label: tCad.blockManager.fasteners, description: t12(language, 'Universal dynamic bolts, DIN 912 socket screws, nuts, washers & pins', 'Evrensel dinamik cıvatalar, ISO 4014, DIN 912 imbus, somunlar ve pullar') },
        { id: 'Templates', label: tCad.blockManager.templates, description: t12(language, 'DIN EN ISO 5457 drawing sheets with margins and borders', 'Kenar boşluklu ve çerçeveli DIN EN ISO 5457 teknik resim sayfaları') },
        { id: 'TitleBlocks', label: tCad.blockManager.titleBlocks, description: t12(language, 'ISO 7200 title blocks, BOM parts lists & revision tables', 'ISO 7200 antet blokları, BOM parça listeleri ve revizyon tabloları') },
        { id: 'Symbols', label: tCad.blockManager.symbols, description: t12(language, 'GD&T, surface texture, welding & projection symbols', 'GD&T, yüzey işleme, kaynak ve projeksiyon sembolleri') },
        { id: 'Profiles', label: tCad.blockManager.profiles, description: t12(language, 'T-Slot aluminum profiles (2020, 2040, 3030) & corner brackets', 'T-Kanal alüminyum profiller (2020, 2040, 3030) ve köşe braketleri') },
        { id: 'Mounts', label: tCad.blockManager.mounts, description: t12(language, 'NEMA stepper motors (17, 23, 34) and ball bearings', 'NEMA step motorlar (17, 23, 34) ve bilyalı rulmanlar') },
        { id: 'Schematics', label: tCad.blockManager.schematics, description: t12(language, 'ISO 1219 cylinders, valves, pressure gauges & pump symbols', 'ISO 1219 silindirler, valfler, manometreler ve pompa sembolleri') },
        { id: 'Custom', label: tCad.blockManager.custom, description: t12(language, 'Locally created custom blocks and templates', 'Yerel olarak oluşturulan özel bloklar ve şablonlar') },
    ], [tCad.blockManager, language]);
    const [blocks, setBlocks] = useState<BlockDefinition[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    // Insertion scale and rotation
    const [insertScale, setInsertScale] = useState<number>(1.0);
    const [insertRotation, setInsertRotation] = useState<number>(0);
    const [showSurfaceBuilder, setShowSurfaceBuilder] = useState(false);

    // Block creation from selection state
    const [isCreating, setIsCreating] = useState(false);
    const [newBlockName, setNewBlockName] = useState('');
    const [newBlockDesc, setNewBlockDesc] = useState('');
    const [newBlockCategory, setNewBlockCategory] = useState<BlockCategory>('Custom');
    const [newBlockSubcategory, setNewBlockSubcategory] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { selectedIds, entities } = useCadStore();

    const selectedEntities = useMemo(() => {
        return entities.filter(e => selectedIds.includes(e.id));
    }, [entities, selectedIds]);

    const refreshBlocks = () => {
        const all = BlockManager.getAllBlocks();
        setBlocks(all);
        if (!selectedBlockId && all.length > 0) {
            setSelectedBlockId(all[0].id);
        }
    };

    useEffect(() => {
        if (isOpen) {
            refreshBlocks();
        }
    }, [isOpen]);

    // Compute counts per category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { All: blocks.length };
        for (const b of blocks) {
            const cat = b.category || 'Custom';
            counts[cat] = (counts[cat] || 0) + 1;
        }
        return counts;
    }, [blocks]);

    // Available subcategories for the active category
    const subcategories = useMemo(() => {
        const pool = selectedCategory === 'All' ? blocks : blocks.filter(b => (b.category || 'Custom') === selectedCategory);
        const set = new Set<string>();
        for (const b of pool) {
            if (b.subcategory) set.add(b.subcategory);
        }
        return ['All', ...Array.from(set)];
    }, [blocks, selectedCategory]);

    const handleSelectCategory = (cat: string) => {
        setSelectedCategory(cat);
        setSelectedSubcategory('All');
    };

    const filteredBlocks = useMemo(() => {
        return blocks.filter(b => {
            const matchesCategory = selectedCategory === 'All' ||
                (selectedCategory === 'Dynamic' && b.isDynamic) ||
                (selectedCategory === 'Mechanical' && (b.category === 'Mechanical' || (b.isDynamic && (b.id.includes('gear') || b.id.includes('sprocket') || b.id.includes('pulley'))))) ||
                (selectedCategory === 'Fasteners' && (b.category === 'Fasteners' || (b.isDynamic && b.id.includes('fastener')))) ||
                (b.category || 'Custom') === selectedCategory;
            const matchesSubcat = selectedSubcategory === 'All' || b.subcategory === selectedSubcategory;
            const matchesQuery = !searchQuery ||
                b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (b.subcategory && b.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSubcat && matchesQuery;
        });
    }, [blocks, selectedCategory, selectedSubcategory, searchQuery]);

    const activeBlock = useMemo(() => {
        return blocks.find(b => b.id === selectedBlockId) || filteredBlocks[0] || null;
    }, [blocks, selectedBlockId, filteredBlocks]);

    if (!isOpen) return null;

    const handleInsert = (block: BlockDefinition, scale = insertScale, rotationDeg = insertRotation) => {
        const tool = new InsertTool(block);
        tool.setScale(scale);
        tool.setRotation((rotationDeg * Math.PI) / 180);
        commandProcessor.setActiveTool(tool);
        tool.setBlock(block);
        onClose();
    };

    const handleCreateBlock = () => {
        if (!newBlockName.trim() || selectedEntities.length === 0) return;

        // Compute centroid as basePoint
        let sumX = 0, sumY = 0, count = 0;
        for (const e of selectedEntities) {
            if (e.geometry.type === 'LINE') {
                sumX += e.geometry.start.x + e.geometry.end.x;
                sumY += e.geometry.start.y + e.geometry.end.y;
                count += 2;
            } else if (e.geometry.type === 'CIRCLE' || e.geometry.type === 'ARC' || e.geometry.type === 'RECTANGLE' || e.geometry.type === 'HEXAGON') {
                sumX += e.geometry.center.x;
                sumY += e.geometry.center.y;
                count += 1;
            } else if (e.geometry.type === 'POLYLINE') {
                for (const v of e.geometry.vertices) {
                    sumX += v.x;
                    sumY += v.y;
                    count++;
                }
            }
        }
        const basePoint: Point = count > 0 ? { x: sumX / count, y: sumY / count } : { x: 0, y: 0 };

        const saved = BlockManager.saveBlock({
            name: newBlockName.trim(),
            description: newBlockDesc.trim() || undefined,
            category: newBlockCategory,
            subcategory: newBlockSubcategory.trim() || undefined,
            basePoint,
            entities: selectedEntities
        });

        setIsCreating(false);
        setNewBlockName('');
        setNewBlockDesc('');
        setNewBlockSubcategory('');
        refreshBlocks();
        setSelectedBlockId(saved.id);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this custom block from your library?')) {
            BlockManager.deleteBlock(id);
            refreshBlocks();
        }
    };

    const handleExportJson = () => {
        const json = BlockManager.exportLibraryJson();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alucad-block-library-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const count = BlockManager.importLibraryJson(content);
                alert(`Successfully imported ${count} custom block(s)!`);
                refreshBlocks();
            }
        };
        reader.readAsText(file);
        if (e.target) e.target.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="flex h-[90vh] w-[95vw] max-w-7xl flex-col rounded-lg border border-[var(--line)] bg-[var(--bg-0)] shadow-2xl overflow-hidden font-sans">
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg-1)] px-5 py-3">
                    <div className="flex items-center gap-3">
                        <Box className="h-5 w-5 text-[var(--cyan)]" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-[var(--ink)] tracking-wide uppercase">
                                    {tCad.blockManager.modalTitle}
                                </h2>
                                <span className="rounded bg-[var(--bg-3)] px-2 py-0.5 text-[10px] font-mono text-[var(--cyan)] border border-[var(--line)]">
                                    {blocks.length} {t12(language, 'Blocks', 'Blok')}
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--alu-dim)]">
                                {tCad.blockManager.modalSubtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportJson}
                            className="flex items-center gap-1.5 rounded border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1 text-xs text-[var(--alu)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-colors"
                            title={tCad.blockManager.exportLibrary}
                        >
                            <Download className="h-3.5 w-3.5" />
                            {tCad.blockManager.exportLibrary}
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 rounded border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1 text-xs text-[var(--alu)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-colors"
                            title={tCad.blockManager.importLibrary}
                        >
                            <Upload className="h-3.5 w-3.5" />
                            {tCad.blockManager.importLibrary}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImportJson}
                            className="hidden"
                        />
                        <button
                            onClick={onClose}
                            className="rounded p-1 text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Sub-bar: Category Tabs */}
                <div className="border-b border-[var(--line)] bg-[var(--bg-1)] px-5 py-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {categories.map(cat => {
                            const count = categoryCounts[cat.id] || 0;
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => handleSelectCategory(cat.id)}
                                    className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-mono whitespace-nowrap transition-colors border ${
                                        isSelected
                                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/10 text-[var(--cyan)] font-semibold shadow-sm'
                                            : 'border-transparent text-[var(--alu-dim)] hover:border-[var(--line)] hover:bg-[var(--bg-2)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    <span>{cat.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                        isSelected ? 'bg-[var(--cyan)] text-[var(--bg-0)] font-bold' : 'bg-[var(--bg-3)] text-[var(--alu-dim)]'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sub-bar 2: Subcategory Filter Chips & Search */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--bg-0)] px-5 py-2">
                    {/* Subcategories Filter Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                        {subcategories.length > 2 && (
                            <div className="flex items-center gap-1 text-[11px]">
                                <Tag className="h-3 w-3 text-[var(--alu-dim)]" />
                                {subcategories.map(sc => (
                                    <button
                                        key={sc}
                                        onClick={() => setSelectedSubcategory(sc)}
                                        className={`rounded px-2.5 py-0.5 text-[11px] font-mono whitespace-nowrap shrink-0 transition-colors ${
                                            selectedSubcategory === sc
                                                ? 'bg-[var(--bg-3)] text-[var(--cyan)] border border-[var(--cyan)]/40 font-medium shadow-sm'
                                                : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                        }`}
                                    >
                                        {sc}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search, Surface Builder & Save Selection Button */}
                    <div className="flex items-center gap-2.5 ml-auto">
                        <button
                            type="button"
                            onClick={() => setShowSurfaceBuilder(true)}
                            className="flex items-center gap-1.5 rounded border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 px-2.5 py-1 text-xs font-mono font-medium text-[var(--cyan)] hover:bg-[var(--cyan)]/20 transition-all shrink-0"
                            title={t12(language, 'Open ISO 1302 Surface Symbol Builder', 'ISO 1302 Yüzey İşareti Sihirbazını Aç')}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t12(language, 'Surface Builder', 'Yüzey Sihirbazı')}</span>
                        </button>

                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--alu-dim)]" />
                            <input
                                type="text"
                                placeholder={tCad.blockManager.searchPlaceholder}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-7 w-64 rounded border border-[var(--line)] bg-[var(--bg-1)] pl-8 pr-3 text-xs text-[var(--ink)] placeholder-[var(--alu-dim)] focus:border-[var(--cyan)] focus:outline-none"
                            />
                        </div>

                        {selectedEntities.length > 0 && (
                            <button
                                onClick={() => setIsCreating(!isCreating)}
                                className="flex items-center gap-1.5 rounded bg-[var(--bg-3)] border border-[var(--cyan)] px-3 py-1 text-xs font-semibold text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-[var(--bg-0)] transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {tCad.blockManager.saveSelected} ({selectedEntities.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Creation drawer if triggered */}
                {isCreating && (
                    <div className="border-b border-[var(--line)] bg-[var(--bg-2)] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-mono text-[var(--cyan)] font-semibold">
                                {t12(language, 'CREATE NEW BLOCK DEFINITION', 'YENİ BLOK TANIMI OLUŞTUR')} ({selectedEntities.length})
                            </span>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="text-xs text-[var(--alu-dim)] hover:text-[var(--ink)]"
                            >
                                {tCad.blockManager.cancel}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-[10px] text-[var(--alu-dim)] font-mono mb-1">{tCad.blockManager.name.toUpperCase()} *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. M12 Flanged Bolt"
                                    value={newBlockName}
                                    onChange={e => setNewBlockName(e.target.value)}
                                    className="w-full h-8 rounded border border-[var(--line)] bg-[var(--bg-0)] px-2.5 text-xs text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-[var(--alu-dim)] font-mono mb-1">{tCad.blockManager.category.toUpperCase()}</label>
                                <select
                                    value={newBlockCategory}
                                    onChange={e => setNewBlockCategory(e.target.value as any)}
                                    className="w-full h-8 rounded border border-[var(--line)] bg-[var(--bg-0)] px-2 text-xs text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                >
                                    <option value="Custom">Custom</option>
                                    <option value="Templates">Templates</option>
                                    <option value="TitleBlocks">TitleBlocks</option>
                                    <option value="Symbols">Symbols</option>
                                    <option value="Fasteners">Fasteners</option>
                                    <option value="Profiles">Profiles</option>
                                    <option value="Mounts">Mounts</option>
                                    <option value="Schematics">Schematics</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-[var(--alu-dim)] font-mono mb-1">{tCad.blockManager.subcategory.toUpperCase()}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Hex Bolts / Annotations"
                                    value={newBlockSubcategory}
                                    onChange={e => setNewBlockSubcategory(e.target.value)}
                                    className="w-full h-8 rounded border border-[var(--line)] bg-[var(--bg-0)] px-2.5 text-xs text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-[var(--alu-dim)] font-mono mb-1">{tCad.blockManager.specification.toUpperCase()}</label>
                                <input
                                    type="text"
                                    placeholder="Optional note / DIN standard"
                                    value={newBlockDesc}
                                    onChange={e => setNewBlockDesc(e.target.value)}
                                    className="w-full h-8 rounded border border-[var(--line)] bg-[var(--bg-0)] px-2.5 text-xs text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleCreateBlock}
                                    disabled={!newBlockName.trim()}
                                    className="w-full h-8 rounded bg-[var(--ok)] px-3 text-xs font-semibold text-[var(--bg-0)] hover:bg-[var(--ok)] disabled:opacity-50 transition-colors"
                                >
                                    {tCad.blockManager.saveBlock}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area: Grid + Details / Preview Inspector */}
                {selectedCategory === 'Dynamic' ? (
                    <div className="flex-1 overflow-hidden">
                        <DynamicBlockConfigurator
                            onClose={onClose}
                            onInserted2D={onClose}
                            onInserted3D={() => {
                                onClose();
                                if (typeof window !== 'undefined' && !window.location.pathname.includes('/design-studio')) {
                                    window.location.href = '/design-studio/';
                                }
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex flex-1 overflow-hidden">
                        {/* Blocks Grid */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5">
                            {filteredBlocks.map(block => {
                                const isSelected = activeBlock?.id === block.id;
                                const isStandard = STANDARD_BLOCKS.some(sb => sb.id === block.id);
                                return (
                                    <div
                                        key={block.id}
                                        onClick={() => setSelectedBlockId(block.id)}
                                        className={`group flex flex-col rounded border p-2.5 cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-[var(--cyan)] bg-[var(--bg-3)] shadow-lg shadow-[#3ad0e6]/10'
                                                : 'border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--line-strong)] hover:bg-[var(--bg-2)]'
                                        }`}
                                    >
                                        {/* Preview SVG Canvas */}
                                        <div className="relative aspect-[4/3] w-full rounded bg-[var(--bg-0)] border border-[var(--line)] flex items-center justify-center overflow-hidden mb-2">
                                            <BlockThumbnail block={block} />
                                            <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-[var(--alu-dim)] bg-[var(--bg-1)]/90 px-1 rounded">
                                                {block.entities.length}e
                                            </span>
                                            {block.isDynamic ? (
                                                <span className="absolute top-1 left-1.5 text-[8px] font-mono text-[var(--cyan)] bg-[var(--cyan)]/20 px-1 rounded border border-[var(--cyan)]/40 font-bold">
                                                    ⚡ DYN
                                                </span>
                                            ) : isStandard ? (
                                                <span className="absolute top-1 left-1.5 text-[8px] font-mono text-[var(--std)] bg-[var(--bg-3)]/90 px-1 rounded border border-[var(--std)]/30">
                                                    ISO/DIN
                                                </span>
                                            ) : (
                                                <span className="absolute top-1 left-1.5 text-[8px] font-mono text-[var(--ok)] bg-[var(--bg-3)]/90 px-1 rounded border border-[var(--ok)]/30">
                                                    USER
                                                </span>
                                            )}
                                            {block.subcategory && (
                                                <span className="absolute bottom-1 left-1.5 text-[8px] font-mono text-[var(--alu-dim)] bg-[var(--bg-0)]/90 px-1 rounded truncate max-w-[90px]">
                                                    {block.subcategory}
                                                </span>
                                            )}
                                        </div>

                                    {/* Title & Info */}
                                    <div className="flex flex-col flex-1 justify-between">
                                        <div>
                                            <div className="text-xs font-semibold text-[var(--ink)] line-clamp-1 group-hover:text-[var(--cyan)] transition-colors" title={block.name}>
                                                {block.name}
                                            </div>
                                            <div className="text-[10px] text-[var(--alu-dim)] font-mono line-clamp-1 mt-0.5" title={block.description}>
                                                {block.description || block.category || 'General'}
                                            </div>
                                        </div>

                                        <div className="mt-2.5 pt-2 border-t border-[var(--line)] flex items-center justify-between">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInsert(block);
                                                }}
                                                className="rounded bg-[var(--cyan)] px-2.5 py-1 text-[10px] font-semibold text-[var(--bg-0)] hover:bg-[var(--cyan)] transition-colors"
                                            >
                                                Insert
                                            </button>

                                            {!isStandard && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(block.id);
                                                    }}
                                                    className="p-1 text-[var(--alu-dim)] hover:text-[var(--bad)] transition-colors"
                                                    title="Delete Custom Block"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredBlocks.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-[var(--alu-dim)]">
                                <Shapes className="h-10 w-10 mb-2 opacity-40 text-[var(--cyan)]" />
                                <span className="text-xs font-mono">{tCad.blockManager.noBlocksFound}</span>
                            </div>
                        )}
                    </div>

                    {/* Inspector / Preview Pane */}
                    {activeBlock && (
                        <div className="w-84 border-l border-[var(--line)] bg-[var(--bg-0)] p-4 flex flex-col justify-between overflow-y-auto hidden md:flex">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-mono text-[var(--cyan)] uppercase tracking-wider font-semibold">
                                        {tCad.blockManager.inspector.toUpperCase()}
                                    </div>
                                    {activeBlock.subcategory && (
                                        <span className="text-[9px] font-mono text-[var(--alu-dim)] bg-[var(--bg-3)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                                            {activeBlock.subcategory}
                                        </span>
                                    )}
                                </div>

                                <div className="aspect-[4/3] w-full rounded border border-[var(--line)] bg-[var(--bg-1)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
                                    <BlockThumbnail block={activeBlock} />
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div>
                                        <span className="text-[10px] font-mono text-[var(--alu-dim)] block uppercase">{tCad.blockManager.name}</span>
                                        <span className="font-semibold text-[var(--ink)]">{activeBlock.name}</span>
                                    </div>
                                    {activeBlock.description && (
                                        <div>
                                            <span className="text-[10px] font-mono text-[var(--alu-dim)] block uppercase">{tCad.blockManager.specification}</span>
                                            <span className="text-[var(--alu)] text-[11px] leading-relaxed">{activeBlock.description}</span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div>
                                            <span className="text-[10px] font-mono text-[var(--alu-dim)] block uppercase">{tCad.blockManager.category}</span>
                                            <span className="font-mono text-[var(--cyan)]">{activeBlock.category || 'Custom'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-mono text-[var(--alu-dim)] block uppercase">{tCad.blockManager.entities}</span>
                                            <span className="font-mono text-[var(--ink)]">{activeBlock.entities.length}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-mono text-[var(--alu-dim)] block uppercase">{tCad.blockManager.basePoint}</span>
                                        <span className="font-mono text-[var(--alu-dim)]">
                                            X: {activeBlock.basePoint.x.toFixed(2)}, Y: {activeBlock.basePoint.y.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Insertion Parameters (Scale & Rotation) */}
                                <div className="pt-3 border-t border-[var(--line)] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-[var(--alu-dim)] flex items-center gap-1 uppercase">
                                            <Sliders className="h-3 w-3 text-[var(--cyan)]" />
                                            {t12(language, 'INSERTION PARAMETERS', 'YERLEŞTİRME PARAMETRELERİ')}
                                        </span>
                                    </div>

                                    {/* Scale Control */}
                                    <div>
                                        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--alu-dim)] mb-1">
                                            <span className="uppercase">{tCad.blockManager.scale}</span>
                                            <span className="text-[var(--cyan)]">{insertScale}x</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1">
                                            {[0.5, 1.0, 2.0, 5.0].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setInsertScale(s)}
                                                    className={`rounded py-1 text-[10px] font-mono border transition-colors ${
                                                        insertScale === s
                                                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/20 text-[var(--cyan)] font-semibold'
                                                            : 'border-[var(--line)] bg-[var(--bg-1)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                                    }`}
                                                >
                                                    {s}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rotation Control */}
                                    <div>
                                        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--alu-dim)] mb-1">
                                            <span className="uppercase">{tCad.blockManager.rotation}</span>
                                            <span className="text-[var(--cyan)]">{insertRotation}°</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1">
                                            {[0, 90, 180, 270].map(deg => (
                                                <button
                                                    key={deg}
                                                    onClick={() => setInsertRotation(deg)}
                                                    className={`rounded py-1 text-[10px] font-mono border transition-colors ${
                                                        insertRotation === deg
                                                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/20 text-[var(--cyan)] font-semibold'
                                                            : 'border-[var(--line)] bg-[var(--bg-1)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                                    }`}
                                                >
                                                    {deg}°
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--line)] mt-4 space-y-2">
                                {activeBlock.isDynamic && (
                                    <button
                                        onClick={() => setSelectedCategory('Dynamic')}
                                        className="w-full rounded bg-[var(--cyan)]/15 border border-[var(--cyan)]/50 py-2 text-xs font-semibold text-[var(--cyan)] hover:bg-[var(--cyan)]/25 flex items-center justify-center gap-2 transition-colors uppercase font-mono shadow-md shadow-[#00e5ff]/10"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        {t12(language, 'Configure Dynamic Block', 'Dinamik Bloğu Yapılandır')}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleInsert(activeBlock, insertScale, insertRotation)}
                                    className="w-full rounded bg-[var(--cyan)] py-2 text-xs font-semibold text-[var(--bg-0)] hover:bg-[var(--cyan)] flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#3ad0e6]/10 uppercase"
                                >
                                    <Plus className="h-4 w-4" />
                                    {tCad.blockManager.insertBlock} (I)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                )}
            </div>

            {/* ─── SURFACE FINISH BUILDER MODAL ─── */}
            <SurfaceFinishBuilderModal
                isOpen={showSurfaceBuilder}
                onClose={() => setShowSurfaceBuilder(false)}
                onBlockSaved={refreshBlocks}
                onInserted={() => {
                    setShowSurfaceBuilder(false);
                    onClose();
                }}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// DYNAMIC SVG THUMBNAIL RENDERER
// ═══════════════════════════════════════════════════════════════

function BlockThumbnail({ block }: { block: BlockDefinition }) {
    // Calculate bounding box of entities to auto-scale viewBox
    // In CAD space: Y goes up. In SVG space: Y goes down.
    // We map CAD point (x, y) to SVG point (x, -y).
    const bbox = useMemo(() => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        const expand = (x: number, y: number) => {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        };

        for (const e of block.entities) {
            const g = e.geometry as any;
            if (g.type === 'LINE') {
                expand(g.start.x, -g.start.y);
                expand(g.end.x, -g.end.y);
            } else if (g.type === 'CIRCLE') {
                expand(g.center.x - g.radius, -g.center.y - g.radius);
                expand(g.center.x + g.radius, -g.center.y + g.radius);
            } else if (g.type === 'HEXAGON') {
                expand(g.center.x - g.radius, -g.center.y - g.radius);
                expand(g.center.x + g.radius, -g.center.y + g.radius);
            } else if (g.type === 'ARC') {
                expand(g.center.x - g.radius, -g.center.y - g.radius);
                expand(g.center.x + g.radius, -g.center.y + g.radius);
            } else if (g.type === 'RECTANGLE') {
                const hw = g.width / 2;
                const hh = g.height / 2;
                expand(g.center.x - hw, -g.center.y - hh);
                expand(g.center.x + hw, -g.center.y + hh);
            } else if (g.type === 'POLYLINE') {
                const pts = g.vertices || g.points || [];
                for (const v of pts) expand(v.x, -v.y);
            } else if (g.type === 'TEXT') {
                const approxW = (g.content?.length || 1) * (g.fontSize || 3) * 0.65;
                const h = g.fontSize || 3;
                expand(g.position.x - 2, -g.position.y - h);
                expand(g.position.x + approxW + 2, -g.position.y + 2);
            } else if (g.type === 'LEADER') {
                expand(g.start.x, -g.start.y);
                expand(g.end.x, -g.end.y);
            } else if (g.type === 'ELLIPSE') {
                expand(g.center.x - g.radiusX, -g.center.y - g.radiusY);
                expand(g.center.x + g.radiusX, -g.center.y + g.radiusY);
            } else if (g.type === 'POINT') {
                expand(g.x, -g.y);
            } else if (g.type === 'HATCH') {
                if (g.boundaryVertices) {
                    for (const v of g.boundaryVertices) expand(v.x, -v.y);
                }
            }
        }

        if (minX === Infinity) {
            return { minX: -10, minY: -10, width: 20, height: 20 };
        }

        const width = Math.max(maxX - minX, 1);
        const height = Math.max(maxY - minY, 1);
        const padding = Math.max(width, height) * 0.12;

        return {
            minX: minX - padding,
            minY: minY - padding,
            width: width + padding * 2,
            height: height + padding * 2
        };
    }, [block]);

    const strokeWidth = Math.max(bbox.width * 0.012, 0.5);

    return (
        <svg
            viewBox={`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Origin indicator */}
            <circle cx={block.basePoint.x} cy={-block.basePoint.y} r={Math.min(Math.max(bbox.width * 0.012, 0.35), 0.75)} fill="#e85d5d" fillOpacity={0.65} stroke="#07090c" strokeWidth={0.25} />

            {block.entities.map((e, idx) => {
                const g = e.geometry as any;
                const strokeColor = e.color || '#3ad0e6';

                if (g.type === 'LINE') {
                    return (
                        <line
                            key={idx}
                            x1={g.start.x}
                            y1={-g.start.y}
                            x2={g.end.x}
                            y2={-g.end.y}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                        />
                    );
                }
                if (g.type === 'CIRCLE') {
                    return (
                        <circle
                            key={idx}
                            cx={g.center.x}
                            cy={-g.center.y}
                            r={g.radius}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                        />
                    );
                }
                if (g.type === 'ARC') {
                    const sp = { x: g.center.x + g.radius * Math.cos(g.startAngle), y: -(g.center.y + g.radius * Math.sin(g.startAngle)) };
                    const ep = { x: g.center.x + g.radius * Math.cos(g.endAngle), y: -(g.center.y + g.radius * Math.sin(g.endAngle)) };
                    let sweep = g.endAngle - g.startAngle;
                    if (sweep < 0) sweep += 2 * Math.PI;
                    const largeArc = sweep > Math.PI ? 1 : 0;
                    return (
                        <path
                            key={idx}
                            d={`M ${sp.x} ${sp.y} A ${g.radius} ${g.radius} 0 ${largeArc} 0 ${ep.x} ${ep.y}`}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                        />
                    );
                }
                if (g.type === 'RECTANGLE') {
                    return (
                        <rect
                            key={idx}
                            x={g.center.x - g.width / 2}
                            y={-g.center.y - g.height / 2}
                            width={g.width}
                            height={g.height}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                        />
                    );
                }
                if (g.type === 'HEXAGON') {
                    const points = polygonVertices(g).map((v) => `${v.x},${-v.y}`);
                    return (
                        <polygon
                            key={idx}
                            points={points.join(' ')}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                        />
                    );
                }
                if (g.type === 'POLYLINE') {
                    const pts = (g.vertices || g.points || []).map((v: Point) => `${v.x},${-v.y}`).join(' ');
                    return (g.closed || g.isClosed) ? (
                        <polygon key={idx} points={pts} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                    ) : (
                        <polyline key={idx} points={pts} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
                    );
                }
                if (g.type === 'TEXT') {
                    const anchor = g.justification === 'center' ? 'middle' : g.justification === 'right' ? 'end' : 'start';
                    return (
                        <text
                            key={idx}
                            x={g.position.x}
                            y={-g.position.y}
                            fill={g.color || strokeColor}
                            fontSize={g.fontSize || 3}
                            fontFamily="'JetBrains Mono', monospace"
                            fontWeight={g.bold ? 'bold' : 'normal'}
                            fontStyle={g.italic ? 'italic' : 'normal'}
                            textAnchor={anchor}
                            dominantBaseline="alphabetic"
                        >
                            {g.content}
                        </text>
                    );
                }
                if (g.type === 'LEADER') {
                    return (
                        <g key={idx}>
                            <line
                                x1={g.start.x}
                                y1={-g.start.y}
                                x2={g.end.x}
                                y2={-g.end.y}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                            />
                            {g.text && (
                                <text
                                    x={g.end.x}
                                    y={-g.end.y - 1.5}
                                    fill={strokeColor}
                                    fontSize={g.fontSize || 3}
                                    fontFamily="'JetBrains Mono', monospace"
                                    dominantBaseline="auto"
                                >
                                    {g.text}
                                </text>
                            )}
                        </g>
                    );
                }
                if (g.type === 'ELLIPSE') {
                    return (
                        <ellipse
                            key={idx}
                            cx={g.center.x}
                            cy={-g.center.y}
                            rx={g.radiusX}
                            ry={g.radiusY}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                        />
                    );
                }
                if (g.type === 'POINT') {
                    return (
                        <circle
                            key={idx}
                            cx={g.x}
                            cy={-g.y}
                            r={strokeWidth * 1.5}
                            fill={strokeColor}
                        />
                    );
                }
                if (g.type === 'HATCH') {
                    if (g.boundaryVertices && g.boundaryVertices.length > 2) {
                        const pts = g.boundaryVertices.map((v: Point) => `${v.x},${-v.y}`).join(' ');
                        return (
                            <polygon
                                key={idx}
                                points={pts}
                                fill="rgba(58, 208, 230, 0.15)"
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                            />
                        );
                    }
                }
                return null;
            })}
        </svg>
    );
}
