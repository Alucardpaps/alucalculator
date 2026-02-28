
'use client';

import React, { useState } from 'react';
import { useCadStore } from '../store/cadStore';
import { Plus, Trash2, Eye, EyeOff, Check } from 'lucide-react';

export function LayerManager() {
    const { layers, activeLayerId, setActiveLayer, addLayer, removeLayer, toggleLayerVisibility, setLayerColor } = useCadStore();
    const [newLayerName, setNewLayerName] = useState('');

    const handleAddLayer = () => {
        if (!newLayerName.trim()) return;
        // Default color white for new layers
        addLayer(newLayerName.trim(), '#ffffff');
        setNewLayerName('');
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e2e] border-l border-[#2a2a3c] w-64">
            <div className="p-3 border-b border-[#2a2a3c] flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">Layers</span>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newLayerName}
                        onChange={(e) => setNewLayerName(e.target.value)}
                        className="bg-[#12121a] text-xs text-white px-2 py-1 rounded w-24 border border-[#2a2a3c]"
                        placeholder="New Layer"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLayer()}
                    />
                    <button onClick={handleAddLayer} className="p-1 hover:bg-[#2a2a3c] rounded text-primary">
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        className={`flex items-center gap-2 p-2 rounded text-xs group ${activeLayerId === layer.id ? 'bg-[#2a2a3c]' : 'hover:bg-[#252535]'}`}
                        onClick={() => setActiveLayer(layer.id)}
                    >
                        {/* Active Indicator */}
                        <div className="w-4 flex justify-center">
                            {activeLayerId === layer.id && <Check size={12} className="text-primary" />}
                        </div>

                        {/* Visibility Toggle */}
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                            className={`p-1 rounded hover:bg-black/20 ${layer.visible ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>

                        {/* Color Picker */}
                        <div className="relative">
                            <div
                                className="w-3 h-3 rounded-full border border-gray-600 cursor-pointer"
                                style={{ backgroundColor: layer.color }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    document.getElementById(`color-picker-${layer.id}`)?.click();
                                }}
                            />
                            <input
                                id={`color-picker-${layer.id}`}
                                type="color"
                                value={layer.color}
                                onChange={(e) => setLayerColor(layer.id, e.target.value)}
                                className="absolute opacity-0 w-0 h-0"
                            />
                        </div>

                        {/* Name */}
                        <span className={`flex-1 truncate ${activeLayerId === layer.id ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {layer.name}
                        </span>

                        {/* Delete (prevent deleting layer-0) */}
                        {layer.id !== 'layer-0' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                                className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
