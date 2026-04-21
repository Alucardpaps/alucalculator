import React, { useState } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { useWorkspace } from '@/store/useWorkspace';

/**
 * SaveButton Component
 * Persists calculation inputs to the selected project.
 */

interface SaveButtonProps {
    type: string;
    inputData: any;
    engineVersion: string;
    resultJson?: any;
    disabled?: boolean;
    onError?: (msg: string) => void;
}

export function SaveButton({ type, inputData, engineVersion, resultJson, disabled, onError }: SaveButtonProps) {
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const { currentProjectId, setUnsavedChanges } = useWorkspace();

    const handleSave = async () => {
        if (!currentProjectId) {
            alert("Please select or create a project first via the Dashboard.");
            return;
        }

        setStatus('saving');
        try {
            const response = await fetch('/api/calculations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: currentProjectId,
                    type,
                    inputJson: inputData,
                    engineVersion,
                    resultJson: resultJson
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save");
            }

            setStatus('success');
            setUnsavedChanges(false);
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err: any) {
            console.error("Save Error:", err);
            setStatus('error');
            if (onError) onError(err.message);
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <button
            onClick={handleSave}
            disabled={disabled || status === 'saving' || !currentProjectId}
            className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all
                ${status === 'success' 
                    ? 'bg-emerald-600 text-white' 
                    : status === 'error'
                        ? 'bg-red-600 text-white'
                        : !currentProjectId
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                }
            `}
        >
            {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             status === 'success' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            
            {status === 'saving' ? 'Saving...' : 
             status === 'success' ? 'Saved' : 
             status === 'error' ? 'Error' : 'Save to Project'}
        </button>
    );
}
