'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AegisMascot, playMascotChirp, type AegisPose } from './AegisMascot';
import { useI18nStore } from '@/store/i18nStore';
import { useCopilotStore } from '@/store/copilotStore';
import { t12 } from '@/locales/t12';
import {
  Cog,
  Box,
  Network,
  Zap,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

const POSE_LABEL: Record<string, string> = {
  blueprint: 'CAD B-REP · ISO 2768',
  calculation: 'TENSOR SOLVE · σ_vm',
  einstein: 'RELATIVITY · Gμν',
  tesla: 'EM FLUX · 1.21 GW',
  newton: 'BALLISTICS · g=9.80665',
  wave: 'LINK UP · HANDSHAKE',
  idle: 'STANDBY · NOMINAL',
  thinking: 'REASONING STREAM',
  celebrate: 'SOLVE LOCKED',
  walk: 'GAIT CYCLE · 1.2 m/s',
  run: 'SPRINT · 3.8 m/s',
  jump: 'BALLISTIC · Δh CLEAR',
  apple: 'NEWTON IMPACT · mg',
};

interface GuidanceChip {
  id: string;
  title: string;
  desc: string;
  formula: string;
  insight: string;
  standard: string;
  href?: string;
  action?: 'copilot';
  pose: AegisPose;
  icon: 'gear' | 'cad' | 'flow' | 'bolt' | 'copilot';
  color: string;
  lookTarget: { x: number; y: number };
}

interface ScientistQuote {
  name: string;
  badge: string;
  formula: string;
  quote: string;
  standard: string;
}

const SCIENTIST_QUOTES: Record<string, Record<string, ScientistQuote>> = {
  tr: {
    einstein: {
      name: 'Albert Einstein',
      badge: 'GÖRELİLİK KURAMI',
      formula: 'E = mc² · G_μν + Λg_μν = 8πT_μν',
      quote: 'Kütle-enerji eşdeğerliği ve uzay-zaman eğriliği: Işık hızında deterministik doğrulama.',
      standard: 'RELATIVISTIC TENSOR',
    },
    newton: {
      name: 'Isaac Newton',
      badge: 'KLASİK DİNAMİK',
      formula: 'F = m·a · g = 9.80665 m/s²',
      quote: 'Yerçekimi balistiği ve eylemsizlik yasaları: Mekanik tasarımın temel yapıtaşı.',
      standard: 'CLASSICAL BALLISTICS',
    },
    tesla: {
      name: 'Nikola Tesla',
      badge: 'REZONANS AKISI',
      formula: 'B = μ₀·I/(2πr) · 1.21 GW FLUX',
      quote: 'Yüksek frekanslı elektromanyetik alanlar ve kablosuz rezonans enerjisi.',
      standard: 'ELECTROMAGNETIC',
    },
    blueprint: {
      name: 'Dr. AeGiS · CAD B-Rep',
      badge: 'PARAMETRİK MODEL',
      formula: 'ISO 2768-mK · STEP / IGES B-Rep',
      quote: 'Hassas 3D katı modelleme çekirdeği ve CNC talaşlı imalat toleransları devrede.',
      standard: 'ISO 2768-mK',
    },
    calculation: {
      name: 'Dr. AeGiS · Mukavemet',
      badge: 'GERİLME TENSÖRÜ',
      formula: 'σ_vm = √(σ₁² - σ₁σ₂ + σ₂²) ≤ [σ]',
      quote: 'Von Mises akma kriteri: Çok eksenli gerilmelerde elastik güvenlik kontrolü.',
      standard: 'VON MISES YIELD',
    },
    celebrate: {
      name: 'Dr. AeGiS · Çözüm Onay',
      badge: 'DOĞRULAMA KİLİDİ',
      formula: 'S_F ≥ S_min · 64-BIT IEEE 754',
      quote: 'Tüm deterministik toleranslar, emniyet katsayıları ve standartlar doğrulandı!',
      standard: 'CERTIFIED PASS',
    },
    wave: {
      name: 'Dr. AeGiS · İletişim',
      badge: 'AR-GE DANIŞMANI',
      formula: 'AEGIS-AI · 90+ DETERMINISTIC SOLVERS',
      quote: 'Merhaba mühendis! Tasarımınızı ISO/DIN/VDI standartlarına göre doğrulamaya hazırım.',
      standard: 'ONLINE COPILOT',
    },
    idle: {
      name: 'Dr. AeGiS · Beklemede',
      badge: 'MÜHENDİSLİK LABORATUVARI',
      formula: 'ISO / DIN / VDI · 0ms LATENCY',
      quote: 'Aşağıdaki modüllerden birini seçin veya doğrudan formül analizi için tıklayın.',
      standard: 'READY TO SOLVE',
    },
  },
  en: {
    einstein: {
      name: 'Albert Einstein',
      badge: 'GENERAL RELATIVITY',
      formula: 'E = mc² · G_μν + Λg_μν = 8πT_μν',
      quote: 'Mass-energy equivalence and spacetime curvature: Deterministic validation at c.',
      standard: 'RELATIVISTIC TENSOR',
    },
    newton: {
      name: 'Isaac Newton',
      badge: 'CLASSICAL DYNAMICS',
      formula: 'F = m·a · g = 9.80665 m/s²',
      quote: 'Gravitational ballistics and laws of motion: Foundation of mechanical engineering.',
      standard: 'CLASSICAL BALLISTICS',
    },
    tesla: {
      name: 'Nikola Tesla',
      badge: 'RESONANCE FLUX',
      formula: 'B = μ₀·I/(2πr) · 1.21 GW FLUX',
      quote: 'High-frequency electromagnetic fields and wireless resonant flux transfer.',
      standard: 'ELECTROMAGNETIC',
    },
    blueprint: {
      name: 'Dr. AeGiS · CAD B-Rep',
      badge: 'PARAMETRIC MODEL',
      formula: 'ISO 2768-mK · STEP / IGES B-Rep',
      quote: 'Precise 3D solid modeling kernel and CNC machining tolerances activated.',
      standard: 'ISO 2768-mK',
    },
    calculation: {
      name: 'Dr. AeGiS · Structural',
      badge: 'STRESS TENSOR',
      formula: 'σ_vm = √(σ₁² - σ₁σ₂ + σ₂²) ≤ [σ]',
      quote: 'Von Mises yield criterion: Elastic safety boundary check for multi-axial stress.',
      standard: 'VON MISES YIELD',
    },
    celebrate: {
      name: 'Dr. AeGiS · Solution Verified',
      badge: 'SOLVE CERTIFIED',
      formula: 'S_F ≥ S_min · 64-BIT IEEE 754',
      quote: 'All deterministic tolerances, safety factors, and standard limits fully verified!',
      standard: 'CERTIFIED PASS',
    },
    wave: {
      name: 'Dr. AeGiS · Ready',
      badge: 'R&D ADVISOR',
      formula: 'AEGIS-AI · 90+ DETERMINISTIC SOLVERS',
      quote: 'Hello engineer! Ready to verify your designs against ISO/DIN/VDI specifications.',
      standard: 'ONLINE COPILOT',
    },
    idle: {
      name: 'Dr. AeGiS · Standby',
      badge: 'ENGINEERING LAB',
      formula: 'ISO / DIN / VDI · 0ms LATENCY',
      quote: 'Select any module below or click to consult on formulas and material specs.',
      standard: 'READY TO SOLVE',
    },
  },
};

const GUIDANCE_DATA: Record<string, {
  title: string;
  badge: string;
  msg: string;
  guidePrompt: string;
  chips: GuidanceChip[];
}> = {
  tr: {
    title: 'AeGiS · Baş Araştırma Mühendisi',
    badge: 'AR-GE LABORATUVARI · AKTİF',
    msg: 'AluCAD OS Mühendislik Laboratuvarına Hoş Geldiniz! ISO/DIN standartları ve 3D CAD araçlarımızla tasarımlarınızı doğrulamaya hazırım.',
    guidePrompt: 'Başlamak istediğiniz modülü seçin:',
    chips: [
      {
        id: 'gears',
        title: 'ISO 6336 Dişli',
        desc: 'İnvolüt profil & KHK serisi',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'ISO 6336 Dişli Mukavemeti: Pitting yüzey basıncı ve diş dibi kırılma emniyet analizi.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: '3D CAD Montaj',
        desc: 'Parametrik B-Rep stüdyosu',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'Parametrik B-Rep Katı Modelleme: Hassas geometri, montaj ilişkileri ve CNC toleransları.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Flow Engine Graf',
        desc: 'Deterministik blok ağı',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Flow Engine Hesaplama Grafı: Deterministik blok ağı, sıfır yuvarlama hatası ve anlık veri akışı.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'VDI 2230 Cıvata',
        desc: 'Sıkma torku & emniyet',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'VDI 2230 Cıvata Bağlantıları: Montaj sıkma torku, önyük kuvveti ve elastik sınır kontrolü.',
        standard: 'VDI 2230 Blatt 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: "AeGiS'e Danış",
        desc: 'Anlık formül & malzeme',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'AeGiS Mühendislik Danışmanı: Doğrudan malzeme seçimi, formül türetme ve standart kontrolü.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  en: {
    title: 'AeGiS · Chief Research Engineer',
    badge: 'R&D LAB ONLINE · CERTIFIED',
    msg: 'Welcome to AluCAD OS Engineering Lab! Ready to verify and optimize your designs across deterministic ISO/DIN solvers and 3D CAD.',
    guidePrompt: 'Choose your starting engineering tool:',
    chips: [
      {
        id: 'gears',
        title: 'ISO 6336 Gears',
        desc: 'Involute profiles & KHK',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'ISO 6336 Gear Rating: Contact pitting stress & tooth root bending safety limits.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: '3D CAD Assembly',
        desc: 'Parametric B-Rep studio',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'Parametric B-Rep Solid Modeling: Precise geometry, assembly constraints & CNC tolerances.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Flow Engine Graph',
        desc: 'Deterministic solve nodes',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Flow Engine Computation Graph: Deterministic node network with zero floating-point drift.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'VDI 2230 Bolt Torque',
        desc: 'Tightening & joint safety',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'VDI 2230 Bolted Joint Design: Tightening torque, preload clamping force & yield check.',
        standard: 'VDI 2230 Sheet 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'Consult AeGiS',
        desc: 'Real-time engineering Q&A',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'AeGiS Engineering Copilot: Instant formula derivation, alloy properties & solver guidance.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  de: {
    title: 'AeGiS · Leitender Forschungsingenieur',
    badge: 'F&E-LABOR AKTIV · ZERTIFIZIERT',
    msg: 'Willkommen im AluCAD OS Ingenieurlabor! Bereit zur Verifikation Ihrer Konstruktionen mit ISO/DIN-Präzisionslösern und 3D-CAD.',
    guidePrompt: 'Wählen Sie Ihr technisches Werkzeug:',
    chips: [
      {
        id: 'gears',
        title: 'ISO 6336 Zahnräder',
        desc: 'Evolventenprofil & KHK',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'ISO 6336 Zahnradberechnung: Flankentragfähigkeit und Zahnfußbruchsicherheit.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: '3D-CAD Baugruppe',
        desc: 'Parametrisches B-Rep Studio',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'Parametrische B-Rep CAD-Modellierung: Geometrie, Baugruppenbeziehungen und Toleranzen.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Flow Engine Graph',
        desc: 'Deterministische Rechenblöcke',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Flow Engine Rechengraf: Deterministische Knoten mit IEEE 754 Gleitkommapräzision.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'VDI 2230 Schrauben',
        desc: 'Anzugsmoment & Sicherheit',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'VDI 2230 Schraubenverbindungen: Anziehdrehmoment, Montagevorspannkraft und Sicherheit.',
        standard: 'VDI 2230 Blatt 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'AeGiS Befragen',
        desc: 'Ingenieurberatung in Echtzeit',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'AeGiS Ingenieurberatung: Sofortige Werkstoffauswahl, Formeln und Richtlinien.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  es: {
    title: 'AeGiS · Ingeniero Jefe de Investigación',
    badge: 'LABORATORIO I+D · CERTIFICADO',
    msg: '¡Bienvenido al Laboratorio de Ingeniería de AluCAD OS! Listo para validar sus diseños con solucionadores ISO/DIN y CAD 3D.',
    guidePrompt: 'Seleccione su herramienta de inicio:',
    chips: [
      {
        id: 'gears',
        title: 'Engranajes ISO 6336',
        desc: 'Perfiles evolventes y KHK',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'Engranajes ISO 6336: Presión superficial de contacto y seguridad contra fractura en pie de diente.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: 'Ensamblaje CAD 3D',
        desc: 'Estudio paramétrico B-Rep',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'Modelado CAD B-Rep Paramétrico: Geometría precisa, ensamblajes y tolerancias ISO 2768-mK.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Grafo Flow Engine',
        desc: 'Red determinista de cálculo',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Grafo Flow Engine: Red de cálculo determinista con precisión de punto flotante de 64 bits.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'Tornillería VDI 2230',
        desc: 'Par de apriete y seguridad',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'Uniones Atornilladas VDI 2230: Par de apriete, fuerza de pretensado y límite elástico.',
        standard: 'VDI 2230 Hoja 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'Consultar a AeGiS',
        desc: 'Asesoría técnica en tiempo real',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'Copilot de Ingeniería AeGiS: Respuestas técnicas inmediatas, propiedades de aleaciones y fórmulas.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  fr: {
    title: 'AeGiS · Ingénieur en Chef de Recherche',
    badge: 'LABORATOIRE R&D · CERTIFIÉ',
    msg: 'Bienvenue au Laboratoire d’Ingénierie AluCAD OS ! Prêt à certifier vos conceptions avec les solveurs ISO/DIN et le CAD 3D.',
    guidePrompt: 'Choisissez votre outil d’ingénierie :',
    chips: [
      {
        id: 'gears',
        title: 'Engrenages ISO 6336',
        desc: 'Profils développants & KHK',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'Engrenages ISO 6336 : Pression de contact superficielle et sécurité contre la rupture en pied de dent.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: 'Assemblage CAD 3D',
        desc: 'Studio paramétrique B-Rep',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'Modélisation B-Rep Paramétrique : Géométrie exacte, contraintes d’assemblage et tolérances d’usinage.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Graphe Flow Engine',
        desc: 'Réseau de calcul déterministe',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Graphe Flow Engine : Réseau déterministe sans dérive de calcul en virgule flottante.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'Boulonnerie VDI 2230',
        desc: 'Couple de serrage & sécurité',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'Assemblages VDI 2230 : Couple de serrage, précharge et vérification de la limite élastique.',
        standard: 'VDI 2230 Feuille 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'Consulter AeGiS',
        desc: 'Support technique en direct',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'Copilote Technique AeGiS : Assistance immédiate aux formules, matériaux et normes.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  it: {
    title: 'AeGiS · Ingegnere Capo della Ricerca',
    badge: 'LABORATORIO R&S · CERTIFICATO',
    msg: 'Benvenuti nel Laboratorio di Ingegneria AluCAD OS! Pronto a convalidare i vostri progetti con solutori ISO/DIN e CAD 3D.',
    guidePrompt: 'Seleziona lo strumento di ingegneria:',
    chips: [
      {
        id: 'gears',
        title: 'Ingranaggi ISO 6336',
        desc: 'Profili ad evolvente & KHK',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'Ingranaggi ISO 6336: Pressione di contatto superficiale e sicurezza a rottura del dente.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: 'Assemblaggio CAD 3D',
        desc: 'Studio parametrico B-Rep',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'Modellazione CAD B-Rep Parametrica: Geometria solida, vincoli di montaggio e tolleranze.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Grafo Flow Engine',
        desc: 'Nodi di calcolo deterministici',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Grafo Flow Engine: Calcolo deterministico senza accumulo di errore in virgola mobile a 64 bit.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'Bulloni VDI 2230',
        desc: 'Coppia di serraggio e sicurezza',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'Giunzioni Bullonate VDI 2230: Coppia di serraggio, forza di precarico e limite elastico.',
        standard: 'VDI 2230 Foglio 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'Consulta AeGiS',
        desc: 'Consulenza tecnica in tempo reale',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'Copilot di Ingegneria AeGiS: Risposte immediate su formule, leghe metalliche e standard.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  pt: {
    title: 'AeGiS · Engenheiro Chefe de Pesquisa',
    badge: 'LABORATÓRIO P&D · CERTIFICADO',
    msg: 'Bem-vindo ao Laboratório de Engenharia AluCAD OS! Pronto para validar seus projetos com solucionadores ISO/DIN e CAD 3D.',
    guidePrompt: 'Escolha a ferramenta de engenharia inicial:',
    chips: [
      {
        id: 'gears',
        title: 'Engrenagens ISO 6336',
        desc: 'Perfis evolventes & KHK',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'Engrenagens ISO 6336: Pressão de contato superficial de pitting e segurança no pé do dente.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: 'Montagem CAD 3D',
        desc: 'Estúdio paramétrico B-Rep',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'Modelagem Paramétrica B-Rep: Geometria sólida exata, montagens mecânicas e tolerâncias.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Grafo Flow Engine',
        desc: 'Nós de computação determinísticos',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Grafo Flow Engine: Rede determinística com precisão de ponto flutuante de 64 bits.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'Parafusos VDI 2230',
        desc: 'Torque de aperto e segurança',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'Juntas Parafusadas VDI 2230: Torque de aperto, força de pré-carga e limite elástico.',
        standard: 'VDI 2230 Folha 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'Consultar AeGiS',
        desc: 'Assessoria técnica em tempo real',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'Copilot de Engenharia AeGiS: Resoluções imediatas de fórmulas, materiais e normas.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  ru: {
    title: 'AeGiS · Главный инженер-исследователь',
    badge: 'НИОКР ЛАБОРАТОРИЯ · СЕРТИФИЦИРОВАНО',
    msg: 'Добро пожаловать в инженерную лабораторию AluCAD OS! Готов верифицировать ваши проекты с помощью солверов ISO/DIN и 3D CAD.',
    guidePrompt: 'Выберите инженерный модуль для начала:',
    chips: [
      {
        id: 'gears',
        title: 'Зубчатые передачи ISO 6336',
        desc: 'Эвольвентный профиль и KHK',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'Зубчатые передачи ISO 6336: Контактные напряжения питтинга и прочность зубьев на изгиб.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: '3D CAD сборка',
        desc: 'Параметрическая B-Rep среда',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'Параметрическое B-Rep моделирование: Точная геометрия деталей и допуски ISO 2768-mK.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Граф Flow Engine',
        desc: 'Детерминированная сеть расчетов',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Граф Flow Engine: Детерминированная расчетная сеть без погрешности с плавающей запятой.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'Болты VDI 2230',
        desc: 'Момент затяжки и надежность',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'Болтовые соединения VDI 2230: Момент затяжки, предварительный натяг и предел текучести.',
        standard: 'VDI 2230 Лист 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'Спросить AeGiS',
        desc: 'Консультация инженера онлайн',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'Инженерный ассистент AeGiS: Мгновенные расчеты формул, свойства сплавов и стандарты.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  zh: {
    title: 'AeGiS · 首席研发工程师',
    badge: '研发实验室在线 · 已认证',
    msg: '欢迎来到 AluCAD OS 工程实验室！随时准备为您使用 ISO/DIN 确定性求解器与 3D CAD 验证并优化设计。',
    guidePrompt: '请选择您的工程起始工具：',
    chips: [
      {
        id: 'gears',
        title: 'ISO 6336 齿轮',
        desc: '渐开线齿形与 KHK 套件',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'ISO 6336 齿轮强度校核：齿面点蚀接触应力与齿根弯曲疲劳极限计算。',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: '3D CAD 装配',
        desc: '参数化 B-Rep 建模工作台',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: '参数化 B-Rep 实体建模：高精度拓扑几何、机械配合与 ISO 2768-mK 机械加工公差。',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Flow Engine 逻辑图',
        desc: '确定性计算节点网络',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Flow Engine 计算逻辑图：确定性无漂移 64 位双精度浮点计算网络。',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'VDI 2230 螺栓扭矩',
        desc: '预紧力与连接强度核算',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'VDI 2230 高强度螺栓副连接：拧紧力矩、装配预紧力与屈服强度极限验证。',
        standard: 'VDI 2230 Sheet 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: '咨询 AeGiS',
        desc: '实时工程技术解答与支持',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'AeGiS 工程助手：即时力学公式推导、金属材料参数库与标准规范查阅。',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  ja: {
    title: 'AeGiS · 主任研究エンジニア',
    badge: 'R&D研究室稼働中 · 認証済',
    msg: 'AluCAD OS エンジニアリング研究所へようこそ！ISO/DIN決定論的ソルバーと3D CADで設計を検証・最適化します。',
    guidePrompt: '使用する工学ツールを選択してください：',
    chips: [
      {
        id: 'gears',
        title: 'ISO 6336 歯車',
        desc: 'インボリュート歯形＆KHKシリーズ',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'ISO 6336 歯車強度計算：歯面ピッチング接触応力および歯元曲げ疲労強度の検証。',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: '3D CAD アセンブリ',
        desc: 'パラメトリックB-Repスタジオ',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'パラメトリック B-Rep モデリング：高精度ソリッド形状、拘束関係および工作公差。',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Flow Engine グラフ',
        desc: '決定論的ノード計算ネットワーク',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Flow Engine 決定論的グラフ：累積丸め誤差ゼロの64ビット浮動小数点計算フロー。',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'VDI 2230 ボルト締結',
        desc: '締付トルク＆結合部安全率',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'VDI 2230 高力ボルト結合：締付トルク、初期予圧軸力および降伏安全率検証。',
        standard: 'VDI 2230 Sheet 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'AeGiS に相談',
        desc: 'リアルタイム技術ガイダンス',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'AeGiS エンジニアリングコパイロット：公式導出、材料定数および各種規格対応。',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  ko: {
    title: 'AeGiS · 수석 연구 엔지니어',
    badge: 'R&D 연구소 가동 중 · 인증됨',
    msg: 'AluCAD OS 엔지니어링 랩에 오신 것을 환영합니다! ISO/DIN 솔버와 3D CAD로 설계를 정확하게 검증해 드립니다.',
    guidePrompt: '시작할 엔지니어링 도구를 선택하세요:',
    chips: [
      {
        id: 'gears',
        title: 'ISO 6336 기어',
        desc: '인벌류트 치형 및 KHK 계열',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'ISO 6336 기어 강도 계산: 치면 피팅 접촉응력 및 이뿌리 굽힘 파단 안전율.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: '3D CAD 어셈블리',
        desc: '파라메트릭 B-Rep 스튜디오',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: '파라메트릭 B-Rep 모델링: 정밀 솔리드 형상, 조립 구속조건 및 가공 공차.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'Flow Engine 그래프',
        desc: '결정론적 연산 노드 네트워크',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'Flow Engine 연산 그래프: 누적 오차 없는 64비트 부동소수점 결정론적 연산.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'VDI 2230 볼트 체결',
        desc: '체결 토크 및 조인트 안전율',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'VDI 2230 볼트 체결: 조임 토크, 조립 예하중 및 항복 경계 안전율 검증.',
        standard: 'VDI 2230 Sheet 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'AeGiS 자문',
        desc: '실시간 공학 질의응답',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'AeGiS 엔지니어링 코파일럿: 공식 유도, 합금 재료 물성치 및 표준 규격 질의응답.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
  ar: {
    title: 'AeGiS · كبير مهندسي الأبحاث',
    badge: 'مختبر الأبحاث والتطوير · معتمد',
    msg: 'مرحباً بكم في مختبر هندسة AluCAD OS! جاهز للتحقق من تصميماتكم وتحسينها عبر محللات معايير ISO/DIN والنمذجة ثلاثية الأبعاد.',
    guidePrompt: 'اختر الأداة الهندسية للبدء:',
    chips: [
      {
        id: 'gears',
        title: 'تروس ISO 6336',
        desc: 'منحنى إنفوليت ومجموعة KHK',
        formula: 'σ_H = Z_H · Z_E · Z_ε · Z_β · √(F_t / (d1 · b)) ≤ σ_HP',
        insight: 'حسابات التروس ISO 6336: إجهاد التلامس السطحي وأمان مقاومة كسر جذر السن.',
        standard: 'ISO 6336-1/2',
        href: '/gears',
        pose: 'calculation',
        icon: 'gear',
        color: '#00e5ff',
        lookTarget: { x: -0.7, y: 0.8 },
      },
      {
        id: 'cad',
        title: 'تجميع CAD ثلاثي الأبعاد',
        desc: 'استوديو B-Rep البارامتري',
        formula: 'OpenCascade B-Rep · NURBS · STEP/DXF · ISO 2768-mK',
        insight: 'نمذجة B-Rep البارامترية: هندسة صلبة دقيقة، قيود التجميع والتفاوتات الميكانيكية.',
        standard: 'ISO 2768-mK',
        href: '/workspace',
        pose: 'blueprint',
        icon: 'cad',
        color: '#818cf8',
        lookTarget: { x: -0.35, y: 0.8 },
      },
      {
        id: 'flow',
        title: 'مخطط Flow Engine',
        desc: 'شبكة عقد حسابية قطعية',
        formula: 'Topological DAG · 64-bit IEEE 754 Float · Zero Drift',
        insight: 'مخطط محرك Flow Engine: شبكة حسابية قطعية دقيقة بدون تراكم خطأ الفاصلة العائمة.',
        standard: 'IEEE 754-2019',
        href: '/flow',
        pose: 'tesla',
        icon: 'flow',
        color: '#c084fc',
        lookTarget: { x: 0, y: 0.8 },
      },
      {
        id: 'bolt',
        title: 'براغي VDI 2230',
        desc: 'عزم الشد وأمان الوصلة',
        formula: 'F_M = T_A / [d · (0.16 · P + μ_ges · d_2)] · S_F ≥ 1.2',
        insight: 'وصلات البراغي VDI 2230: عزم الشد، قوة التحميل المسبق وحد الخضوع.',
        standard: 'VDI 2230 Sheet 1',
        href: '/bolt-torque',
        pose: 'newton',
        icon: 'bolt',
        color: '#f59e0b',
        lookTarget: { x: 0.35, y: 0.8 },
      },
      {
        id: 'ask',
        title: 'استشارة AeGiS',
        desc: 'استشارة هندسية فورية',
        formula: 'AeGiS Copilot · 90+ Solvers · ISO/DIN/VDI Knowledge Base',
        insight: 'مساعد AeGiS الهندسي: إجابات فورية للمعادلات والمواد والمعايير المعتمدة.',
        standard: 'AI COPILOT',
        action: 'copilot',
        pose: 'wave',
        icon: 'copilot',
        color: '#3dd68c',
        lookTarget: { x: 0.7, y: 0.8 },
      },
    ],
  },
};

export function AegisHeroStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { language } = useI18nStore();
  const langKey = language in GUIDANCE_DATA ? language : 'en';
  const g = GUIDANCE_DATA[langKey] || GUIDANCE_DATA.en;
  const quotes = SCIENTIST_QUOTES[language] || SCIENTIST_QUOTES.en;

  const [activeChip, setActiveChip] = useState<GuidanceChip | null>(null);
  const [currentPose, setCurrentPose] = useState<AegisPose>('walk');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [lookPos, setLookPos] = useState<{ x: number; y: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mascotClickCount, setMascotClickCount] = useState(0);

  const effectivePose = activeChip ? activeChip.pose : currentPose;
  const label = useMemo(() => POSE_LABEL[effectivePose] ?? POSE_LABEL.idle, [effectivePose]);

  // Compute active dialog information
  const activeDialog = useMemo(() => {
    if (activeChip) {
      return {
        badge: activeChip.title,
        standard: activeChip.standard,
        formula: activeChip.formula,
        text: activeChip.insight,
        color: activeChip.color,
      };
    }
    const quote = quotes[effectivePose] || quotes.idle;
    return {
      badge: quote.badge,
      standard: quote.standard,
      formula: quote.formula,
      text: quote.quote,
      color: '#00e5ff',
    };
  }, [activeChip, effectivePose, quotes]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    setTilt({ x: nx * 4, y: ny * -3 });
    if (!activeChip) {
      setLookPos({ x: nx, y: ny });
    }
  };

  const handleMascotClick = () => {
    if (soundEnabled) {
      playMascotChirp();
    }
    const cyclePoses: AegisPose[] = [
      'einstein',
      'newton',
      'tesla',
      'blueprint',
      'calculation',
      'celebrate',
      'walk',
      'idle',
    ];
    const nextIdx = (mascotClickCount + 1) % cyclePoses.length;
    setMascotClickCount(nextIdx);
    setCurrentPose(cyclePoses[nextIdx]);
  };

  const handleChipClick = (chip: GuidanceChip) => {
    if (soundEnabled) {
      playMascotChirp();
    }
    if (chip.action === 'copilot') {
      useCopilotStore.getState().setIsOpen(true);
    }
  };

  const handleChipHover = (chip: GuidanceChip | null) => {
    setActiveChip(chip);
    if (chip) {
      setLookPos(chip.lookTarget);
      if (soundEnabled) {
        playMascotChirp();
      }
    } else {
      setLookPos(null);
    }
  };

  const renderIcon = (iconType: GuidanceChip['icon'], color: string) => {
    switch (iconType) {
      case 'gear':
        return <Cog size={13} style={{ color }} className="shrink-0" />;
      case 'cad':
        return <Box size={13} style={{ color }} className="shrink-0" />;
      case 'flow':
        return <Network size={13} style={{ color }} className="shrink-0" />;
      case 'bolt':
        return <Zap size={13} style={{ color }} className="shrink-0" />;
      case 'copilot':
        return <MessageSquare size={13} style={{ color }} className="shrink-0" />;
    }
  };

  return (
    <div
      ref={stageRef}
      onMouseMove={onMove}
      onMouseLeave={() => {
        setTilt({ x: 0, y: 0 });
        setLookPos(null);
        setActiveChip(null);
      }}
      className="aegis-hero-stage relative w-full h-full min-h-[360px] overflow-hidden rounded-[var(--radius-s)] bg-[var(--bg-0)] flex flex-col justify-between p-3 select-none"
    >
      <div className="pointer-events-none absolute inset-0 aegis-hero-floor opacity-35" />

      {/* Technical Background Orbit Grid */}
      <div className="pointer-events-none absolute right-[18%] top-[40%] -translate-x-1/2 -translate-y-1/2 opacity-60">
        <div className="aegis-orbit-slow h-44 w-44 rounded-full border border-[var(--line)] border-dashed" />
      </div>
      <div className="pointer-events-none absolute right-[18%] top-[40%] -translate-x-1/2 -translate-y-1/2 opacity-60">
        <div className="aegis-orbit-rev h-32 w-32 rounded-full border border-[var(--cyan)]/25" />
      </div>

      {/* Laser Top Scanline */}
      <div className="pointer-events-none absolute inset-x-4 top-0 h-8 overflow-hidden">
        <div className="aegis-scan-line h-6 w-full bg-gradient-to-b from-transparent via-[var(--cyan)]/15 to-transparent" />
      </div>

      {/* TOP: Welcoming Scientist HUD Banner */}
      <div className="relative z-20 flex items-start justify-between gap-3 bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-m)] p-2.5 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleMascotClick}
            className="h-8 w-8 rounded-lg bg-[#f8fafc] border border-slate-300 flex items-center justify-center shadow-sm shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={t12(language, "Click Dr. AeGiS to interact!", "Dr. AeGiS'e tıkla ve konuş!")}
          >
            <span className="text-xs font-mono font-black text-slate-900">Dr.</span>
          </button>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-white tracking-wide truncate">{g.title}</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-[8.5px] font-mono font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {g.badge}
              </span>
            </div>
            <p className="text-[10px] text-[var(--alu-dim)] line-clamp-1 max-w-[480px]">
              {g.msg}
            </p>
          </div>
        </div>

        {/* Telemetry Status Badge & Sound Toggle */}
        <div className="shrink-0 flex items-center gap-1.5 ml-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-1.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-slate-400 hover:text-[var(--cyan)] hover:border-[var(--cyan)]/40 transition-colors"
            title={soundEnabled ? t12(language, 'Mute Audio', 'Sesi Kapat') : t12(language, 'Enable Audio', 'Sesi Aç')}
          >
            {soundEnabled ? (
              <Volume2 size={11} className="text-[var(--cyan)]" />
            ) : (
              <VolumeX size={11} className="text-slate-500" />
            )}
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[9px] font-mono text-[var(--cyan)]">
            <ShieldCheck size={11} className="text-[var(--cyan)]" />
            <span>{label}</span>
          </div>
        </div>
      </div>

      {/* MIDDLE: Mascot Stage with 3D Tilt, Eye Tracking & Live Formula Bubble */}
      <div className="relative z-10 flex-1 w-full flex items-center justify-center py-1">
        {/* Floating Holographic Thought / Insight Speech Bubble */}
        <div className="absolute top-1 left-2 sm:left-4 z-30 pointer-events-auto max-w-[270px] sm:max-w-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDialog.badge + activeDialog.formula}
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--cyan)]/40 shadow-[0_4px_24px_rgba(0,0,0,0.7)]"
            >
              <div className="flex items-center justify-between gap-1 mb-1 border-b border-white/10 pb-1">
                <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[var(--cyan)] truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] animate-pulse shrink-0" />
                  <span className="truncate">{activeDialog.badge}</span>
                </div>
                <span className="text-[8px] font-mono text-slate-400 uppercase shrink-0 font-bold">
                  {activeDialog.standard}
                </span>
              </div>

              {/* Exact Formula Readout */}
              <div className="text-[9.5px] font-mono font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-400/20 mb-1 truncate shadow-inner">
                {activeDialog.formula}
              </div>

              {/* Insight Explanation */}
              <p className="text-[9px] text-slate-300 leading-snug line-clamp-2">
                {activeDialog.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mascot Center with gaze tracking */}
        <motion.div
          className="relative h-full w-full max-h-[190px] sm:max-h-[210px] flex items-center justify-center"
          animate={{ rotateX: tilt.y, rotateY: tilt.x }}
          transition={{ type: 'spring', stiffness: 70, damping: 22, mass: 0.8 }}
          style={{ transformPerspective: 700 }}
        >
          <AegisMascot
            className="h-full w-full max-w-[340px]"
            variant="panoramic"
            pose={effectivePose}
            lookAt={lookPos}
            soundEnabled={soundEnabled}
            onPoseChange={setCurrentPose}
          />
        </motion.div>
      </div>

      {/* BOTTOM: Actionable Quick Start Guidance Chips */}
      <div className="relative z-20 space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[var(--alu-dim)] px-1">
          <span className="flex items-center gap-1 text-[var(--cyan)]">
            <Sparkles size={10} />
            {g.guidePrompt}
          </span>
          <span className="hidden sm:inline text-slate-500">ISO/DIN/VDI Validated</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono">
          {g.chips.map((chip) => {
            const isHovered = activeChip?.id === chip.id;
            const content = (
              <div
                onMouseEnter={() => handleChipHover(chip)}
                onMouseLeave={() => handleChipHover(null)}
                className={`group/chip h-full flex flex-col justify-between p-2 rounded-[var(--radius-s)] transition-all duration-150 cursor-pointer shadow-sm ${
                  isHovered
                    ? 'bg-[var(--bg-2)] border-[var(--cyan)] ring-1 ring-[var(--cyan)]/40'
                    : 'bg-[var(--bg-1)]/95 hover:bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)]/50 '
                }`}
                title={`${chip.title} — ${chip.desc}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {renderIcon(chip.icon, chip.color)}
                    <span
                      className={`text-[10px] font-bold truncate transition-colors ${
                        isHovered ? 'text-[var(--cyan)]' : 'text-white group-hover/chip:text-[var(--cyan)]'
                      }`}
                    >
                      {chip.title}
                    </span>
                  </div>
                  <ArrowRight
                    size={10}
                    className={`transition-all shrink-0 ${
                      isHovered
                        ? 'text-[var(--cyan)] translate-x-0.5'
                        : 'text-slate-600 group-hover/chip:text-[var(--cyan)] group-hover/chip:translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-[8.5px] text-[var(--alu-dim)] line-clamp-2 leading-tight" title={chip.desc}>
                  {chip.desc}
                </span>
              </div>
            );

            if (chip.href) {
              return (
                <Link
                  key={chip.id}
                  href={chip.href}
                  className={`block h-full ${chip.id === 'ask' ? 'col-span-2 sm:col-span-2' : ''}`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`text-left w-full h-full block cursor-pointer ${chip.id === 'ask' ? 'col-span-2 sm:col-span-2' : ''}`}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AegisHeroStage;
