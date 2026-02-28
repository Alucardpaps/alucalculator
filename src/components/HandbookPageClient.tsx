"use client";

import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { BEARINGS_DB } from '@/data/bearingsData';
import { MATERIALS_DB, FITS_DB } from '@/data/materialsData';
import { useI18nStore } from '@/store/i18nStore';

type Section = 'bearings' | 'tolerances' | 'gcodes' | 'materials';

const G_CODES = [
    { code: 'G00', desc: 'Rapid Positioning' },
    { code: 'G01', desc: 'Linear Interpolation' },
    { code: 'G02', desc: 'Circular Interpolation CW' },
    { code: 'G03', desc: 'Circular Interpolation CCW' },
    { code: 'G28', desc: 'Return to Home' },
    { code: 'M03', desc: 'Spindle ON CW' },
    { code: 'M05', desc: 'Spindle STOP' },
    { code: 'M08', desc: 'Coolant ON' },
];

export default function HandbookPageClient() {
    const { t, language: lang } = useI18nStore();
    const [section, setSection] = useState<Section>('bearings');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');

    const filteredBearings = BEARINGS_DB.filter(b => {
        const matchesSearch = b.code.includes(search);
        const matchesType = typeFilter === 'All' || b.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-12 font-sans transition-colors duration-300">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <BookOpen className="text-blue-600 dark:text-blue-400" />
                        {t.modules.handbook.title}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">{t.handbook.description}</p>
                </div>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Sidebar Navigation */}
                <div className="lg:col-span-3 space-y-2">
                    <button
                        onClick={() => setSection('bearings')}
                        className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${section === 'bearings' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        {t.handbook.categories}
                    </button>
                    <button
                        onClick={() => setSection('tolerances')}
                        className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${section === 'tolerances' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        {t.modules['fits-tolerances'].title}
                    </button>
                    <button
                        onClick={() => setSection('materials')}
                        className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${section === 'materials' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        {t.modules['materials-db'].title}
                    </button>
                    <button
                        onClick={() => setSection('gcodes')}
                        className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all ${section === 'gcodes' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        G & M Codes
                    </button>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">

                        {/* Search Bar */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <Search size={20} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder={lang === 'tr' ? 'Ara...' : 'Filter...'}
                                className="w-full outline-none text-slate-700 dark:text-slate-200 bg-transparent"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Bearings Table */}
                        {section === 'bearings' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">{t.variables.name}</th>
                                            <th className="p-4">{lang === 'tr' ? 'Tip' : 'Type'}</th>
                                            <th className="p-4">ID (d)</th>
                                            <th className="p-4">OD (D)</th>
                                            <th className="p-4">{lang === 'tr' ? 'Genişlik' : 'Width'} (B)</th>
                                            <th className="p-4">Dyn (C)</th>
                                            <th className="p-4">Stat (Co)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredBearings.slice(0, 50).map((b) => (
                                            <tr key={b.code} className="hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-slate-300">
                                                <td className="p-4 font-bold">{b.code}</td>
                                                <td className="p-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">{b.type}</span></td>
                                                <td className="p-4">{b.d} mm</td>
                                                <td className="p-4">{b.D} mm</td>
                                                <td className="p-4">{b.B} mm</td>
                                                <td className="p-4 text-slate-500 dark:text-slate-500">{b.C} N</td>
                                                <td className="p-4 text-slate-500 dark:text-slate-500">{b.Co} N</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Tolerances Table */}
                        {section === 'tolerances' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">{lang === 'tr' ? 'Tolerans' : 'Fit / Grade'}</th>
                                            <th className="p-4">{lang === 'tr' ? 'Tip' : 'Type'}</th>
                                            <th className="p-4">{lang === 'tr' ? 'Uygulama' : 'Application'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {FITS_DB.map((f) => (
                                            <tr key={f.grade} className="hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-slate-300">
                                                <td className="p-4 font-mono font-bold w-32">{f.grade}</td>
                                                <td className="p-4 font-bold text-blue-600 dark:text-blue-400 w-40">{f.desc}</td>
                                                <td className="p-4 text-slate-600 dark:text-slate-400">{f.application}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Empty states for other tabs to save space in this edit, simplified */}
                        {section === 'materials' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Material</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Density (g/cm³)</th>
                                            <th className="p-4">Yield (MPa)</th>
                                            <th className="p-4">Tensile (MPa)</th>
                                            <th className="p-4">Hardness</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {MATERIALS_DB.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.includes(search)).map((m) => (
                                            <tr key={m.name} className="hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-slate-300">
                                                <td className="p-4 font-bold">{m.name}</td>
                                                <td className="p-4 text-xs"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{m.category}</span></td>
                                                <td className="p-4">{m.density}</td>
                                                <td className="p-4 text-slate-600 dark:text-slate-400">{m.yield}</td>
                                                <td className="p-4 text-slate-600 dark:text-slate-400">{m.tensile}</td>
                                                <td className="p-4 text-slate-600 dark:text-slate-400">{m.hardness}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* G-Codes (Construction) */}
                        {section === 'gcodes' && (
                            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                                {lang === 'tr' ? 'Bu tablo hazırlanıyor...' : 'Table construction in progress...'}
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </main>
    );
}
