'use client';

/**
 * AluCAD — SolidWorks-Style Tool Property Panel
 * 
 * Renders a contextual input form when a tool is active.
 * Each tool has its own set of labeled inputs and action buttons.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useCadStore } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import { useI18nStore } from '@/store/i18nStore';
import { trCad } from './cadPanelI18n';
import {
    Check, X, RotateCcw, ChevronDown, ChevronRight,
    Minus, Circle, Square, Hexagon, Spline, Scissors,
    Blend, Maximize, CornerUpRight, Copy, Move, RotateCw,
    FlipHorizontal, Ruler, Cog, Nut, Type, Scan, Pencil,
    Link, LifeBuoy, Printer, Layers, Columns3
} from 'lucide-react';
import { SurfaceFinishIcon, CrossSectionIcon, BeltPulleyIcon, RollerChainIcon, TSlotIcon } from './CadIcons';
import { largestRegion } from '../geometry/contourAssembler';
import { motion, AnimatePresence } from 'framer-motion';
import { METRIC_TABLE } from '../commands/tools/FastenerDrawTool';

// ═══════════════════════════════════════════════════════════════
// PROPERTY SCHEMA DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface PropertyField {
    key: string;
    label: string;
    type: 'number' | 'text' | 'select' | 'toggle' | 'info';
    default?: any;
    options?: { value: string; label: string }[];
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
}

interface PropertySection {
    title: string;
    icon?: React.ReactNode;
    fields: PropertyField[];
    collapsed?: boolean;
}

interface ToolSchema {
    title: string;
    icon: React.ReactNode;
    sections: PropertySection[];
    actions?: { label: string; action: string; variant?: 'primary' | 'secondary' }[];
}

const TOOL_SCHEMAS: Record<string, ToolSchema> = {
    LINE: {
        title: 'Line',
        icon: <Minus size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'x1', label: 'X1 (Başlangıç)', type: 'number', unit: 'mm' },
                    { key: 'y1', label: 'Y1 (Başlangıç)', type: 'number', unit: 'mm' },
                    { key: 'x2', label: 'X2 (Bitiş)', type: 'number', unit: 'mm' },
                    { key: 'y2', label: 'Y2 (Bitiş)', type: 'number', unit: 'mm' },
                    { key: 'length', label: 'Uzunluk', type: 'info', unit: 'mm' },
                    { key: 'angle', label: 'Açı', type: 'info', unit: '°' },
                ]
            }
        ],
    },
    PLINE: {
        title: 'Polyline',
        icon: <Pencil size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'closed', label: 'Closed', type: 'toggle', default: false },
                    { key: 'vertices', label: 'Vertices', type: 'info' },
                ]
            }
        ],
    },
    CIRCLE: {
        title: 'Circle',
        icon: <Circle size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'cx', label: 'Center X', type: 'number', unit: 'mm' },
                    { key: 'cy', label: 'Center Y', type: 'number', unit: 'mm' },
                    { key: 'radius', label: 'Radius', type: 'number', unit: 'mm', min: 0.1, step: 0.5 },
                    { key: 'diameter', label: 'Diameter', type: 'info', unit: 'mm' },
                ]
            }
        ],
    },
    RECTANGLE: {
        title: 'Rectangle',
        icon: <Square size={16} />,
        sections: [
            {
                title: 'Geometri',
                fields: [
                    { key: 'width', label: 'Genişlik (w)', type: 'number', unit: 'mm', min: 0.1 },
                    { key: 'height', label: 'Yükseklik (h)', type: 'number', unit: 'mm', min: 0.1 },
                    { key: 'rotation', label: 'Dönme Açısı', type: 'number', unit: '°', default: 0 },
                ]
            }
        ],
    },
    POLYGON: {
        title: 'Polygon',
        icon: <Hexagon size={16} />,
        sections: [
            {
                title: 'Poligon Ayarları',
                fields: [
                    { key: 'sides', label: 'Kenar Sayısı (N)', type: 'number', min: 3, max: 100, default: 6 },
                    { key: 'radius', label: 'Yarıçap (R)', type: 'number', unit: 'mm', min: 0.1 },
                    { key: 'rotation', label: 'Dönme Açısı', type: 'number', unit: '°', default: 0 },
                ]
            }
        ],
    },
    ARC: {
        title: 'Arc',
        icon: <Spline size={16} />,
        sections: [
            {
                title: 'Parameters',
                fields: [
                    { key: 'radius', label: 'Radius', type: 'number', unit: 'mm', min: 0.1 },
                    { key: 'startAngle', label: 'Start Angle', type: 'number', unit: '°' },
                    { key: 'endAngle', label: 'End Angle', type: 'number', unit: '°' },
                ]
            }
        ],
    },
    TRIM: {
        title: 'Trim (Budama)',
        icon: <Scissors size={16} />,
        sections: [
            {
                title: 'Canlı Çit Budama',
                fields: [
                    { key: 'trailMode', label: '🖱️ Sürükle-Kes (Fence Trail)', type: 'info', default: 'Aktif (Çizgi çekerek kes)' },
                ]
            }
        ],
        actions: [
            { label: 'Tüm Kesişimleri Seç (Enter)', action: 'ENTER', variant: 'secondary' },
        ],
    },
    FILLET: {
        title: 'Fillet (Radyus)',
        icon: <Blend size={16} />,
        sections: [
            {
                title: 'Radyus Parametreleri',
                fields: [
                    { key: 'radius', label: 'Yarıçap (R)', type: 'number', unit: 'mm', min: 0.1, default: 5, step: 0.5 },
                ]
            }
        ],
        actions: [
            { label: '⚡ Tüm Köşeleri Yuvarlat (All)', action: 'FILLET_ALL', variant: 'primary' },
            { label: 'R1', action: 'FILLET_R1' },
            { label: 'R2', action: 'FILLET_R2' },
            { label: 'R5', action: 'FILLET_R5' },
            { label: 'R10', action: 'FILLET_R10' },
            { label: 'R20', action: 'FILLET_R20' },
        ],
    },
    CHAMFER: {
        title: 'Chamfer (Pah Kırma)',
        icon: <Scissors size={16} />,
        sections: [
            {
                title: 'Pah Mesafeleri',
                fields: [
                    { key: 'distance1', label: 'Mesafe 1 (d1)', type: 'number', unit: 'mm', min: 0.1, default: 5, step: 0.5 },
                    { key: 'distance2', label: 'Mesafe 2 (d2)', type: 'number', unit: 'mm', min: 0.1, default: 5, step: 0.5 },
                ]
            }
        ],
        actions: [
            { label: '⚡ Tüm Köşelere Pah Kır (All)', action: 'CHAMFER_ALL', variant: 'primary' },
            { label: '1×45°', action: 'CHAMFER_1X45' },
            { label: '2×45°', action: 'CHAMFER_2X45' },
            { label: '5×45°', action: 'CHAMFER_5X45' },
            { label: '10×45°', action: 'CHAMFER_10X45' },
        ],
    },
    OFFSET: {
        title: 'Offset (Ötele)',
        icon: <CornerUpRight size={16} />,
        sections: [
            {
                title: 'Öteleme Mesafesi',
                fields: [
                    { key: 'distance', label: 'Mesafe', type: 'number', unit: 'mm', min: 0.1, default: 10 },
                ]
            }
        ],
        actions: [
            { label: 'Dışa Ötele (+10mm)', action: 'OFFSET_OUT', variant: 'primary' },
            { label: 'İçe Ötele (-10mm)', action: 'OFFSET_IN' },
            { label: 'Uygula (Enter)', action: 'ENTER' },
        ],
    },
    SCALE: {
        title: 'Scale (Ölçekle)',
        icon: <Maximize size={16} />,
        sections: [
            {
                title: 'Ölçek Faktörü',
                fields: [
                    { key: 'factor', label: 'Faktör', type: 'number', min: 0.01, max: 100, step: 0.1, default: 2 },
                ]
            }
        ],
        actions: [
            { label: '2x Büyüt', action: 'SCALE_2X', variant: 'primary' },
            { label: '0.5x Küçült (Yarıya İndir)', action: 'SCALE_HALF' },
            { label: '3x Büyüt', action: 'SCALE_3X' },
            { label: 'Uygula (Enter)', action: 'ENTER' },
        ],
    },
    JOIN: {
        title: 'Join (Birleştir)',
        icon: <Link size={16} />,
        sections: [
            {
                title: 'Polyline Birleştirme',
                fields: [
                    { key: 'joinInfo', label: 'Durum', type: 'info', default: 'Uç uca değen çizgileri Polyline yapar' },
                ]
            }
        ],
        actions: [
            { label: 'Seçilenleri Birleştir (Enter)', action: 'JOIN_EXEC', variant: 'primary' },
        ],
    },
    GROUP: {
        title: 'Group (Grupla)',
        icon: <LifeBuoy size={16} />,
        sections: [
            {
                title: 'Grup Özellikleri',
                fields: [
                    { key: 'groupInfo', label: 'Durum', type: 'info', default: 'Nesneleri tek bir montaj grubu olarak bağlar' },
                ]
            }
        ],
        actions: [
            { label: 'Grup Oluştur (G)', action: 'GROUP_EXEC', variant: 'primary' },
        ],
    },
    UNGROUP: {
        title: 'Ungroup (Grubu Çöz)',
        icon: <LifeBuoy size={16} />,
        sections: [
            {
                title: 'Grup Çözme',
                fields: [
                    { key: 'ungroupInfo', label: 'Durum', type: 'info', default: 'Seçili grubun bağını çözer' },
                ]
            }
        ],
        actions: [
            { label: 'Grubu Çöz (UNG)', action: 'UNGROUP_EXEC', variant: 'primary' },
        ],
    },
    EXPLODE: {
        title: 'Explode (Patlat)',
        icon: <Scissors size={16} />,
        sections: [
            {
                title: 'Parçalama',
                fields: [
                    { key: 'explodeInfo', label: 'Durum', type: 'info', default: 'Polyline, dikdörtgen ve blokları çizgi parçalarına ayırır' },
                ]
            }
        ],
        actions: [
            { label: 'Patlat / Parçala (X)', action: 'EXPLODE_EXEC', variant: 'primary' },
        ],
    },
    DIMENSION: {
        title: 'Linear Dimension',
        icon: <Scan size={16} />,
        sections: [
            {
                title: 'Tolerans (GD&T)',
                fields: [
                    { key: 'tolMode', label: 'Tolerans', type: 'select', options: [
                        { value: 'none', label: 'Yok' },
                        { value: 'bilateral', label: 'Simetrik (±)' },
                        { value: 'asymmetric', label: 'Asimetrik (+/-)' },
                    ], default: 'none' },
                    { key: 'tolUpper', label: 'Üst (+)', type: 'number', unit: 'mm', default: 0.05, step: 0.005 },
                    { key: 'tolLower', label: 'Alt (-)', type: 'number', unit: 'mm', default: -0.01, step: 0.005 },
                ]
            }
        ],
        actions: [
            { label: '📐 Hemen Yerleştir (Enter)', action: 'PLACE_DIM_NOW', variant: 'primary' },
            { label: '±0.05 Tolerans Ekle', action: 'TOL_BILATERAL' },
        ],
    },
    MEASURE: {
        title: 'Measure (Mesafe Ölç)',
        icon: <Ruler size={16} />,
        sections: [
            {
                title: 'Canlı Ölçüm Bilgisi',
                fields: [
                    { key: 'measureStatus', label: 'Durum', type: 'info', default: 'Noktaları veya Şekli Tıklayın' },
                ]
            }
        ],
        actions: [
            { label: '📐 Kalıcı Ölçüye Dönüştür (Enter)', action: 'CONVERT_TO_DIM', variant: 'primary' },
        ],
    },
    LEADER: {
        title: 'Leader Note (Lider Not)',
        icon: <CornerUpRight size={16} />,
        sections: [
            {
                title: 'Not Metni',
                fields: [
                    { key: 'text', label: 'Metin', type: 'text', default: 'ÖLÇÜ NOTU / NOT' },
                ]
            }
        ],
        actions: [
            { label: '📌 Lider Notu Hemen Ekle', action: 'PLACE_LEADER_NOW', variant: 'primary' },
            { label: 'R0.5 TÜM KÖŞELER', action: 'SET_NOTE_R' },
            { label: 'ÇAPAKLARI TEMİZLEYİN', action: 'SET_NOTE_DEBURR' },
            { label: 'KAYNAK DİKİŞİ 5mm', action: 'SET_NOTE_WELD' },
            { label: '▽ Ra 3.2 GENEL TALAŞLI', action: 'SET_NOTE_SURF_32' },
            { label: '▽ Ra 1.6 RULMAN YATAĞI', action: 'SET_NOTE_SURF_16' },
            { label: '▽ Ra 0.8 TAŞLAMA', action: 'SET_NOTE_SURF_08' },
        ],
    },
    SURFACE: {
        title: 'Surface Finish (Yüzey İşareti)',
        icon: <SurfaceFinishIcon size={16} />,
        sections: [
            {
                title: 'Parametreler',
                fields: [
                    {
                        key: 'mode',
                        label: 'Yerleşim Modu',
                        type: 'select',
                        options: [
                            { value: 'LEADER', label: '📌 Lider Ok İle (Leader)' },
                            { value: 'DIRECT', label: '🎯 Doğrudan Yerleştir (Direct)' },
                        ],
                        default: 'LEADER'
                    },
                    {
                        key: 'roughnessParam',
                        label: 'Parametre',
                        type: 'select',
                        options: [
                            { value: 'Ra', label: 'Ra (Aritmetik Ortalama)' },
                            { value: 'Rz', label: 'Rz (Ortalama Tepe/Vadi)' },
                            { value: 'Rmax', label: 'Rmax (Maksimum Tepe)' },
                        ],
                        default: 'Ra'
                    },
                    {
                        key: 'roughnessValue',
                        label: 'Pürüzlülük (μm)',
                        type: 'text',
                        default: '3.2'
                    },
                    {
                        key: 'symbolType',
                        label: 'İmalat Türü',
                        type: 'select',
                        options: [
                            { value: 'machining_required', label: 'Talaşlı (Kapalı Bar)' },
                            { value: 'any_process', label: 'Serbest (Açık V)' },
                            { value: 'machining_prohibited', label: 'Talaşsız (Daireli)' },
                        ],
                        default: 'machining_required'
                    },
                ]
            }
        ],
        actions: [
            { label: '📌 Yüzey İşaretini Hemen Ekle', action: 'PLACE_SURF_NOW', variant: 'primary' },
            { label: 'Ra 3.2 (Genel Talaşlı)', action: 'SET_SURF_RA32' },
            { label: 'Ra 1.6 (Rulman Yatağı)', action: 'SET_SURF_RA16' },
            { label: 'Ra 0.8 (Yüzey Taşlama)', action: 'SET_SURF_RA08' },
            { label: 'Ra 0.4 (Hassas Taşlama)', action: 'SET_SURF_RA04' },
            { label: 'Ra 0.2 (Honlama)', action: 'SET_SURF_RA02' },
            { label: 'Ra 12.5 (Döküm / Talaşsız)', action: 'SET_SURF_RA125' },
            { label: '🛠️ Ayrıntılı Oluşturucu Aç', action: 'OPEN_SURF_BUILDER', variant: 'secondary' },
        ],
    },
    SURF_LEADER: {
        title: 'Surface Leader (Yüzey Lideri)',
        icon: <SurfaceFinishIcon size={16} />,
        sections: [
            {
                title: 'Parametreler',
                fields: [
                    {
                        key: 'roughnessParam',
                        label: 'Parametre',
                        type: 'select',
                        options: [
                            { value: 'Ra', label: 'Ra (Aritmetik Ortalama)' },
                            { value: 'Rz', label: 'Rz (Ortalama Tepe/Vadi)' },
                            { value: 'Rmax', label: 'Rmax (Maksimum Tepe)' },
                        ],
                        default: 'Ra'
                    },
                    {
                        key: 'roughnessValue',
                        label: 'Pürüzlülük (μm)',
                        type: 'text',
                        default: '3.2'
                    },
                    {
                        key: 'symbolType',
                        label: 'İmalat Türü',
                        type: 'select',
                        options: [
                            { value: 'machining_required', label: 'Talaşlı (Kapalı Bar)' },
                            { value: 'any_process', label: 'Serbest (Açık V)' },
                            { value: 'machining_prohibited', label: 'Talaşsız (Daireli)' },
                        ],
                        default: 'machining_required'
                    },
                ]
            }
        ],
        actions: [
            { label: '📌 Lider İşareti Hemen Ekle', action: 'PLACE_SURF_NOW', variant: 'primary' },
            { label: 'Ra 3.2 (Genel Talaşlı)', action: 'SET_SURF_RA32' },
            { label: 'Ra 1.6 (Rulman Yatağı)', action: 'SET_SURF_RA16' },
            { label: 'Ra 0.8 (Yüzey Taşlama)', action: 'SET_SURF_RA08' },
            { label: 'Ra 0.4 (Hassas Taşlama)', action: 'SET_SURF_RA04' },
            { label: 'Ra 0.2 (Honlama)', action: 'SET_SURF_RA02' },
            { label: '🛠️ Ayrıntılı Oluşturucu Aç', action: 'OPEN_SURF_BUILDER', variant: 'secondary' },
        ],
    },
    SURFACE_DIRECT: {
        title: 'Direct Surface Finish (Doğrudan)',
        icon: <SurfaceFinishIcon size={16} />,
        sections: [
            {
                title: 'Parametreler',
                fields: [
                    {
                        key: 'roughnessParam',
                        label: 'Parametre',
                        type: 'select',
                        options: [
                            { value: 'Ra', label: 'Ra' },
                            { value: 'Rz', label: 'Rz' },
                        ],
                        default: 'Ra'
                    },
                    {
                        key: 'roughnessValue',
                        label: 'Pürüzlülük (μm)',
                        type: 'text',
                        default: '3.2'
                    },
                ]
            }
        ],
        actions: [
            { label: '📌 Doğrudan Ekle', action: 'PLACE_SURF_NOW', variant: 'primary' },
            { label: 'Ra 3.2 (Genel)', action: 'SET_SURF_RA32' },
            { label: 'Ra 1.6 (Rulman)', action: 'SET_SURF_RA16' },
            { label: 'Ra 0.8 (Taşlama)', action: 'SET_SURF_RA08' },
            { label: '🛠️ Oluşturucu Aç', action: 'OPEN_SURF_BUILDER', variant: 'secondary' },
        ],
    },
    ELLIPSE: {
        title: 'Ellipse (Elips)',
        icon: <Circle size={16} />,
        sections: [
            {
                title: 'Eksen Boyutları',
                fields: [
                    { key: 'radiusX', label: 'Eksen 1 (Rx)', type: 'number', unit: 'mm', min: 1, default: 40 },
                    { key: 'radiusY', label: 'Eksen 2 (Ry)', type: 'number', unit: 'mm', min: 1, default: 20 },
                ]
            }
        ],
    },
    SPLINE: {
        title: 'Spline Curve (Eğri)',
        icon: <Spline size={16} />,
        sections: [
            {
                title: 'Eğri Durumu',
                fields: [
                    { key: 'splineStatus', label: 'Durum', type: 'info', default: 'Noktalara tıklayın, Enter veya Çift Tık ile bitirin' },
                ]
            }
        ],
        actions: [
            { label: 'Eğriyi Tamamla (Enter)', action: 'FINISH_SPLINE', variant: 'primary' },
            { label: 'Eğriyi Kapat (C)', action: 'CLOSE_SPLINE' },
        ],
    },
    HATCH: {
        title: 'Hatch (Tarama)',
        icon: <Blend size={16} />,
        sections: [
            {
                title: 'Desen ve Ölçek',
                fields: [
                    { key: 'pattern', label: 'Desen', type: 'select', options: [
                        { value: 'ANSI31', label: 'ANSI31 (45° Çizgili)' },
                        { value: 'SOLID', label: 'SOLID (Dolu Dolgu)' },
                        { value: 'CROSS', label: 'CROSS (Kare Izgara)' },
                        { value: 'HONEYCOMB', label: 'HONEYCOMB (Balpeteği)' },
                    ], default: 'ANSI31' },
                    { key: 'scale', label: 'Ölçek', type: 'number', min: 0.1, max: 10, step: 0.1, default: 1 },
                ]
            }
        ],
        actions: [
            { label: 'Kapalı Şekle Uygula (Enter)', action: 'ENTER' },
        ],
    },
    TEXT: {
        title: 'Text Annotation (Not)',
        icon: <Type size={16} />,
        sections: [
            {
                title: 'Metin İçeriği',
                fields: [
                    { key: 'content', label: 'Metin', type: 'text', default: 'Not / Metin' },
                ]
            },
            {
                title: 'Yazı Boyutu ve Stil',
                fields: [
                    { key: 'fontSize', label: 'Boyut (pt)', type: 'number', unit: 'pt', min: 6, max: 200, default: 14 },
                    { key: 'bold', label: 'Kalın (Bold)', type: 'toggle', default: false },
                    { key: 'italic', label: 'İtalik', type: 'toggle', default: false },
                    { key: 'justification', label: 'Hizala', type: 'select', options: [
                        { value: 'left', label: 'Sol' },
                        { value: 'center', label: 'Orta' },
                        { value: 'right', label: 'Sağ' },
                    ], default: 'left' },
                ]
            }
        ],
        actions: [
            { label: '📌 Çizime Yerleştir / Ekle', action: 'PLACE_TEXT_NOW', variant: 'primary' },
            { label: 'TOLERANS ±0.05', action: 'STAMP_TOL' },
            { label: 'MALZEME: 6082-T6', action: 'STAMP_MAT' },
            { label: 'ÇAPAKLARI TEMİZLEYİN', action: 'STAMP_DEBURR' },
        ],
    },
    MOVE: {
        title: 'Move (Taşı)',
        icon: <Move size={16} />,
        sections: [{ title: 'Öteleme Vektörü', fields: [
            { key: 'dx', label: 'Delta X', type: 'number', unit: 'mm', default: 50 },
            { key: 'dy', label: 'Delta Y', type: 'number', unit: 'mm', default: 0 },
        ]}],
        actions: [
            { label: '→ +50mm Sağa Taşı', action: 'MOVE_RIGHT' },
            { label: '↑ +50mm Yukarı Taşı', action: 'MOVE_UP' },
        ],
    },
    COPY: {
        title: 'Copy (Kopyala)',
        icon: <Copy size={16} />,
        sections: [{ title: 'Öteleme ve Adet', fields: [
            { key: 'dx', label: 'Delta X', type: 'number', unit: 'mm', default: 50 },
            { key: 'dy', label: 'Delta Y', type: 'number', unit: 'mm', default: 0 },
            { key: 'count', label: 'Adet', type: 'number', min: 1, max: 20, default: 1 },
        ]}],
        actions: [
            { label: '→ +50mm Sağa Kopyala', action: 'COPY_RIGHT' },
            { label: '↑ +50mm Yukarı Kopyala', action: 'COPY_UP' },
        ],
    },
    ROTATE: {
        title: 'Rotate (Döndür)',
        icon: <RotateCw size={16} />,
        sections: [{ title: 'Dönme Açısı', fields: [
            { key: 'angle', label: 'Açı', type: 'number', unit: '°', default: 90, step: 5 },
        ]}],
        actions: [
            { label: '⟳ +90° Çevir', action: 'ROT_90' },
            { label: '⟲ -90° Çevir', action: 'ROT_MINUS_90' },
            { label: '↻ +45° Çevir', action: 'ROT_45' },
            { label: '↺ 180° Ters Çevir', action: 'ROT_180' },
        ],
    },
    MIRROR: {
        title: 'Mirror (Aynala)',
        icon: <FlipHorizontal size={16} />,
        sections: [{ title: 'Aynalama Seçenekleri', fields: [
            { key: 'deleteSource', label: 'Kaynak Şekli Sil', type: 'toggle', default: false },
        ]}],
        actions: [
            { label: '↕ Dikey Eksen (Vertical)', action: 'MIRROR_VERT' },
            { label: '↔ Yatay Eksen (Horizontal)', action: 'MIRROR_HORIZ' },
        ],
    },
    EXTEND: {
        title: 'Extend (Uzat)',
        icon: <Maximize size={16} />,
        sections: [{ title: 'Options', fields: [
            { key: 'mode', label: 'Mode', type: 'select', options: [
                { value: 'boundary', label: 'To Boundary' },
            ]},
        ]}],
    },
    GEAR: {
        title: 'Evolvent Dişli (ISO 53 / DIN 867)',
        icon: <Cog size={16} />,
        sections: [
            {
                title: 'Dişli Parametreleri',
                fields: [
                    { key: 'module', label: 'Modül (m)', type: 'number', unit: 'mm', min: 0.5, max: 50, step: 0.5, default: 2 },
                    { key: 'teethCount', label: 'Diş Sayısı (z)', type: 'number', min: 6, max: 200, step: 1, default: 20 },
                    {
                        key: 'pressureAngle',
                        label: 'Kavrama Açısı (α)',
                        type: 'select',
                        options: [
                            { value: '20', label: '20° (Standart ISO/DIN)' },
                            { value: '14.5', label: '14.5° (Eski / ANSI)' },
                            { value: '25', label: '25° (Ağır Hizmet)' },
                        ],
                        default: '20',
                    },
                ],
            },
            {
                title: 'Hesaplanan Ölçüler (DIN)',
                fields: [
                    { key: 'pitchDia', label: 'Taksimat Çapı (d)', type: 'info', unit: 'mm', default: '40.0' },
                    { key: 'addendumDia', label: 'Dişüstü Çapı (da)', type: 'info', unit: 'mm', default: '44.0' },
                    { key: 'dedendumDia', label: 'Dişdibi Çapı (df)', type: 'info', unit: 'mm', default: '35.0' },
                ],
            },
        ],
        actions: [
            { label: '📌 Çizime Yerleştir', action: 'PLACE_GEAR_NOW', variant: 'primary' },
            { label: '🔗 Karşılık Dişli (Mating)', action: 'START_MATING_GEAR' },
            { label: '🪐 Planet Dişli Grubu', action: 'START_PLANETARY_GEAR' },
            { label: 'm=1.5 z=24 (d=36mm)', action: 'GEAR_M15_Z24' },
            { label: 'm=2.0 z=20 (d=40mm)', action: 'GEAR_M2_Z20' },
            { label: 'm=2.5 z=30 (d=75mm)', action: 'GEAR_M25_Z30' },
            { label: 'm=3.0 z=40 (d=120mm)', action: 'GEAR_M3_Z40' },
            { label: 'm=4.0 z=25 (d=100mm)', action: 'GEAR_M4_Z25' },
        ],
    },
    MATING_GEAR: {
        title: 'Karşılık Dişli (Mating Gear)',
        icon: <Cog size={16} />,
        sections: [
            {
                title: 'Karşılık Dişli Parametreleri',
                fields: [
                    { key: 'targetTeeth', label: 'Diş Sayısı (z2)', type: 'number', min: 6, max: 200, default: 30 },
                ]
            }
        ],
        actions: [
            { label: 'z=20 Karşılık', action: 'MATING_Z20' },
            { label: 'z=30 Karşılık', action: 'MATING_Z30' },
            { label: 'z=40 Karşılık', action: 'MATING_Z40' },
            { label: 'z=60 Karşılık (1:3)', action: 'MATING_Z60' },
        ]
    },
    BELT_PULLEY: {
        title: 'Kayış & Kasnak (ISO 5296 / DIN 7721)',
        icon: <BeltPulleyIcon size={16} />,
        sections: [
            {
                title: 'Kasnak Ölçüleri',
                fields: [
                    { key: 'radius1', label: '1. Kasnak Yarıçapı (R1)', type: 'number', unit: 'mm', min: 5, max: 500, default: 50 },
                    { key: 'radius2', label: '2. Kasnak Yarıçapı (R2)', type: 'number', unit: 'mm', min: 5, max: 500, default: 30 },
                    {
                        key: 'beltType',
                        label: 'Kayış Tipi',
                        type: 'select',
                        options: [
                            { value: 'OPEN', label: 'Düz Kayış (Open Belt)' },
                            { value: 'CROSSED', label: 'Çapraz Kayış (Crossed)' },
                        ],
                        default: 'OPEN',
                    },
                ]
            }
        ],
        actions: [
            { label: '📌 Çizime Yerleştir', action: 'PLACE_BELT_NOW', variant: 'primary' },
            { label: 'R50 / R30 (1.67:1 İndirgeme)', action: 'BELT_50_30' },
            { label: 'R40 / R40 (1:1 Birebir)', action: 'BELT_40_40' },
            { label: 'R30 / R60 (1:2 Hızlandırma)', action: 'BELT_30_60' },
            { label: 'R80 / R40 (2:1 Redüksiyon)', action: 'BELT_80_40' },
        ],
    },
    PLANETARY_GEAR: {
        title: 'Planet Dişli Grubu (Epicyclic)',
        icon: <LifeBuoy size={16} />,
        sections: [
            {
                title: 'Parametreler',
                fields: [
                    { key: 'module', label: 'Modül (m)', type: 'number', unit: 'mm', min: 0.5, default: 2 },
                    { key: 'sunTeeth', label: 'Güneş Dişli (Zs)', type: 'number', min: 6, default: 20 },
                    { key: 'planetTeeth', label: 'Planet Dişli (Zp)', type: 'number', min: 6, default: 20 },
                ]
            }
        ],
        actions: [
            { label: '📌 Çizime Yerleştir', action: 'PLACE_PLANET_NOW', variant: 'primary' },
            { label: 'm=1.5 Zs=18 Zp=18', action: 'PLANET_M15' },
            { label: 'm=2.0 Zs=20 Zp=20', action: 'PLANET_M20' },
            { label: 'm=2.5 Zs=24 Zp=24', action: 'PLANET_M25' },
        ],
    },
    ROLLER_CHAIN: {
        title: 'Rulo Zincir Dişlisi (ISO 606 / DIN 8187)',
        icon: <RollerChainIcon size={16} />,
        sections: [
            {
                title: 'Zincir ve Dişli Parametreleri',
                fields: [
                    {
                        key: 'standard',
                        label: 'Zincir Standardı',
                        type: 'select',
                        options: [
                            { value: '06B', label: '06B (3/8" - p=9.525mm, d1=6.35mm)' },
                            { value: '08B', label: '08B (1/2" - p=12.700mm, d1=8.51mm) — Standart' },
                            { value: '10B', label: '10B (5/8" - p=15.875mm, d1=10.16mm)' },
                            { value: '12B', label: '12B (3/4" - p=19.050mm, d1=12.07mm)' },
                            { value: '16B', label: '16B (1" - p=25.400mm, d1=15.88mm)' },
                        ],
                        default: '08B',
                    },
                    { key: 'teeth', label: 'Diş Sayısı (z)', type: 'number', min: 6, max: 150, step: 1, default: 19 },
                    { key: 'boreDiameter', label: 'Mil Göbek Çapı (mm)', type: 'number', unit: 'mm', min: 0, max: 120, default: 20 },
                ],
            },
            {
                title: 'Hesaplanan Ölçüler (ISO 606)',
                fields: [
                    { key: 'pitchDia', label: 'Taksimat Çapı (d)', type: 'info', unit: 'mm', default: '77.2' },
                    { key: 'tipDia', label: 'Dış Tepe Çapı (da)', type: 'info', unit: 'mm', default: '84.0' },
                    { key: 'rootDia', label: 'Dişdibi Çapı (df)', type: 'info', unit: 'mm', default: '68.7' },
                ],
            },
        ],
        actions: [
            { label: '📌 Çizime Yerleştir', action: 'PLACE_SPROCKET_NOW', variant: 'primary' },
            { label: '08B z=17 (d=69.1mm)', action: 'SPROCKET_08B_17' },
            { label: '08B z=19 (d=77.2mm)', action: 'SPROCKET_08B_19' },
            { label: '08B z=25 (d=101.3mm)', action: 'SPROCKET_08B_25' },
            { label: '08B z=38 (d=153.8mm)', action: 'SPROCKET_08B_38' },
            { label: '06B z=21 (d=63.9mm)', action: 'SPROCKET_06B_21' },
            { label: '10B z=19 (d=96.5mm)', action: 'SPROCKET_10B_19' },
        ],
    },
    PLOT: {
        title: 'Çizim ve Yazdırma (Plot)',
        icon: <Printer size={16} />,
        sections: [
            {
                title: 'Kağıt ve Yerleşim',
                fields: [
                    { key: 'paperSize', label: 'Sayfa Boyutu', type: 'select', options: [
                        { value: 'A4', label: 'A4 (210x297)' },
                        { value: 'A3', label: 'A3 (297x420)' },
                        { value: 'A2', label: 'A2 (420x594)' },
                        { value: 'Letter', label: 'Letter (ANSI A)' },
                    ], default: 'A4' },
                    { key: 'orientation', label: 'Oryantasyon', type: 'select', options: [
                        { value: 'LANDSCAPE', label: 'Yatay (Landscape)' },
                        { value: 'PORTRAIT', label: 'Dikey (Portrait)' },
                    ], default: 'LANDSCAPE' },
                    { key: 'scale', label: 'Ölçek', type: 'select', options: [
                        { value: 'FIT', label: 'Sığdır (Fit to Paper)' },
                        { value: '1:1', label: 'Gerçek Ölçek (1:1)' },
                        { value: '1:2', label: 'Yarım Ölçek (1:2)' },
                        { value: '1:5', label: 'Mühendislik (1:5)' },
                        { value: '1:10', label: 'Plan Ölçeği (1:10)' },
                    ], default: 'FIT' },
                ]
            },
            {
                title: 'Antet Bilgileri',
                fields: [
                    { key: 'showTitleBlock', label: 'Teknik Antet Ekle', type: 'toggle', default: true },
                    { key: 'partName', label: 'Parça İsmi', type: 'text', default: 'Yeni Parça' },
                    { key: 'designer', label: 'Tasarımcı', type: 'text', default: 'AluCAD User' },
                    { key: 'approver', label: 'Onaylayan', type: 'text', default: '' },
                    { key: 'company', label: 'Firma Adı', type: 'text', default: 'AluCAD Engineering' },
                ]
            }
        ],
    },
    FASTENER: {
        title: 'Fastener / Cıvata & Somun (ISO/DIN)',
        icon: <Nut size={16} />,
        sections: [
            {
                title: 'Eleman ve Standart',
                fields: [
                    {
                        key: 'fastenerType',
                        label: 'Bağlantı Türü',
                        type: 'select',
                        options: [
                            { value: 'BOLT', label: '🔩 Cıvata (ISO 4014 / DIN 931)' },
                            { value: 'NUT', label: '⬡ Altıköşe Somun (ISO 4032)' },
                        ],
                        default: 'BOLT',
                    },
                    {
                        key: 'diameter',
                        label: 'Metrik Çap (M)',
                        type: 'select',
                        options: [
                            { value: '3', label: 'M3 (Adım 0.5 mm)' },
                            { value: '4', label: 'M4 (Adım 0.7 mm)' },
                            { value: '5', label: 'M5 (Adım 0.8 mm)' },
                            { value: '6', label: 'M6 (Adım 1.0 mm)' },
                            { value: '8', label: 'M8 (Adım 1.25 mm)' },
                            { value: '10', label: 'M10 (Adım 1.5 mm)' },
                            { value: '12', label: 'M12 (Adım 1.75 mm)' },
                            { value: '16', label: 'M16 (Adım 2.0 mm)' },
                            { value: '20', label: 'M20 (Adım 2.5 mm)' },
                            { value: '24', label: 'M24 (Adım 3.0 mm)' },
                        ],
                        default: '10',
                    },
                    {
                        key: 'length',
                        label: 'Gövde Boyu (L)',
                        type: 'number',
                        unit: 'mm',
                        min: 5,
                        max: 300,
                        default: 40,
                    },
                ],
            },
            {
                title: 'Görünüş ve Yön',
                fields: [
                    {
                        key: 'view',
                        label: 'Çizim Görünüşü',
                        type: 'select',
                        options: [
                            { value: 'SIDE', label: '📐 Yan / Profil (ISO 4014)' },
                            { value: 'TOP', label: '⬡ Üst / Eksenel (ISO 6410)' },
                        ],
                        default: 'SIDE',
                    },
                    {
                        key: 'direction',
                        label: 'Yerleşim Yönü',
                        type: 'select',
                        options: [
                            { value: '-90', label: '⬇️ Aşağı (-90°, Standart)' },
                            { value: '0', label: '➡️ Sağa (0° Yatay)' },
                            { value: '90', label: '⬆️ Yukarı (90° Dikey)' },
                            { value: '180', label: '⬅️ Sola (180° Ters)' },
                        ],
                        default: '-90',
                    },
                    {
                        key: 'threadStyle',
                        label: 'Diş Çizim Stili',
                        type: 'select',
                        options: [
                            { value: 'DETAILED', label: '⚙️ Detaylı (Helis & Dişler)' },
                            { value: 'SCHEMATIC', label: '📐 Şematik (ISO 6410 Resim)' },
                        ],
                        default: 'DETAILED',
                    },
                ],
            },
            {
                title: 'Standart Ölçüleri (ISO 4014 / 4032)',
                fields: [
                    { key: 'headW', label: 'Anahtar Ağzı (s)', type: 'info', unit: 'mm', default: '16.0' },
                    { key: 'headH', label: 'Baş / Somun Boyu (k/m)', type: 'info', unit: 'mm', default: '6.4' },
                    { key: 'pitch', label: 'Diş Adımı (P)', type: 'info', unit: 'mm', default: '1.50' },
                    { key: 'rootDia', label: 'Dişdibi Çapı (d1)', type: 'info', unit: 'mm', default: '8.38' },
                ],
            },
        ],
        actions: [
            { label: '📌 Çizime Yerleştir', action: 'PLACE_FASTENER_NOW', variant: 'primary' },
            { label: '🔄 Yönü Döndür (90°)', action: 'FAST_ROTATE_90' },
            { label: 'M6×25 Cıvata (ISO 4014)', action: 'FAST_M6_25' },
            { label: 'M8×30 Cıvata (ISO 4014)', action: 'FAST_M8_30' },
            { label: 'M10×40 Cıvata (ISO 4014)', action: 'FAST_M10_40' },
            { label: 'M12×50 Cıvata (ISO 4014)', action: 'FAST_M12_50' },
            { label: 'M8 Somun (ISO 4032)', action: 'FAST_NUT_M8' },
            { label: 'M10 Somun (ISO 4032)', action: 'FAST_NUT_M10' },
        ],
    },
    TSLOT: {
        title: 'T-Slot Alüminyum Profil (Wellste / EN 12020)',
        icon: <TSlotIcon size={16} />,
        sections: [
            {
                title: 'Profil Modeli (Wellste Kataloğu)',
                fields: [
                    {
                        key: 'specId',
                        label: 'Profil Seçin',
                        type: 'select',
                        options: [
                            // 20 Series
                            { value: '2020', label: '20×20 (Slot 6, 0.65 kg/m)' },
                            { value: '2040', label: '20×40 (Slot 6, 1.10 kg/m)' },
                            { value: '2060', label: '20×60 (Slot 6, 1.45 kg/m)' },
                            { value: '2080', label: '20×80 (Slot 6, 1.98 kg/m)' },
                            // 30 Series
                            { value: '3030', label: '30×30 (Slot 8, 1.05 kg/m)' },
                            { value: '3060', label: '30×60 (Slot 8, 1.85 kg/m)' },
                            { value: '3090', label: '30×90 (Slot 8, 2.85 kg/m)' },
                            { value: '30120', label: '30×120 (Slot 8, 3.98 kg/m)' },
                            { value: '30150', label: '30×150 (Slot 8, 4.50 kg/m)' },
                            { value: '6060-30', label: '60×60 (Slot 8 30s, 3.20 kg/m)' },
                            // 40 Series
                            { value: '4040', label: '40×40 (Slot 8, 1.75 kg/m)' },
                            { value: '4040H', label: '40×40 Ağır (Slot 10, 2.10 kg/m)' },
                            { value: '4060', label: '40×60 (Slot 8, 2.45 kg/m)' },
                            { value: '4080', label: '40×80 (Slot 8, 3.25 kg/m)' },
                            { value: '40120', label: '40×120 (Slot 8, 4.90 kg/m)' },
                            { value: '40160', label: '40×160 (Slot 8, 7.20 kg/m)' },
                            { value: '8080-40', label: '80×80 (Slot 8 40s, 5.80 kg/m)' },
                            // 45 Series
                            { value: '4545', label: '45×45 (Slot 10, 2.20 kg/m)' },
                            { value: '4545H', label: '45×45 Ağır (Slot 10, 2.50 kg/m)' },
                            { value: '4560', label: '45×60 (Slot 10, 2.80 kg/m)' },
                            { value: '4590', label: '45×90 (Slot 10, 4.50 kg/m)' },
                            { value: '9090-45', label: '90×90 (Slot 10 45s, 7.80 kg/m)' },
                            // 50 Series
                            { value: '5050', label: '50×50 (Slot 10, 2.95 kg/m)' },
                            { value: '50100', label: '50×100 (Slot 10, 4.90 kg/m)' },
                            // 60 Series
                            { value: '6060', label: '60×60 (Slot 10, 3.80 kg/m)' },
                            { value: '60120', label: '60×120 (Slot 10, 6.80 kg/m)' },
                            // 80 Series
                            { value: '8080', label: '80×80 (Slot 10, 5.80 kg/m)' },
                            { value: '80160', label: '80×160 (Slot 10, 12.60 kg/m)' },
                        ],
                        default: '4040',
                    },
                    {
                        key: 'alloy',
                        label: 'Alaşım Standardı',
                        type: 'info',
                        default: 'EN AW-6063-T5 / EN 755',
                    },
                ],
            },
        ],
        actions: [
            { label: '📌 Çizime Yerleştir', action: 'PLACE_TSLOT_NOW', variant: 'primary' },
            { label: '🎯 Orijine Yerleştir (0,0)', action: 'PLACE_TSLOT_ORIGIN' },
            { label: '40×40 Standart (Kanal 8)', action: 'SET_TSLOT_4040' },
            { label: '40×80 Dikdörtgen (Kanal 8)', action: 'SET_TSLOT_4080' },
            { label: '20×20 Kompakt (Kanal 6)', action: 'SET_TSLOT_2020' },
            { label: '20×40 Dikdörtgen (Kanal 6)', action: 'SET_TSLOT_2040' },
            { label: '30×30 Standart (Kanal 8)', action: 'SET_TSLOT_3030' },
            { label: '30×60 Dikdörtgen (Kanal 8)', action: 'SET_TSLOT_3060' },
            { label: '45×45 Standart (Kanal 10)', action: 'SET_TSLOT_4545' },
            { label: '45×90 Ağır Dikdörtgen', action: 'SET_TSLOT_4590' },
            { label: '80×80 Ağır Şasi (Kanal 10)', action: 'SET_TSLOT_8080' },
            { label: '80×160 Dev Kolon (Kanal 10)', action: 'SET_TSLOT_80160' },
        ],
    },
    CROSS_SECTION: {
        title: 'Kesit & Atalet Analizi (DIN EN 1993)',
        icon: <CrossSectionIcon size={16} />,
        sections: [
            {
                title: 'Analiz Durumu',
                fields: [
                    {
                        key: 'sectionStatus',
                        label: 'Durum',
                        type: 'info',
                        default: 'Kapalı profile tıklayın veya sağ paneldeki kesit özelliklerini inceleyin.',
                    },
                ],
            },
        ],
        actions: [
            { label: '📋 Analiz Raporunu Kopyala', action: 'COPY_SECTION_REPORT', variant: 'primary' },
            { label: '📥 CSV Olarak İndir', action: 'EXPORT_SECTION_CSV' },
            { label: '🔍 Seçili Profili Analiz Et', action: 'ANALYZE_SELECTED' },
            { label: '📊 Tüm Çizimi Analiz Et', action: 'ANALYZE_ALL' },
        ],
    },
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ToolPropertyPanel() {
    const { activeCommand, commandPrompt } = useCadStore();
    const { language } = useI18nStore();
    const [values, setValues] = useState<Record<string, any>>({});
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const schema = activeCommand ? TOOL_SCHEMAS[activeCommand] : null;

    // Initialize defaults when tool changes
    useEffect(() => {
        if (!schema) { setValues({}); return; }
        const defaults: Record<string, any> = {};
        for (const section of schema.sections) {
            for (const field of section.fields) {
                if (field.default !== undefined) defaults[field.key] = field.default;
            }
        }
        const cmd = commandProcessor.getActiveCommand();
        if (cmd && activeCommand?.startsWith('SURF') && 'getMode' in cmd) {
            defaults.mode = (cmd as any).getMode();
        } else if (cmd && activeCommand === 'FASTENER' && 'getParams' in cmd) {
            const p = (cmd as any).getParams();
            defaults.fastenerType = p.type;
            defaults.diameter = String(p.diameter);
            defaults.length = p.length;
            defaults.view = p.view || 'SIDE';
            defaults.threadStyle = p.threadStyle || 'DETAILED';
            const rotDeg = p.rotation !== undefined ? Math.round((p.rotation * 180) / Math.PI) : -90;
            defaults.direction = String(rotDeg);

            const meta = METRIC_TABLE[p.diameter] || { headH: p.diameter * 0.65, headW: p.diameter * 1.6, pitch: p.diameter * 0.15, nutH: p.diameter * 0.8 };
            defaults.headW = meta.headW.toFixed(1);
            defaults.headH = (p.type === 'BOLT' ? meta.headH : meta.nutH).toFixed(1);
            defaults.pitch = (p.pitch || meta.pitch).toFixed(2);
            defaults.rootDia = (p.diameter - 1.08253 * (p.pitch || meta.pitch)).toFixed(2);
        } else if (cmd && activeCommand === 'TSLOT' && 'getSize' in cmd) {
            defaults.size = String((cmd as any).getSize());
        } else if (cmd && activeCommand === 'GEAR' && 'getParams' in cmd) {
            const p = (cmd as any).getParams();
            defaults.module = p.module;
            defaults.teethCount = p.teethCount;
            defaults.pressureAngle = String(p.pressureAngle);
            const m = Number(p.module) || 2;
            const z = Number(p.teethCount) || 20;
            defaults.pitchDia = (m * z).toFixed(1);
            defaults.addendumDia = (m * (z + 2)).toFixed(1);
            defaults.dedendumDia = (m * (z - 2.5)).toFixed(1);
        } else if (cmd && activeCommand === 'BELT_PULLEY' && 'getParams' in cmd) {
            const p = (cmd as any).getParams();
            defaults.radius1 = p.radius1;
            defaults.radius2 = p.radius2;
            defaults.beltType = p.beltType || 'OPEN';
        } else if (cmd && activeCommand === 'ROLLER_CHAIN' && 'getParams' in cmd) {
            const p = (cmd as any).getParams();
            defaults.standard = p.standard;
            defaults.teeth = p.teeth;
            defaults.boreDiameter = p.boreDiameter;
            const z = Number(p.teeth) || 19;
            const std = p.standard || '08B';
            const pitch = std === '06B' ? 9.525 : std === '10B' ? 15.875 : std === '12B' ? 19.05 : std === '16B' ? 25.4 : 12.7;
            const d1 = std === '06B' ? 6.35 : std === '10B' ? 10.16 : std === '12B' ? 12.07 : std === '16B' ? 15.88 : 8.51;
            const pitchDia = pitch / Math.sin(Math.PI / Math.max(6, z));
            const tipDia = pitchDia + pitch * (1 - 1.6 / Math.max(6, z)) - d1;
            const rootDia = pitchDia - d1;
            defaults.pitchDia = pitchDia.toFixed(1);
            defaults.tipDia = tipDia.toFixed(1);
            defaults.rootDia = rootDia.toFixed(1);
        }

        if (activeCommand === 'GEAR' && !defaults.pitchDia) {
            const m = Number(defaults.module) || 2;
            const z = Number(defaults.teethCount) || 20;
            defaults.pitchDia = (m * z).toFixed(1);
            defaults.addendumDia = (m * (z + 2)).toFixed(1);
            defaults.dedendumDia = (m * (z - 2.5)).toFixed(1);
        } else if (activeCommand === 'ROLLER_CHAIN' && !defaults.pitchDia) {
            const z = Number(defaults.teeth) || 19;
            const std = defaults.standard || '08B';
            const pitch = std === '06B' ? 9.525 : std === '10B' ? 15.875 : std === '12B' ? 19.05 : std === '16B' ? 25.4 : 12.7;
            const d1 = std === '06B' ? 6.35 : std === '10B' ? 10.16 : std === '12B' ? 12.07 : std === '16B' ? 15.88 : 8.51;
            const pitchDia = pitch / Math.sin(Math.PI / Math.max(6, z));
            const tipDia = pitchDia + pitch * (1 - 1.6 / Math.max(6, z)) - d1;
            const rootDia = pitchDia - d1;
            defaults.pitchDia = pitchDia.toFixed(1);
            defaults.tipDia = tipDia.toFixed(1);
            defaults.rootDia = rootDia.toFixed(1);
        }

        setValues(defaults);
        // Initialize collapsed sections
        const collapsed: Record<string, boolean> = {};
        schema.sections.forEach((s, i) => { if (s.collapsed) collapsed[`${i}`] = true; });
        setCollapsedSections(collapsed);
    }, [activeCommand]);

    const handleValueChange = useCallback((key: string, value: any) => {
        let updated: Record<string, any> = {};

        setValues(prev => {
            const next = { ...prev, [key]: value };

            if (activeCommand === 'FASTENER') {
                const dia = Number(next.diameter) || 10;
                const meta = METRIC_TABLE[dia] || { headH: dia * 0.65, headW: dia * 1.6, pitch: dia * 0.15, nutH: dia * 0.8 };
                const pitch = meta.pitch;
                next.headW = meta.headW.toFixed(1);
                next.headH = (next.fastenerType === 'BOLT' ? meta.headH : meta.nutH).toFixed(1);
                next.pitch = pitch.toFixed(2);
                next.rootDia = (dia - 1.08253 * pitch).toFixed(2);
            } else if (activeCommand === 'GEAR') {
                const m = Number(next.module) || 2;
                const z = Number(next.teethCount) || 20;
                next.pitchDia = (m * z).toFixed(1);
                next.addendumDia = (m * (z + 2)).toFixed(1);
                next.dedendumDia = (m * (z - 2.5)).toFixed(1);
            } else if (activeCommand === 'ROLLER_CHAIN') {
                const z = Number(next.teeth) || 19;
                const std = next.standard || '08B';
                const pitch = std === '06B' ? 9.525 : std === '10B' ? 15.875 : std === '12B' ? 19.05 : std === '16B' ? 25.4 : 12.7;
                const d1 = std === '06B' ? 6.35 : std === '10B' ? 10.16 : std === '12B' ? 12.07 : std === '16B' ? 15.88 : 8.51;
                const pitchDia = pitch / Math.sin(Math.PI / Math.max(6, z));
                const tipDia = pitchDia + pitch * (1 - 1.6 / Math.max(6, z)) - d1;
                const rootDia = pitchDia - d1;
                next.pitchDia = pitchDia.toFixed(1);
                next.tipDia = tipDia.toFixed(1);
                next.rootDia = rootDia.toFixed(1);
            }

            updated = next;
            return next;
        });

        // Defer any tool parameter updates and store notifications outside of React's state calculation/render
        queueMicrotask(() => {
            const cmd = commandProcessor.getActiveCommand();
            if (!cmd) return;

            if (activeCommand === 'FILLET' && key === 'radius') {
                const r = Number(value);
                if (r > 0 && 'setRadius' in cmd && typeof (cmd as any).setRadius === 'function') {
                    (cmd as any).setRadius(r);
                }
            } else if (activeCommand === 'CHAMFER' && (key === 'distance1' || key === 'distance2')) {
                const d1 = key === 'distance1' ? Number(value) : Number(updated.distance1 || 5);
                const d2 = key === 'distance2' ? Number(value) : Number(updated.distance2 || d1);
                if (d1 > 0 && 'setDistances' in cmd && typeof (cmd as any).setDistances === 'function') {
                    (cmd as any).setDistances(d1, d2);
                }
            } else if (activeCommand?.startsWith('SURF')) {
                if (key === 'mode' && 'setMode' in cmd) {
                    (cmd as any).setMode(value);
                }
                if ((key === 'roughnessParam' || key === 'roughnessValue') && 'setRoughness' in cmd) {
                    (cmd as any).setRoughness(updated.roughnessParam || 'Ra', String(updated.roughnessValue || '3.2'));
                }
                if (key === 'symbolType' && 'setSymbolType' in cmd) {
                    (cmd as any).setSymbolType(value);
                }
            } else if (activeCommand === 'FASTENER') {
                const dia = Number(updated.diameter) || 10;
                const rotDeg = Number(updated.direction !== undefined ? updated.direction : -90);
                const rotRad = (rotDeg * Math.PI) / 180;

                if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                    (cmd as any).setParams({
                        type: (updated.fastenerType || 'BOLT') as any,
                        diameter: dia,
                        length: Number(updated.length) || 40,
                        rotation: rotRad,
                        view: (updated.view || 'SIDE') as any,
                        threadStyle: (updated.threadStyle || 'DETAILED') as any,
                    });
                }
            } else if (activeCommand === 'TSLOT') {
                if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                    (cmd as any).setParams({
                        specId: updated.specId || updated.size || '4040',
                    });
                }
            } else if (activeCommand === 'GEAR') {
                if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                    (cmd as any).setParams({
                        module: Number(updated.module) || 2,
                        teethCount: Number(updated.teethCount) || 20,
                        pressureAngle: Number(updated.pressureAngle) || 20,
                    });
                }
            } else if (activeCommand === 'BELT_PULLEY') {
                if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                    (cmd as any).setParams({
                        radius1: Number(updated.radius1) || 50,
                        radius2: Number(updated.radius2) || 30,
                        beltType: updated.beltType || 'OPEN',
                    });
                }
            } else if (activeCommand === 'ROLLER_CHAIN') {
                if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                    (cmd as any).setParams({
                        standard: updated.standard || '08B',
                        teeth: Number(updated.teeth) || 19,
                        boreDiameter: Number(updated.boreDiameter) || 20,
                    });
                }
            }
        });
    }, [activeCommand]);

    const handleApply = useCallback(() => {
        if (!activeCommand) return;
        const cmd = commandProcessor.getActiveCommand();
        if (!cmd) return;

        if (activeCommand === 'ROTATE') {
            if ('setAngle' in cmd && typeof (cmd as any).setAngle === 'function') {
                (cmd as any).setAngle(Number(values.angle) || 0);
            }
        } else if (activeCommand === 'COPY') {
            if ('setDisplacement' in cmd && typeof (cmd as any).setDisplacement === 'function') {
                (cmd as any).setDisplacement(Number(values.dx) || 0, Number(values.dy) || 0, Number(values.count) || 1);
            }
        } else if (activeCommand === 'MOVE') {
            if ('setDisplacement' in cmd && typeof (cmd as any).setDisplacement === 'function') {
                (cmd as any).setDisplacement(Number(values.dx) || 0, Number(values.dy) || 0);
            }
        } else if (activeCommand === 'MIRROR') {
            if ('setDeleteSource' in cmd && typeof (cmd as any).setDeleteSource === 'function') {
                (cmd as any).setDeleteSource(Boolean(values.deleteSource));
            }
        } else if (activeCommand === 'TEXT') {
            if ('setTextParams' in cmd && typeof (cmd as any).setTextParams === 'function') {
                (cmd as any).setTextParams({
                    content: values.content || 'Not / Metin',
                    fontSize: Number(values.fontSize) || 14,
                    bold: Boolean(values.bold),
                    italic: Boolean(values.italic),
                    justification: values.justification || 'left',
                });
            }
        } else if (activeCommand === 'LEADER') {
            if ('setAnnotationText' in cmd && typeof (cmd as any).setAnnotationText === 'function') {
                (cmd as any).setAnnotationText(values.text || 'ÖLÇÜ NOTU / NOT');
            }
        } else if (activeCommand?.startsWith('SURF')) {
            if ('setMode' in cmd && values.mode) {
                (cmd as any).setMode(values.mode);
            }
            if ('setRoughness' in cmd && values.roughnessValue) {
                (cmd as any).setRoughness(values.roughnessParam || 'Ra', String(values.roughnessValue));
            }
            if ('setSymbolType' in cmd && values.symbolType) {
                (cmd as any).setSymbolType(values.symbolType);
            }
        } else if (activeCommand === 'DIMENSION') {
            if ('setTolerance' in cmd && typeof (cmd as any).setTolerance === 'function') {
                (cmd as any).setTolerance(Number(values.tolUpper), Number(values.tolLower));
            }
        } else if (activeCommand === 'GEAR') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    module: Number(values.module) || 2,
                    teethCount: Number(values.teethCount) || 20,
                    pressureAngle: Number(values.pressureAngle) || 20,
                });
            }
        } else if (activeCommand === 'MATING_GEAR') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    targetTeeth: Number(values.targetTeeth) || 30,
                });
            }
        } else if (activeCommand === 'BELT_PULLEY') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    radius1: Number(values.radius1) || 50,
                    radius2: Number(values.radius2) || 30,
                    beltType: values.beltType || 'OPEN',
                });
            }
        } else if (activeCommand === 'ROLLER_CHAIN') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    standard: values.standard || '08B',
                    teeth: Number(values.teeth) || 19,
                    boreDiameter: Number(values.boreDiameter) || 20,
                });
            }
        } else if (activeCommand === 'PLANETARY_GEAR') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    module: Number(values.module) || 2,
                    sunTeeth: Number(values.sunTeeth) || 20,
                    planetTeeth: Number(values.planetTeeth) || 20,
                });
            }
        } else if (activeCommand === 'POLYGON' || activeCommand === 'HEXAGON') {
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    sides: Number(values.sides) || 6,
                    radius: Number(values.radius) || 20,
                    rotation: Number(values.rotation) || 0,
                });
            }
        } else if (activeCommand === 'FASTENER') {
            const rotDeg = Number(values.direction !== undefined ? values.direction : -90);
            const rotRad = (rotDeg * Math.PI) / 180;
            if ('setParams' in cmd && typeof (cmd as any).setParams === 'function') {
                (cmd as any).setParams({
                    type: (values.fastenerType || 'BOLT') as any,
                    diameter: Number(values.diameter) || 10,
                    length: Number(values.length) || 40,
                    rotation: rotRad,
                    view: (values.view || 'SIDE') as any,
                    threadStyle: (values.threadStyle || 'DETAILED') as any,
                });
            } else {
                cmd.onValueInput(values.fastenerType || 'BOLT');
                cmd.onValueInput(String(values.diameter || 10));
                if ((values.fastenerType || 'BOLT') !== 'NUT') {
                    cmd.onValueInput(String(values.length || 40));
                }
            }
        } else if (activeCommand === 'FILLET') {
            if ('setRadius' in cmd && typeof (cmd as any).setRadius === 'function') {
                (cmd as any).setRadius(Number(values.radius) || 5);
            } else {
                cmd.onValueInput(String(values.radius || 5));
            }
        } else if (activeCommand === 'CHAMFER') {
            if ('setDistances' in cmd && typeof (cmd as any).setDistances === 'function') {
                (cmd as any).setDistances(Number(values.distance1) || 5, Number(values.distance2) || Number(values.distance1) || 5);
            } else {
                cmd.onValueInput(`${values.distance1 || 5},${values.distance2 || values.distance1 || 5}`);
            }
        } else if (activeCommand === 'OFFSET') {
            cmd.onValueInput(String(values.distance || 10));
        } else if (activeCommand === 'PLOT') {
            if ('onParamChange' in cmd && typeof (cmd as any).onParamChange === 'function') {
                (cmd as any).onParamChange(values);
            }
        }
    }, [activeCommand, values]);

    const handleCancel = useCallback(() => {
        commandProcessor.setActiveCommand(null);
    }, []);

    const handleAction = useCallback((action: string) => {
        const cmd = commandProcessor.getActiveCommand();
        if (!cmd) return;

        if (action === 'ENTER') {
            cmd.onKeyInput('Enter');
        } else if (action === 'FILLET_ALL' && 'filletAll' in cmd) {
            (cmd as any).filletAll();
        } else if (action === 'FILLET_R1' && 'setRadius' in cmd) {
            (cmd as any).setRadius(1);
            setValues(prev => ({ ...prev, radius: 1 }));
        } else if (action === 'FILLET_R2' && 'setRadius' in cmd) {
            (cmd as any).setRadius(2);
            setValues(prev => ({ ...prev, radius: 2 }));
        } else if (action === 'FILLET_R5' && 'setRadius' in cmd) {
            (cmd as any).setRadius(5);
            setValues(prev => ({ ...prev, radius: 5 }));
        } else if (action === 'FILLET_R10' && 'setRadius' in cmd) {
            (cmd as any).setRadius(10);
            setValues(prev => ({ ...prev, radius: 10 }));
        } else if (action === 'FILLET_R20' && 'setRadius' in cmd) {
            (cmd as any).setRadius(20);
            setValues(prev => ({ ...prev, radius: 20 }));
        } else if (action === 'CHAMFER_ALL' && 'chamferAll' in cmd) {
            (cmd as any).chamferAll();
        } else if (action === 'CHAMFER_1X45' && 'setDistances' in cmd) {
            (cmd as any).setDistances(1, 1);
            setValues(prev => ({ ...prev, distance1: 1, distance2: 1 }));
        } else if (action === 'CHAMFER_2X45' && 'setDistances' in cmd) {
            (cmd as any).setDistances(2, 2);
            setValues(prev => ({ ...prev, distance1: 2, distance2: 2 }));
        } else if (action === 'CHAMFER_5X45' && 'setDistances' in cmd) {
            (cmd as any).setDistances(5, 5);
            setValues(prev => ({ ...prev, distance1: 5, distance2: 5 }));
        } else if (action === 'CHAMFER_10X45' && 'setDistances' in cmd) {
            (cmd as any).setDistances(10, 10);
            setValues(prev => ({ ...prev, distance1: 10, distance2: 10 }));
        } else if (action === 'ROT_90' && 'setAngle' in cmd) {
            (cmd as any).setAngle(90);
            setValues(prev => ({ ...prev, angle: 90 }));
        } else if (action === 'ROT_MINUS_90' && 'setAngle' in cmd) {
            (cmd as any).setAngle(-90);
            setValues(prev => ({ ...prev, angle: -90 }));
        } else if (action === 'ROT_45' && 'setAngle' in cmd) {
            (cmd as any).setAngle(45);
            setValues(prev => ({ ...prev, angle: 45 }));
        } else if (action === 'ROT_180' && 'setAngle' in cmd) {
            (cmd as any).setAngle(180);
            setValues(prev => ({ ...prev, angle: 180 }));
        } else if (action === 'MIRROR_VERT' && 'applyPresetAxis' in cmd) {
            (cmd as any).applyPresetAxis('VERTICAL');
        } else if (action === 'MIRROR_HORIZ' && 'applyPresetAxis' in cmd) {
            (cmd as any).applyPresetAxis('HORIZONTAL');
        } else if (action === 'COPY_RIGHT' && 'setDisplacement' in cmd) {
            (cmd as any).setDisplacement(50, 0, 1);
        } else if (action === 'COPY_UP' && 'setDisplacement' in cmd) {
            (cmd as any).setDisplacement(0, 50, 1);
        } else if (action === 'MOVE_RIGHT' && 'setDisplacement' in cmd) {
            (cmd as any).setDisplacement(50, 0);
        } else if (action === 'MOVE_UP' && 'setDisplacement' in cmd) {
            (cmd as any).setDisplacement(0, 50);
        } else if (action === 'CONVERT_TO_DIM' && 'convertToDimension' in cmd) {
            (cmd as any).convertToDimension();
        } else if (action === 'FINISH_SPLINE' && 'finishSpline' in cmd) {
            (cmd as any).finishSpline(false);
        } else if (action === 'CLOSE_SPLINE' && 'finishSpline' in cmd) {
            (cmd as any).finishSpline(true);
        } else if (action === 'SET_NOTE_R' && 'setAnnotationText' in cmd) {
            (cmd as any).setAnnotationText('R0.5 TÜM KÖŞELER');
            setValues(prev => ({ ...prev, text: 'R0.5 TÜM KÖŞELER' }));
        } else if (action === 'SET_NOTE_DEBURR' && 'setAnnotationText' in cmd) {
            (cmd as any).setAnnotationText('ÇAPAKLARI TEMİZLEYİN');
            setValues(prev => ({ ...prev, text: 'ÇAPAKLARI TEMİZLEYİN' }));
        } else if (action === 'SET_NOTE_WELD' && 'setAnnotationText' in cmd) {
            (cmd as any).setAnnotationText('KAYNAK DİKİŞİ 5mm');
            setValues(prev => ({ ...prev, text: 'KAYNAK DİKİŞİ 5mm' }));
        } else if (action === 'STAMP_TOL' && 'setTextParams' in cmd) {
            (cmd as any).setTextParams({ content: 'TOLERANS ±0.05' });
            setValues(prev => ({ ...prev, content: 'TOLERANS ±0.05' }));
        } else if (action === 'STAMP_MAT' && 'setTextParams' in cmd) {
            (cmd as any).setTextParams({ content: 'MALZEME: 6082-T6' });
            setValues(prev => ({ ...prev, content: 'MALZEME: 6082-T6' }));
        } else if (action === 'STAMP_DEBURR' && 'setTextParams' in cmd) {
            (cmd as any).setTextParams({ content: 'NOT: ÇAPAKLARI TEMİZLEYİN' });
            setValues(prev => ({ ...prev, content: 'NOT: ÇAPAKLARI TEMİZLEYİN' }));
        } else if (action === 'TOL_BILATERAL' && 'setTolerance' in cmd) {
            (cmd as any).setTolerance(0.05, -0.05);
            setValues(prev => ({ ...prev, tolMode: 'bilateral', tolUpper: 0.05, tolLower: -0.05 }));
        } else if (action === 'SCALE_2X' && 'setScaleFactor' in cmd) {
            (cmd as any).setScaleFactor(2);
            setValues(prev => ({ ...prev, factor: 2 }));
        } else if (action === 'SCALE_HALF' && 'setScaleFactor' in cmd) {
            (cmd as any).setScaleFactor(0.5);
            setValues(prev => ({ ...prev, factor: 0.5 }));
        } else if (action === 'SCALE_3X' && 'setScaleFactor' in cmd) {
            (cmd as any).setScaleFactor(3);
            setValues(prev => ({ ...prev, factor: 3 }));
        } else if (action === 'JOIN_EXEC') {
            cmd.onKeyInput('Enter');
        } else if (action === 'GROUP_EXEC') {
            cmd.onKeyInput('Enter');
        } else if (action === 'UNGROUP_EXEC') {
            const count = useCadStore.getState().ungroupSelectedEntities();
            useCadStore.setState({
                commandPrompt: count > 0 
                    ? trCad(`✅ ${count} entities ungrouped.`, language)
                    : trCad('Selected entities are not in a group.', language)
            });
            cmd.cancel();
        } else if (action === 'EXPLODE_EXEC') {
            const count = useCadStore.getState().explodeSelectedEntities();
            useCadStore.setState({
                commandPrompt: count > 0 
                    ? trCad(`✅ ${count} compound entities exploded into line segments.`, language)
                    : trCad('No objects found to explode.', language)
            });
            cmd.cancel();
        } else if (action === 'OFFSET_OUT' && 'executeOffset' in cmd) {
            (cmd as any).executeOffset(true);
        } else if (action === 'OFFSET_IN' && 'executeOffset' in cmd) {
            (cmd as any).executeOffset(false);
        } else if (action === 'PLACE_DIM_NOW' && 'placeAtDefaultOffset' in cmd) {
            (cmd as any).placeAtDefaultOffset();
        } else if (action === 'PLACE_TEXT_NOW' && 'placeTextNow' in cmd) {
            (cmd as any).placeTextNow();
        } else if (action === 'PLACE_LEADER_NOW' && 'placeLeaderNow' in cmd) {
            (cmd as any).placeLeaderNow();
        } else if (action === 'PLACE_SURF_NOW' && 'placeNow' in cmd) {
            (cmd as any).placeNow();
        } else if (action === 'SET_SURF_RA32' && 'setRoughness' in cmd) {
            (cmd as any).setRoughness('Ra', '3.2');
            if ('setSymbolType' in cmd) (cmd as any).setSymbolType('machining_required');
            setValues(prev => ({ ...prev, roughnessParam: 'Ra', roughnessValue: '3.2', symbolType: 'machining_required' }));
        } else if (action === 'SET_SURF_RA16' && 'setRoughness' in cmd) {
            (cmd as any).setRoughness('Ra', '1.6');
            if ('setSymbolType' in cmd) (cmd as any).setSymbolType('machining_required');
            setValues(prev => ({ ...prev, roughnessParam: 'Ra', roughnessValue: '1.6', symbolType: 'machining_required' }));
        } else if (action === 'SET_SURF_RA08' && 'setRoughness' in cmd) {
            (cmd as any).setRoughness('Ra', '0.8');
            if ('setSymbolType' in cmd) (cmd as any).setSymbolType('machining_required');
            setValues(prev => ({ ...prev, roughnessParam: 'Ra', roughnessValue: '0.8', symbolType: 'machining_required' }));
        } else if (action === 'SET_SURF_RA04' && 'setRoughness' in cmd) {
            (cmd as any).setRoughness('Ra', '0.4');
            if ('setSymbolType' in cmd) (cmd as any).setSymbolType('machining_required');
            setValues(prev => ({ ...prev, roughnessParam: 'Ra', roughnessValue: '0.4', symbolType: 'machining_required' }));
        } else if (action === 'SET_SURF_RA02' && 'setRoughness' in cmd) {
            (cmd as any).setRoughness('Ra', '0.2');
            if ('setSymbolType' in cmd) (cmd as any).setSymbolType('machining_required');
            setValues(prev => ({ ...prev, roughnessParam: 'Ra', roughnessValue: '0.2', symbolType: 'machining_required' }));
        } else if (action === 'SET_SURF_RA125' && 'setRoughness' in cmd) {
            (cmd as any).setRoughness('Ra', '12.5');
            if ('setSymbolType' in cmd) (cmd as any).setSymbolType('machining_prohibited');
            setValues(prev => ({ ...prev, roughnessParam: 'Ra', roughnessValue: '12.5', symbolType: 'machining_prohibited' }));
        } else if (action === 'OPEN_SURF_BUILDER') {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('alucad:open-surface-builder'));
            }
        } else if (action === 'SET_NOTE_SURF_32' && 'setAnnotationText' in cmd) {
            (cmd as any).setAnnotationText('▽ Ra 3.2 (Genel Talaşlı)');
            setValues(prev => ({ ...prev, text: '▽ Ra 3.2 (Genel Talaşlı)' }));
        } else if (action === 'SET_NOTE_SURF_16' && 'setAnnotationText' in cmd) {
            (cmd as any).setAnnotationText('▽ Ra 1.6 (Rulman Yatağı)');
            setValues(prev => ({ ...prev, text: '▽ Ra 1.6 (Rulman Yatağı)' }));
        } else if (action === 'SET_NOTE_SURF_08' && 'setAnnotationText' in cmd) {
            (cmd as any).setAnnotationText('▽ Ra 0.8 (Yüzey Taşlama)');
            setValues(prev => ({ ...prev, text: '▽ Ra 0.8 (Yüzey Taşlama)' }));
        } else if (action === 'PLACE_FASTENER_NOW' && 'placeNow' in cmd) {
            (cmd as any).placeNow();
        } else if (action === 'FAST_ROTATE_90') {
            const curRot = values.direction !== undefined ? Number(values.direction) : -90;
            const newRot = curRot === -90 ? 0 : curRot === 0 ? 90 : curRot === 90 ? 180 : -90;
            const rotRad = (newRot * Math.PI) / 180;
            if ('setParams' in cmd) (cmd as any).setParams({ rotation: rotRad });
            setValues(prev => ({ ...prev, direction: String(newRot) }));
        } else if (action === 'FAST_M6_25' || action === 'FAST_M6_20') {
            if ('setParams' in cmd) (cmd as any).setParams({ type: 'BOLT', diameter: 6, length: 25 });
            setValues(prev => ({ ...prev, fastenerType: 'BOLT', diameter: '6', length: 25 }));
        } else if (action === 'FAST_M8_30') {
            if ('setParams' in cmd) (cmd as any).setParams({ type: 'BOLT', diameter: 8, length: 30 });
            setValues(prev => ({ ...prev, fastenerType: 'BOLT', diameter: '8', length: 30 }));
        } else if (action === 'FAST_M10_40') {
            if ('setParams' in cmd) (cmd as any).setParams({ type: 'BOLT', diameter: 10, length: 40 });
            setValues(prev => ({ ...prev, fastenerType: 'BOLT', diameter: '10', length: 40 }));
        } else if (action === 'FAST_M12_50') {
            if ('setParams' in cmd) (cmd as any).setParams({ type: 'BOLT', diameter: 12, length: 50 });
            setValues(prev => ({ ...prev, fastenerType: 'BOLT', diameter: '12', length: 50 }));
        } else if (action === 'FAST_NUT_M8') {
            if ('setParams' in cmd) (cmd as any).setParams({ type: 'NUT', diameter: 8, view: 'TOP' });
            setValues(prev => ({ ...prev, fastenerType: 'NUT', diameter: '8', view: 'TOP' }));
        } else if (action === 'FAST_NUT_M10') {
            if ('setParams' in cmd) (cmd as any).setParams({ type: 'NUT', diameter: 10, view: 'TOP' });
            setValues(prev => ({ ...prev, fastenerType: 'NUT', diameter: '10', view: 'TOP' }));
        } else if (action === 'PLACE_TSLOT_NOW' && 'placeNow' in cmd) {
            (cmd as any).placeNow();
        } else if (action.startsWith('SET_TSLOT_')) {
            const pid = action.replace('SET_TSLOT_', '');
            if ('setParams' in cmd) (cmd as any).setParams({ specId: pid, size: pid });
            setValues(prev => ({ ...prev, specId: pid, size: pid }));
        } else if (action === 'PLACE_TSLOT_ORIGIN' && 'placeNow' in cmd) {
            (cmd as any).placeNow({ x: 0, y: 0 });
        } else if (action === 'PLACE_GEAR_NOW' && 'placeNow' in cmd) {
            (cmd as any).placeNow();
        } else if (action === 'START_MATING_GEAR') {
            commandProcessor.startCommand('MATING_GEAR');
        } else if (action === 'START_PLANETARY_GEAR') {
            commandProcessor.startCommand('PLANETARY_GEAR');
        } else if (action === 'GEAR_M15_Z24') {
            if ('setParams' in cmd) (cmd as any).setParams({ module: 1.5, teethCount: 24 });
            setValues(prev => ({ ...prev, module: 1.5, teethCount: 24 }));
        } else if (action === 'GEAR_M2_Z20') {
            if ('setParams' in cmd) (cmd as any).setParams({ module: 2, teethCount: 20 });
            setValues(prev => ({ ...prev, module: 2, teethCount: 20 }));
        } else if (action === 'GEAR_M25_Z30') {
            if ('setParams' in cmd) (cmd as any).setParams({ module: 2.5, teethCount: 30 });
            setValues(prev => ({ ...prev, module: 2.5, teethCount: 30 }));
        } else if (action === 'GEAR_M3_Z40') {
            if ('setParams' in cmd) (cmd as any).setParams({ module: 3, teethCount: 40 });
            setValues(prev => ({ ...prev, module: 3, teethCount: 40 }));
        } else if (action === 'GEAR_M4_Z25') {
            if ('setParams' in cmd) (cmd as any).setParams({ module: 4, teethCount: 25 });
            setValues(prev => ({ ...prev, module: 4, teethCount: 25 }));
        } else if (action === 'MATING_Z20') {
            if ('setParams' in cmd) (cmd as any).setParams({ targetTeeth: 20 });
            setValues(prev => ({ ...prev, targetTeeth: 20 }));
        } else if (action === 'MATING_Z30') {
            if ('setParams' in cmd) (cmd as any).setParams({ targetTeeth: 30 });
            setValues(prev => ({ ...prev, targetTeeth: 30 }));
        } else if (action === 'MATING_Z40') {
            if ('setParams' in cmd) (cmd as any).setParams({ targetTeeth: 40 });
            setValues(prev => ({ ...prev, targetTeeth: 40 }));
        } else if (action === 'MATING_Z60') {
            if ('setParams' in cmd) (cmd as any).setParams({ targetTeeth: 60 });
            setValues(prev => ({ ...prev, targetTeeth: 60 }));
        } else if (action === 'PLACE_BELT_NOW' && 'placeNow' in cmd) {
            (cmd as any).placeNow();
        } else if (action === 'BELT_50_30') {
            if ('setParams' in cmd) (cmd as any).setParams({ radius1: 50, radius2: 30 });
            setValues(prev => ({ ...prev, radius1: 50, radius2: 30 }));
        } else if (action === 'BELT_40_40') {
            if ('setParams' in cmd) (cmd as any).setParams({ radius1: 40, radius2: 40 });
            setValues(prev => ({ ...prev, radius1: 40, radius2: 40 }));
        } else if (action === 'BELT_30_60') {
            if ('setParams' in cmd) (cmd as any).setParams({ radius1: 30, radius2: 60 });
            setValues(prev => ({ ...prev, radius1: 30, radius2: 60 }));
        } else if (action === 'BELT_80_40') {
            if ('setParams' in cmd) (cmd as any).setParams({ radius1: 80, radius2: 40 });
            setValues(prev => ({ ...prev, radius1: 80, radius2: 40 }));
        } else if (action === 'PLACE_PLANET_NOW' && 'placeNow' in cmd) {
            (cmd as any).placeNow();
        } else if (action === 'PLANET_M15') {
            if ('setParams' in cmd) (cmd as any).setParams({ module: 1.5, sunTeeth: 18, planetTeeth: 18 });
            setValues(prev => ({ ...prev, module: 1.5, sunTeeth: 18, planetTeeth: 18 }));
        } else if (action === 'PLANET_M20') {
            if ('setParams' in cmd) (cmd as any).setParams({ module: 2.0, sunTeeth: 20, planetTeeth: 20 });
            setValues(prev => ({ ...prev, module: 2.0, sunTeeth: 20, planetTeeth: 20 }));
        } else if (action === 'PLANET_M25') {
            if ('setParams' in cmd) (cmd as any).setParams({ module: 2.5, sunTeeth: 24, planetTeeth: 24 });
            setValues(prev => ({ ...prev, module: 2.5, sunTeeth: 24, planetTeeth: 24 }));
        } else if (action === 'PLACE_SPROCKET_NOW' && 'placeNow' in cmd) {
            (cmd as any).placeNow();
        } else if (action === 'SPROCKET_08B_17') {
            if ('setParams' in cmd) (cmd as any).setParams({ standard: '08B', teeth: 17 });
            setValues(prev => ({ ...prev, standard: '08B', teeth: 17 }));
        } else if (action === 'SPROCKET_08B_19') {
            if ('setParams' in cmd) (cmd as any).setParams({ standard: '08B', teeth: 19 });
            setValues(prev => ({ ...prev, standard: '08B', teeth: 19 }));
        } else if (action === 'SPROCKET_08B_25') {
            if ('setParams' in cmd) (cmd as any).setParams({ standard: '08B', teeth: 25 });
            setValues(prev => ({ ...prev, standard: '08B', teeth: 25 }));
        } else if (action === 'SPROCKET_08B_38') {
            if ('setParams' in cmd) (cmd as any).setParams({ standard: '08B', teeth: 38 });
            setValues(prev => ({ ...prev, standard: '08B', teeth: 38 }));
        } else if (action === 'SPROCKET_06B_21') {
            if ('setParams' in cmd) (cmd as any).setParams({ standard: '06B', teeth: 21 });
            setValues(prev => ({ ...prev, standard: '06B', teeth: 21 }));
        } else if (action === 'SPROCKET_10B_19') {
            if ('setParams' in cmd) (cmd as any).setParams({ standard: '10B', teeth: 19 });
            setValues(prev => ({ ...prev, standard: '10B', teeth: 19 }));
        } else if (action === 'COPY_SECTION_REPORT') {
            const { entities, selectedIds } = useCadStore.getState();
            const pool = selectedIds.length > 0 ? entities.filter(e => selectedIds.includes(e.id)) : entities;
            const region = largestRegion(pool);
            if (region && region.section) {
                const s = region.section;
                const header = trCad('=== AluCAD Section Analysis Report (DIN EN 1993 / ISO 6892) ===', language);
                const areaLbl = trCad('Area (A)', language);
                const perimLbl = trCad('Perimeter (P)', language);
                const massLbl = trCad('Al 6061 Mass', language);
                const report = `${header}\n${areaLbl}: ${s.area.toFixed(2)} mm²\n${perimLbl}: ${s.perimeter.toFixed(2)} mm\nIx: ${(s.Ix / 1e4).toFixed(4)} cm⁴\nIy: ${(s.Iy / 1e4).toFixed(4)} cm⁴\nWx: ${(s.Wx / 1e3).toFixed(4)} cm³\nWy: ${(s.Wy / 1e3).toFixed(4)} cm³\n${massLbl}: ${((s.area * 2.70) / 1000).toFixed(4)} kg/m\n=================================================`;
                navigator.clipboard.writeText(report);
                useCadStore.setState({ commandPrompt: trCad('✅ Section analysis report copied to clipboard.', language) });
            } else {
                useCadStore.setState({ commandPrompt: trCad('No valid closed profile found to copy.', language) });
            }
        } else if (action === 'EXPORT_SECTION_CSV') {
            const { entities, selectedIds } = useCadStore.getState();
            const pool = selectedIds.length > 0 ? entities.filter(e => selectedIds.includes(e.id)) : entities;
            const region = largestRegion(pool);
            if (region && region.section) {
                const s = region.section;
                const csv = `Property,Value,Unit\nArea,${s.area.toFixed(2)},mm2\nPerimeter,${s.perimeter.toFixed(2)},mm\nIx,${(s.Ix / 1e4).toFixed(4)},cm4\nIy,${(s.Iy / 1e4).toFixed(4)},cm4\nWx,${(s.Wx / 1e3).toFixed(4)},cm3\nWy,${(s.Wy / 1e3).toFixed(4)},cm3\n`;
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'alucad_section_analysis.csv';
                a.click();
                URL.revokeObjectURL(url);
                useCadStore.setState({ commandPrompt: trCad('✅ CSV section report downloaded.', language) });
            }
        } else if (action === 'ANALYZE_ALL') {
            useCadStore.setState({ selectedIds: [] });
            if ('runAnalysis' in cmd) (cmd as any).runAnalysis();
        } else if (action === 'ANALYZE_SELECTED') {
            if ('runAnalysis' in cmd) (cmd as any).runAnalysis();
        }
    }, []);

    const toggleSection = useCallback((idx: string) => {
        setCollapsedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
    }, []);

    if (!schema || !activeCommand) return null;

    // Filter out standard CLI fallback prompts
    const displayPrompt = commandPrompt && commandPrompt !== 'Type a command' && !commandPrompt.startsWith('Unknown:') ? commandPrompt : null;

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-[68px] top-6 z-20 pointer-events-auto w-[230px]"
        >
            <div className="bg-[var(--bg-1)]/95 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-900/30 to-transparent border-b border-white/10">
                    <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        {schema.icon}
                    </div>
                    <span className="text-[11px] font-semibold text-white tracking-wide uppercase">{trCad(schema.title, language)}</span>
                    <button onClick={handleCancel} className="ml-auto text-slate-500 hover:text-red-400 transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {/* Color Legend Bar */}
                <div className="px-2.5 py-1 bg-black/60 border-b border-white/5 flex items-center justify-between text-[8px] font-mono select-none">
                    <span className="flex items-center gap-1 text-cyan-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] " />
                        {trCad('Shape', language)}
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--bad)] " />
                        {trCad('Pivot', language)}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] " />
                        {trCad('Angle/Guide', language)}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] " />
                        {trCad('Preview', language)}
                    </span>
                </div>

                {/* Status / Instruction */}
                {displayPrompt && (
                    <div className="px-3 py-1.5 bg-cyan-900/15 border-b border-white/5">
                        <p className="text-[9px] font-mono text-cyan-300 leading-relaxed font-medium">{trCad(displayPrompt, language)}</p>
                    </div>
                )}

                {/* Sections */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {schema.sections.map((section, sIdx) => {
                        const isCollapsed = collapsedSections[`${sIdx}`];
                        return (
                            <div key={sIdx} className="border-b border-white/5 last:border-0">
                                <button
                                    onClick={() => toggleSection(`${sIdx}`)}
                                    className="w-full flex items-center gap-1.5 px-3 py-2 text-[9px] font-mono uppercase tracking-[0.15em] text-slate-400 hover:text-slate-200 transition-colors bg-white/[0.02] hover:bg-white/[0.04]"
                                >
                                    {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                                    {trCad(section.title, language)}
                                </button>
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-3 pb-2.5 space-y-1.5">
                                                {section.fields.map(field => (
                                                    <FieldRenderer
                                                        key={field.key}
                                                        field={field}
                                                        value={values[field.key]}
                                                        onChange={(v) => handleValueChange(field.key, v)}
                                                        language={language}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="px-3 py-2 border-t border-white/10 bg-black/30 space-y-1.5">
                    {schema.actions?.map((act, i) => (
                        <button
                            key={i}
                            onClick={() => handleAction(act.action)}
                            className="w-full py-1.5 text-[9px] font-mono uppercase tracking-widest rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {trCad(act.label, language)}
                        </button>
                    ))}
                    <div className="flex gap-1.5">
                        <button
                            onClick={handleApply}
                            className="flex-1 py-2 rounded-lg bg-gradient-to-b from-cyan-600/40 to-cyan-700/20 border border-cyan-500/30 text-[10px] font-mono uppercase tracking-widest text-cyan-300 hover:text-white hover:from-cyan-600/60 transition-all flex items-center justify-center gap-1.5 "
                        >
                            <Check size={12} /> {trCad('Apply', language)}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-3 py-2 rounded-lg border border-white/10 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// FIELD RENDERER
// ═══════════════════════════════════════════════════════════════

function FieldRenderer({ field, value, onChange, language }: {
    field: PropertyField;
    value: any;
    onChange: (v: any) => void;
    language: string;
}) {
    switch (field.type) {
        case 'number':
            return (
                <div className="flex items-center justify-between gap-2">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">{trCad(field.label, language)}</label>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            value={value ?? ''}
                            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                            className="w-[70px] px-2 py-1 text-[10px] font-mono text-right bg-black/40 border border-white/10 rounded-md text-cyan-300 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                        {field.unit && <span className="text-[8px] text-slate-600 font-mono w-5">{field.unit}</span>}
                    </div>
                </div>
            );

        case 'text':
            return (
                <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{trCad(field.label, language)}</label>
                    <input
                        type="text"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={trCad('Enter text...', language)}
                        className="w-full px-2 py-1.5 text-[10px] font-mono bg-black/40 border border-white/10 rounded-md text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-700"
                    />
                </div>
            );

        case 'select':
            return (
                <div className="flex items-center justify-between gap-2">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">{trCad(field.label, language)}</label>
                    <select
                        value={value ?? field.default ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-[90px] px-1.5 py-1 text-[10px] font-mono bg-black/40 border border-white/10 rounded-md text-cyan-300 focus:border-cyan-500/50 focus:outline-none appearance-none cursor-pointer"
                    >
                        {field.options?.map(o => (
                            <option key={o.value} value={o.value} className="bg-[var(--bg-1)] text-white">{trCad(o.label, language)}</option>
                        ))}
                    </select>
                </div>
            );

        case 'toggle':
            return (
                <div className="flex items-center justify-between">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{trCad(field.label, language)}</label>
                    <button
                        onClick={() => onChange(!value)}
                        className={`w-8 h-4 rounded-full transition-all relative ${value ? 'bg-cyan-500/40 border-cyan-500/60' : 'bg-white/5 border-white/10'} border`}
                    >
                        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${value ? 'left-[14px] bg-cyan-400 ' : 'left-0.5 bg-slate-500'}`} />
                    </button>
                </div>
            );

        case 'info':
            return (
                <div className="flex items-center justify-between">
                    <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{trCad(field.label, language)}</label>
                    <span className="text-[10px] font-mono text-slate-400">
                        {trCad(value, language) || '—'}{field.unit ? ` ${field.unit}` : ''}
                    </span>
                </div>
            );

        default:
            return null;
    }
}
