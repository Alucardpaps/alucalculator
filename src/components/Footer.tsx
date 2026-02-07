"use client";

import { Linkedin, Mail, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const Footer = ({ lang, dict }: { lang: string, dict: any }) => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 py-12 text-slate-400">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                    {/* Developer Info */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-white mb-2">Developed by</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                AY
                            </div>
                            <div>
                                <div className="font-bold text-white text-lg">Abdulsamet Yildirim</div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Frontend Architect & Engineer</div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <a
                                href="https://www.linkedin.com/in/abdulsamet-yildirim-b353b718a/?locale=en"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-slate-800 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                                <Linkedin size={20} />
                            </a>
                            <a
                                href="mailto:abdulsametyildirim95@gmail.com"
                                className="p-2 bg-slate-800 hover:bg-red-500 text-white rounded-lg transition-colors"
                            >
                                <Mail size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-amber-900/20 border border-amber-900/50 p-6 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h4 className="text-white font-bold mb-1">v4.0.0 Stable</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {lang === 'tr'
                                        ? "Bu yazılım v4.0.0 Stable sürümüdür. Hesaplama sonuçları referans amaçlıdır. Nihai üretim ve mühendislik kararları öncesinde mutlaka uzman bir profesyonel tarafından kontrol edilmelidir."
                                        : "This software is v4.0.0 Stable. Calculation results are for reference only. Final production and engineering decisions must be verified by a qualified professional."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600">
                    <p>&copy; 2026 AluCalculator. All rights reserved.</p>
                    <p>Designed with Intentional Minimalism.</p>
                </div>
            </div>
        </footer>
    );
};
