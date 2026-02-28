
'use client';

import React from 'react';
import { useCadStore } from '../store/cadStore';

export function PropertiesPanel() {
    const { entities, updateEntity } = useCadStore();

    // Get selected entities
    const selectedEntities = entities.filter(e => e.isSelected);

    if (selectedEntities.length === 0) {
        return (
            <div className="p-4 text-xs text-gray-500 text-center h-full flex items-center justify-center">
                No selection
            </div>
        );
    }

    // Common properties logic (if multiple selected, show common or mixed)
    // For simplicity, just edit the first one or iterate all
    const first = selectedEntities[0];
    const isMultiple = selectedEntities.length > 1;

    const handleColorChange = (color: string) => {
        selectedEntities.forEach(e => {
            updateEntity(e.id, { color });
        });
    };

    // Geometry properties (only show if single selection and specific type)
    const renderGeometryProps = () => {
        if (isMultiple) return null;

        const geom = first.geometry;

        if (geom.type === 'LINE') {
            return (
                <div className="space-y-2 mt-4 border-t border-[#2a2a3c] pt-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Geometry</div>
                    <div className="grid grid-cols-2 gap-2">
                        <PropInput label="Start X" value={geom.start.x} onChange={(v) => updateEntity(first.id, { geometry: { ...geom, start: { ...geom.start, x: Number(v) } } })} />
                        <PropInput label="Start Y" value={geom.start.y} onChange={(v) => updateEntity(first.id, { geometry: { ...geom, start: { ...geom.start, y: Number(v) } } })} />
                        <PropInput label="End X" value={geom.end.x} onChange={(v) => updateEntity(first.id, { geometry: { ...geom, end: { ...geom.end, x: Number(v) } } })} />
                        <PropInput label="End Y" value={geom.end.y} onChange={(v) => updateEntity(first.id, { geometry: { ...geom, end: { ...geom.end, y: Number(v) } } })} />
                    </div>
                </div>
            );
        }
        else if (geom.type === 'CIRCLE') {
            return (
                <div className="space-y-2 mt-4 border-t border-[#2a2a3c] pt-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Geometry</div>
                    <div className="grid grid-cols-2 gap-2">
                        <PropInput label="Center X" value={geom.center.x} onChange={(v) => updateEntity(first.id, { geometry: { ...geom, center: { ...geom.center, x: Number(v) } } })} />
                        <PropInput label="Center Y" value={geom.center.y} onChange={(v) => updateEntity(first.id, { geometry: { ...geom, center: { ...geom.center, y: Number(v) } } })} />
                        <div className="col-span-2">
                            <PropInput label="Radius" value={geom.radius} onChange={(v) => updateEntity(first.id, { geometry: { ...geom, radius: Number(v) } })} />
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e2e] border-l border-[#2a2a3c] w-64 p-4 text-xs">
            <div className="font-medium text-gray-200 mb-4 flex justify-between">
                <span>Properties</span>
                <span className="text-gray-500">{selectedEntities.length} selected</span>
            </div>

            <div className="space-y-4">
                {/* General */}
                <div className="space-y-2">
                    <label className="text-gray-400 block">Color</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={first.color}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="bg-transparent w-8 h-8 rounded border border-gray-600 cursor-pointer"
                        />
                        <span className="text-gray-300 font-mono">{first.color}</span>
                    </div>
                </div>

                {renderGeometryProps()}
            </div>
        </div>
    );
}

function PropInput({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) {
    return (
        <div>
            <label className="text-[10px] text-gray-500 block mb-1">{label}</label>
            <input
                type="number"
                value={value.toFixed(2)} // formatting for display
                onChange={(e) => onChange(e.target.value)}
                step={1}
                className="w-full bg-[#12121a] border border-[#2a2a3c] rounded px-2 py-1 text-white"
            />
        </div>
    );
}
