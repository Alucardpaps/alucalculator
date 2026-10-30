'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Flame,
  Layers,
  Box,
  Compass,
  Search,
  ShieldCheck,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Sparkles,
  Cpu
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { solverCount } from '@/lib/registry/calculatorRegistry';

interface DirectoryCard {
  id: string;
  href: string;
  category: 'mechanical' | 'fluids' | 'manufacturing' | 'cad';
  titleTr: string;
  titleEn: string;
  standard: string;
  descTr: string;
  descEn: string;
  inputsTr: string;
  inputsEn: string;
  outputsTr: string;
  outputsEn: string;
}

const DIRECTORY_CARDS: DirectoryCard[] = [
  // ─── MEKANİK ELEMANLARI ───
  {
    id: 'bolt-torque',
    href: '/bolt-torque',
    category: 'mechanical',
    titleTr: 'Cıvata Torku & Ön Gerilme Hesabı',
    titleEn: 'Bolt Tightening Torque & Preload',
    standard: 'VDI 2230 / ISO 898-1',
    descTr: 'Cıvata bağlantısının sıkma torku, elastik sıkma kuvveti ve akma emniyeti kontrolü.',
    descEn: 'Assembly tightening torque, elastic clamp load, and proof load safety margin.',
    inputsTr: 'Metrik Çap (d), Adım (P), Mukavemet Sınıfı (8.8/10.9), Sürtünme (μ)',
    inputsEn: 'Nominal Dia (d), Pitch (P), Grade (8.8/10.9), Friction (μ)',
    outputsTr: 'Sıkma Torku (M_A), Ön Yük (F_M), Eşdeğer Gerilme (σ_eq), Emniyet',
    outputsEn: 'Tightening Torque (M_A), Preload (F_M), von Mises Stress, Safety Margin',
  },
  {
    id: 'bearings',
    href: '/bearings',
    category: 'mechanical',
    titleTr: 'Rulman Ömrü & L10h Analizi',
    titleEn: 'Rolling Bearing Rating Life (L10h)',
    standard: 'ISO 281:2007',
    descTr: 'Radyal ve eksenel işletme yükleri altında bilyalı/makaralı rulmanın çalışma ömrü.',
    descEn: 'Dynamic rating life in million revolutions and operating hours under radial/axial loads.',
    inputsTr: 'Dinamik Yük Sayısı (C), Eşdeğer Yük (P), Devir (RPM), Rulman Tipi',
    inputsEn: 'Dynamic Rating (C), Equivalent Load (P), RPM, Bearing Type',
    outputsTr: 'Temel Ömür L10 (Milyon Devir), Çalışma Saati L10h (Saat), Güvenilirlik',
    outputsEn: 'L10 Life (Million Revs), Operating Hours L10h, Reliability Factor',
  },
  {
    id: 'gears',
    href: '/gears',
    category: 'mechanical',
    titleTr: 'Düz & Helis Dişli Mukavemeti',
    titleEn: 'Spur & Helical Gear Strength',
    standard: 'ISO 6336-1/2',
    descTr: 'Diş dibi eğilme kırılması ve diş yanağı pitting yüzey yorulması dayanım analizi.',
    descEn: 'Tooth root bending stress and contact surface pitting fatigue verification.',
    inputsTr: 'Modül (m), Diş Sayısı (z1, z2), Tork (T), Kavrama Açısı (α), Helis Açısı (β)',
    inputsEn: 'Module (m), Teeth (z1, z2), Torque (T), Pressure Angle (α), Helix (β)',
    outputsTr: 'Eğilme Gerilmesi (σ_F), Temas Gerilmesi (σ_H), Dişli Emniyetleri',
    outputsEn: 'Bending Stress (σ_F), Contact Stress (σ_H), Safety Factors (S_F, S_H)',
  },
  {
    id: 'keyway-connection',
    href: '/keyway-connection',
    category: 'mechanical',
    titleTr: 'Paralel Kama & Mil-Göbek Dayanımı',
    titleEn: 'Parallel Keyway Hub Connection',
    standard: 'DIN 6885 / ISO 3912',
    descTr: 'Mil ve göbek arasındaki tork iletiminde yüzey ezilme basıncı ve kama kesme gerilmesi.',
    descEn: 'Surface pressure on shaft/hub and key shear stress under transmitting torque.',
    inputsTr: 'Mil Çapı (d), Tork (T), Kama Boyu (L), Kama Kesiti (b×h), Malzeme',
    inputsEn: 'Shaft Dia (d), Torque (T), Key Length (L), Section (b×h), Material',
    outputsTr: 'Yüzey Basıncı (p_hub), Kesme Gerilmesi (τ), Ezilme ve Kesme Emniyetleri',
    outputsEn: 'Surface Pressure (p_hub), Shear Stress (τ), Hub & Shear Safeties',
  },
  {
    id: 'press-fit',
    href: '/press-fit',
    category: 'mechanical',
    titleTr: 'Sıkı Geçme (Pres & Sıcak Geçme)',
    titleEn: 'Interference / Press Fit Sizing',
    standard: 'DIN 7190 / ISO 286',
    descTr: 'Lamé kalın cidarlı silindir teorisiyle temas basıncı, iletilebilen tork ve montaj ısıtma sıcaklığı.',
    descEn: 'Contact pressure via Lamé thick-wall equations, transmissible torque, heating temperature.',
    inputsTr: 'Mil Çapı, Göbek Dış Çapı, Tolerans Sıkılığı (U), Sürtünme (μ), Malzeme',
    inputsEn: 'Shaft Dia, Hub Outer Dia, Interference (U), Friction (μ), Material',
    outputsTr: 'Arayüz Temas Basıncı (p), İletilebilir Tork (T), Eşdeğer Gerilme, Isıtma Sıcaklığı (ΔT)',
    outputsEn: 'Interface Pressure (p), Transmissible Torque (T), von Mises, Heating Temp (ΔT)',
  },
  {
    id: 'o-ring',
    href: '/o-ring',
    category: 'mechanical',
    titleTr: 'O-Ring Sızdırmazlık & Kanal Tasarımı',
    titleEn: 'O-Ring Sealing Gland Sizing',
    standard: 'ISO 3601 / AS568',
    descTr: 'Radyal ve eksenel sızdırmazlıkta kanal boyutları, sıkışma oranı ve ekstrüzyon boşluğu.',
    descEn: 'Gland depth/width, squeeze ratio, percent gland fill, and allowable extrusion gap.',
    inputsTr: 'İç Çap (ID), Kordon Kesiti (CS), Sızdırmazlık Tipi (Radyal/Aksiyal), Basınç',
    inputsEn: 'Inner Dia (ID), Cross Section (CS), Seal Type (Radial/Axial), Pressure',
    outputsTr: 'Kanal Derinliği (h), Kanal Genişliği (b), Sıkışma Oranı (%), Boşluk Sınırı',
    outputsEn: 'Groove Depth (h), Groove Width (b), Squeeze (%), Max Gap Limit',
  },
  {
    id: 'shafts',
    href: '/shafts',
    category: 'mechanical',
    titleTr: 'Mil Boyutlandırma & Mesnet Tepkileri',
    titleEn: 'Shaft Sizing & Bearing Reactions',
    standard: 'DIN 743 / ASME B106',
    descTr: 'Bileşik burulma-eğilme eşdeğer gerilmesi, mesnet tepki kuvvetleri ve minimum mil çapı.',
    descEn: 'Equivalent torsion-bending stress, reaction forces, and ASME minimum diameter.',
    inputsTr: 'Mil Boyu, Mesnet Konumları, Dişli/Kasnak Yükleri, Tork (T), Malzeme Sınıfı',
    inputsEn: 'Shaft Span, Bearing Positions, Applied Loads, Torque (T), Material Yield',
    outputsTr: 'Mesnet Tepkileri (R_A, R_B), Maks Moment (M_max), Minimum Güvenli Çap (d_min)',
    outputsEn: 'Bearing Reactions (R_A, R_B), Peak Moment (M_max), Safe Min Diameter (d_min)',
  },
  {
    id: 'cylinders',
    href: '/cylinders',
    category: 'mechanical',
    titleTr: 'Hidrolik & Pnömatik Silindir Tasarımı',
    titleEn: 'Hydraulic Cylinder Sizing (1:1 CAD)',
    standard: 'ISO 6020 / DIN 2413',
    descTr: 'İtme/çekme kuvveti, boru et kalınlığı, mil burkulma hesabı ve Kastaş sızdırmazlık seti.',
    descEn: 'Push/pull force, tube hoop stress, Euler rod buckling, and standard sealing gland.',
    inputsTr: 'Boru Çapı (D), Mil Çapı (d), Strok Boyu (L), Çalışma Basıncı (p)',
    inputsEn: 'Bore Dia (D), Rod Dia (d), Stroke Length (L), Operating Pressure (p)',
    outputsTr: 'İtme Kuvveti (F_push), Çekme Kuvveti (F_pull), Kritik Burkulma Yükü (F_k)',
    outputsEn: 'Push Force (F_push), Pull Force (F_pull), Critical Buckling Load (F_k)',
  },

  // ─── TERMAL, AKIŞKAN & BASINÇ ───
  {
    id: 'pressure-vessel',
    href: '/pressure-vessel',
    category: 'fluids',
    titleTr: 'Basınçlı Kap Et Kalınlığı (ASME VIII)',
    titleEn: 'Pressure Vessel Shell Sizing (ASME VIII)',
    standard: 'ASME Section VIII Div 1',
    descTr: 'İç basınç altındaki silindirik gövde, torisferik ve eliptik bombeler için minimum et kalınlığı.',
    descEn: 'Minimum shell thickness and torispherical/ellipsoidal head calculation per ASME code.',
    inputsTr: 'İç Basınç (P), İç Çap (D), Malzeme Akması (S), Kaynak Dikiş Katsayısı (E), Korozyon Payı',
    inputsEn: 'Internal Pressure (P), Inside Dia (D), Allowable Stress (S), Joint Efficiency (E), CA',
    outputsTr: 'Gövde Minimum Et Kalınlığı (t_shell), Bombe Et Kalınlığı (t_head), Hidrostatik Test Basıncı',
    outputsEn: 'Shell Thickness (t_shell), Head Thickness (t_head), Hydrostatic Test Pressure',
  },
  {
    id: 'fluid-dynamics',
    href: '/fluid-dynamics',
    category: 'fluids',
    titleTr: 'Boru Hattı Akışı & Basınç Düşümü',
    titleEn: 'Pipe Flow & Pressure Drop (Darcy)',
    standard: 'Darcy-Weisbach / Crane TP 410',
    descTr: 'Reynolds sayısı, sürtünme katsayısı, fitting yerel kayıpları ve boru hattı basınç kaybı.',
    descEn: 'Reynolds regime, Colebrook friction factor, minor losses, and total head loss.',
    inputsTr: 'Boru İç Çapı, Hat Boyu, Debi (Q), Akışkan Yoğunluğu (ρ) & Viskozitesi (μ), Fittingler',
    inputsEn: 'Pipe ID, Length, Flow Rate (Q), Density (ρ) & Viscosity (μ), Valve/Fitting counts',
    outputsTr: 'Akış Hızı (V), Reynolds (Re), Sürtünme Faktörü (f), Toplam Basınç Düşümü (ΔP)',
    outputsEn: 'Velocity (V), Reynolds (Re), Friction Factor (f), Total Pressure Drop (ΔP)',
  },
  {
    id: 'heat-sink',
    href: '/heat-sink',
    category: 'fluids',
    titleTr: 'Alüminyum Soğutucu Profil (Termal Direnç)',
    titleEn: 'Extruded Heat Sink Thermal Sizing',
    standard: 'ISO 13732 / VDI Termal',
    descTr: 'Kanat geometrisi, doğal/zorlanmış konveksiyon ve profil termal direnci (R_th) hesabı.',
    descEn: 'Fin geometry, natural/forced convection heat transfer, and profile thermal resistance.',
    inputsTr: 'Taban Boyutları, Kanat Sayısı & Kalınlığı, Hava Hızı, Dağıtılan Güç (Watt)',
    inputsEn: 'Base Dimensions, Fin Count & Thickness, Airflow Velocity, Dissipated Power (W)',
    outputsTr: 'Profil Termal Direnci (R_th °C/W), Yüzey Sıcaklık Artışı (ΔT), Konveksiyon Katsayısı',
    outputsEn: 'Thermal Resistance (R_th °C/W), Junction Temp Rise (ΔT), Convection Coefficient (h)',
  },

  // ─── MALZEME, İMALAT & YAPISAL ───
  {
    id: 'fits',
    href: '/fits',
    category: 'manufacturing',
    titleTr: 'Toleranslar ve Geçmeler (ISO 286)',
    titleEn: 'Fits & Tolerances (ISO 286)',
    standard: 'ISO 286 / DIN 7154',
    descTr: 'Mil ve delik temel sapmaları, H7/g6, H7/p6 gibi boşluklu, sıkı ve ara geçme limit ölçüleri.',
    descEn: 'Shaft/hole fundamental deviations, clearance, interference, and transition tolerance limits.',
    inputsTr: 'Anma Çapı (mm), Delik Toleransı (H7, H8 vb.), Mil Toleransı (g6, p6, h6 vb.)',
    inputsEn: 'Nominal Dia (mm), Hole Class (H7, H8 etc.), Shaft Class (g6, p6, h6 etc.)',
    outputsTr: 'Delik ve Mil Üst/Alt Sapmaları (ES, EI, es, ei), Maks/Min Boşluk veya Sıkılık',
    outputsEn: 'Upper/Lower Deviations (ES, EI, es, ei), Max/Min Clearance or Interference',
  },
  {
    id: 'sheet-metal',
    href: '/sheet-metal',
    category: 'manufacturing',
    titleTr: 'Sac Büküm Açınımı & K-Faktörü',
    titleEn: 'Sheet Metal Bend Allowance & K-Factor',
    standard: 'DIN 6935',
    descTr: 'Büküm payı (BA), büküm kesintisi (BD), tarafsız eksen K-faktörü ve açınım boyu hesabı.',
    descEn: 'Bend allowance, bend deduction, neutral axis K-factor, and unfolded flat sheet length.',
    inputsTr: 'Sac Kalınlığı (t), Büküm Yarıçapı (R), Büküm Açısı (α), Malzeme Cinsi',
    inputsEn: 'Sheet Thickness (t), Bend Radius (R), Bend Angle (α), Material Type',
    outputsTr: 'Büküm Payı (BA), Büküm Kesintisi (BD), K-Faktörü, Düz Açınım Sac Boyu',
    outputsEn: 'Bend Allowance (BA), Bend Deduction (BD), K-Factor, Flat Blank Length',
  },
  {
    id: 'beam-deflection',
    href: '/beam-deflection',
    category: 'manufacturing',
    titleTr: 'Kiriş Sehim & Gerilme Analizi',
    titleEn: 'Beam Deflection & Bending Stress',
    standard: 'EN 1993 (Eurocode 3)',
    descTr: 'Noktasal veya yayılı yük altında kirişin maksimum sehimi, eğilme momenti ve L/300 kontrolü.',
    descEn: 'Maximum deflection, bending moment, shear force, and Eurocode serviceability check.',
    inputsTr: 'Açıklık (L), Yük Değeri (F veya q), Mesnet Şartı, Kesit Atalet Momenti (I), Elastisite Modülü (E)',
    inputsEn: 'Span (L), Load (F or q), Boundary Conditions, Moment of Inertia (I), Young Modulus (E)',
    outputsTr: 'Maksimum Sehim (f_max), Maks Eğilme Gerilmesi (σ_max), Sehim Sınır Kontrolü (L/300)',
    outputsEn: 'Max Deflection (f_max), Max Bending Stress (σ_max), Deflection Check (L/300)',
  },

  // ─── CAD & HESAP AĞI ───
  {
    id: 'design-studio',
    href: '/design-studio',
    category: 'cad',
    titleTr: '3D Parametrik Parça Konfigüratörü',
    titleEn: '3D Parametric Part Configurator',
    standard: 'OpenCascade WASM / STEP',
    descTr: 'Alüminyum profil ve montajları 3D ortamda inceleyin, delik/havşa ekleyin, STL ve STEP indirin.',
    descEn: 'Interactive 3D part configurator with hole/machining features and binary STL/STEP export.',
    inputsTr: 'Profil Serisi (20x20, 45x45 vb.), Boy (L), Delik/Havşa Koordinatları, Montaj Elemanları',
    inputsEn: 'Profile Series (20x20, 45x45 etc.), Length (L), Hole/Countersink Positions, Mates',
    outputsTr: '3D B-Rep Geometri, Anlık Ağırlık & Metraj, STEP (ISO 10303) ve STL İhracı',
    outputsEn: '3D B-Rep Geometry, Real-time BOM Weight, STEP (ISO 10303) and STL Export',
  },
  {
    id: 'cad-editor',
    href: '/cad-editor',
    category: 'cad',
    titleTr: '2D AluCAD Teknik Çizim Motoru',
    titleEn: '2D AluCAD Drafting Engine',
    standard: 'AutoCAD DXF R12 / ISO 128',
    descTr: 'Nokta yakalama, kısıtlayıcılar, ölçülendirme ve doğrudan CNC/Lazer için temiz DXF dışa aktarımı.',
    descEn: '2D drafting canvas with geometric constraints, dimensions, and manufacturing-ready DXF export.',
    inputsTr: '2D Çizgiler, Yaylar, Çemberler, Ölçülendirme Kısıtları, Katmanlar',
    inputsEn: '2D Entities (Lines, Arcs, Circles), Geometric Constraints, Layers',
    outputsTr: 'İmalat Seviyesinde DXF R12 Teknik Resmi, PDF Çıktısı, Ölçekli Kesit Çizimleri',
    outputsEn: 'Manufacturing-Grade DXF R12 File, Vector PDF, Scaled Technical Drawings',
  },
];

