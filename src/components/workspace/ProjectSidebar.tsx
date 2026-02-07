'use client';

/**
 * AluCalc OS — Project Sidebar
 * 
 * Sidebar for project and workspace management.
 * Shows recent projects, workspace tabs, and quick actions.
 */

import React, { useState, useCallback } from 'react';
import {
    FolderOpen,
    Plus,
    ChevronRight,
    ChevronDown,
    Trash2,
    Copy,
    Download,
    Upload,
    Settings,
    Layers,
    Clock,
    Star,
    MoreVertical
} from 'lucide-react';
import { useWorkspaceStore, Project, WorkspaceLayout } from '@/store/workspaceStore';

// ============================================
// Styles
// ============================================

const styles = {
    container: `
        w-64 h-full bg-[#0f1419] border-r border-[#2a3a4a] 
        flex flex-col overflow-hidden
    `,
    header: `
        flex items-center justify-between px-4 py-3 
        bg-[#1a2332] border-b border-[#2a3a4a]
    `,
    title: `
        flex items-center gap-2 text-sm font-bold text-white
    `,
    headerActions: `
        flex items-center gap-1
    `,
    iconBtn: `
        p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white
        transition-colors cursor-pointer
    `,
    section: `
        flex-1 overflow-y-auto
    `,
    sectionHeader: `
        flex items-center justify-between px-4 py-2 
        text-xs font-semibold text-gray-500 uppercase
    `,
    projectItem: `
        flex items-center gap-2 px-4 py-2 
        cursor-pointer hover:bg-white/5 transition-colors
        border-l-2 border-transparent
    `,
    projectItemActive: `
        !bg-[#00e5ff]/10 !border-[#00e5ff]
    `,
    projectIcon: `
        flex-shrink-0
    `,
    projectInfo: `
        flex-1 min-w-0
    `,
    projectName: `
        text-sm text-white truncate
    `,
    projectMeta: `
        text-xs text-gray-500 truncate
    `,
    workspaceTab: `
        flex items-center gap-2 px-4 py-1.5 ml-4
        cursor-pointer hover:bg-white/5 transition-colors
        text-xs text-gray-400 hover:text-white
    `,
    workspaceTabActive: `
        !text-[#00e5ff]
    `,
    footer: `
        p-3 border-t border-[#2a3a4a] space-y-2
    `,
    footerBtn: `
        flex items-center gap-2 w-full px-3 py-2 rounded-lg
        bg-[#1a2332] hover:bg-[#2a3a4a] text-sm text-gray-400
        hover:text-white transition-colors cursor-pointer
    `,
    modal: `
        fixed inset-0 z-50 flex items-center justify-center 
        bg-black/80 backdrop-blur-sm
    `,
    modalContent: `
        bg-[#0f1419] rounded-xl border border-[#2a3a4a] 
        w-full max-w-md mx-4 overflow-hidden
    `,
    modalHeader: `
        flex items-center justify-between px-4 py-3 
        bg-[#1a2332] border-b border-[#2a3a4a]
    `,
    modalBody: `
        p-4 space-y-4
    `,
    input: `
        w-full px-3 py-2 bg-[#0a0e14] border border-[#2a3a4a] 
        rounded-lg text-white text-sm outline-none
        focus:border-[#00e5ff] transition-colors
    `,
    btnPrimary: `
        px-4 py-2 bg-[#00e5ff] text-black text-sm font-medium 
        rounded-lg hover:bg-[#00e5ff]/80 transition-colors
    `,
    btnSecondary: `
        px-4 py-2 bg-[#2a3a4a] text-white text-sm 
        rounded-lg hover:bg-[#3a4a5a] transition-colors
    `,
};

// ============================================
// New Project Modal
// ============================================

const NewProjectModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, description?: string) => void;
}> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), description.trim() || undefined);
            setName('');
            setDescription('');
            onClose();
        }
    };

    return (
        <div className={styles.modal} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <span className="text-sm font-bold text-white">New Project</span>
                </div>
                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className={styles.input}
                            placeholder="My Engineering Project"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">
                            Description (optional)
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className={styles.input}
                            placeholder="Brief description..."
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={onClose} className={styles.btnSecondary}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.btnPrimary}>
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================
// Project Item Component
// ============================================

