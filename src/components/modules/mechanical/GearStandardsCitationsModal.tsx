'use client';

import React, { useState } from 'react';
import { BookOpen, ExternalLink, Copy, Check, X, ShieldCheck, Bookmark, FileText } from 'lucide-react';
import { t12 } from '@/locales/t12';

export interface StandardCitation {
  id: string;
  category: 'khk' | 'iso' | 'din' | 'jis_agma';
  code: string;
  title: string;
  titleTr: string;
  organization: string;
  year?: string;
  summaryEn: string;
  summaryTr: string;
  appliedFormulas: string[];
  url?: string;
  bibtex: string;
}

export const GEAR_STANDARDS_CITATIONS: StandardCitation[] = [
  {
    id: 'khk-tech-ref',
    category: 'khk',
    code: 'KHK Technical Reference (Tables 4.4 – 4.24)',
    title: 'KHK Gear Technical Reference — Calculation of Gear Dimensions',
    titleTr: 'KHK Dişli Teknik Referansı — Dişli Boyutlandırma ve Hesaplama El Kitabı',
    organization: 'Kohara Gear Industry Co., Ltd. (Saitama, Japan)',
    year: '2024',
    summaryEn: 'Primary industrial design manual specifying geometric equations for racks (Table 4.6/4.10), Gleason straight bevel gears (Table 4.16/4.17), cylindrical worm gear pairs (Table 4.22), and crossed helical gears (Table 4.24).',
    summaryTr: 'Kremayer (Tablo 4.6/4.10), Gleason düz konik dişliler (Tablo 4.16/4.17), sonsuz vida mekanizmaları (Tablo 4.22) ve çapraz helis dişlilerin (Tablo 4.24) geometrik formüllerini içeren birincil endüstriyel standart el kitabı.',
    appliedFormulas: [
      'Rack travel L = π · mt · z1 (mm/rev)',
      'Bevel cone distance Re = d2 / (2 · sin δ2)',
      'Worm lead angle γ = arctan(z1 / q)',
      'Crossed helical center distance a = (d1 + d2) / 2',
    ],
    url: 'https://khkgears.net/new/gear_knowledge/gear_technical_reference/calculation_gear_dimensions.html',
    bibtex: `@manual{khk_gears_2024,
  title = {Gear Technical Reference: Calculation of Gear Dimensions},
  author = {{Kohara Gear Industry Co., Ltd.}},
  year = {2024},
  address = {Kawaguchi, Saitama, Japan},
  url = {https://khkgears.net/new/gear_knowledge/gear_technical_reference/calculation_gear_dimensions.html}
}`,
  },
  {
    id: 'iso-6336',
    category: 'iso',
    code: 'ISO 6336:2019 (Parts 1, 2, 3, 5, 6)',
    title: 'Calculation of load capacity of spur and helical gears',
    titleTr: 'Düz ve helis dişlilerin yük taşıma kapasitesi hesaplaması',
    organization: 'International Organization for Standardization (ISO / TC 60)',
    year: '2019',
    summaryEn: 'The international master standard for contact stress (pitting fatigue, Part 2), tooth root bending fatigue (Part 3), material endurance limits (Part 5), and calculation of service life under variable loads (Part 6).',
    summaryTr: 'Dişli yüzey basıncı (pitting yorulması, Bölüm 2), diş dibi eğilme yorulması (Bölüm 3), malzeme mukavemet sınırları (Bölüm 5) ve değişken yük spektrumları için uluslararası ana standart.',
    appliedFormulas: [
      'Contact Stress: σ_H = Z_H · Z_E · Z_ε · Z_β · √( (F_t / (d1 · b)) · K_A · K_v · K_Hβ · K_Hα · (u + 1)/u ) ≤ σ_HP',
      'Tooth Root Bending: σ_F = (F_t / (b · m_n)) · Y_F · Y_S · Y_β · Y_B · Y_DT · K_A · K_v · K_Fβ · K_Fα ≤ σ_FP',
    ],
    url: 'https://www.iso.org/standard/66493.html',
    bibtex: `@standard{ISO6336_2019,
  title = {ISO 6336:2019 Calculation of load capacity of spur and helical gears},
  organization = {International Organization for Standardization},
  year = {2019},
  address = {Geneva, Switzerland}
}`,
  },
  {
    id: 'din-3960',
    category: 'din',
    code: 'DIN 3960 / DIN 3961',
    title: 'Definitions and parameters for cylindrical gears and cylindrical gear pairs with involute teeth',
    titleTr: 'Evolvent dişli silindirik dişliler ve dişli çiftleri için tanımlar ve parametreler',
    organization: 'Deutsches Institut für Normung (DIN)',
    year: '1987',
    summaryEn: 'Defines the mathematical framework for transverse and normal involute gear parameters, profile shift coefficients (x1, x2), operating pressure angle (αwt), and center distance modification.',
    summaryTr: 'Alın ve normal evolvent dişli geometrisi, profil kaydırma katsayıları (x1, x2), kavrama basınç açısı (αwt) ve eksenler arası mesafe denklemlerinin temel matematiksel çerçevesi.',
    appliedFormulas: [
      'Transverse Module: mt = mn / cos β',
      'Base Diameter: db = d · cos αt',
      'Involute Function: inv(α) = tan(α) - α (rad)',
      'Operating Pressure Angle: inv(αwt) = inv(αt) + 2·(x1 + x2)·tan(αn) / (z1 + z2)',
    ],
    url: 'https://www.din.de/en/getting-involved/standards-committees/naw/standards/wdc-beuth:din21:1159841',
    bibtex: `@standard{DIN3960,
  title = {DIN 3960: Definitions and parameters for cylindrical gears and cylindrical gear pairs with involute teeth},
  organization = {Deutsches Institut f{\"u}r Normung},
  year = {1987},
  address = {Berlin, Germany}
}`,
  },
  {
    id: 'din-867',
    category: 'din',
    code: 'DIN 867 / ISO 53',
    title: 'Basic rack tooth profiles for involute teeth of cylindrical gears for general engineering',
    titleTr: 'Genel mühendislik için silindirik dişlilerin temel kremayer profil standardı',
    organization: 'DIN / ISO',
    year: '1986',
    summaryEn: 'Defines the standard reference tool profile: normal pressure angle αn = 20°, addendum ha = 1.0·mn, dedendum hf = 1.25·mn, and root radius ρf0 = 0.38·mn.',
    summaryTr: 'Standart referans takım profili: normal basınç açısı αn = 20°, diş başı yüksekliği ha = 1.0·mn, diş dibi hf = 1.25·mn ve dip yuvarlama yarıçapı ρf0 = 0.38·mn.',
    appliedFormulas: [
      'Addendum: ha = mn · (1.0 + x)',
      'Dedendum: hf = mn · (1.25 - x)',
      'Total Tooth Depth: h = 2.25 · mn',
    ],
    url: 'https://www.iso.org/standard/4703.html',
    bibtex: `@standard{DIN867_ISO53,
  title = {ISO 53: Cylindrical gears for general and heavy engineering -- Standard basic rack tooth profile},
  organization = {International Organization for Standardization},
  year = {1998}
}`,
  },
  {
    id: 'din-3975',
    category: 'din',
    code: 'DIN 3975 / AGMA 6022',
    title: 'Terms and definitions for cylindrical worm gear pairs with axes at right angles',
    titleTr: '90° dik eksenli silindirik sonsuz vida ve çark çiftleri için terimler ve hesaplamalar',
    organization: 'DIN / AGMA',
    year: '2002',
    summaryEn: 'Specifies axial module mx, diameter factor q, globoid throat curvature ri, lead angle γ, friction angle ρ\', sliding velocity vs, and mesh efficiency η for industrial worm gear sets.',
    summaryTr: 'Eksenel modül mx, çap faktörü q, globoid boğaz yarıçapı ri, hatve açısı γ, sürtünme açısı ρ\', kayma hızı vs ve kavrama verimi η bağıntılarını tanımlayan sonsuz vida standardı.',
    appliedFormulas: [
      'Center Distance: a = (d1 + d2) / 2 = mx · (q + z2) / 2',
      'Throat Radius: ri = a - da1 / 2',
      'Sliding Velocity: vs = (π · d1 · n1) / (60000 · cos γ)',
      'Efficiency: η = tan(γ) / tan(γ + ρ\')',
    ],
    url: 'https://www.din.de/en/getting-involved/standards-committees/naw/standards/wdc-beuth:din21:4983050',
    bibtex: `@standard{DIN3975_2002,
  title = {DIN 3975: Terms and definitions for cylindrical worm gear pairs with axes at right angles},
  organization = {Deutsches Institut f{\"u}r Normung},
  year = {2002}
}`,
  },
  {
    id: 'jis-b-1702',
    category: 'jis_agma',
    code: 'JIS B 1702 / ISO 1328',
    title: 'Cylindrical gears — System of accuracy and crossed helical gearing',
    titleTr: 'Silindirik dişliler — Hassasiyet sistemi ve çapraz helis dişli çiftleri',
    organization: 'Japanese Industrial Standards (JIS) / ISO',
    year: '1998',
    summaryEn: 'Governs crossed helical gears (screw gears) operating on non-parallel, non-intersecting shafts at arbitrary angles (typically Σ = 90°), specifying normal/transverse modules and point-contact sliding kinematics.',
    summaryTr: 'Kesişmeyen ve paralel olmayan eksenlerde (genellikle Σ = 90°) çalışan çapraz helis dişlilerin normal/alın modülleri, hatveleri ve nokta temaslı kayma kinematiğini belirleyen standart.',
    appliedFormulas: [
      'Shaft Angle: Σ = β1 + β2 (for same hand)',
      'Pitch Diameters: d1 = mn · z1 / cos β1, d2 = mn · z2 / cos β2',
      'Center Distance: a = (d1 + d2) / 2',
      'Sliding Velocity: vs = √(v1² + v2² - 2·v1·v2·cos Σ)',
    ],
    url: 'https://www.jisc.go.jp/',
    bibtex: `@standard{JISB1702_1998,
  title = {JIS B 1702: Cylindrical gears -- System of accuracy},
  organization = {Japanese Standards Association},
  year = {1998}
}`,
  },
  {
    id: 'iso-21771',
    category: 'iso',
    code: 'ISO 21771:2007',
    title: 'Gears — Cylindrical involute gears and gear pairs — Concepts and geometry',
    titleTr: 'Dişliler — Silindirik evolvent dişliler ve dişli çiftleri — Kavramlar ve geometri',
    organization: 'International Organization for Standardization',
    year: '2007',
    summaryEn: 'Defines internal gear pair geometry, crest shortening factor k, root trimming interference, and tip interference criteria (trochoidal and involute interference).',
    summaryTr: 'İç dişli çifti geometrisi, kafa kısaltma faktörü k, diş dibi ve başı girişim kriterleri (trokoid ve evolvent girişim kontrolleri).',
    appliedFormulas: [
      'Internal Tip Dia: da2 = d2 - 2·mn·(1 - x2 - k2)',
      'Involute Interference Check: db2² + a² - 2·a·db2·cos(αwt - αt2) > da1²',
    ],
    url: 'https://www.iso.org/standard/38075.html',
    bibtex: `@standard{ISO21771_2007,
  title = {ISO 21771:2007 Gears -- Cylindrical involute gears and gear pairs -- Concepts and geometry},
  organization = {International Organization for Standardization},
  year = {2007}
}`,
  },
];

