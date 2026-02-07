'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

// Comprehensive Engineering Handbook Data
const HANDBOOK_DATA = {
    'tolerances': {
        title: 'ISO Tolerances (Linear)',
        desc: 'Standard tolerance grades (IT) for linear dimensions per ISO 286-1.',
        columns: ['Grade', '0-3mm', '3-6mm', '6-10mm', '10-18mm', '18-30mm', '30-50mm'],
        data: [
            { Grade: 'IT5', '0-3mm': '4 µm', '3-6mm': '5 µm', '6-10mm': '6 µm', '10-18mm': '8 µm', '18-30mm': '9 µm', '30-50mm': '11 µm' },
            { Grade: 'IT6', '0-3mm': '6 µm', '3-6mm': '8 µm', '6-10mm': '9 µm', '10-18mm': '11 µm', '18-30mm': '13 µm', '30-50mm': '16 µm' },
            { Grade: 'IT7', '0-3mm': '10 µm', '3-6mm': '12 µm', '6-10mm': '15 µm', '10-18mm': '18 µm', '18-30mm': '21 µm', '30-50mm': '25 µm' },
            { Grade: 'IT8', '0-3mm': '14 µm', '3-6mm': '18 µm', '6-10mm': '22 µm', '10-18mm': '27 µm', '18-30mm': '33 µm', '30-50mm': '39 µm' },
            { Grade: 'IT9', '0-3mm': '25 µm', '3-6mm': '30 µm', '6-10mm': '36 µm', '10-18mm': '43 µm', '18-30mm': '52 µm', '30-50mm': '62 µm' },
            { Grade: 'IT10', '0-3mm': '40 µm', '3-6mm': '48 µm', '6-10mm': '58 µm', '10-18mm': '70 µm', '18-30mm': '84 µm', '30-50mm': '100 µm' },
            { Grade: 'IT11', '0-3mm': '60 µm', '3-6mm': '75 µm', '6-10mm': '90 µm', '10-18mm': '110 µm', '18-30mm': '130 µm', '30-50mm': '160 µm' },
        ]
    },
    'roughness': {
        title: 'Surface Roughness (Ra)',
        desc: 'Typical roughness values for various manufacturing processes.',
        columns: ['Process', 'Range (µm)', 'Typical (µm)', 'N-Grade'],
        data: [
            { Process: 'Sand Casting', 'Range (µm)': '12.5 - 50', 'Typical (µm)': '25', 'N-Grade': 'N11-N12' },
            { Process: 'Die Casting', 'Range (µm)': '0.8 - 3.2', 'Typical (µm)': '1.6', 'N-Grade': 'N6-N8' },
            { Process: 'Hot Rolling', 'Range (µm)': '12.5 - 50', 'Typical (µm)': '25', 'N-Grade': 'N11-N12' },
            { Process: 'Turning', 'Range (µm)': '0.4 - 6.3', 'Typical (µm)': '3.2', 'N-Grade': 'N5-N9' },
            { Process: 'Milling', 'Range (µm)': '0.8 - 6.3', 'Typical (µm)': '3.2', 'N-Grade': 'N6-N9' },
            { Process: 'Drilling', 'Range (µm)': '1.6 - 12.5', 'Typical (µm)': '6.3', 'N-Grade': 'N7-N10' },
            { Process: 'Grinding', 'Range (µm)': '0.1 - 1.6', 'Typical (µm)': '0.4', 'N-Grade': 'N3-N7' },
            { Process: 'Polishing', 'Range (µm)': '0.05 - 0.4', 'Typical (µm)': '0.1', 'N-Grade': 'N2-N5' },
            { Process: 'Lapping', 'Range (µm)': '0.02 - 0.2', 'Typical (µm)': '0.05', 'N-Grade': 'N1-N4' },
        ]
    },
    'threads': {
        title: 'Metric Thread Standard (ISO)',
        desc: 'Coarse and Fine pitch standards for common metric threads.',
        columns: ['Size', 'Coarse Pitch', 'Fine Pitch (1)', 'Fine Pitch (2)', 'Tap Drill (Coarse)'],
        data: [
            { Size: 'M1.6', 'Coarse Pitch': '0.35 mm', 'Fine Pitch (1)': '-', 'Fine Pitch (2)': '-', 'Tap Drill (Coarse)': '1.25 mm' },
            { Size: 'M2', 'Coarse Pitch': '0.4 mm', 'Fine Pitch (1)': '0.25 mm', 'Fine Pitch (2)': '-', 'Tap Drill (Coarse)': '1.6 mm' },
            { Size: 'M2.5', 'Coarse Pitch': '0.45 mm', 'Fine Pitch (1)': '0.35 mm', 'Fine Pitch (2)': '-', 'Tap Drill (Coarse)': '2.05 mm' },
            { Size: 'M3', 'Coarse Pitch': '0.5 mm', 'Fine Pitch (1)': '0.35 mm', 'Fine Pitch (2)': '-', 'Tap Drill (Coarse)': '2.5 mm' },
            { Size: 'M4', 'Coarse Pitch': '0.7 mm', 'Fine Pitch (1)': '0.5 mm', 'Fine Pitch (2)': '-', 'Tap Drill (Coarse)': '3.3 mm' },
            { Size: 'M5', 'Coarse Pitch': '0.8 mm', 'Fine Pitch (1)': '0.5 mm', 'Fine Pitch (2)': '-', 'Tap Drill (Coarse)': '4.2 mm' },
            { Size: 'M6', 'Coarse Pitch': '1.0 mm', 'Fine Pitch (1)': '0.75 mm', 'Fine Pitch (2)': '-', 'Tap Drill (Coarse)': '5.0 mm' },
            { Size: 'M8', 'Coarse Pitch': '1.25 mm', 'Fine Pitch (1)': '1.0 mm', 'Fine Pitch (2)': '0.75 mm', 'Tap Drill (Coarse)': '6.8 mm' },
            { Size: 'M10', 'Coarse Pitch': '1.5 mm', 'Fine Pitch (1)': '1.25 mm', 'Fine Pitch (2)': '1.0 mm', 'Tap Drill (Coarse)': '8.5 mm' },
            { Size: 'M12', 'Coarse Pitch': '1.75 mm', 'Fine Pitch (1)': '1.5 mm', 'Fine Pitch (2)': '1.25 mm', 'Tap Drill (Coarse)': '10.2 mm' },
            { Size: 'M16', 'Coarse Pitch': '2.0 mm', 'Fine Pitch (1)': '1.5 mm', 'Fine Pitch (2)': '-', 'Tap Drill (Coarse)': '14.0 mm' },
            { Size: 'M20', 'Coarse Pitch': '2.5 mm', 'Fine Pitch (1)': '2.0 mm', 'Fine Pitch (2)': '1.5 mm', 'Tap Drill (Coarse)': '17.5 mm' },
            { Size: 'M24', 'Coarse Pitch': '3.0 mm', 'Fine Pitch (1)': '2.0 mm', 'Fine Pitch (2)': '-', 'Tap Drill (Coarse)': '21.0 mm' },
        ]
    },
    'gcode': {
        title: 'CNC G-Codes & M-Codes',
        desc: 'Common ISO G-codes for milling and turning.',
        columns: ['Code', 'Type', 'Description', 'Group'],
        data: [
            { Code: 'G00', Type: 'Motion', Description: 'Rapid positioning', Group: '01' },
            { Code: 'G01', Type: 'Motion', Description: 'Linear interpolation (feed rate)', Group: '01' },
            { Code: 'G02', Type: 'Motion', Description: 'Circular interpolation CW', Group: '01' },
            { Code: 'G03', Type: 'Motion', Description: 'Circular interpolation CCW', Group: '01' },
            { Code: 'G04', Type: 'Dwell', Description: 'Dwell (pause)', Group: '00' },
            { Code: 'G17', Type: 'Plane', Description: 'XY Plane selection', Group: '02' },
            { Code: 'G18', Type: 'Plane', Description: 'XZ Plane selection', Group: '02' },
            { Code: 'G19', Type: 'Plane', Description: 'YZ Plane selection', Group: '02' },
            { Code: 'G20/G21', Type: 'Unit', Description: 'Inch / Metric input', Group: '06' },
            { Code: 'G28', Type: 'Home', Description: 'Return to reference point', Group: '00' },
            { Code: 'G40', Type: 'Comp', Description: 'Cutter compensation cancel', Group: '07' },
            { Code: 'G41', Type: 'Comp', Description: 'Cutter compensation left', Group: '07' },
            { Code: 'G42', Type: 'Comp', Description: 'Cutter compensation right', Group: '07' },
            { Code: 'G43', Type: 'Offset', Description: 'Tool length offset +', Group: '08' },
            { Code: 'G54-G59', Type: 'WCS', Description: 'Work coordinate systems', Group: '14' },
            { Code: 'G81', Type: 'Cycle', Description: 'Drilling cycle', Group: '09' },
            { Code: 'G83', Type: 'Cycle', Description: 'Peck drilling cycle', Group: '09' },
            { Code: 'G90', Type: 'Mode', Description: 'Absolute programming', Group: '03' },
            { Code: 'G91', Type: 'Mode', Description: 'Incremental programming', Group: '03' },
            { Code: 'M03', Type: 'M-Code', Description: 'Spindle ON (CW)', Group: 'M' },
            { Code: 'M04', Type: 'M-Code', Description: 'Spindle ON (CCW)', Group: 'M' },
            { Code: 'M05', Type: 'M-Code', Description: 'Spindle STOP', Group: 'M' },
            { Code: 'M06', Type: 'M-Code', Description: 'Tool Change', Group: 'M' },
            { Code: 'M08', Type: 'M-Code', Description: 'Coolant ON', Group: 'M' },
            { Code: 'M09', Type: 'M-Code', Description: 'Coolant OFF', Group: 'M' },
            { Code: 'M30', Type: 'M-Code', Description: 'Program End & Rewind', Group: 'M' },
        ]
    },
    'hardness': {
        title: 'Hardness Conversion Table',
        desc: 'Approximate conversion values for steel.',
        columns: ['HRC', 'HV (Vickers)', 'HB (Brinell)', 'Tensile (MPa)', 'Tensile (ksi)'],
        data: [
            { HRC: '68', HV: '940', HB: '-', Tensile: '-', 'Tensile (ksi)': '-' },
            { HRC: '60', HV: '697', HB: '654', Tensile: '2180', 'Tensile (ksi)': '316' },
            { HRC: '55', HV: '595', HB: '578', Tensile: '1880', 'Tensile (ksi)': '273' },
            { HRC: '50', HV: '513', HB: '481', Tensile: '1620', 'Tensile (ksi)': '235' },
            { HRC: '45', HV: '446', HB: '421', Tensile: '1420', 'Tensile (ksi)': '206' },
            { HRC: '40', HV: '392', HB: '371', Tensile: '1240', 'Tensile (ksi)': '180' },
            { HRC: '35', HV: '345', HB: '327', Tensile: '1090', 'Tensile (ksi)': '158' },
            { HRC: '30', HV: '302', HB: '286', Tensile: '950', 'Tensile (ksi)': '138' },
            { HRC: '25', HV: '266', HB: '253', Tensile: '840', 'Tensile (ksi)': '122' },
            { HRC: '20', HV: '238', HB: '226', Tensile: '758', 'Tensile (ksi)': '110' },
        ]
    },
    'sheetmetal': {
        title: 'Sheet Metal Bend Allowances',
        desc: 'K-Factor and bend deductions for common materials.',
        columns: ['Material', 'K-Factor', 'Bend Radius/Thickness Ratio', 'Process'],
        data: [
            { Material: 'Aluminum (Air Bend)', 'K-Factor': '0.33', 'Bend Radius/Thickness Ratio': '< 1', Process: 'Air Bending' },
            { Material: 'Aluminum (Air Bend)', 'K-Factor': '0.42', 'Bend Radius/Thickness Ratio': '> 1', Process: 'Air Bending' },
            { Material: 'Steel (Air Bend)', 'K-Factor': '0.33', 'Bend Radius/Thickness Ratio': '< 1', Process: 'Air Bending' },
            { Material: 'Steel (Air Bend)', 'K-Factor': '0.44', 'Bend Radius/Thickness Ratio': '> 1', Process: 'Air Bending' },
            { Material: 'Stainless (Air Bend)', 'K-Factor': '0.33', 'Bend Radius/Thickness Ratio': '< 1', Process: 'Air Bending' },
            { Material: 'Stainless (Air Bend)', 'K-Factor': '0.46', 'Bend Radius/Thickness Ratio': '> 1', Process: 'Air Bending' },
            { Material: 'Coining (All)', 'K-Factor': '0.50', 'Bend Radius/Thickness Ratio': 'Any', Process: 'Coining' },
        ]
    },
    'gdt': {
        title: 'GD&T Symbols',
        desc: 'Geometric Dimensioning and Tolerancing symbols per ASME Y14.5.',
        columns: ['Symbol', 'Type', 'Characteristic', 'Description'],
        data: [
            { Symbol: '⏥', Type: 'Form', Characteristic: 'Flatness', Description: 'All points on surface must be in one plane' },
            { Symbol: '⎯', Type: 'Form', Characteristic: 'Straightness', Description: 'Line element deviation from straight' },
            { Symbol: '○', Type: 'Form', Characteristic: 'Circularity', Description: 'Roundness of a feature' },
            { Symbol: '⌭', Type: 'Form', Characteristic: 'Cylindricity', Description: 'Roundness + Straightness combined' },
            { Symbol: '⟂', Type: 'Orientation', Characteristic: 'Perpendicularity', Description: '90° to datum' },
            { Symbol: '∥', Type: 'Orientation', Characteristic: 'Parallelism', Description: 'Equidistant at all points to datum' },
            { Symbol: '∠', Type: 'Orientation', Characteristic: 'Angularity', Description: 'Specific angle to datum' },
            { Symbol: '⌖', Type: 'Location', Characteristic: 'Position', Description: 'Center point location' },
            { Symbol: '◎', Type: 'Location', Characteristic: 'Concentricity', Description: 'Median points centered to axis' },
            { Symbol: '⌰', Type: 'Location', Characteristic: 'Symmetry', Description: 'Median points symm. about plane' },
            { Symbol: '↗', Type: 'Runout', Characteristic: 'Circular Runout', Description: 'Deviation during 360° rotation' },
            { Symbol: '⌻', Type: 'Runout', Characteristic: 'Total Runout', Description: 'Runout across entire surface' },
        ]
    }
};