const ProjectItem: React.FC<{
    project: Project;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}> = ({ project, isActive, onSelect, onDelete, onDuplicate }) => {
    const [isExpanded, setIsExpanded] = useState(isActive);
    const [showMenu, setShowMenu] = useState(false);

    const { switchWorkspace } = useWorkspaceStore();

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div>
            <div
                className={`${styles.projectItem} ${isActive ? styles.projectItemActive : ''}`}
                onClick={() => {
                    onSelect();
                    setIsExpanded(!isExpanded);
                }}
            >
                <span className={styles.projectIcon}>
                    {isExpanded ? (
                        <ChevronDown size={14} className="text-gray-500" />
                    ) : (
                        <ChevronRight size={14} className="text-gray-500" />
                    )}
                </span>
                <FolderOpen size={16} className={isActive ? 'text-[#00e5ff]' : 'text-gray-500'} />
                <div className={styles.projectInfo}>
                    <div className={styles.projectName}>{project.name}</div>
                    <div className={styles.projectMeta}>
                        {formatDate(project.updatedAt)} · {project.workspaces.length} workspace(s)
                    </div>
                </div>
                <div
                    className="relative"
                    onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
                >
                    <MoreVertical size={14} className="text-gray-500 hover:text-white" />
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-[#1a2332] border border-[#2a3a4a] rounded-lg py-1 min-w-[120px] z-10">
                            <button
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10"
                                onClick={onDuplicate}
                            >
                                <Copy size={12} /> Duplicate
                            </button>
                            <button
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                                onClick={onDelete}
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Workspaces */}
            {isExpanded && isActive && (
                <div>
                    {project.workspaces.map(workspace => (
                        <div
                            key={workspace.id}
                            className={`${styles.workspaceTab} ${workspace.id === project.activeWorkspaceId
                                    ? styles.workspaceTabActive
                                    : ''
                                }`}
                            onClick={() => switchWorkspace(workspace.id)}
                        >
                            <Layers size={12} />
                            {workspace.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ============================================
// Main Component
// ============================================

export const ProjectSidebar: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [showNewModal, setShowNewModal] = useState(false);
    const [showImport, setShowImport] = useState(false);

    const {
        projects,
        currentProjectId,
        recentProjects,
        createProject,
        openProject,
        deleteProject,
        duplicateProject,
        exportProject,
        importProject,
    } = useWorkspaceStore();

    const handleCreate = useCallback((name: string, description?: string) => {
        createProject(name, description);
    }, [createProject]);

    const handleExport = useCallback(() => {
        if (currentProjectId) {
            const json = exportProject(currentProjectId);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }, [currentProjectId, exportProject]);

    const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const json = reader.result as string;
                const newId = importProject(json);
                if (newId) {
                    openProject(newId);
                }
            };
            reader.readAsText(file);
        }
    }, [importProject, openProject]);

    // Sort projects: active first, then by updated date
    const sortedProjects = [...projects].sort((a, b) => {
        if (a.id === currentProjectId) return -1;
        if (b.id === currentProjectId) return 1;
        return b.updatedAt - a.updatedAt;
    });

    return (
        <>
            <div className={`${styles.container} ${className}`}>
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.title}>
                        <FolderOpen size={16} className="text-[#00e5ff]" />
                        Projects
                    </span>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.iconBtn}
                            onClick={() => setShowNewModal(true)}
                            title="New Project"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {/* Projects List */}
                <div className={styles.section}>
                    {projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <FolderOpen size={32} className="mb-2 opacity-50" />
                            <span className="text-sm">No projects yet</span>
                            <button
                                className="mt-3 px-3 py-1.5 bg-[#00e5ff]/20 text-[#00e5ff] text-xs rounded-lg"
                                onClick={() => setShowNewModal(true)}
                            >
                                Create First Project
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={styles.sectionHeader}>
                                <span>All Projects</span>
                                <span className="text-[#00e5ff]">{projects.length}</span>
                            </div>
                            {sortedProjects.map(project => (
                                <ProjectItem
                                    key={project.id}
                                    project={project}
                                    isActive={project.id === currentProjectId}
                                    onSelect={() => openProject(project.id)}
                                    onDelete={() => deleteProject(project.id)}
                                    onDuplicate={() => duplicateProject(project.id)}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className={styles.footer}>
                    <button className={styles.footerBtn} onClick={handleExport}>
                        <Download size={14} />
                        Export Project
                    </button>
                    <label className={styles.footerBtn}>
                        <Upload size={14} />
                        Import Project
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImport}
                        />
                    </label>
                </div>
            </div>

            {/* New Project Modal */}
            <NewProjectModal
                isOpen={showNewModal}
                onClose={() => setShowNewModal(false)}
                onCreate={handleCreate}
            />
        </>
    );
};

export default ProjectSidebar;
