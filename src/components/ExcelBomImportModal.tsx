"use client";

import { useState, useRef, useMemo, useCallback } from 'react';
import { 
    FileSpreadsheet, Upload, Download, Check, AlertCircle, 
    Trash2, Plus, Copy, FileText, ArrowRight, X, Sparkles 
} from 'lucide-react';
import type { Part2D, Polygon } from '@/types/nesting2d.types';

interface ExcelBomImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportParts: (newParts: Part2D[], updatedExisting?: Part2D[]) => void;
    existingParts: Part2D[];
}

interface BomRow {
    id: string;
    label: string;
    quantity: number;
    material: string;
    thickness: number;
    width: number;
    length: number;
    rotations: string; // e.g. "0, 90, 180, 270"
    isMatchedWithDxf: boolean;
}

const SAMPLE_CSV_CONTENT = `Parca_Adi,Adet,Malzeme,Kalinlik_mm,Genislik_mm,Boy_mm,Rotasyon
TABAN_PLAKASI_P1,12,ST-37,15,450,300,0;90;180;270
FLANS_KONSOL_A,24,S355JR,10,250,180,0;90
KILAVUZ_LEVHA,8,HARDOX 450,20,600,200,0;180
ALU_YAN_KAPAK,16,6082-T6,5,320,240,0;90;180;270
DESTEK_KOPRU_B,30,ST-52,12,180,90,0;90;180;270
BAGLANTI_KULAGI,45,ST-37,8,120,80,0;90;180;270`;

/**
 * Creates a rectangular Part2D polygon from width and length
 */
function createRectangularPart(
    id: string,
    label: string,
    width: number,
    height: number,
    quantity: number,
    material?: string,
    thickness?: number,
    allowedRotations: number[] = [0, 90, 180, 270]
): Part2D {
    const points = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
    ];
    const polygon: Polygon = {
        points,
        bounds: { x: 0, y: 0, width, height },
        area: width * height,
    };

    return {
        id,
        label,
        polygon,
        quantity: Math.max(1, quantity),
        allowedRotations: allowedRotations.length > 0 ? allowedRotations : [0, 90, 180, 270],
        source: 'Excel/CSV BOM',
        material: material || 'ST-37',
        thickness: thickness || 15,
        notes: `BOM Import: ${width}×${height} mm | ${material || 'ST-37'} ${thickness || 15}mm`,
    };
}

