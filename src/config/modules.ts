import {
    LucideIcon,
    Ruler, Square, Circle, Settings, Grid3X3, Database, Flame, Wrench, CircleDot,
    CircleSlash, Scissors, Droplets, Layers, BookOpen, ArrowDownToLine, Zap, Cable,
    Atom, ArrowLeftRight, Calculator, Receipt, Table, Braces, Regex, MessageSquare, Newspaper,
    Folder, File, Image, Video, Music, FileText, Palette, Globe, GitGraph
} from 'lucide-react';

// ============================================
// Types
// ============================================

export type ModuleType =
    // Mechanical
    | 'profile-weight'
    // | 'sheet-calculator' // Merged
    // | 'tube-calculator'  // Merged
    | 'gears-bearings'
    | 'reducer-lubrication'
    | 'nesting-2d'
    | 'materials-db'
    | 'welding'
    | 'fasteners'
    | 'bearings'
    | 'fits-tolerances'
    | 'strength-analysis'
    | 'cutting-optimizer'
    | 'pumps'
    | 'sheet-metal'
    | 'handbook'
    // Civil
    | 'beam-deflection'
    | 'concrete-reinforcement'
    // Electrical
    | 'ohms-law'
    | 'voltage-drop'
    // Science
    | 'periodic-table'
    | 'unit-converter'
    | 'calculator'
    // Finance
    | 'vat-calculator'
    | 'excel-helper'
    // Other
    | 'feedback'
    | 'news'
    // Software
    | 'json-formatter'
    | 'json-formatter'
    | 'regex-tester'
    // AI Tools
    | 'ai-copilot'
    | 'box-profile-detector'
    | 'cost-estimator'
    // OS 2.0
    | 'file-explorer'
    | 'media-player'
    | 'image-viewer'
    | 'pdf-viewer'
    | 'spreadsheet-viewer'
    | 'browser'
    | 'paint'
    // Flow Editor (AluCalc OS 2.0)
    | 'flow-editor';

export interface WindowSize {
    width: number;
    height: number;
}

export interface ModuleDefinition {
    type: ModuleType;
    title: string;
    category: 'mechanical' | 'civil' | 'electrical' | 'science' | 'finance' | 'software' | 'other';
    iconName: string; // Storing string name for serialization if needed
    defaultSize: WindowSize;
}

// ============================================
// Module Registry
// ============================================

