import {
    LucideIcon,
    Ruler, Square, Circle, Settings, Grid3X3, Database, Flame, Wrench, CircleDot,
    CircleSlash, Scissors, Droplets, Layers, BookOpen, ArrowDownToLine, Zap, Cable,
    Atom, ArrowLeftRight, Calculator, Receipt, Table, Braces, Regex, MessageSquare, Newspaper,
    Folder, File, Image, Video, Music, FileText, Palette, Globe, GitGraph,
    Bot, Scan, DollarSign, Droplet, BarChart3, Box, Factory, PenTool, Variable,
    Terminal, Sparkles, Thermometer, Activity,
    Rocket, FlaskConical, Dna, Code, Plane, Anchor, Cpu, ShieldCheck
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
    | 'cad-editor'
    | 'simulation-fea'
    | 'sketch-pad'
    | 'manufacturing-sandbox'
    | 'engineering-selection'
    | 'manufacturing-readiness'
    | 'topology-optimization'
    | 'machine-assembly'
    | 'failure-prediction'
    | 'fatigue-analysis'
    | 'fluid-dynamics'
    | 'bolt-torque'
    | 'physics-kinematics'
    | 'chemistry-reactions'
    | 'biology-genetics'
    | 'cs-algorithms'
    | 'aerospace-dynamics'
    | 'naval-hydrostatics'
    | 'materials-explorer'
    | 'physics-solver'
    | 'gearbox-design'
    | 'motor-selection-std'
    | 'material-selector-ai'
    | 'failure-diagnosis'
    | 'fatigue-advanced'
    | 'planetary-gearbox'
    | 'three-phase-power'
    | 'digital-logic'
    | 'filter-design'
    | 'machining-details'
    | 'chain-drive'
    | 'belt-drive'
    | 'ai-copilot'
    | 'holographic-viewer'
    | 'matrix-screensaver'
    | 'parametric-cad'
    | 'cost-estimator'
    | 'settings'
    | 'project-manager'
    | 'file-explorer'
    | 'project-vault'
    | 'browser'
    | 'paint'
    | 'terminal'
    | 'project-variables'
    | 'analytics-dashboard'
    | 'engineering-notes'
    | 'diagnostics'
    | 'marine';

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
        title: 'Thread Geometry & Clearances',
        category: 'mechanical',
        iconName: 'Wrench',
        defaultSize: { width: 1300, height: 850 }
    },
    'machining-details': {
        type: 'machining-details',
        title: 'Machining Details',
        category: 'mechanical',
        iconName: 'Scissors',
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
        title: 'RC Concrete Suite',
        category: 'civil',
        iconName: 'Layers',
        defaultSize: { width: 1100, height: 850 }
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
    'cad-editor': {
        type: 'cad-editor',
        title: 'CAD Editor',
        category: 'manufacturing',
        iconName: 'Ruler',
        defaultSize: { width: 1400, height: 900 }
    },
    'simulation-fea': {
        type: 'simulation-fea',
        title: 'Finite Element Analysis (FEA)',
        category: 'manufacturing',
        iconName: 'Box',
        defaultSize: { width: 1100, height: 850 }
    },
    'sketch-pad': {
        type: 'sketch-pad',
        title: 'Sketch Pad',
        category: 'other',
        iconName: 'PenTool',
        defaultSize: { width: 1200, height: 850 }
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
        title: 'AI Failure Prediction',
        category: 'manufacturing',
        iconName: 'Activity',
        defaultSize: { width: 1100, height: 850 }
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
        title: 'Bolt Torque (VDI 2230)',
        category: 'mechanical',
        iconName: 'Zap',
        defaultSize: { width: 1300, height: 850 }
    },
    'chain-drive': {
        type: 'chain-drive',
        title: 'Roller Chain Drive',
        category: 'mechanical',
        iconName: 'Link',
        defaultSize: { width: 1200, height: 820 }
    },
    'belt-drive': {
        type: 'belt-drive',
        title: 'Belt Drive Calculator',
        category: 'mechanical',
        iconName: 'Cable',
        defaultSize: { width: 1200, height: 820 }
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
        title: 'Naval Engineering & Hydro',
        category: 'mechanical',
        iconName: 'Anchor',
        defaultSize: { width: 1200, height: 900 }
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
        title: 'Advanced Machine Assembly',
        category: 'manufacturing',
        iconName: 'Wrench',
        defaultSize: { width: 1300, height: 950 }
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
    },
    'planetary-gearbox': {
        type: 'planetary-gearbox',
        title: 'Planetary Gearbox Solver',
        category: 'mechanical',
        iconName: 'Settings',
        defaultSize: { width: 1300, height: 900 }
    },
    'three-phase-power': {
        type: 'three-phase-power',
        title: '3-Phase Power Workstation',
        category: 'electrical',
        iconName: 'Zap',
        defaultSize: { width: 1200, height: 850 }
    },
    'digital-logic': {
        type: 'digital-logic',
        title: 'Digital Logic Lab',
        category: 'software',
        iconName: 'Cpu',
        defaultSize: { width: 1100, height: 800 }
    },
    'filter-design': {
        type: 'filter-design',
        title: 'Filter Design Engine',
        category: 'electrical',
        iconName: 'Activity',
        defaultSize: { width: 1200, height: 850 }
    },
    'ai-copilot': {
        type: 'ai-copilot',
        title: 'Aegis AI',
        category: 'other',
        iconName: 'Bot',
        defaultSize: { width: 800, height: 700 }
    },
    'holographic-viewer': {
        type: 'holographic-viewer',
        title: 'Holographic Viewer',
        category: 'other',
        iconName: 'Scan',
        defaultSize: { width: 1100, height: 850 }
    },
    'matrix-screensaver': {
        type: 'matrix-screensaver',
        title: 'Matrix Screensaver',
        category: 'other',
        iconName: 'Code',
        defaultSize: { width: 1200, height: 900 }
    },
    'parametric-cad': {
        type: 'parametric-cad',
        title: 'Parametric CAD 3D',
        category: 'manufacturing',
        iconName: 'Box',
        defaultSize: { width: 1400, height: 950 }
    },
    'cost-estimator': {
        type: 'cost-estimator',
        title: 'Cost Estimator',
        category: 'finance',
        iconName: 'DollarSign',
        defaultSize: { width: 1000, height: 750 }
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
        case 'Cpu': return Cpu;
        case 'ShieldCheck': return ShieldCheck;
        default: return Circle;
    }
};
