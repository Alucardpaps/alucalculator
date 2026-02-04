'use client';

/**
 * ModuleWorkspace Component
 * 
 * Provides workspace for managing interconnected engineering modules:
 * - Create/load/delete projects
 * - Add/remove engineering calculation modules
 * - Connect module outputs to inputs (reactive linking)
 */

import React, { useState } from 'react';
import {
    FolderPlus,
    Trash2,
    Plus,
    Save,
    FolderOpen,
    Box,
    Settings2,
    ChevronDown,
    ChevronRight,
    Link2
} from 'lucide-react';
import {
    useProjectStore,
    selectCurrentProject,
    selectModuleOrder,
    selectSavedProjects,
    type ModuleType
} from '@/stores/projectStore';

const MODULE_OPTIONS: { type: ModuleType; label: string; icon: string }[] = [
    { type: 'gear-calculator', label: 'Gear Calculator', icon: '⚙️' },
    { type: 'bearing-life', label: 'Bearing Life (L10)', icon: '🔘' },
    { type: 'aluminum-profile', label: 'Aluminum Profile', icon: '📐' },
    { type: 'fit-calculator', label: 'Fit & Tolerance', icon: '🎯' },
    { type: 'strength-mohr', label: 'Strength (Mohr)', icon: '💪' },
    { type: 'welding-heat', label: 'Welding Heat', icon: '🔥' },
    { type: 'sheet-metal', label: 'Sheet Metal Bend', icon: '📄' },
    { type: 'pump-calculator', label: 'Pump Calculator', icon: '💧' },
    { type: 'fastener-thread', label: 'Fastener/Thread', icon: '🔩' },
    { type: 'unit-converter', label: 'Unit Converter', icon: '🔄' },
];

interface ModuleWorkspaceProps {
    className?: string;
}