export function ExcelBomImportModal({
    isOpen,
    onClose,
    onImportParts,
    existingParts
}: ExcelBomImportModalProps) {
    const [rawText, setRawText] = useState('');
    const [parsedRows, setParsedRows] = useState<BomRow[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [importMode, setImportMode] = useState<'create_and_merge' | 'create_only'>('create_and_merge');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Parse CSV / TSV text into structured rows
    const parseCsvToRows = useCallback((text: string): BomRow[] => {
        if (!text.trim()) return [];

        const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length === 0) return [];

        // Detect delimiter: comma, tab, or semicolon
        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes('\t')) delimiter = '\t';
        else if (firstLine.includes(';')) delimiter = ';';
        else if (firstLine.includes(',')) delimiter = ',';

        // Check if first line is a header
        const hasHeader = /(?:parca|name|part|adet|qty|malzeme|mat|kalinlik|thk|width|boy|en)/i.test(firstLine);
        const dataLines = hasHeader ? lines.slice(1) : lines;

        const rows: BomRow[] = [];

        dataLines.forEach((line, idx) => {
            const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
            if (cols.length < 2) return;

            const label = cols[0] || `BOM-Part-${idx + 1}`;
            const qty = parseInt(cols[1], 10) || 1;
            const mat = cols[2] || 'ST-37';
            const thk = parseFloat(cols[3]?.replace(',', '.')) || 15;
            const w = parseFloat(cols[4]?.replace(',', '.')) || 300;
            const l = parseFloat(cols[5]?.replace(',', '.')) || 200;
            const rot = cols[6] || '0, 90, 180, 270';

            // Check if matches an existing DXF part
            const isMatched = existingParts.some(p => 
                p.label.toLowerCase() === label.toLowerCase() ||
                (p.source && p.source.toLowerCase().includes(label.toLowerCase()))
            );

            rows.push({
                id: `bom-${Date.now()}-${idx}`,
                label,
                quantity: qty > 0 ? qty : 1,
                material: mat,
                thickness: thk > 0 ? thk : 15,
                width: w > 0 ? w : 300,
                length: l > 0 ? l : 200,
                rotations: rot,
                isMatchedWithDxf: isMatched,
            });
        });

        return rows;
    }, [existingParts]);

    // Handle text change in paste area
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setRawText(val);
        setParseError(null);
        try {
            const rows = parseCsvToRows(val);
            setParsedRows(rows);
        } catch (err: any) {
            setParseError(`Satır okuma hatası: ${err?.message || 'Bilinmeyen hata'}`);
        }
    };

    // Handle file drop or selection
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            setRawText(text);
            const rows = parseCsvToRows(text);
            setParsedRows(rows);
            setParseError(null);
        } catch {
            setParseError('Dosya okunamadı. Geçerli bir CSV veya metin dosyası seçin.');
        }
    };

    // Download Sample CSV template
    const handleDownloadSample = () => {
        const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Ornek_AluCAD_BOM_Listesi.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Update row field
    const handleUpdateRow = (id: string, field: keyof BomRow, value: any) => {
        setParsedRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    // Delete row
    const handleDeleteRow = (id: string) => {
        setParsedRows(prev => prev.filter(r => r.id !== id));
    };

    // Add empty row
    const handleAddRow = () => {
        setParsedRows(prev => [
            ...prev,
            {
                id: `manual-${Date.now()}`,
                label: `YENI_PLAKA_${prev.length + 1}`,
                quantity: 10,
                material: 'ST-37',
                thickness: 15,
                width: 400,
                length: 250,
                rotations: '0, 90, 180, 270',
                isMatchedWithDxf: false,
            }
        ]);
    };

    // Import Execution
    const handleExecuteImport = () => {
        if (parsedRows.length === 0) return;

        const newGeneratedParts: Part2D[] = [];
        const updatedExistingParts: Part2D[] = [...existingParts];

        for (const row of parsedRows) {
            // Parse rotations
            const rotList = row.rotations
                .split(/[,;\s]+/)
                .map(n => parseInt(n.trim(), 10))
                .filter(n => !isNaN(n));
            const finalRotations = rotList.length > 0 ? rotList : [0, 90, 180, 270];

            if (importMode === 'create_and_merge' && row.isMatchedWithDxf) {
                // Update matching existing DXF part
                const matchIdx = updatedExistingParts.findIndex(p => 
                    p.label.toLowerCase() === row.label.toLowerCase() ||
                    (p.source && p.source.toLowerCase().includes(row.label.toLowerCase()))
                );
                if (matchIdx !== -1) {
                    updatedExistingParts[matchIdx] = {
                        ...updatedExistingParts[matchIdx],
                        quantity: row.quantity,
                        material: row.material,
                        thickness: row.thickness,
                        allowedRotations: finalRotations,
                        notes: `BOM Güncelleme: ${row.material} ${row.thickness}mm`,
                    };
                    continue;
                }
            }

            // Create new rectangular part
            const part = createRectangularPart(
                `bom-part-${Date.now()}-${row.label}`,
                row.label,
                row.width,
                row.length,
                row.quantity,
                row.material,
                row.thickness,
                finalRotations
            );
            newGeneratedParts.push(part);
        }

        onImportParts(newGeneratedParts, updatedExistingParts);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden font-sans">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-0)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[var(--cyan)]">
                            <FileSpreadsheet size={22} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2">
                                Toplu Parça İçe Aktarma & Excel / CSV BOM Modülü
                                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-[var(--cyan)] font-mono font-normal">
                                    Endüstriyel CAM Uyumlu
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 font-mono">
                                Excel&apos;den kopyala-yapıştır yapın veya CSV/TSV yükleyin. DXF parçalarıyla eşleştirin veya doğrudan sac plaka oluşturun.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    
                    {/* Top Action Bar: File Upload + Template Download */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* File Upload / Drag area */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-[var(--line)] hover:border-cyan-500/50 bg-[var(--bg-0)]/50 hover:bg-cyan-950/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all text-center group"
                        >
                            <input 
                                ref={fileInputRef} 
                                type="file" 
                                accept=".csv,.tsv,.txt" 
                                onChange={handleFileUpload} 
                                className="hidden" 
                            />
                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-[var(--cyan)] mb-2 transition-colors" />
                            <p className="text-xs font-bold text-slate-200">
                                Excel CSV / TSV Dosyası Seç veya Sürükle
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                                Virgül, noktalı virgül veya sekme (tab) ayraçlı dosyalar desteklenir
                            </p>
                        </div>

                        {/* Direct Clipboard / Template Download */}
                        <div className="flex flex-col justify-between bg-[var(--bg-0)]/40 border border-[var(--line)] rounded-xl p-4">
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-[var(--cyan)]" />
                                    Hızlı Şablon & İpuçları
                                </span>
                                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                                    Excel&apos;de tablonuzu seçip <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200">Ctrl+C</kbd> yapın, aşağıdaki alana <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200">Ctrl+V</kbd> ile yapıştırın. Sütunlar anında otomatik ayrıştırılır.
                                </p>
                            </div>
                            <button
                                onClick={handleDownloadSample}
                                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <Download size={13} className="text-[var(--cyan)]" />
                                Örnek BOM Şablonu İndir (.csv)
                            </button>
                        </div>
                    </div>

                    {/* Text Area for Direct Paste */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <Copy size={13} className="text-[var(--cyan)]" />
                                Excel Verisini Buraya Yapıştırın (CSV / TSV)
                            </label>
                            {parsedRows.length > 0 && (
                                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                                    <Check size={13} /> {parsedRows.length} parça satırı ayrıştırıldı
                                </span>
                            )}
                        </div>
                        <textarea
                            value={rawText}
                            onChange={handleTextChange}
                            placeholder="Örnek:&#10;TABAN_PLAKASI, 12, ST-37, 15, 450, 300, 0;90&#10;FLANS_KONSOL, 24, S355JR, 10, 250, 180, 0;90;180;270"
                            rows={3}
                            className="w-full bg-[var(--bg-0)] border border-[var(--line)] focus:border-[var(--cyan)] rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none transition-colors"
                        />
                        {parseError && (
                            <p className="text-xs text-rose-400 font-mono flex items-center gap-1">
                                <AlertCircle size={13} /> {parseError}
                            </p>
                        )}
                    </div>

                    {/* Parsed Items Table Preview */}
                    {parsedRows.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
                                    Ayrıştırılan Parça Listesi ({parsedRows.length} Adet Tür)
                                </span>
                                <button
                                    onClick={handleAddRow}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-[var(--cyan)] border border-[var(--line)] flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <Plus size={13} /> Satır Ekle
                                </button>
                            </div>

                            <div className="border border-[var(--line)] rounded-lg overflow-x-auto max-h-60 bg-[var(--bg-0)]">
                                <table className="w-full text-left text-xs font-mono border-collapse">
                                    <thead className="bg-[var(--bg-1)] border-b border-[var(--line)] text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
                                        <tr>
                                            <th className="p-2.5">Durum</th>
                                            <th className="p-2.5">Parça / DXF Adı</th>
                                            <th className="p-2.5 text-center">Adet</th>
                                            <th className="p-2.5">Malzeme</th>
                                            <th className="p-2.5 text-center">Kalınlık (mm)</th>
                                            <th className="p-2.5 text-center">En × Boy (mm)</th>
                                            <th className="p-2.5">İzinli Rotasyon</th>
                                            <th className="p-2.5 text-right">Sil</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--line)]/60">
                                        {parsedRows.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="p-2.5">
                                                    {row.isMatchedWithDxf ? (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-[var(--cyan)] border border-cyan-500/30">
                                                            DXF Eşleşti
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                            Yeni Sac
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2.5 font-bold text-slate-200">
                                                    <input
                                                        type="text"
                                                        value={row.label}
                                                        onChange={(e) => handleUpdateRow(row.id, 'label', e.target.value)}
                                                        className="bg-transparent border-b border-transparent hover:border-[var(--line)] focus:border-[var(--cyan)] focus:outline-none w-full"
                                                    />
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={row.quantity}
                                                        onChange={(e) => handleUpdateRow(row.id, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="w-16 bg-[var(--bg-0)] border border-[var(--line)] rounded px-1.5 py-0.5 text-center text-cyan-400 font-bold focus:outline-none"
                                                    />
                                                </td>
                                                <td className="p-2.5">
                                                    <input
                                                        type="text"
                                                        value={row.material}
                                                        onChange={(e) => handleUpdateRow(row.id, 'material', e.target.value)}
                                                        className="bg-[var(--bg-0)] border border-[var(--line)] rounded px-1.5 py-0.5 text-slate-200 w-24 focus:outline-none"
                                                    />
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    <input
                                                        type="number"
                                                        step={0.5}
                                                        value={row.thickness}
                                                        onChange={(e) => handleUpdateRow(row.id, 'thickness', parseFloat(e.target.value) || 15)}
                                                        className="w-14 bg-[var(--bg-0)] border border-[var(--line)] rounded px-1.5 py-0.5 text-center text-amber-400 focus:outline-none"
                                                    />
                                                </td>
                                                <td className="p-2.5 text-center text-slate-300">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input
                                                            type="number"
                                                            value={row.width}
                                                            onChange={(e) => handleUpdateRow(row.id, 'width', parseFloat(e.target.value) || 100)}
                                                            className="w-14 bg-[var(--bg-0)] border border-[var(--line)] rounded px-1 text-center"
                                                        />
                                                        <span>×</span>
                                                        <input
                                                            type="number"
                                                            value={row.length}
                                                            onChange={(e) => handleUpdateRow(row.id, 'length', parseFloat(e.target.value) || 100)}
                                                            className="w-14 bg-[var(--bg-0)] border border-[var(--line)] rounded px-1 text-center"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2.5 text-slate-400">
                                                    <input
                                                        type="text"
                                                        value={row.rotations}
                                                        onChange={(e) => handleUpdateRow(row.id, 'rotations', e.target.value)}
                                                        className="bg-[var(--bg-0)] border border-[var(--line)] rounded px-1.5 py-0.5 w-24 text-[11px] focus:outline-none"
                                                    />
                                                </td>
                                                <td className="p-2.5 text-right">
                                                    <button
                                                        onClick={() => handleDeleteRow(row.id)}
                                                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Mode Selector */}
                    {parsedRows.length > 0 && existingParts.length > 0 && (
                        <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-lg space-y-2">
                            <span className="text-xs font-bold font-mono text-slate-300 uppercase">
                                İçe Aktarma Stratejisi
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                                <label className={`p-2.5 rounded border flex items-center gap-2 cursor-pointer transition-all ${
                                    importMode === 'create_and_merge' 
                                        ? 'bg-cyan-500/10 border-[var(--cyan)] text-slate-100' 
                                        : 'border-[var(--line)] text-slate-400'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="import_mode" 
                                        checked={importMode === 'create_and_merge'} 
                                        onChange={() => setImportMode('create_and_merge')}
                                        className="accent-[var(--cyan)]"
                                    />
                                    <span>DXF Parçalarıyla Eşleştir & Güncelle (Önerilen)</span>
                                </label>
                                <label className={`p-2.5 rounded border flex items-center gap-2 cursor-pointer transition-all ${
                                    importMode === 'create_only' 
                                        ? 'bg-cyan-500/10 border-[var(--cyan)] text-slate-100' 
                                        : 'border-[var(--line)] text-slate-400'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="import_mode" 
                                        checked={importMode === 'create_only'} 
                                        onChange={() => setImportMode('create_only')}
                                        className="accent-[var(--cyan)]"
                                    />
                                    <span>Tümünü Bağımsız Dikdörtgen Plaka Olarak Ekle</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[var(--line)] bg-[var(--bg-0)] flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono transition-colors cursor-pointer"
                    >
                        İptal
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">
                            Toplam {parsedRows.reduce((sum, r) => sum + r.quantity, 0)} Adet Parça
                        </span>
                        <button
                            onClick={handleExecuteImport}
                            disabled={parsedRows.length === 0}
                            className="px-5 py-2 rounded-lg bg-[var(--cyan)] hover:bg-[var(--cyan)] text-[var(--bg-0)] text-xs font-black font-mono tracking-wider uppercase transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                        >
                            <Check size={14} />
                            Nesting Listesine Aktar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
