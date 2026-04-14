import {
    LucideIcon,
    Ruler, Square, Circle, Settings, Grid3X3, Database, Flame, Wrench, CircleDot,
    CircleSlash, Scissors, Droplets, Layers, BookOpen, ArrowDownToLine, Zap, Cable,
    Atom, ArrowLeftRight, Calculator, Receipt, Table, Braces, Regex, MessageSquare, Newspaper,
    Folder, File, Image, Video, Music, FileText, Palette, Globe, GitGraph,
    Bot, Scan, DollarSign, Droplet, BarChart3, Box, Factory, PenTool, Variable,
    Terminal, Sparkles, Thermometer, Activity,
    Rocket, FlaskConical, Dna, Code, Plane, Anchor
} from 'lucide-react';

export type ModuleType =
    | 'profile-weight'
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
    | 'thermal-expansion'
    | 'manufacturing'
    | 'handbook'
    | 'beam-deflection'
    | 'concrete-reinforcement'
    | 'ohms-law'
    | 'voltage-drop'
    | 'periodic-table'
    | 'unit-converter'
    | 'calculator'
    | 'vat-calculator'
    | 'excel-helper'
    | 'feedback'
    | 'news'
    | 'json-formatter'
    | 'regex-tester'
    | 'ai-copilot'
    | 'ai-copilot'
    | 'holographic-viewer'
    | 'matrix-screensaver'
    | 'box-profile-detector'
    | 'cost-estimator'
    | 'file-explorer'
    | 'media-player'
    | 'image-viewer'
    | 'pdf-viewer'
    | 'spreadsheet-viewer'
    | 'browser'
    | 'paint'
    | 'flow-editor'
    | 'parametric-cad'
    | 'cad-editor'
    | 'analytics-dashboard'
    | 'simulation-fea'
    | 'sketch-pad'
    | 'project-variables'
    | 'project-manager'
    | 'terminal'
    | 'manufacturing-sandbox'
    | 'engineering-selection'
    | 'manufacturing-readiness'
    | 'topology-optimization'
    | 'machine-assembly'
    | 'failure-prediction'
    | 'fatigue-analysis'
    | 'fluid-dynamics'
    | 'bolt-torque'
    | 'engineering-notes'
    | 'physics-kinematics'
    | 'chemistry-reactions'
    | 'biology-genetics'
    | 'cs-algorithms'
    | 'aerospace-dynamics'
    | 'naval-hydrostatics'
    | 'materials-explorer'
    | 'physics-solver'
    | 'project-vault'
    | 'gearbox-design'
    | 'motor-selection-std'
    | 'material-selector-ai'
    | 'failure-diagnosis'
    | 'fatigue-advanced'
    | 'settings';

export interface WindowSize {
    width: number;
    height: number;
}

export type ModuleCategory = 'mechanical' | 'manufacturing' | 'civil' | 'electrical' | 'science' | 'finance' | 'software' | 'other';

export interface ModuleDefinition {
    type: ModuleType;
    title: string;
    category: ModuleCategory;
    iconName: string;
    defaultSize: WindowSize;
}

import calculatorsDB from '../data/seo-calculators/calculators.json';