export const MODULE_REGISTRY: Record<ModuleType, ModuleDefinition> = {
    // Mechanical
    'profile-weight': {
        type: 'profile-weight',
        title: 'Profile Weight Calculator',
        category: 'mechanical',
        iconName: 'Ruler',
        defaultSize: { width: 1100, height: 800 }
    },
    'reducer-lubrication': {
        type: 'reducer-lubrication',
        title: 'Gearbox Thermal & Lube',
        category: 'mechanical',
        iconName: 'Droplet',
        defaultSize: { width: 1000, height: 800 }
    },
    // Combined into Profile Weight
    /*
    'sheet-calculator': { ... },
    'tube-calculator': { ... },
    */
    'gears-bearings': {
        type: 'gears-bearings',
        title: 'Gears & Bearings',
        category: 'mechanical',
        iconName: 'Settings',
        defaultSize: { width: 1200, height: 850 }
    },
    'nesting-2d': {
        type: 'nesting-2d',
        title: '2D Nesting',
        category: 'mechanical',
        iconName: 'Grid3X3',
        defaultSize: { width: 1200, height: 900 }
    },
    'materials-db': {
        type: 'materials-db',
        title: 'Materials Database',
        category: 'mechanical',
        iconName: 'Database',
        defaultSize: { width: 1200, height: 850 }
    },
    'welding': {
        type: 'welding',
        title: 'Welding Calculator',
        category: 'mechanical',
        iconName: 'Flame',
        defaultSize: { width: 1000, height: 750 }
    },
    'fasteners': {
        type: 'fasteners',
        title: 'Fasteners & Threads',
        category: 'mechanical',
        iconName: 'Wrench',
        defaultSize: { width: 1100, height: 850 }
    },
    'bearings': {
        type: 'bearings',
        title: 'Bearings (L10)',
        category: 'mechanical',
        iconName: 'CircleDot',
        defaultSize: { width: 900, height: 700 }
    },
    'fits-tolerances': {
        type: 'fits-tolerances',
        title: 'Fits & Tolerances',
        category: 'mechanical',
        iconName: 'Ruler',
        defaultSize: { width: 800, height: 700 }
    },
    'strength-analysis': {
        type: 'strength-analysis',
        title: 'Strength Analysis',
        category: 'mechanical',
        iconName: 'CircleSlash',
        defaultSize: { width: 1000, height: 800 }
    },
    'cutting-optimizer': {
        type: 'cutting-optimizer',
        title: 'Cutting Optimizer',
        category: 'mechanical',
        iconName: 'Scissors',
        defaultSize: { width: 1000, height: 800 }
    },
    'pumps': {
        type: 'pumps',
        title: 'Pump Calculator',
        category: 'mechanical',
        iconName: 'Droplets',
        defaultSize: { width: 800, height: 700 }
    },
    'sheet-metal': {
        type: 'sheet-metal',
        title: 'Sheet Metal Bending',
        category: 'mechanical',
        iconName: 'Layers',
        defaultSize: { width: 800, height: 700 }
    },
    'handbook': {
        type: 'handbook',
        title: 'Eng. Handbook',
        category: 'mechanical',
        iconName: 'BookOpen',
        defaultSize: { width: 1100, height: 850 }
    },
    // Civil
    'beam-deflection': {
        type: 'beam-deflection',
        title: 'Beam Deflection',
        category: 'civil',
        iconName: 'ArrowDownToLine',
        defaultSize: { width: 1200, height: 850 }
    },
    'concrete-reinforcement': {
        type: 'concrete-reinforcement',
        title: 'Concrete Reinforcement',
        category: 'civil',
        iconName: 'Grid3X3',
        defaultSize: { width: 1000, height: 800 }
    },
    // Electrical
    'ohms-law': {
        type: 'ohms-law',
        title: "Ohm's Law",
        category: 'electrical',
        iconName: 'Zap',
        defaultSize: { width: 700, height: 600 }
    },
    'voltage-drop': {
        type: 'voltage-drop',
        title: 'Voltage Drop',
        category: 'electrical',
        iconName: 'Cable',
        defaultSize: { width: 800, height: 700 }
    },
    // Science
    'periodic-table': {
        type: 'periodic-table',
        title: 'Periodic Table',
        category: 'science',
        iconName: 'Atom',
        defaultSize: { width: 1400, height: 900 }
    },
    'unit-converter': {
        type: 'unit-converter',
        title: 'Unit Converter',
        category: 'science',
        iconName: 'ArrowLeftRight',
        defaultSize: { width: 1000, height: 750 }
    },
    'calculator': {
        type: 'calculator',
        title: 'Scientific Calculator',
        category: 'science',
        iconName: 'Calculator',
        defaultSize: { width: 700, height: 850 }
    },
    // Finance
    'vat-calculator': {
        type: 'vat-calculator',
        title: 'VAT Calculator',
        category: 'finance',
        iconName: 'Receipt',
        defaultSize: { width: 600, height: 700 }
    },
    'excel-helper': {
        type: 'excel-helper',
        title: 'Excel Formula Helper',
        category: 'finance',
        iconName: 'Table',
        defaultSize: { width: 900, height: 750 }
    },
    // Software
    'json-formatter': {
        type: 'json-formatter',
        title: 'JSON Formatter',
        category: 'software',
        iconName: 'Braces',
        defaultSize: { width: 1000, height: 800 }
    },
    'regex-tester': {
        type: 'regex-tester',
        title: 'Regex Tester',
        category: 'software',
        iconName: 'Regex',
        defaultSize: { width: 1100, height: 800 }
    },
    // AI Tools
    'ai-copilot': {
        type: 'ai-copilot',
        title: 'AI Co-Pilot',
        category: 'software',
        iconName: 'Bot',
        defaultSize: { width: 600, height: 800 }
    },
    'box-profile-detector': {
        type: 'box-profile-detector',
        title: 'Box Profile Detector',
        category: 'mechanical',
        iconName: 'Scan',
        defaultSize: { width: 700, height: 700 }
    },
    'cost-estimator': {
        type: 'cost-estimator',
        title: 'Cost Estimator',
        category: 'finance',
        iconName: 'DollarSign',
        defaultSize: { width: 900, height: 700 }
    },
    // Other
    'feedback': {
        type: 'feedback',
        title: 'Feedback',
        category: 'other',
        iconName: 'MessageSquare',
        defaultSize: { width: 600, height: 700 }
    },

    'news': {
        type: 'news',
        title: 'Industry News',
        category: 'other',
        iconName: 'Newspaper',
        defaultSize: { width: 600, height: 700 }
    },

    // OS 2.0 Modules
    'file-explorer': {
        type: 'file-explorer',
        title: 'File Explorer',
        category: 'other',
        iconName: 'Folder',
        defaultSize: { width: 900, height: 600 }
    },
    'media-player': {
        type: 'media-player',
        title: 'Media Player',
        category: 'other',
        iconName: 'Video',
        defaultSize: { width: 800, height: 600 }
    },
    'image-viewer': {
        type: 'image-viewer',
        title: 'Image Viewer',
        category: 'other',
        iconName: 'Image',
        defaultSize: { width: 1000, height: 800 }
    },
    'pdf-viewer': {
        type: 'pdf-viewer',
        title: 'PDF Viewer',
        category: 'other',
        iconName: 'FileText',
        defaultSize: { width: 1000, height: 900 }
    },
    'spreadsheet-viewer': {
        type: 'spreadsheet-viewer',
        title: 'Spreadsheet',
        category: 'finance',
        iconName: 'Table',
        defaultSize: { width: 1000, height: 800 }
    },
    'browser': {
        type: 'browser',
        title: 'Web Browser',
        category: 'software',
        iconName: 'Globe',
        defaultSize: { width: 1000, height: 800 }
    },
    'paint': {
        type: 'paint',
        title: 'Paint',
        category: 'other',
        iconName: 'Palette',
        defaultSize: { width: 1200, height: 900 }
    },
    // Flow Editor (AluCalc OS 2.0)
    'flow-editor': {
        type: 'flow-editor',
        title: 'Flow Editor',
        category: 'mechanical',
        iconName: 'GitGraph',
        defaultSize: { width: 1400, height: 900 }
    }
};