interface GearStandardsCitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: string;
}

export function GearStandardsCitationsModal({
  isOpen,
  onClose,
  currentLang = 'tr',
}: GearStandardsCitationsModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'khk' | 'iso' | 'din' | 'jis_agma'>('all');
  const t = (en: string, tr: string) => t12(currentLang, en, tr);

  if (!isOpen) return null;

  const handleCopy = (citation: StandardCitation) => {
    navigator.clipboard.writeText(citation.bibtex);
    setCopiedId(citation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCitations = activeFilter === 'all'
    ? GEAR_STANDARDS_CITATIONS
    : GEAR_STANDARDS_CITATIONS.filter(c => c.category === activeFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-[var(--line)] bg-[var(--bg-1)] text-white shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-1)]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--cyan)]/15 border border-[var(--cyan)]/40 text-[var(--cyan)]">
              <BookOpen size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {t('Standards & Engineering Bibliography', 'Mühendislik Standartları ve Kaynakça')}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
                  ISO / DIN / KHK / JIS
                </span>
              </div>
              <p className="text-[10px] text-[var(--alu-dim)]">
                {t(
                  'Deterministic mathematical models, cited technical handbooks and standard formulas.',
                  'Deterministik hesaplama motorunda uygulanan uluslararası standartlar ve resmi kaynaklar.'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={t('Close', 'Kapat')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-[var(--line)] bg-[var(--bg-1)] text-[10px] overflow-x-auto">
          <span className="text-[var(--alu-dim)] uppercase tracking-wider mr-1 text-[9px]">
            {t('Filter:', 'Filtre:')}
          </span>
          {[
            { id: 'all', label: t('All Sources (7)', 'Tüm Kaynaklar (7)') },
            { id: 'khk', label: 'KHK Technical Reference' },
            { id: 'iso', label: 'ISO (6336, 21771)' },
            { id: 'din', label: 'DIN (3960, 3975, 867)' },
            { id: 'jis_agma', label: 'JIS & AGMA' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-2.5 py-1 rounded-md border font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)]'
                  : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Citations List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {filteredCitations.map((citation) => (
            <div
              key={citation.id}
              className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--cyan)]/40 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--cyan)]">{citation.code}</span>
                    {citation.year && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-3)] text-slate-400 border border-[var(--line)]">
                        {citation.year}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-white">
                    {t(citation.title, citation.titleTr)}
                  </h3>
                  <div className="text-[10px] text-slate-400">
                    {citation.organization}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(citation)}
                    className="px-2 py-1 rounded-md bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[9.5px] text-[var(--alu)] hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                    title={t('Copy BibTeX Citation', 'BibTeX Atfını Kopyala')}
                  >
                    {copiedId === citation.id ? (
                      <>
                        <Check size={11} className="text-emerald-400" />
                        <span className="text-emerald-400">{t('Copied', 'Kopyalandı')}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>BibTeX</span>
                      </>
                    )}
                  </button>

                  {citation.url && (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-md bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 border border-[var(--cyan)]/30 text-[9.5px] text-[var(--cyan)] flex items-center gap-1 transition-all cursor-pointer"
                      title={t('Open Official Documentation', 'Resmi Belgeyi Aç')}
                    >
                      <ExternalLink size={11} />
                      <span>{t('Manual', 'Kılavuz')}</span>
                    </a>
                  )}
                </div>
              </div>

              <p className="text-[10.5px] text-[var(--alu-dim)] leading-relaxed">
                {t(citation.summaryEn, citation.summaryTr)}
              </p>

              {/* Formula Badges */}
              <div className="pt-2 border-t border-[var(--line)] space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[var(--alu-dim)] block font-bold">
                  {t('Implemented Standard Formulas:', 'Uygulanan Standart Formüller:')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {citation.appliedFormulas.map((formula, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[9.5px] text-[var(--cyan)] font-mono truncate"
                      title={formula}
                    >
                      {formula}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-2.5 border-t border-[var(--line)] bg-[var(--bg-1)] flex items-center justify-between text-[10px] text-[var(--alu-dim)]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck size={13} className="text-emerald-400" />
            {t('All solvers mathematically cited to recognized international standards.', 'Tüm çözücüler resmi standartlara doğrudan referanslıdır.')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[var(--cyan)] hover:bg-[var(--cyan)] text-slate-950 font-bold text-[11px] transition-all cursor-pointer"
          >
            {t('Close', 'Kapat')}
          </button>
        </div>
      </div>
    </div>
  );
}