type HandbookKey = keyof typeof HANDBOOK_DATA;

export default function HandbookModule() {
    const [activeSection, setActiveSection] = useState<HandbookKey>('tolerances');
    const [searchQuery, setSearchQuery] = useState('');

    const section = HANDBOOK_DATA[activeSection];

    // Filter data based on search
    const filteredData = section.data.filter(row =>
        Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Header / Tabs */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {(Object.keys(HANDBOOK_DATA) as HandbookKey[]).map(key => (
                        <button
                            key={key}
                            onClick={() => { setActiveSection(key); setSearchQuery(''); }}
                            className="px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap shrink-0"
                            style={{
                                backgroundColor: activeSection === key ? 'var(--color-os-accent)' : 'var(--color-os-header)',
                                color: activeSection === key ? 'var(--color-os-canvas)' : 'var(--color-os-text-secondary)',
                                border: '1px solid var(--color-os-border)'
                            }}
                        >
                            {key === 'gdt' ? 'GD&T' : key.replace(/([A-Z])/g, ' $1').trim()}
                        </button>
                    ))}
                </div>

                {/* Search & Info */}
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1.5 w-3 h-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder={`Search in ${keyToLabel(activeSection)}...`}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-7 pr-2 py-1 rounded text-[10px] bg-transparent border border-gray-700 focus:border-cyan-500 outline-none transition-all"
                            style={{
                                backgroundColor: 'var(--color-os-header)',
                                borderColor: 'var(--color-os-border)',
                                color: 'var(--color-os-text-primary)'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                <div className="flex justify-between items-end border-b pb-1" style={{ borderColor: 'var(--color-os-border)' }}>
                    <div>
                        <div className="font-bold text-sm" style={{ color: 'var(--color-os-accent)' }}>{section.title}</div>
                        <div className="text-[10px] opacity-70" style={{ color: 'var(--color-os-text-primary)' }}>{section.desc}</div>
                    </div>
                    <div className="text-[9px] font-mono opacity-50" style={{ color: 'var(--color-os-text-secondary)' }}>
                        {filteredData.length} entries
                    </div>
                </div>

                <div className="flex-1 overflow-auto rounded-lg border" style={{ backgroundColor: 'var(--color-os-canvas)', borderColor: 'var(--color-os-border)' }}>
                    <table className="w-full text-[10px] border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr style={{ backgroundColor: 'var(--color-os-panel)' }}>
                                {section.columns.map((col, i) => (
                                    <th key={col} className={`text-left px-3 py-2 font-bold uppercase tracking-wider border-b ${i === 0 ? 'sticky left-0 z-20 shadow-[1px_0_0_rgba(0,0,0,0.1)]' : ''}`}
                                        style={{
                                            backgroundColor: 'var(--color-os-panel)',
                                            color: 'var(--color-os-text-secondary)',
                                            borderColor: 'var(--color-os-border)'
                                        }}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((row, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        {Object.values(row).map((val, j) => (
                                            <td key={j} className={`px-3 py-2 border-b font-mono ${j === 0 ? 'font-bold sticky left-0 z-10 shadow-[1px_0_0_rgba(0,0,0,0.1)]' : ''}`}
                                                style={{
                                                    borderColor: 'var(--color-os-border)',
                                                    color: j === 0 ? 'var(--color-os-accent)' : 'var(--color-os-text-primary)',
                                                    backgroundColor: j === 0 ? 'var(--color-os-canvas)' : 'transparent' // Solid bg for sticky col
                                                }}>
                                                {String(val)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={section.columns.length} className="px-3 py-8 text-center opacity-50 italic">
                                        No matching entries found for "{searchQuery}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-[9px] text-right opacity-40">
                Source: ISO / ASME Standards
            </div>
        </div>
    );
}

function keyToLabel(key: string) {
    if (key === 'gdt') return 'GD&T';
    return key.charAt(0).toUpperCase() + key.slice(1);
}