export function EngineerWorkflowDirectory() {
  const { language } = useI18nStore();
  const [selectedCat, setSelectedCat] = useState<'all' | 'mechanical' | 'fluids' | 'manufacturing' | 'cad'>('all');
  const [filterQuery, setFilterQuery] = useState('');

  const filteredCards = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    return DIRECTORY_CARDS.filter((card) => {
      if (selectedCat !== 'all' && card.category !== selectedCat) return false;
      if (!q) return true;
      const text = `${card.titleTr} ${card.titleEn} ${card.standard} ${card.descTr} ${card.descEn} ${card.inputsTr} ${card.outputsTr}`.toLowerCase();
      return text.includes(q);
    });
  }, [selectedCat, filterQuery]);

  return (
    <section className="space-y-6 pt-4 border-t border-[var(--line)]">
      {/* ═══ SECTION HEADER & WORKFLOW GUIDE ═══ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[var(--cyan)]">
            <Calculator size={13} />
            <span>{t12(language, 'Engineers Quick Directory', 'Mühendisler İçin Hızlı Hesaplayıcı Rehberi')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-tech text-[var(--ink)] tracking-tight">
            {t12(language, 'Standard-Referenced ISO / DIN / VDI Engineering Solvers', 'Standart Referanslı ISO / DIN / VDI Mühendislik Çözücüleri')}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--alu-dim)] font-sans leading-relaxed">
            {t12(
              language,
              `Explore ${solverCount} standard-referenced deterministic solvers across mechanical elements, piping, pressure vessels, and manufacturing tolerances. Find your exact calculation in 1 click without getting lost.`,
              `Makine elemanları, borulama, basınçlı kaplar ve imalat toleranslarında standart referanslı deterministik çözücüleri keşfedin. Sitede kaybolmadan aradığınız hesabı tek tıkla bulun.`
            )}
          </p>
        </div>

        {/* Global Navigator Quick Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('alucalc:open-navigator'))}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-s)] bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 border border-[var(--cyan)]/30 text-[var(--cyan)] font-mono text-xs font-bold transition-colors shrink-0 cursor-pointer"
        >
          <Compass size={14} />
          <span>{t12(language, 'Decision Guide & Sitemap', 'Karar Ağacı & Site Haritası')}</span>
        </button>
      </div>

      {/* ═══ 3-STEP ENGINEERING WORKFLOW CARDS (NASIL ÇALIŞIR) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-1">
          <div className="flex items-center gap-2 text-[var(--cyan)] font-bold">
            <span className="w-5 h-5 rounded-full bg-[var(--cyan)]/15 border border-[var(--cyan)]/40 flex items-center justify-center text-[10px]">1</span>
            <span>{t12(language, '1. Calculate & Verify', '1. Hesapla & Boyutlandır')}</span>
          </div>
          <p className="text-[11px] text-[var(--alu-dim)] font-sans leading-relaxed">
            {t12(language, 'VDI 2230, ISO 281 and DIN standards provide documented methodologies and deterministic safety factor calculations.', 'VDI 2230, ISO 281 ve DIN normlarıyla belgelenmiş metodolojileri ve deterministik emniyet katsayılarını hesaplayın.')}
          </p>
        </div>

        <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-1">
          <div className="flex items-center gap-2 text-[var(--std)] font-bold">
            <span className="w-5 h-5 rounded-full bg-[var(--std)]/15 border border-[var(--std)]/40 flex items-center justify-center text-[10px]">2</span>
            <span>{t12(language, '2. Model & Draft (CAD)', '2. Modelle & Çiz (3D/2D)')}</span>
          </div>
          <p className="text-[11px] text-[var(--alu-dim)] font-sans leading-relaxed">
            {t12(language, 'Take calculated dimensions into 3D Parametric Part Configurator or 2D AluCAD drafting canvas.', 'Hesaplanan ölçüleri 3D parça konfigüratörüne veya 2D teknik resme aktarın, DXF ve STEP üretin.')}
          </p>
        </div>

        <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-1">
          <div className="flex items-center gap-2 text-[var(--ok)] font-bold">
            <span className="w-5 h-5 rounded-full bg-[var(--ok)]/15 border border-[var(--ok)]/40 flex items-center justify-center text-[10px]">3</span>
            <span>{t12(language, '3. Audit & Report', '3. Raporla & Üret')}</span>
          </div>
          <p className="text-[11px] text-[var(--alu-dim)] font-sans leading-relaxed">
            {t12(language, 'Export unwatermarked, client-ready engineering reports citing exact norm clauses.', 'Formül adımlarını, kabul şartlarını ve toleransları içeren denetlenebilir mühendislik raporu alın.')}
          </p>
        </div>
      </div>

      {/* ═══ FILTER BAR (CATEGORY TABS + SEARCH) ═══ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto font-mono text-xs pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', labelTr: 'Tümü', labelEn: 'All' },
            { id: 'mechanical', labelTr: 'Mekanik & Makine', labelEn: 'Mechanical' },
            { id: 'fluids', labelTr: 'Akışkan & Termal', labelEn: 'Fluids & Thermal' },
            { id: 'manufacturing', labelTr: 'İmalat & Yapısal', labelEn: 'Manufacturing' },
            { id: 'cad', labelTr: 'CAD & Stüdyolar', labelEn: 'CAD & Studios' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCat(tab.id as any)}
              className={`px-3 py-1.5 rounded-[var(--radius-s)] border transition-all whitespace-nowrap ${
                selectedCat === tab.id
                  ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold shadow-xs'
                  : 'border-[var(--line)] bg-[var(--bg-1)] text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-2)]'
              }`}
            >
              {language === 'tr' ? tab.labelTr : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Live Filter Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--alu-dim)]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={t12(language, 'Filter by calculation or norm...', 'Hesap veya standart filtrele...')}
            className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--alu-dim)]/50 focus:outline-none focus:border-[var(--cyan)] transition-colors"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--alu-dim)] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ═══ MODULE CARDS GRID ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCards.map((tool) => (
          <div
            key={tool.id}
            className="group flex flex-col justify-between p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] hover:border-[var(--cyan)] transition-all shadow-xs space-y-3"
          >
            <div className="space-y-2.5">
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan)]/30 text-[var(--cyan)] font-bold">
                  <ShieldCheck size={11} className="text-[var(--ok)]" />
                  <span>{tool.standard}</span>
                </span>
                <span className="text-[10px] font-mono uppercase text-[var(--alu-dim)]/70">
                  {tool.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold font-tech text-[var(--ink)] group-hover:text-[var(--cyan)] transition-colors leading-snug">
                <Link href={tool.href} className="focus:outline-none">
                  {language === 'tr' ? tool.titleTr : tool.titleEn}
                </Link>
              </h3>

              {/* Description */}
              <p className="text-xs text-[var(--alu-dim)] font-sans leading-relaxed line-clamp-2">
                {language === 'tr' ? tool.descTr : tool.descEn}
              </p>

              {/* Inputs & Outputs Breakdown */}
              <div className="pt-2 border-t border-[var(--line)]/60 space-y-1 font-mono text-[10px]">
                <div className="text-[var(--alu-dim)] truncate">
                  <span className="text-[var(--std)] font-bold">{t12(language, 'Inputs:', 'Girişler:')} </span>
                  <span>{language === 'tr' ? tool.inputsTr : tool.inputsEn}</span>
                </div>
                <div className="text-[var(--alu-dim)] truncate">
                  <span className="text-[var(--ok)] font-bold">{t12(language, 'Outputs:', 'Çıkışlar:')} </span>
                  <span>{language === 'tr' ? tool.outputsTr : tool.outputsEn}</span>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
              <Link
                href={tool.href}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--cyan)] hover:text-[var(--cyan)] transition-colors"
              >
                <span>{t12(language, 'Open Calculation', 'Hesaplayıcıyı Aç')}</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Banner linking to the full 86 solvers catalog */}
      <div className="p-4 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-[var(--alu-dim)]">
          <CheckCircle2 size={15} className="text-[var(--ok)] shrink-0" />
          <span>
            {t12(
              language,
              `Showing core engineering solvers. Explore all ${solverCount} verified ISO/DIN solvers in the catalog.`,
              `Temel çözücüler listelendi. Katalogdaki doğrulanmış ${solverCount} çözücünün tamamını inceleyin.`
            )}
          </span>
        </div>
        <Link
          href="/calculators"
          className="inline-flex items-center gap-1.5 text-[var(--cyan)] hover:text-[var(--cyan)] font-bold shrink-0 hover:underline"
        >
          <span>{t12(language, 'Full Solvers Directory (86 Modül) →', 'Tüm Çözücüler Dizinine Git (86 Modül) →')}</span>
        </Link>
      </div>
    </section>
  );
}

export default EngineerWorkflowDirectory;
