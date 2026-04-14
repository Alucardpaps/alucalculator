'use client';

import React from 'react';
import { useCivilStore } from '@/store/useCivilStore';
import { BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

export function CodeVerification() {
    const { violations, isCheckingCode, lastCheckedCode, runComplianceCheck, clearViolations } = useCivilStore();

    return (
        <div className="flex flex-col gap-4 p-4 border border-slate-700 bg-slate-900 rounded-lg">
            <h3 className="text-xl font-bold flex items-center gap-2 text-sky-400">
                <BookOpen /> Automated Design Code Verification
            </h3>
            <p className="text-sm text-slate-300">SkyCiv style international design code checks (AISC, Eurocode).</p>

            <div className="flex gap-2">
                <button
                    onClick={() => runComplianceCheck({}, 'AISC')}
                    disabled={isCheckingCode}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded disabled:opacity-50"
                >
                    Verify against AISC 360-16
                </button>
                <button
                    onClick={() => runComplianceCheck({}, 'Eurocode')}
                    disabled={isCheckingCode}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded disabled:opacity-50"
                >
                    Verify against Eurocode 3
                </button>
            </div>

            {lastCheckedCode && violations.length === 0 && !isCheckingCode && (
                <div className="mt-2 p-3 bg-emerald-900/30 text-emerald-400 rounded flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> All {lastCheckedCode} code requirements satisfied.
                </div>
            )}

            {violations.length > 0 && !isCheckingCode && (
                <div className="mt-2 space-y-2">
                    <h4 className="font-bold text-rose-400 text-sm">Code Violations ({lastCheckedCode}):</h4>
                    {violations.map(v => (
                        <div key={v.id} className="p-3 bg-slate-800 border-l-4 border-rose-500 rounded text-sm text-slate-300 flex items-start gap-2">
                            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${v.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                            <div>{v.description}</div>
                        </div>
                    ))}
                    <button onClick={clearViolations} className="text-xs text-slate-400 hover:text-slate-200 underline mt-2 block">Clear Results</button>
                </div>
            )}
        </div>
    );
}
