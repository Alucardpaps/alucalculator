/**
 * modules/mechanical/CylinderDesign/MountingMatrixGrid.tsx
 * 
 * Interactive ISO 6020-2 / ISO 6022 Mounting Selection Matrix
 * Visual cards with schematic symbols, buckling factors (nu), and standard designations.
 */

'use client';

import React from 'react';
import { CylinderMountingStyle } from './engine';
import { t12 } from '@/locales/t12';

interface MountingMatrixGridProps {
    currentMounting: CylinderMountingStyle;
    onSelectMounting: (style: CylinderMountingStyle) => void;
    language: string;
}

interface MountDef {
    id: CylinderMountingStyle;
    code: string;
    standard: string;
    nameTr: string;
    nameEn: string;
    nu: number;
    descTr: string;
    descEn: string;
    svgPath: string; // schematic representation
}

const MOUNT_GROUPS: { groupNameTr: string; groupNameEn: string; items: MountDef[] }[] = [
    {
        groupNameTr: 'Mafsallı & Çatal Montajlar (Pivot & Swivel Mounts)',
        groupNameEn: 'Pivot & Swivel Mounts',
        items: [
            {
                id: 'cap_spherical_eye_mp5',
                code: 'ISO MP5',
                standard: 'ISO 6020-2 / DIN 24554',
                nameTr: 'Oynak Mafsal Rulmanlı Göz',
                nameEn: 'Spherical Bearing Eye (GE..ES)',
                nu: 1.0,
                descTr: 'Açısal kasıntıları tolere eden DIN ISO 12240-1 GE..ES oynak bilye rulmanı.',
                descEn: 'Swivel eye with spherical bearing absorbing angular misalignment.',
                svgPath: 'M 10 20 C 10 14, 16 10, 24 10 C 32 10, 38 14, 38 20 C 38 26, 32 30, 24 30 C 16 30, 10 26, 10 20 Z M 24 16 A 4 4 0 1 0 24 24 A 4 4 0 1 0 24 16 Z'
            },
            {
                id: 'cap_clevis_mp1',
                code: 'ISO MP1',
                standard: 'ISO 6020-2 / DIN 24554',
                nameTr: 'Arka Çatal Mafsal & Pim',
                nameEn: 'Rear Female Clevis with Pin',
                nu: 1.0,
                descTr: 'Çatal formunda arka kulak ve segmanlı çapraz mafsal pimi.',
                descEn: 'U-shaped rear clevis fork with retention cross pin.',
                svgPath: 'M 8 12 L 20 12 L 20 28 L 8 28 Z M 24 12 L 36 12 L 36 28 L 24 28 Z M 22 20 A 3 3 0 1 0 22 20.1 Z'
            },
            {
                id: 'cap_plain_eye_mp3',
                code: 'ISO MP3',
                standard: 'ISO 6020-2',
                nameTr: 'Arka Sabit Delikli Göz',
                nameEn: 'Rear Plain Cylindrical Eye',
                nu: 1.0,
                descTr: 'Düz delikli sabit arka kulak (bronz burçlu pim yataklama).',
                descEn: 'Fixed rear lug with plain cylindrical bore and bronze bushing.',
                svgPath: 'M 12 20 C 12 15, 17 11, 24 11 C 31 11, 36 15, 36 20 C 36 25, 31 29, 24 29 C 17 29, 12 25, 12 20 Z M 24 17 A 3 3 0 1 0 24 23 A 3 3 0 1 0 24 17 Z'
            },
            {
                id: 'cap_male_eye_mp4',
                code: 'ISO MP4',
                standard: 'ISO 6022 Mill Duty',
                nameTr: 'Arka Tek Kulak (Erkek Mafsal)',
                nameEn: 'Rear Male Clevis Lug',
                nu: 1.0,
                descTr: 'Harici çatala oturan masif arka tek kulak.',
                descEn: 'Single male tab mating into external clevis brackets.',
                svgPath: 'M 14 14 L 30 14 L 30 26 L 14 26 Z M 22 20 A 3 3 0 1 0 22 20.1 Z'
            }
        ]
    },
    {
        groupNameTr: 'Flanşlı Montajlar (Flange Mounts - ISO 6020 / 6022)',
        groupNameEn: 'Flange Mounts',
        items: [
            {
                id: 'head_flange_mf3',
                code: 'ISO MF3',
                standard: 'ISO 6020-2 / DIN 24554',
                nameTr: 'Ön Başlık Flanşı',
                nameEn: 'Head Rectangular/Round Flange',
                nu: 0.7,
                descTr: 'Ön boğaza sabitlenmiş cıvata delikli sert flanş (nu = 0.7 burkulma avantajı).',
                descEn: 'Rigid front flange bolted directly to machine bulkhead.',
                svgPath: 'M 18 6 L 24 6 L 24 34 L 18 34 Z M 8 10 L 14 10 L 14 30 L 8 30 Z M 11 14 A 1.5 1.5 0 1 0 11 14.1 Z M 11 26 A 1.5 1.5 0 1 0 11 26.1 Z'
            },
            {
                id: 'cap_flange_mf4',
                code: 'ISO MF4',
                standard: 'ISO 6020-2 / DIN 24554',
                nameTr: 'Arka Taban Flanşı',
                nameEn: 'Rear Cap Flange',
                nu: 1.0,
                descTr: 'Arka kapağa sabitlenmiş düz montaj flanşı.',
                descEn: 'Base flange for rear bulkhead surface mounting.',
                svgPath: 'M 10 6 L 16 6 L 16 34 L 10 34 Z M 20 10 L 26 10 L 26 30 L 20 30 Z M 13 14 A 1.5 1.5 0 1 0 13 14.1 Z M 13 26 A 1.5 1.5 0 1 0 13 26.1 Z'
            }
        ]
    },
    {
        groupNameTr: 'Muylulu Montajlar (Trunnion Mounts - ISO MT1 & MT4)',
        groupNameEn: 'Trunnion Mounts',
        items: [
            {
                id: 'intermediate_trunnion_mt4',
                code: 'ISO MT4',
                standard: 'ISO 6020-2 / ISO 6022',
                nameTr: 'Gövde Orta Muylu Mafsalı',
                nameEn: 'Intermediate Trunnion',
                nu: 1.0,
                descTr: 'Boru üzerine geçirilmiş silindirik çift muylu pimi. Burkulma boyunu kısaltır.',
                descEn: 'Adjustable body trunnion reducing effective buckling length.',
                svgPath: 'M 14 10 L 30 10 L 30 30 L 14 30 Z M 6 17 L 14 17 L 14 23 L 6 23 Z M 30 17 L 38 17 L 38 23 L 30 23 Z'
            },
            {
                id: 'head_trunnion_mt1',
                code: 'ISO MT1',
                standard: 'ISO 6020-2',
                nameTr: 'Ön Kafa Muylu Mafsalı',
                nameEn: 'Head Fixed Trunnion',
                nu: 1.0,
                descTr: 'Ön boğaz bloğu üzerinde entegre muylu pimleri.',
                descEn: 'Front head integrated pivot pins.',
                svgPath: 'M 18 10 L 32 10 L 32 30 L 18 30 Z M 22 4 L 28 4 L 28 10 L 22 10 Z M 22 30 L 28 30 L 28 36 L 22 36 Z'
            }
        ]
    },
    {
        groupNameTr: 'Ayaklar & Saplamalı Montajlar (Lugs & Tie-Rod Mounts)',
        groupNameEn: 'Foot & Tie-Rod Mounts',
        items: [
            {
                id: 'side_lugs_ms2',
                code: 'ISO MS2',
                standard: 'ISO 6020-2 / DIN 24554',
                nameTr: 'Gövde Yan Ayaklar (Taban)',
                nameEn: 'Side Lugs / Foot Mount',
                nu: 0.7,
                descTr: 'Şasiye yatay cıvatalanan yan ayak pabuçları (devirme momenti hesaplanır).',
                descEn: 'Base side lugs for horizontal rigid bed frame mounting.',
                svgPath: 'M 8 24 L 36 24 L 36 30 L 8 30 Z M 12 12 L 32 12 L 32 24 L 12 24 Z M 10 27 A 1.5 1.5 0 1 0 10 27.1 Z M 34 27 A 1.5 1.5 0 1 0 34 27.1 Z'
            },
            {
                id: 'extended_tie_rods_mx1',
                code: 'ISO MX1',
                standard: 'ISO 6020-2 / DIN 24554',
                nameTr: 'Ön Uzatılmış Saplamalar',
                nameEn: 'Head Extended Tie-Rods',
                nu: 0.7,
                descTr: 'Ön kapaktan ileri uzanan 4 adet metrik dişli gergi saplaması.',
                descEn: '4 front continuous tie-rods extending forward past front nuts.',
                svgPath: 'M 12 10 L 26 10 L 26 30 L 12 30 Z M 26 14 L 38 14 L 38 16 L 26 16 Z M 26 24 L 38 24 L 38 26 L 26 26 Z'
            },
            {
                id: 'extended_tie_rods_mx2',
                code: 'ISO MX2',
                standard: 'ISO 6020-2 / DIN 24554',
                nameTr: 'Arka Uzatılmış Saplamalar',
                nameEn: 'Cap Extended Tie-Rods',
                nu: 1.0,
                descTr: 'Arka kapaktan geri uzanan 4 adet metrik dişli gergi saplaması.',
                descEn: '4 rear continuous tie-rods extending rearward.',
                svgPath: 'M 18 10 L 32 10 L 32 30 L 18 30 Z M 6 14 L 18 14 L 18 16 L 6 16 Z M 6 24 L 18 24 L 18 26 L 6 26 Z'
            },
            {
                id: 'extended_tie_rods_mx3',
                code: 'ISO MX3',
                standard: 'ISO 6020-2 / DIN 24554',
                nameTr: 'Çift Taraflı Uzatılmış Saplamalar',
                nameEn: 'Both Ends Extended Tie-Rods',
                nu: 0.7,
                descTr: 'Hem ön hem arka kapaktan dışarı taşan gergi saplamaları.',
                descEn: 'Through tie-rods extending out of both front and rear faces.',
                svgPath: 'M 16 10 L 28 10 L 28 30 L 16 30 Z M 6 15 L 16 15 L 16 17 L 6 17 Z M 28 15 L 38 15 L 38 17 L 28 17 Z'
            }
        ]
    }
];