export const BASE_REGISTRY = {
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
        title: 'Bölüm J: Fastener Analysis',
        category: 'mechanical',
        iconName: 'Wrench',
        defaultSize: { width: 1300, height: 850 }
    },
    'bearings': {
        type: 'bearings',
        title: 'ISO 281: Bearing Analysis',
        category: 'mechanical',
        iconName: 'CircleDot',
        defaultSize: { width: 1300, height: 850 }
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
    'thermal-expansion': {
        type: 'thermal-expansion',
        title: 'Thermal Expansion',
        category: 'mechanical',
        iconName: 'Thermometer',
        defaultSize: { width: 1000, height: 850 }
    },
    'manufacturing': {
        type: 'manufacturing',
        title: 'Manufacturing (CAM)',
        category: 'mechanical',
        iconName: 'Factory',
        defaultSize: { width: 1000, height: 800 }
    },
    'handbook': {
        type: 'handbook',
        title: 'Eng. Handbook',
        category: 'manufacturing',
        iconName: 'BookOpen',
        defaultSize: { width: 1100, height: 850 }
    },
    'manufacturing-sandbox': {
        type: 'manufacturing-sandbox',
        title: 'Manufacturing Sandbox',
        category: 'manufacturing',
        iconName: 'Sparkles',
        defaultSize: { width: 1200, height: 850 }
    },
    'engineering-selection': {
        type: 'engineering-selection',
        title: 'Engineering Selection',
        category: 'manufacturing',
        iconName: 'Database',
        defaultSize: { width: 1100, height: 800 }
    },
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
    'ai-copilot': {
        type: 'ai-copilot',
        title: 'AI Co-Pilot',
        category: 'software',
        iconName: 'Bot',
        defaultSize: { width: 600, height: 800 }
    },
    'holographic-viewer': {
        type: 'holographic-viewer',
        title: 'Holographic Projection',
        category: 'other',
        iconName: 'Box',
        defaultSize: { width: 800, height: 600 }
    },
    'matrix-screensaver': {
        type: 'matrix-screensaver',
        title: 'Engineering Matrix',
        category: 'other',
        iconName: 'Code',
        defaultSize: { width: 800, height: 600 }
    },
    'box-profile-detector': {
        type: 'box-profile-detector',
        title: 'Box Profile Detector',
        category: 'manufacturing',
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
    'flow-editor': {
        type: 'flow-editor',
        title: 'Flow Editor',
        category: 'manufacturing',
        iconName: 'GitGraph',
        defaultSize: { width: 1400, height: 900 }
    },
    'parametric-cad': {
        type: 'parametric-cad',
        title: 'Parametric CAD',
        category: 'manufacturing',
        iconName: 'Box',
        defaultSize: { width: 1400, height: 900 }
    },
    'cad-editor': {
        type: 'cad-editor',
        title: 'CAD Editor',
        category: 'manufacturing',
        iconName: 'Ruler',
        defaultSize: { width: 1400, height: 900 }
    },
    'analytics-dashboard': {
        type: 'analytics-dashboard',
        title: 'Analytics Dashboard',
        category: 'other',
        iconName: 'BarChart3',
        defaultSize: { width: 900, height: 700 }
    },
    'simulation-fea': {
        type: 'simulation-fea',
        title: 'Simulation / FEA Lite',
        category: 'manufacturing',
        iconName: 'Box',
        defaultSize: { width: 950, height: 750 }
    },
    'sketch-pad': {
        type: 'sketch-pad',
        title: 'Sketch Pad',
        category: 'other',
        iconName: 'PenTool',
        defaultSize: { width: 1200, height: 850 }
    },
    'project-variables': {
        type: 'project-variables',
        title: 'Project Variables',
        category: 'other',
        iconName: 'Variable',
        defaultSize: { width: 600, height: 500 }
    },
    'project-manager': {
        type: 'project-manager',
        title: 'Project BOM Manager',
        category: 'other',
        iconName: 'Layers',
        defaultSize: { width: 900, height: 750 }
    },
    'terminal': {
        type: 'terminal',
        title: 'Terminal',
        category: 'software',
        iconName: 'Terminal',
        defaultSize: { width: 800, height: 500 }
    },
    'settings': {
        type: 'settings',
        title: 'Settings',
        category: 'other',
        iconName: 'Settings',
        defaultSize: { width: 1000, height: 750 }
    },
    'failure-prediction': {
        type: 'failure-prediction',
        title: 'Failure Prediction',
        category: 'manufacturing',
        iconName: 'Activity',
        defaultSize: { width: 1000, height: 800 }
    },
    'fatigue-analysis': {
        type: 'fatigue-analysis',
        title: 'Fatigue Life (Goodman)',
        category: 'mechanical',
        iconName: 'Activity',
        defaultSize: { width: 1200, height: 850 }
    },
    'fluid-dynamics': {
        type: 'fluid-dynamics',
        title: 'Fluid Dynamics',
        category: 'mechanical',
        iconName: 'Droplets',
        defaultSize: { width: 1100, height: 850 }
    },
    'bolt-torque': {
        type: 'bolt-torque',
        title: 'Bölüm J: Fastener Suite',
        category: 'mechanical',
        iconName: 'Zap',
        defaultSize: { width: 1300, height: 850 }
    },
    'engineering-notes': {
        type: 'engineering-notes',
        title: 'Engineering Scratchpad',
        category: 'other',
        iconName: 'FileText',
        defaultSize: { width: 600, height: 600 }
    },
    'physics-kinematics': {
        type: 'physics-kinematics',
        title: 'Physics & Kinematics',
        category: 'science',
        iconName: 'Rocket',
        defaultSize: { width: 1100, height: 800 }
    },
    'chemistry-reactions': {
        type: 'chemistry-reactions',
        title: 'Chemistry Lab',
        category: 'science',
        iconName: 'FlaskConical',
        defaultSize: { width: 1000, height: 800 }
    },
    'biology-genetics': {
        type: 'biology-genetics',
        title: 'Biology & Genetics',
        category: 'science',
        iconName: 'Dna',
        defaultSize: { width: 1000, height: 800 }
    },
    'cs-algorithms': {
        type: 'cs-algorithms',
        title: 'Algorithm Visualizer',
        category: 'software',
        iconName: 'Code',
        defaultSize: { width: 1200, height: 850 }
    },
    'aerospace-dynamics': {
        type: 'aerospace-dynamics',
        title: 'Aerospace Dynamics',
        category: 'mechanical',
        iconName: 'Plane',
        defaultSize: { width: 1100, height: 850 }
    },
    'naval-hydrostatics': {
        type: 'naval-hydrostatics',
        title: 'Naval Hydrostatics',
        category: 'mechanical',
        iconName: 'Anchor',
        defaultSize: { width: 1100, height: 850 }
    },
    'manufacturing-readiness': {
        type: 'manufacturing-readiness',
        title: 'Manufacturing Readiness',
        category: 'manufacturing',
        iconName: 'Activity',
        defaultSize: { width: 1000, height: 750 }
    },
    'topology-optimization': {
        type: 'topology-optimization',
        title: 'Topology Optimization',
        category: 'manufacturing',
        iconName: 'Sparkles',
        defaultSize: { width: 1100, height: 850 }
    },
    'machine-assembly': {
        type: 'machine-assembly',
        title: 'Machine Assembly',
        category: 'manufacturing',
        iconName: 'Wrench',
        defaultSize: { width: 1200, height: 900 }
    },
    'materials-explorer': {
        type: 'materials-explorer',
        title: 'Materials Intelligence',
        category: 'mechanical',
        iconName: 'Scan',
        defaultSize: { width: 1000, height: 750 }
    },
    'physics-solver': {
        type: 'physics-solver',
        title: 'Physics CAS Solver',
        category: 'science',
        iconName: 'Activity',
        defaultSize: { width: 1000, height: 800 }
    },
    'project-vault': {
        type: 'project-vault',
        title: 'Engineering Project Vault',
        category: 'software',
        iconName: 'Folder',
        defaultSize: { width: 1100, height: 800 }
    },
    'gearbox-design': {
        type: 'gearbox-design',
        title: 'Gearbox Design Engine',
        category: 'mechanical',
        iconName: 'Settings',
        defaultSize: { width: 1200, height: 850 }
    },
    'motor-selection-std': {
        type: 'motor-selection-std',
        title: 'Motor Selection Engine',
        category: 'mechanical',
        iconName: 'Zap',
        defaultSize: { width: 1000, height: 800 }
    },
    'material-selector-ai': {
        type: 'material-selector-ai',
        title: 'Material Selector AI',
        category: 'mechanical',
        iconName: 'Database',
        defaultSize: { width: 1100, height: 850 }
    },
    'failure-diagnosis': {
        type: 'failure-diagnosis',
        title: 'Failure Analysis Tool',
        category: 'manufacturing',
        iconName: 'ShieldCheck',
        defaultSize: { width: 1000, height: 800 }
    },
    'fatigue-advanced': {
        type: 'fatigue-advanced',
        title: 'Fatigue Life (Advanced)',
        category: 'mechanical',
        iconName: 'Activity',
        defaultSize: { width: 1200, height: 850 }
    }
} as Record<string, ModuleDefinition>;

calculatorsDB.forEach((calc: any) => {
    if (!BASE_REGISTRY[calc.slug]) {
        BASE_REGISTRY[calc.slug] = {
            type: calc.slug as any,
            title: calc.title,
            category: calc.category as ModuleCategory,
            iconName: 'Calculator',
            defaultSize: { width: 900, height: 700 }
        };
    }
});

export const MODULE_REGISTRY = BASE_REGISTRY as Record<ModuleType | string, ModuleDefinition>;

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
        case 'Bot': return Bot;
        case 'Scan': return Scan;
        case 'DollarSign': return DollarSign;
        case 'Droplet': return Droplet;
        case 'BarChart3': return BarChart3;
        case 'Box': return Box;
        case 'Factory': return Factory;
        case 'PenTool': return PenTool;
        case 'Variable': return Variable;
        case 'Terminal': return Terminal;
        case 'Sparkles': return Sparkles;
        case 'Thermometer': return Thermometer;
        case 'Activity': return Activity;
        case 'Rocket': return Rocket;
        case 'FlaskConical': return FlaskConical;
        case 'Dna': return Dna;
        case 'Code': return Code;
        case 'Plane': return Plane;
        case 'Anchor': return Anchor;
        default: return Circle;
    }
};