export function ModuleWorkspace({ className = '' }: ModuleWorkspaceProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showModuleMenu, setShowModuleMenu] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [showNewProject, setShowNewProject] = useState(false);

    const currentProject = useProjectStore(selectCurrentProject);
    const moduleOrder = useProjectStore(selectModuleOrder);
    const savedProjects = useProjectStore(selectSavedProjects);

    const createProject = useProjectStore(s => s.createProject);
    const loadProject = useProjectStore(s => s.loadProject);
    const deleteProject = useProjectStore(s => s.deleteProject);
    const saveCurrentProject = useProjectStore(s => s.saveCurrentProject);
    const addModule = useProjectStore(s => s.addModule);
    const removeModule = useProjectStore(s => s.removeModule);
    const modules = useProjectStore(s => s.currentProject?.modules ?? {});

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            createProject(newProjectName.trim());
            setNewProjectName('');
            setShowNewProject(false);
        }
    };

    const handleAddModule = (type: ModuleType) => {
        addModule(type);
        setShowModuleMenu(false);
    };

    return (
        <div className={`module-workspace ${className}`}>
            <div
                className="mw-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Box size={16} />
                <span>Engineering Workspace</span>
                {currentProject && (
                    <span className="project-name">{currentProject.name}</span>
                )}
            </div>

            {isExpanded && (
                <div className="mw-content">
                    {!currentProject ? (
                        <div className="no-project">
                            {showNewProject ? (
                                <div className="new-project-form">
                                    <input
                                        type="text"
                                        placeholder="Project name..."
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                                        autoFocus
                                    />
                                    <button className="create-btn" onClick={handleCreateProject}>Create</button>
                                    <button className="cancel-btn" onClick={() => setShowNewProject(false)}>Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        className="action-btn primary"
                                        onClick={() => setShowNewProject(true)}
                                    >
                                        <FolderPlus size={14} />
                                        New Project
                                    </button>

                                    {Object.keys(savedProjects).length > 0 && (
                                        <div className="saved-projects">
                                            <div className="section-label">Saved Projects</div>
                                            {Object.values(savedProjects).map(project => (
                                                <div key={project.id} className="saved-project">
                                                    <button
                                                        className="load-btn"
                                                        onClick={() => loadProject(project.id)}
                                                    >
                                                        <FolderOpen size={12} />
                                                        {project.name}
                                                    </button>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => deleteProject(project.id)}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="project-active">
                            <div className="toolbar">
                                <button
                                    className="action-btn"
                                    onClick={saveCurrentProject}
                                    title="Save Project"
                                >
                                    <Save size={14} />
                                </button>
                                <div className="add-module-wrapper">
                                    <button
                                        className="action-btn primary"
                                        onClick={() => setShowModuleMenu(!showModuleMenu)}
                                    >
                                        <Plus size={14} />
                                        Add Module
                                    </button>
                                    {showModuleMenu && (
                                        <div className="module-menu">
                                            {MODULE_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.type}
                                                    onClick={() => handleAddModule(opt.type)}
                                                >
                                                    <span className="icon">{opt.icon}</span>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="module-list">
                                {moduleOrder.length === 0 ? (
                                    <div className="empty-modules">
                                        No modules yet. Add a module to start building your project.
                                    </div>
                                ) : (
                                    moduleOrder.map(moduleId => {
                                        const mod = modules[moduleId];
                                        if (!mod) return null;
                                        const linkedCount = Object.values(mod.inputs)
                                            .filter(i => i.linkedFrom).length;

                                        return (
                                            <div key={moduleId} className="module-item">
                                                <Settings2 size={14} className="module-icon" />
                                                <span className="module-name">{mod.name}</span>
                                                <span className="module-type">{mod.type}</span>
                                                {linkedCount > 0 && (
                                                    <span className="link-badge">
                                                        <Link2 size={10} />
                                                        {linkedCount}
                                                    </span>
                                                )}
                                                <button
                                                    className="remove-btn"
                                                    onClick={() => removeModule(moduleId)}
                                                    title="Remove module"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .module-workspace {
                    background: var(--surface-1, #0f0f1a);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 12px;
                    overflow: hidden;
                    font-size: 13px;
                }
                
                .mw-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 16px;
                    background: linear-gradient(135deg, var(--surface-2, #1a1a2e), var(--surface-3, #252545));
                    cursor: pointer;
                    font-weight: 600;
                    user-select: none;
                    transition: background 0.2s;
                    border-bottom: 1px solid var(--border-dim, #2a2a4a);
                }
                
                .mw-header:hover {
                    background: var(--surface-3, #252545);
                }
                
                .project-name {
                    margin-left: auto;
                    font-weight: 500;
                    color: var(--accent, #6366f1);
                    font-size: 12px;
                    padding: 2px 8px;
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 10px;
                }
                
                .mw-content {
                    padding: 16px;
                }
                
                .no-project {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .new-project-form {
                    display: flex;
                    gap: 8px;
                }
                
                .new-project-form input {
                    flex: 1;
                    padding: 10px 14px;
                    background: var(--surface-2, #1a1a2e);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 6px;
                    color: var(--text, #fff);
                    font-size: 13px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                
                .new-project-form input:focus {
                    border-color: var(--accent, #6366f1);
                }
                
                .create-btn, .cancel-btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .create-btn {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                }
                
                .create-btn:hover {
                    filter: brightness(1.1);
                }
                
                .cancel-btn {
                    background: var(--surface-3, #252545);
                    color: var(--text-dim, #888);
                }
                
                .cancel-btn:hover {
                    background: var(--surface-2, #1a1a2e);
                }
                
                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 14px;
                    background: var(--surface-2, #1a1a2e);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 6px;
                    color: var(--text, #fff);
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .action-btn:hover {
                    background: var(--surface-3, #252545);
                    border-color: var(--accent, #6366f1);
                }
                
                .action-btn.primary {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border: none;
                    color: white;
                }
                
                .action-btn.primary:hover {
                    filter: brightness(1.1);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }
                
                .section-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-dim, #666);
                    margin-bottom: 8px;
                }
                
                .saved-projects {
                    padding-top: 12px;
                    border-top: 1px solid var(--border-dim, #1a1a2e);
                }
                
                .saved-project {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 0;
                }
                
                .load-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                    padding: 8px 12px;
                    background: transparent;
                    border: none;
                    color: var(--text, #fff);
                    font-size: 12px;
                    cursor: pointer;
                    border-radius: 6px;
                    text-align: left;
                }
                
                .load-btn:hover {
                    background: var(--surface-2, #1a1a2e);
                }
                
                .delete-btn {
                    display: flex;
                    padding: 6px;
                    background: transparent;
                    border: none;
                    color: var(--text-dim, #666);
                    cursor: pointer;
                    border-radius: 4px;
                }
                
                .delete-btn:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }
                
                .toolbar {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .add-module-wrapper {
                    position: relative;
                }
                
                .module-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    z-index: 100;
                    min-width: 220px;
                    background: var(--surface-1, #0f0f1a);
                    border: 1px solid var(--border, #2a2a4a);
                    border-radius: 10px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                    margin-top: 6px;
                    overflow: hidden;
                }
                
                .module-menu button {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    border-bottom: 1px solid var(--border-dim, #1a1a2e);
                    color: var(--text, #fff);
                    font-size: 12px;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                
                .module-menu button:last-child {
                    border-bottom: none;
                }
                
                .module-menu button:hover {
                    background: var(--surface-2, #1a1a2e);
                }
                
                .module-menu .icon {
                    font-size: 16px;
                }
                
                .module-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .empty-modules {
                    text-align: center;
                    padding: 24px;
                    color: var(--text-dim, #666);
                    font-size: 12px;
                    background: var(--surface-2, #1a1a2e);
                    border-radius: 8px;
                    border: 1px dashed var(--border-dim, #2a2a4a);
                }
                
                .module-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 14px;
                    background: var(--surface-2, #1a1a2e);
                    border-radius: 8px;
                    border: 1px solid var(--border-dim, #2a2a4a);
                    transition: all 0.2s;
                }
                
                .module-item:hover {
                    border-color: var(--border, #3a3a5a);
                    background: var(--surface-3, #252545);
                }
                
                .module-icon {
                    color: var(--accent, #6366f1);
                }
                
                .module-name {
                    flex: 1;
                    font-weight: 500;
                }
                
                .module-type {
                    font-size: 10px;
                    color: var(--text-dim, #666);
                    padding: 2px 6px;
                    background: var(--surface-1, #0f0f1a);
                    border-radius: 4px;
                }
                
                .link-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 10px;
                    padding: 3px 8px;
                    background: rgba(99, 102, 241, 0.15);
                    color: var(--accent, #6366f1);
                    border-radius: 12px;
                    font-weight: 600;
                }
                
                .remove-btn {
                    display: flex;
                    padding: 6px;
                    background: transparent;
                    border: none;
                    color: var(--text-dim, #555);
                    cursor: pointer;
                    border-radius: 4px;
                    opacity: 0.5;
                    transition: all 0.2s;
                }
                
                .module-item:hover .remove-btn {
                    opacity: 1;
                }
                
                .remove-btn:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }
            `}</style>
        </div>
    );
}

export default ModuleWorkspace;