export function MountingMatrixGrid({
    currentMounting,
    onSelectMounting,
    language
}: MountingMatrixGridProps) {
    return (
        <div className="w-full space-y-3 font-mono">
            {MOUNT_GROUPS.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
                        {t12(language, group.groupNameEn, group.groupNameTr)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {group.items.map((item) => {
                            const isSelected = currentMounting === item.id || 
                                (item.id === 'cap_clevis_mp1' && currentMounting === 'clevis_rear') ||
                                (item.id === 'head_flange_mf3' && currentMounting === 'flange_front') ||
                                (item.id === 'cap_flange_mf4' && currentMounting === 'flange_rear') ||
                                (item.id === 'side_lugs_ms2' && currentMounting === 'foot_mount') ||
                                (item.id === 'intermediate_trunnion_mt4' && currentMounting === 'trunnion_mid');

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelectMounting(item.id)}
                                    className={`p-2.5 rounded-[var(--radius-s)] border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                                        isSelected
                                            ? 'bg-[var(--cyan)]/15 border-[var(--cyan)] text-white'
                                            : 'bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border-[var(--line)] text-[var(--alu)]'
                                    }`}
                                >
                                    {/* Top Line: ISO Code & Factor */}
                                    <div className="flex items-start justify-between gap-1 mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-6 h-6 shrink-0" viewBox="0 0 44 40" fill="none">
                                                <path
                                                    d={item.svgPath}
                                                    fill={isSelected ? 'var(--cyan)' : 'var(--alu-dim)'}
                                                    fillRule="evenodd"
                                                />
                                            </svg>
                                            <div>
                                                <span className="text-xs font-bold block text-white">
                                                    {item.code}
                                                </span>
                                                <span className="text-[9px] text-[var(--alu-dim)] block">
                                                    {item.standard}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                                            isSelected 
                                                ? 'bg-[var(--cyan)]/25 border-[var(--cyan)] text-[var(--cyan)]' 
                                                : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu-dim)]'
                                        }`}>
                                            ν = {item.nu}
                                        </span>
                                    </div>

                                    {/* Name & Short description */}
                                    <div className="space-y-0.5 mt-1">
                                        <div className="text-[11px] font-bold text-white leading-tight">
                                            {t12(language, item.nameEn, item.nameTr)}
                                        </div>
                                        <p className="text-[10px] text-[var(--alu-dim)] leading-tight line-clamp-2">
                                            {t12(language, item.descEn, item.descTr)}
                                        </p>
                                    </div>

                                    {/* Active selection dot */}
                                    {isSelected && (
                                        <div className="mt-2 pt-1 border-t border-[var(--cyan)]/40 flex items-center justify-between text-[10px] text-[var(--cyan)] font-bold">
                                            <span>● {t12(language, 'Active Choice', 'Aktif Seçim')}</span>
                                            <span>Lk = {item.nu === 0.7 ? '0.7 × L' : item.nu === 0.5 ? '0.5 × L' : '1.0 × L'}</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
