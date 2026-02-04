'use client';

/**
 * MaterialSelector Component
 * 
 * Universal material selection dropdown with:
 * - Category filtering
 * - Search functionality
 * - Property preview on hover
 * - Full property display on selection
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Layers, Zap, Thermometer, Scale } from 'lucide-react';
import { MATERIALS_DB, getMaterialCategories, type MaterialProp } from '@/data/materialsData';

interface MaterialSelectorProps {
    value?: string;
    onChange: (material: MaterialProp) => void;
    showPreview?: boolean;
    className?: string;
    placeholder?: string;
}

export function MaterialSelector({
    value,
    onChange,
    showPreview = true,
    className = '',
    placeholder = 'Select material...',
}: MaterialSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [hoveredMaterial, setHoveredMaterial] = useState<MaterialProp | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const categories = useMemo(() => getMaterialCategories(), []);

    const selectedMaterial = useMemo(
        () => MATERIALS_DB.find(m => m.name === value),
        [value]
    );

    const filteredMaterials = useMemo(() => {
        let filtered = MATERIALS_DB;

        if (selectedCategory) {
            filtered = filtered.filter(m => m.category === selectedCategory);
        }

        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(searchLower) ||
                m.category.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [selectedCategory, search]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (material: MaterialProp) => {
        onChange(material);
        setIsOpen(false);
        setSearch('');
    };

    const previewMaterial = hoveredMaterial || selectedMaterial;

    return (
        <div className={`material-selector ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                className="selector-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedMaterial ? (
                    <span className="selected-value">
                        <span className="category-badge">{selectedMaterial.category}</span>
                        {selectedMaterial.name}
                    </span>
                ) : (
                    <span className="placeholder">{placeholder}</span>
                )}
                <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="dropdown-panel">
                    <div className="dropdown-header">
                        {/* Search */}
                        <div className="search-box">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search materials..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="clear-btn">
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Category Tabs */}
                        <div className="category-tabs">
                            <button
                                className={`tab ${!selectedCategory ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(null)}
                            >
                                All
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`tab ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="dropdown-body">
                        {/* Material List */}
                        <div className="material-list">
                            {filteredMaterials.length === 0 ? (
                                <div className="no-results">No materials found</div>
                            ) : (
                                filteredMaterials.map(mat => (
                                    <button
                                        key={mat.name}
                                        className={`material-option ${value === mat.name ? 'selected' : ''}`}
                                        onClick={() => handleSelect(mat)}
                                        onMouseEnter={() => setHoveredMaterial(mat)}
                                        onMouseLeave={() => setHoveredMaterial(null)}
                                    >
                                        <span className="mat-name">{mat.name}</span>
                                        <span className="mat-density">{mat.density} g/cm³</span>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Property Preview Panel */}
                        {showPreview && previewMaterial && (
                            <div className="preview-panel">
                                <div className="preview-header">
                                    <span className="preview-category">{previewMaterial.category}</span>
                                    <span className="preview-name">{previewMaterial.name}</span>
                                </div>

                                <div className="preview-section">
                                    <div className="section-title"><Scale size={12} /> Mechanical</div>
                                    <div className="prop-grid">
                                        <div className="prop">
                                            <span className="prop-label">Density</span>
                                            <span className="prop-value">{previewMaterial.density} g/cm³</span>
                                        </div>
                                        <div className="prop">
                                            <span className="prop-label">Yield</span>
                                            <span className="prop-value">{previewMaterial.yield} MPa</span>
                                        </div>
                                        <div className="prop">
                                            <span className="prop-label">Tensile</span>
                                            <span className="prop-value">{previewMaterial.tensile} MPa</span>
                                        </div>
                                        <div className="prop">
                                            <span className="prop-label">Young's E</span>
                                            <span className="prop-value">{previewMaterial.youngsModulus} GPa</span>
                                        </div>
                                        <div className="prop">
                                            <span className="prop-label">Poisson ν</span>
                                            <span className="prop-value">{previewMaterial.poissonsRatio}</span>
                                        </div>
                                        <div className="prop">
                                            <span className="prop-label">Hardness</span>
                                            <span className="prop-value">{previewMaterial.hardness}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="preview-section">
                                    <div className="section-title"><Thermometer size={12} /> Thermal</div>
                                    <div className="prop-grid">
                                        {previewMaterial.thermalCond && (
                                            <div className="prop">
                                                <span className="prop-label">Conductivity</span>
                                                <span className="prop-value">{previewMaterial.thermalCond} W/m·K</span>
                                            </div>
                                        )}
                                        {previewMaterial.thermalExp && (
                                            <div className="prop">
                                                <span className="prop-label">Expansion</span>
                                                <span className="prop-value">{previewMaterial.thermalExp} µm/m·K</span>
                                            </div>
                                        )}
                                        {previewMaterial.meltingPoint && (
                                            <div className="prop">
                                                <span className="prop-label">Melting</span>
                                                <span className="prop-value">{previewMaterial.meltingPoint} °C</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="preview-section">
                                    <div className="section-title"><Layers size={12} /> Manufacturing</div>
                                    <div className="prop-grid">
                                        <div className="prop">
                                            <span className="prop-label">Weldability</span>
                                            <span className={`prop-value rating rating-${previewMaterial.weldability.toLowerCase()}`}>
                                                {previewMaterial.weldability}
                                            </span>
                                        </div>
                                        <div className="prop">
                                            <span className="prop-label">Machinability</span>
                                            <span className={`prop-value rating rating-${previewMaterial.machinability.toLowerCase()}`}>
                                                {previewMaterial.machinability}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .material-selector {
                    position: relative;
                    width: 100%;
                }
                
                .selector-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 10px 14px;
                    background: var(--surface-2, #1a1a2e);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 8px;
                    color: var(--text, #fff);
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .selector-trigger:hover {
                    border-color: var(--accent, #6366f1);
                }
                
                .placeholder {
                    color: var(--text-dim, #666);
                }
                
                .selected-value {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .category-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                    background: rgba(99, 102, 241, 0.2);
                    color: var(--accent, #6366f1);
                    border-radius: 4px;
                    font-weight: 600;
                }
                
                .chevron {
                    transition: transform 0.2s;
                    color: var(--text-dim, #666);
                }
                
                .chevron.open {
                    transform: rotate(180deg);
                }
                
                .dropdown-panel {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    z-index: 200;
                    margin-top: 4px;
                    background: var(--surface-1, #0f0f1a);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 12px;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                }
                
                .dropdown-header {
                    padding: 12px;
                    border-bottom: 1px solid var(--border-dim, #1a1a2e);
                }
                
                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: var(--surface-2, #1a1a2e);
                    border-radius: 6px;
                    margin-bottom: 10px;
                }
                
                .search-box input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: var(--text, #fff);
                    font-size: 12px;
                    outline: none;
                }
                
                .search-box input::placeholder {
                    color: var(--text-dim, #666);
                }
                
                .clear-btn {
                    display: flex;
                    padding: 2px;
                    background: transparent;
                    border: none;
                    color: var(--text-dim, #666);
                    cursor: pointer;
                }
                
                .category-tabs {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                }
                
                .tab {
                    padding: 5px 10px;
                    background: transparent;
                    border: 1px solid var(--border-dim, #2a2a4a);
                    border-radius: 4px;
                    color: var(--text-dim, #888);
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                
                .tab:hover {
                    border-color: var(--border, #3a3a5a);
                    color: var(--text, #fff);
                }
                
                .tab.active {
                    background: var(--accent, #6366f1);
                    border-color: var(--accent, #6366f1);
                    color: white;
                }
                
                .dropdown-body {
                    display: flex;
                    max-height: 400px;
                }
                
                .material-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                    min-width: 200px;
                }
                
                .no-results {
                    padding: 20px;
                    text-align: center;
                    color: var(--text-dim, #666);
                    font-size: 12px;
                }
                
                .material-option {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 10px 12px;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    color: var(--text, #fff);
                    font-size: 12px;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                
                .material-option:hover {
                    background: var(--surface-2, #1a1a2e);
                }
                
                .material-option.selected {
                    background: rgba(99, 102, 241, 0.15);
                }
                
                .mat-name {
                    font-weight: 500;
                }
                
                .mat-density {
                    font-family: var(--font-mono, 'JetBrains Mono', monospace);
                    font-size: 10px;
                    color: var(--text-dim, #888);
                }
                
                .preview-panel {
                    width: 260px;
                    padding: 12px;
                    background: var(--surface-2, #1a1a2e);
                    border-left: 1px solid var(--border-dim, #2a2a4a);
                    overflow-y: auto;
                }
                
                .preview-header {
                    margin-bottom: 12px;
                }
                
                .preview-category {
                    display: block;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--accent, #6366f1);
                    margin-bottom: 2px;
                }
                
                .preview-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text, #fff);
                }
                
                .preview-section {
                    margin-bottom: 12px;
                }
                
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-dim, #666);
                    margin-bottom: 8px;
                    padding-bottom: 4px;
                    border-bottom: 1px solid var(--border-dim, #252545);
                }
                
                .prop-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }
                
                .prop {
                    background: var(--surface-1, #0f0f1a);
                    padding: 6px 8px;
                    border-radius: 4px;
                }
                
                .prop-label {
                    display: block;
                    font-size: 9px;
                    text-transform: uppercase;
                    color: var(--text-dim, #666);
                    margin-bottom: 2px;
                }
                
                .prop-value {
                    font-family: var(--font-mono, 'JetBrains Mono', monospace);
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text, #fff);
                }
                
                .rating-excellent { color: #10b981; }
                .rating-good { color: #22d3ee; }
                .rating-fair { color: #facc15; }
                .rating-poor { color: #f87171; }
                .rating-difficult { color: #ef4444; }
            `}</style>
        </div>
    );
}

export default MaterialSelector;