// Helper to get Icon Component from string name
// Needed since we stored strings to keep registry Serializable if needed
export const getModuleIcon = (name: string) => {
    switch (name) {
        case 'Ruler': return Ruler;
        case 'Square': return Square;
        case 'Circle': return Circle;
        case 'Settings': return Settings;
        case 'Grid3X3': return Grid3X3;
        case 'Database': return Database;
        case 'Flame': return Flame;
        case 'Wrench': return Wrench;
        case 'CircleDot': return CircleDot;
        case 'CircleSlash': return CircleSlash;
        case 'Scissors': return Scissors;
        case 'Droplets': return Droplets;
        case 'Layers': return Layers;
        case 'BookOpen': return BookOpen;
        case 'ArrowDownToLine': return ArrowDownToLine;
        case 'Zap': return Zap;
        case 'Cable': return Cable;
        case 'Atom': return Atom;
        case 'ArrowLeftRight': return ArrowLeftRight;
        case 'Calculator': return Calculator;
        case 'Receipt': return Receipt;
        case 'Table': return Table;
        case 'Braces': return Braces;
        case 'Regex': return Regex;
        case 'MessageSquare': return MessageSquare;
        case 'Newspaper': return Newspaper;
        case 'Folder': return Folder;
        case 'Video': return Video;
        case 'Music': return Music;
        case 'Image': return Image;
        case 'FileText': return FileText;
        case 'Palette': return Palette;
        case 'Globe': return Globe;
        case 'GitGraph': return GitGraph;
        default: return Circle;
    }
};
