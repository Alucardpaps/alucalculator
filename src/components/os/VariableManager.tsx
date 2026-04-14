import React, { useState } from 'react';
import { useProjectStore, ProjectVariable } from '@/store/projectStore';
import { Plus, Trash2, Save, X, Variable } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

export function VariableManager() {
    const { t } = useI18nStore();
    const { variables, addVariable, updateVariable, removeVariable } = useProjectStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newVar, setNewVar] = useState<Partial<ProjectVariable>>({ name: '', value: 0, unit: '' });

    const handleAdd = () => {
        if (newVar.name && newVar.value !== undefined) {
            addVariable({
                name: newVar.name,
                value: Number(newVar.value),
                unit: newVar.unit || '',
                description: newVar.description || ''
            });
            setIsAdding(false);
            setNewVar({ name: '', value: 0, unit: '' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0e14] text-slate-200 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Variable className="text-cyan-400" />
                    <h2 className="text-lg font-bold tracking-wider">{t.variables.title}</h2>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded hover:bg-cyan-500/20 transition-all text-sm"
                >
                    <Plus size={16} />
                    {t.variables.addVariable}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-mono text-slate-500 border-b border-white/5">
                            <th className="p-2">{t.variables.name}</th>
                            <th className="p-2">{t.variables.value}</th>
                            <th className="p-2">{t.variables.unit}</th>
                            <th className="p-2">{t.variables.description}</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAdding && (
                            <tr className="bg-white/5">
                                <td className="p-2">
                                    <input
                                        autoFocus
                                        className="w-full bg-transparent border-b border-cyan-500 outline-none text-cyan-300 font-mono"
                                        placeholder={t.variables.placeholderName}
                                        value={newVar.name}
                                        onChange={e => setNewVar({ ...newVar, name: e.target.value })}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        className="w-full bg-transparent border-b border-cyan-500 outline-none text-white font-mono"
                                        value={newVar.value}
                                        onChange={e => setNewVar({ ...newVar, value: Number(e.target.value) })}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="w-full bg-transparent border-b border-cyan-500 outline-none text-slate-400 text-xs"
                                        placeholder="mm"
                                        value={newVar.unit}
                                        onChange={e => setNewVar({ ...newVar, unit: e.target.value })}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="w-full bg-transparent border-b border-cyan-500 outline-none text-slate-500 text-xs"
                                        placeholder={t.variables.placeholderDesc}
                                        value={newVar.description}
                                        onChange={e => setNewVar({ ...newVar, description: e.target.value })}
                                    />
                                </td>
                                <td className="p-2 flex items-center gap-1">
                                    <button onClick={handleAdd} className="p-1 hover:text-green-400"><Save size={14} /></button>
                                    <button onClick={() => setIsAdding(false)} className="p-1 hover:text-red-400"><X size={14} /></button>
                                </td>
                            </tr>
                        )}

                        {variables.map((v: ProjectVariable) => (
                            <VariableRow key={v.id} variable={v} onUpdate={updateVariable} onRemove={removeVariable} />
                        ))}
                    </tbody>
                </table>

                {variables.length === 0 && !isAdding && (
                    <div className="text-center py-10 text-slate-600 text-sm">
                        {t.variables.noVariables}
                    </div>
                )}
            </div>
        </div>
    );
}

function VariableRow({ variable, onUpdate, onRemove }: {
    variable: ProjectVariable,
    onUpdate: (id: string, v: Partial<ProjectVariable>) => void,
    onRemove: (id: string) => void
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editVal, setEditVal] = useState(variable.value);

    const handleSave = () => {
        onUpdate(variable.id, { value: editVal });
        setIsEditing(false);
    };

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 group transition-colors">
            <td className="p-2 font-mono text-cyan-300 text-sm">{variable.name}</td>
            <td className="p-2 font-mono text-white">
                {isEditing ? (
                    <input
                        autoFocus
                        type="number"
                        className="w-24 bg-black/50 border border-cyan-500/50 rounded px-1 outline-none"
                        value={editVal}
                        onChange={e => setEditVal(Number(e.target.value))}
                        onBlur={handleSave}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                ) : (
                    <span
                        onClick={() => setIsEditing(true)}
                        className="cursor-pointer hover:underline decoration-dashed underline-offset-4 decoration-slate-600"
                    >
                        {variable.value}
                    </span>
                )}
            </td>
            <td className="p-2 text-xs text-slate-400">{variable.unit}</td>
            <td className="p-2 text-xs text-slate-500">{variable.description}</td>
            <td className="p-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onRemove(variable.id)}
                    className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </td>
        </tr>
    );
}
