import React, { useState } from 'react';
import { FileText, Building2, UserCircle, Tag, StickyNote, X, Loader2 } from 'lucide-react';
import { ReportMetadata } from '@/lib/pdfReportEngine';
import { getReportBranding, nextDocumentNumber } from '@/lib/report/reportBranding';

interface ReportSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (metadata: ReportMetadata) => Promise<void>;
    defaultTitle: string;
}

export function ReportSettingsModal({ isOpen, onClose, onGenerate, defaultTitle }: ReportSettingsModalProps) {
    const [metadata, setMetadata] = useState<ReportMetadata>({
        title: defaultTitle,
        clientName: '',
        projectName: '',
        preparedBy: getReportBranding().designedBy,
        referenceNo: nextDocumentNumber(),
        notes: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await onGenerate(metadata);
            onClose();
        } catch (error) {
            console.error("Failed to generate report:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)]">
            <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-l)] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--line)] bg-[var(--bg-2)]">
                    <div className="flex items-center gap-2 text-[var(--ink)]">
                        <FileText size={16} className="text-[var(--cyan)]" />
                        <h2 className="text-xs font-bold uppercase tracking-widest">Enterprise Report Setup</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-[var(--alu-dim)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-xs text-[var(--alu-dim)] mb-4 px-1">Configure metadata for the professional PDF report before generating. Company logo and the Designed / Checked / Approved names come from Settings → Reports.</p>

                    {/* Document Title (Static layout usually but editable) */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest px-1">Document Title</label>
                        <div className="relative">
                            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                            <input
                                type="text"
                                className="w-full bg-[var(--bg-3)] border border-[var(--line)] rounded-[var(--radius-m)] pl-9 pr-3 py-2.5 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent-line)] transition-colors"
                                value={metadata.title}
                                onChange={e => setMetadata({ ...metadata, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest px-1">Client/Company</label>
                            <div className="relative">
                                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                                <input
                                    type="text"
                                    placeholder="Optional"
                                    className="w-full bg-[var(--bg-3)] border border-[var(--line)] rounded-[var(--radius-m)] pl-9 pr-3 py-2.5 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent-line)] transition-colors"
                                    value={metadata.clientName}
                                    onChange={e => setMetadata({ ...metadata, clientName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest px-1">Prepared By</label>
                            <div className="relative">
                                <UserCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                                <input
                                    type="text"
                                    placeholder="Engineer Name"
                                    className="w-full bg-[var(--bg-3)] border border-[var(--line)] rounded-[var(--radius-m)] pl-9 pr-3 py-2.5 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent-line)] transition-colors"
                                    value={metadata.preparedBy}
                                    onChange={e => setMetadata({ ...metadata, preparedBy: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest px-1">Project Name</label>
                            <input
                                type="text"
                                placeholder="Internal Identifier"
                                className="w-full bg-[var(--bg-3)] border border-[var(--line)] rounded-[var(--radius-m)] px-3 py-2.5 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent-line)] transition-colors"
                                value={metadata.projectName}
                                onChange={e => setMetadata({ ...metadata, projectName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest px-1">Ref Number</label>
                            <input
                                type="text"
                                className="w-full bg-[var(--bg-3)] border border-[var(--line)] rounded-[var(--radius-m)] px-3 py-2.5 text-xs text-[var(--alu)] font-mono focus:outline-none focus:border-[var(--accent-line)] transition-colors"
                                value={metadata.referenceNo}
                                onChange={e => setMetadata({ ...metadata, referenceNo: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest px-1">Additional Notes</label>
                        <div className="relative">
                            <StickyNote size={14} className="absolute left-3 top-3 text-[var(--muted)]" />
                            <textarea
                                rows={3}
                                placeholder="Disclaimers, assumptions, revisions..."
                                className="w-full bg-[var(--bg-3)] border border-[var(--line)] rounded-[var(--radius-m)] pl-9 pr-3 py-2.5 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent-line)] transition-colors resize-none"
                                value={metadata.notes}
                                onChange={e => setMetadata({ ...metadata, notes: e.target.value })}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--line)] bg-black/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="px-4 py-2 text-xs font-bold text-[var(--alu-dim)] hover:text-[var(--ink)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !metadata.title}
                        className="px-6 py-2 bg-[var(--cyan)] hover:bg-[var(--cyan-dim)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--accent-ink)] text-xs font-bold uppercase tracking-wider rounded-[var(--radius-m)] transition-all shadow-lg flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <><Loader2 size={14} className="animate-spin" /> Generating...</>
                        ) : (
                            <><FileText size={14} /> Generate PDF</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
