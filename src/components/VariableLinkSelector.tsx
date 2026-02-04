'use client';

/**
 * VariableLinkSelector Component
 * 
 * Allows users to link an input variable to an output from another module.
 * Shows a dropdown with available outputs from other modules.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link2, Unlink, ChevronDown } from 'lucide-react';
import {
    useProjectStore,
    selectModules,
    type ModuleInstanceId,
    type VariableId,
    type ModuleVariable
} from '@/stores/projectStore';

interface VariableLinkSelectorProps {
    /** Current module's ID */
    moduleId: ModuleInstanceId;
    /** The input variable ID to link */
    variableId: VariableId;
    /** Current input variable data */
    variable: ModuleVariable;
    /** Callback when value is manually changed (if not linked) */
    onManualChange?: (value: number) => void;
    /** Optional class name */
    className?: string;
}

export function VariableLinkSelector({
    moduleId,
    variableId,
    variable,
    onManualChange,
    className = '',
}: VariableLinkSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const modules = useProjectStore(selectModules);
    const linkVariable = useProjectStore(s => s.linkVariable);
    const unlinkVariable = useProjectStore(s => s.unlinkVariable);

    const isLinked = !!variable.linkedFrom;

    // Get source module and variable info if linked
    const sourceModule = isLinked ? modules[variable.linkedFrom!.sourceModuleId] : null;
    const sourceVariable = sourceModule?.outputs[variable.linkedFrom!.sourceVariableId];

    // Get all available outputs from OTHER modules
    const availableLinks = Object.values(modules)
        .filter(mod => mod.id !== moduleId)
        .flatMap(mod =>
            Object.values(mod.outputs).map(output => ({
                moduleId: mod.id,
                moduleName: mod.name,
                variableId: output.id,
                variableName: output.name,
                value: output.value,
                unit: output.unit,
            }))
        );

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLink = (sourceModId: string, sourceVarId: string) => {
        linkVariable(moduleId, variableId, sourceModId, sourceVarId);
        setIsOpen(false);
    };

    const handleUnlink = () => {
        unlinkVariable(moduleId, variableId);
    };

    return (
        <div className={`variable-link-selector ${className}`} ref={dropdownRef}>
            <div className="link-display">
                {isLinked ? (
                    <div className="linked-indicator">
                        <Link2 size={14} className="link-icon linked" />
                        <span className="source-label">
                            ← {sourceModule?.name}: {sourceVariable?.name}
                        </span>
                        <span className="linked-value">
                            {sourceVariable?.value?.toFixed(2) ?? '—'} {sourceVariable?.unit}
                        </span>
                        <button
                            type="button"
                            className="unlink-btn"
                            onClick={handleUnlink}
                            title="Unlink"
                        >
                            <Unlink size={12} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="link-btn"
                        onClick={() => setIsOpen(!isOpen)}
                        title="Link to another module's output"
                    >
                        <Link2 size={14} />
                        <ChevronDown size={12} />
                    </button>
                )}
            </div>

            {isOpen && !isLinked && (
                <div className="link-dropdown">
                    {availableLinks.length === 0 ? (
                        <div className="no-links">
                            No outputs available. Add more modules to create links.
                        </div>
                    ) : (
                        <>
                            <div className="dropdown-header">Link from:</div>
                            {availableLinks.map(link => (
                                <button
                                    key={`${link.moduleId}-${link.variableId}`}
                                    className="link-option"
                                    onClick={() => handleLink(link.moduleId, link.variableId)}
                                >
                                    <span className="option-module">{link.moduleName}</span>
                                    <span className="option-var">{link.variableName}</span>
                                    <span className="option-value">
                                        {link.value?.toFixed(2) ?? '—'} {link.unit}
                                    </span>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
                .variable-link-selector {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }
                
                .link-display {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .link-btn {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    padding: 4px 6px;
                    background: var(--surface-2, #1a1a2e);
                    border: 1px solid var(--border-dim, #2a2a4a);
                    border-radius: 4px;
                    color: var(--text-dim, #888);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                
                .link-btn:hover {
                    background: var(--surface-3, #252545);
                    border-color: var(--accent, #6366f1);
                    color: var(--accent, #6366f1);
                }
                
                .linked-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 8px;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
                    border: 1px solid var(--accent, #6366f1);
                    border-radius: 4px;
                    font-size: 11px;
                }
                
                .link-icon.linked {
                    color: var(--accent, #6366f1);
                }
                
                .source-label {
                    color: var(--text-dim, #888);
                }
                
                .linked-value {
                    font-family: var(--font-mono, 'JetBrains Mono', monospace);
                    color: var(--accent, #6366f1);
                    font-weight: 600;
                }
                
                .unlink-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2px;
                    background: transparent;
                    border: none;
                    color: var(--text-dim, #888);
                    cursor: pointer;
                    border-radius: 2px;
                    transition: all 0.15s ease;
                }
                
                .unlink-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }
                
                .link-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    z-index: 100;
                    min-width: 280px;
                    max-height: 300px;
                    overflow-y: auto;
                    background: var(--surface-1, #0f0f1a);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 8px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    margin-top: 4px;
                }
                
                .dropdown-header {
                    padding: 8px 12px;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-dim, #666);
                    border-bottom: 1px solid var(--border-dim, #1a1a2e);
                }
                
                .link-option {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 10px 12px;
                    background: transparent;
                    border: none;
                    border-bottom: 1px solid var(--border-dim, #1a1a2e);
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }
                
                .link-option:last-child {
                    border-bottom: none;
                }
                
                .link-option:hover {
                    background: var(--surface-2, #1a1a2e);
                }
                
                .option-module {
                    flex: 1;
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text, #fff);
                }
                
                .option-var {
                    font-size: 11px;
                    color: var(--text-dim, #888);
                }
                
                .option-value {
                    font-family: var(--font-mono, 'JetBrains Mono', monospace);
                    font-size: 11px;
                    color: var(--accent, #6366f1);
                }
                
                .no-links {
                    padding: 16px;
                    text-align: center;
                    font-size: 12px;
                    color: var(--text-dim, #666);
                }
            `}</style>
        </div>
    );
}

export default VariableLinkSelector;
