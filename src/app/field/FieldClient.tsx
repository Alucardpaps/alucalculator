'use client';

/**
 * AluCAD OS — Professional Field Engineering Suite (34 Field Tools)
 * Route: /field
 * 
 * High-performance mobile & desktop field toolkit for engineers and technicians.
 * Integrates all 34 hardware & empirical field modules, offline storage,
 * live device sensors (Gyro, Accel, Magnetometer, GPS, Audio, Torch),
 * search, category filtering, favorites, and PWA Quick Widget launcher.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Compass,
  Ruler,
  Navigation,
  Scale,
  CircleDot,
  Activity,
  Volume2,
  Camera,
  Pipette,
  QrCode,
  Sun,
  Radio,
  Flashlight,
  Timer,
  FileText,
  Layers,
  ArrowLeftRight,
  Sliders,
  RotateCw,
  Split,
  Flame,
  FileSpreadsheet,
  Search,
  Star,
  Sparkles,
  Wifi,
  Battery,
  ShieldCheck,
  Check,
  Copy,
  Download,
  Share2,
  RefreshCw,
  Plus,
  Trash2,
  Play,
  Square,
  Pause,
  ExternalLink,
  ChevronRight,
  Info,
  AlertTriangle,
  AlertOctagon,
  Zap,
  Gauge,
  Anchor,
  Thermometer,
  Disc,
  Wrench,
  X
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

export const METRIC_HOLE_STANDARDS = [
  { name: 'M1', dia: 1.2, close: 1.1, tap: 0.75, pitch: 0.25 },
  { name: 'M1.2', dia: 1.4, close: 1.3, tap: 0.95, pitch: 0.25 },
  { name: 'M1.4', dia: 1.6, close: 1.5, tap: 1.1, pitch: 0.3 },
  { name: 'M1.6', dia: 1.8, close: 1.7, tap: 1.25, pitch: 0.35 },
  { name: 'M1.8', dia: 2.1, close: 2.0, tap: 1.45, pitch: 0.35 },
  { name: 'M2', dia: 2.4, close: 2.2, tap: 1.6, pitch: 0.4 },
  { name: 'M2.5', dia: 2.9, close: 2.7, tap: 2.05, pitch: 0.45 },
  { name: 'M3', dia: 3.4, close: 3.2, tap: 2.5, pitch: 0.5 },
  { name: 'M3.5', dia: 3.9, close: 3.7, tap: 2.9, pitch: 0.6 },
  { name: 'M4', dia: 4.5, close: 4.3, tap: 3.3, pitch: 0.7 },
  { name: 'M5', dia: 5.5, close: 5.3, tap: 4.2, pitch: 0.8 },
  { name: 'M6', dia: 6.6, close: 6.4, tap: 5.0, pitch: 1.0 },
  { name: 'M7', dia: 7.6, close: 7.4, tap: 6.0, pitch: 1.0 },
  { name: 'M8', dia: 9.0, close: 8.4, tap: 6.8, pitch: 1.25 },
  { name: 'M10', dia: 11.0, close: 10.5, tap: 8.5, pitch: 1.5 },
  { name: 'M12', dia: 13.5, close: 13.0, tap: 10.2, pitch: 1.75 },
  { name: 'M14', dia: 15.5, close: 15.0, tap: 12.0, pitch: 2.0 },
  { name: 'M16', dia: 17.5, close: 17.0, tap: 14.0, pitch: 2.0 },
  { name: 'M18', dia: 20.0, close: 19.0, tap: 15.5, pitch: 2.5 },
  { name: 'M20', dia: 22.0, close: 21.0, tap: 17.5, pitch: 2.5 },
  { name: 'M22', dia: 24.0, close: 23.0, tap: 19.5, pitch: 2.5 },
  { name: 'M24', dia: 26.0, close: 25.0, tap: 21.0, pitch: 3.0 },
  { name: 'M27', dia: 30.0, close: 28.0, tap: 24.0, pitch: 3.0 },
  { name: 'M30', dia: 33.0, close: 31.0, tap: 26.5, pitch: 3.5 },
  { name: 'M33', dia: 36.0, close: 34.0, tap: 29.5, pitch: 3.5 },
  { name: 'M36', dia: 39.0, close: 37.0, tap: 32.0, pitch: 4.0 },
  { name: 'M39', dia: 42.0, close: 40.0, tap: 35.0, pitch: 4.0 },
  { name: 'M42', dia: 45.0, close: 43.0, tap: 37.5, pitch: 4.5 },
  { name: 'M45', dia: 48.0, close: 46.0, tap: 40.5, pitch: 4.5 },
  { name: 'M48', dia: 52.0, close: 50.0, tap: 43.0, pitch: 5.0 },
  { name: 'M52', dia: 56.0, close: 54.0, tap: 47.0, pitch: 5.0 },
  { name: 'M56', dia: 62.0, close: 58.0, tap: 50.5, pitch: 5.5 },
  { name: 'M60', dia: 66.0, close: 62.0, tap: 54.5, pitch: 5.5 },
  { name: 'M64', dia: 70.0, close: 66.0, tap: 58.0, pitch: 6.0 },
  { name: 'M68', dia: 74.0, close: 70.0, tap: 62.0, pitch: 6.0 },
  { name: 'M72', dia: 78.0, close: 74.0, tap: 66.0, pitch: 6.0 },
  { name: 'M76', dia: 82.0, close: 78.0, tap: 70.0, pitch: 6.0 },
  { name: 'M80', dia: 86.0, close: 82.0, tap: 74.0, pitch: 6.0 },
  { name: 'M85', dia: 91.0, close: 87.0, tap: 79.0, pitch: 6.0 },
  { name: 'M90', dia: 96.0, close: 92.0, tap: 84.0, pitch: 6.0 },
  { name: 'M95', dia: 101.0, close: 97.0, tap: 89.0, pitch: 6.0 },
  { name: 'M100', dia: 107.0, close: 102.0, tap: 94.0, pitch: 6.0 },
];

// Dynamic imports for existing specialized modal components
import { BubbleLevelModal } from '@/components/os/mobile/BubbleLevelModal';
import { ClinometerModal } from '@/components/os/mobile/ClinometerModal';
import { GPSSurveyorModal } from '@/components/os/mobile/GPSSurveyorModal';
import { SoundMeterModal } from '@/components/os/mobile/SoundMeterModal';
import { VibrationAnalyzerModal } from '@/components/os/mobile/VibrationAnalyzerModal';
import { QRScannerModal } from '@/components/os/mobile/QRScannerModal';
import { TapChartModal } from '@/components/os/mobile/TapChartModal';
import { HardnessConverterModal } from '@/components/os/mobile/HardnessConverterModal';
import { VoiceMemoModule } from '@/components/os/mobile/VoiceMemoModule';
import { BoltTorqueScreeningModal } from '@/components/os/mobile/BoltTorqueScreeningModal';
import { ORingCaliperModal } from '@/components/os/mobile/ORingCaliperModal';
import { FieldWorkOrderModal } from '@/components/os/mobile/FieldWorkOrderModal';
import { FieldShopPanels } from '@/components/os/mobile/FieldShopPanels';
import { FieldHomeScreenWidget } from '@/components/os/mobile/FieldHomeScreenWidget';

type FieldCategory = 'all' | 'measure' | 'sensors' | 'reference' | 'notes' | 'favorites';

interface FieldToolItem {
  id: string;
  nameEn: string;
  nameTr: string;
  descEn: string;
  descTr: string;
  category: 'measure' | 'sensors' | 'reference' | 'notes';
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  color: string;
  badge?: string;
  keywords: string[];
}

const FIELD_TOOLS: FieldToolItem[] = [
  {
    id: 'spirit-level',
    nameEn: 'Spirit Level',
    nameTr: 'Dijital Su Terazisi',
    descEn: 'Tilt & align frames with precision 2-axis gyroscope',
    descTr: 'Çerçeve ve montaj hizalama için 2 eksenli jiroskop',
    category: 'sensors',
    icon: Smartphone,
    color: '#00e5ff',
    badge: 'GYRO',
    keywords: ['level', 'su terazisi', 'egim', 'tilt', 'gyro', 'align'],
  },
  {
    id: 'clinometer',
    nameEn: 'Clinometer / Height Finder',
    nameTr: 'İnklinometre / Yükseklik Ölçer',
    descEn: 'Measure height & slope via camera & tilt sight',
    descTr: 'Kamera ve optik eğim ile bina/direk yüksekliği ölçümü',
    category: 'measure',
    icon: Compass,
    color: '#38bdf8',
    badge: 'OPTICAL',
    keywords: ['clinometer', 'height', 'yukseklik', 'egim', 'trigonometry'],
  },
  {
    id: 'quick-measure',
    nameEn: 'Quick Measure',
    nameTr: 'Hızlı Geometri & Alan',
    descEn: 'Area, perimeter, diagonal, sheet weight & volume',
    descTr: 'Alan, çevre, köşegen ve plaka sac ağırlığı',
    category: 'measure',
    icon: Ruler,
    color: '#34d399',
    keywords: ['measure', 'alan', 'cevre', 'kosegen', 'area', 'perimeter'],
  },
  {
    id: 'gps-surveyor',
    nameEn: 'GPS Surveyor & Compass',
    nameTr: 'GPS Saha Ölçer & Pusula',
    descEn: 'Real-time coordinates, altitude & heading tracker',
    descTr: 'Canlı koordinat, rakım/irtifa ve pusula yönü',
    category: 'sensors',
    icon: Navigation,
    color: '#10b981',
    badge: 'GPS',
    keywords: ['gps', 'surveyor', 'koordinat', 'altitude', 'rakim', 'irtifa', 'pusula'],
  },
  {
    id: 'material-weight',
    nameEn: 'Material Weight Calculator',
    nameTr: 'Malzeme Ağırlık Hesabı',
    descEn: 'Al / Steel / Copper plate, bar, round & tube kg',
    descTr: 'Alüminyum, çelik, bakır profil, sac, boru ve çubuk ağırlığı',
    category: 'measure',
    icon: Scale,
    color: '#a855f7',
    keywords: ['material', 'weight', 'agirlik', 'aluminyum', 'celik', 'boru', 'profil'],
  },
  {
    id: 'bolt-circle-pcd',
    nameEn: 'Bolt Circle (PCD)',
    nameTr: 'Flanş Delik Eksen (PCD)',
    descEn: 'PCD bolt hole circle coordinates (X, Y) table',
    descTr: 'Flanş ve kasnak delik merkez koordinatları (X, Y)',
    category: 'measure',
    icon: CircleDot,
    color: '#f59e0b',
    badge: 'CNC/CAD',
    keywords: ['pcd', 'bolt circle', 'flans', 'delik', 'hole', 'flange'],
  },
  {
    id: 'vibe-analyzer',
    nameEn: 'Vibe Analyzer (ISO 10816)',
    nameTr: 'Titreşim Analizi (ISO 10816)',
    descEn: 'ISO 10816 motor severity & 3-axis accelerometer',
    descTr: '3 eksenli ivmeölçer ile motor titreşim seviye kontrolü',
    category: 'sensors',
    icon: Activity,
    color: '#ef4444',
    badge: 'ISO 10816',
    keywords: ['vibration', 'titresim', 'vibe', 'iso 10816', 'motor', 'ivme'],
  },
  {
    id: 'sound-meter',
    nameEn: 'Sound Decibel Meter',
    nameTr: 'Ses / Desibel Ölçer',
    descEn: 'Real-time ambient noise & FFT acoustic analyzer',
    descTr: 'Mikrofon ile canlı dBA gürültü ve tepe desibel ölçümü',
    category: 'sensors',
    icon: Volume2,
    color: '#f97316',
    badge: 'dBA',
    keywords: ['sound', 'decibel', 'ses', 'desibel', 'gurultu', 'noise', 'fft'],
  },
  {
    id: 'field-camera',
    nameEn: 'Field Camera & GPS Stamp',
    nameTr: 'Saha Kamerası (GPS Damgalı)',
    descEn: 'Capture inspection photos with GPS & time watermark',
    descTr: 'Fotoğraflara konum, saat ve proje damgası ekleme',
    category: 'measure',
    icon: Camera,
    color: '#06b6d4',
    keywords: ['camera', 'kamera', 'gps stamp', 'fotograf', 'photo', 'inspection'],
  },
  {
    id: 'thread-identifier',
    nameEn: 'Thread identifier (ISO 261)',
    nameTr: 'Diş tanımlama (ISO 261)',
    descEn: 'Measured major Ø → nearest metric coarse + tap drill',
    descTr: 'Ölçülen dış çap → en yakın metrik kaba diş ve kılavuz matkap',
    category: 'measure',
    icon: Wrench,
    color: '#22d3ee',
    badge: 'ISO 261',
    keywords: ['thread', 'dis', 'metric', 'm8', 'tap', 'kilavuz', 'pitch'],
  },
  {
    id: 'qr-barcode',
    nameEn: 'QR & Barcode Scanner',
    nameTr: 'QR & Barkod Okuyucu',
    descEn: 'Scan profile labels, standard parts & serials',
    descTr: 'Profil etiketleri ve cıvata seri numarası tarama',
    category: 'sensors',
    icon: QrCode,
    color: '#8b5cf6',
    keywords: ['qr', 'barcode', 'barkod', 'tara', 'scan', 'etiket'],
  },
  {
    id: 'magnetic-compass',
    nameEn: 'Magnetic Compass',
    nameTr: 'Manyetik Pusula & Alan',
    descEn: 'Heading ° & microtesla (µT) magnetic field gauge',
    descTr: 'Manyetik alan şiddeti (µT) ve hassas pusula açısı',
    category: 'sensors',
    icon: Compass,
    color: '#14b8a6',
    keywords: ['compass', 'pusula', 'magnetic', 'manyetik', 'heading', 'yon'],
  },
  {
    id: 'fastener-grade',
    nameEn: 'ISO 898-1 property class',
    nameTr: 'ISO 898-1 mukavemet sınıfı',
    descEn: 'Head mark 4.8–12.9 → Rm / Re lookup on the shop floor',
    descTr: 'Baş damgası 4.8–12.9 → Rm / Re saha tablosu',
    category: 'reference',
    icon: ShieldCheck,
    color: '#f59e0b',
    badge: 'ISO 898',
    keywords: ['898', '8.8', '10.9', 'grade', 'mukavemet', 'civata', 'class'],
  },
  {
    id: 'ra-comparator',
    nameEn: 'Surface roughness Ra',
    nameTr: 'Yüzey pürüzlülüğü Ra',
    descEn: 'ISO 1302 N-grades vs typical machining process',
    descTr: 'ISO 1302 N sınıfı ve talaşlı imalat karşılıkları',
    category: 'reference',
    icon: Layers,
    color: '#94a3b8',
    badge: 'ISO 1302',
    keywords: ['ra', 'roughness', 'puruzluluk', 'n7', 'surface', 'finish'],
  },
  {
    id: 'keyway-iso',
    nameEn: 'Parallel key ISO 773',
    nameTr: 'Kama ISO 773',
    descEn: 'Shaft diameter → key b×h (DIN 6885 / ISO 773)',
    descTr: 'Mil çapı → kama b×h (DIN 6885 / ISO 773)',
    category: 'reference',
    icon: Split,
    color: '#818cf8',
    badge: 'ISO 773',
    keywords: ['key', 'kama', 'keyway', 'shaft', 'mil', '6885', '773'],
  },
  {
    id: 'tachometer-rpm',
    nameEn: 'RPM / sync speed',
    nameTr: 'Devir / senkron hız',
    descEn: 'Hz→rpm and 50 Hz induction motor ns from pole count',
    descTr: 'Hz→rpm ve 50 Hz asenkron motor kutup senkron hızı',
    category: 'sensors',
    icon: Gauge,
    color: '#38bdf8',
    badge: 'n = 120f/p',
    keywords: ['rpm', 'devir', 'hz', 'motor', 'poles', 'kutup', 'tachometer'],
  },
  {
    id: 'stopwatch',
    nameEn: 'Stopwatch & Lap Timer',
    nameTr: 'Kronometre & Tur Sayacı',
    descEn: 'Precision timer for cycle time & process audit',
    descTr: 'Çevrim süresi ve operasyon zaman etüdü için kronometre',
    category: 'measure',
    icon: Timer,
    color: '#0284c7',
    keywords: ['stopwatch', 'timer', 'kronometre', 'sure', 'time study', 'lap'],
  },
  {
    id: 'tap-drill',
    nameEn: 'Tap & Drill Chart',
    nameTr: 'Kılavuz & Matkap Tablosu',
    descEn: 'Metric M1-M64, UNC/UNF, BSP pitch & pilot drill hole',
    descTr: 'Metrik, inç ve gaz diş kılavuz matkap çapları',
    category: 'reference',
    icon: FileText,
    color: '#f59e0b',
    badge: 'ISO/DIN',
    keywords: ['tap', 'drill', 'kilavuz', 'matkap', 'thread', 'metric', 'unc'],
  },
  {
    id: 'hardness-converter',
    nameEn: 'Hardness & Tensile Converter',
    nameTr: 'Sertlik & Çekme Dönüştürücü',
    descEn: 'Convert HRC, HRB, HB, HV & Tensile (MPa) via ASTM E140',
    descTr: 'Rockwell, Brinell, Vickers ve çekme mukavemeti dönüşümü',
    category: 'reference',
    icon: Layers,
    color: '#3b82f6',
    badge: 'ASTM E140',
    keywords: ['hardness', 'sertlik', 'hrc', 'hb', 'vickers', 'tensile', 'mukavemet'],
  },
  {
    id: 'unit-converter',
    nameEn: 'Engineering Unit Converter',
    nameTr: 'Mühendislik Birim Dönüştürücü',
    descEn: 'mm·in, MPa·psi, N·m·lbf·ft, bar, kW·HP instant conversion',
    descTr: 'Uzunluk, basınç, tork, güç ve sıcaklık anlık birim çevirici',
    category: 'reference',
    icon: ArrowLeftRight,
    color: '#06b6d4',
    keywords: ['unit', 'converter', 'birim', 'donusturucu', 'mpa', 'psi', 'bar', 'nm'],
  },
  {
    id: 'limits-fits',
    nameEn: 'ISO 286 Limits & Fits',
    nameTr: 'Toleranslar & Geçmeler (ISO 286)',
    descEn: 'H7/g6, H7/p6 shaft-hole clearance & interference',
    descTr: 'Mil ve delik boşluklu/sıkı geçme tolerans hesabı',
    category: 'reference',
    icon: Sliders,
    color: '#10b981',
    badge: 'ISO 286',
    keywords: ['fits', 'tolerances', 'tolerans', 'gecme', 'iso 286', 'h7', 'g6'],
  },
  {
    id: 'cnc-feeds',
    nameEn: 'CNC Feeds & Speeds',
    nameTr: 'CNC Kesme Hızı & Devir',
    descEn: 'ISO 3002 Kienzle RPM, feed rate and cutting power',
    descTr: 'Freze ve torna için kesme hızı (Vc), devir (RPM) ve ilerleme',
    category: 'reference',
    icon: RotateCw,
    color: '#6366f1',
    keywords: ['cnc', 'feeds', 'speeds', 'devir', 'rpm', 'ilerleme', 'kesme hizi'],
  },
  {
    id: 'cylinder-force',
    nameEn: 'Hydraulic & Pneumatic Cylinder',
    nameTr: 'Hidrolik & Pnömatik Piston',
    descEn: 'Push/pull force, bore/rod sizing & flow rate (L/min)',
    descTr: 'Piston itme/çekme kuvveti (kN/kgf), debi ve hız hesabı',
    category: 'reference',
    icon: Gauge,
    color: '#0284c7',
    badge: 'ISO 6020',
    keywords: ['cylinder', 'piston', 'hidrolik', 'pnomatik', 'hydraulic', 'pneumatic', 'force', 'kuvvet', 'debi'],
  },
  {
    id: 'thermal-expansion',
    nameEn: 'Thermal Expansion & Gap',
    nameTr: 'Termal Genleşme & Boşluk',
    descEn: 'Linear ΔL mm expansion & minimum slotted hole clearance',
    descTr: 'Sıcaklık farkı genleşme payı (ΔL) ve montaj boşluğu hesabı',
    category: 'reference',
    icon: Thermometer,
    color: '#f97316',
    badge: 'ΔL = L·α·ΔT',
    keywords: ['thermal', 'expansion', 'genlesme', 'sicaklik', 'bosluk', 'temperature', 'gap'],
  },
  {
    id: 'rigging-sling',
    nameEn: 'Crane Rigging & Sling Angle',
    nameTr: 'Sapan Açısı & Vinç Emniyeti',
    descEn: 'Sling tension per leg, load angle factor & OSHA safety',
    descTr: 'Sapan kolu başına çekme gerilmesi ve açı emniyet faktörü',
    category: 'reference',
    icon: Anchor,
    color: '#10b981',
    badge: 'OSHA / EN 1492',
    keywords: ['rigging', 'sling', 'crane', 'vinc', 'sapan', 'kaldirma', 'yuk', 'tension'],
  },
  {
    id: 'v-belt-calc',
    nameEn: 'V-Belt & Pulley Center',
    nameTr: 'V-Kayış & Kasnak Eksen Mesafesi',
    descEn: 'Pitch length, center distance & wrap angle per DIN 2215',
    descTr: 'V-kayış hatve boyu, kasnak eksen mesafesi ve sarım açısı',
    category: 'reference',
    icon: Disc,
    color: '#a855f7',
    badge: 'DIN 2215',
    keywords: ['belt', 'pulley', 'kayis', 'kasnak', 'v-belt', 'center distance', 'hatve'],
  },
  {
    id: 'sheet-bending',
    nameEn: 'Sheet Metal Bending (DIN 6935)',
    nameTr: 'Sac Büküm & Açınım (DIN 6935)',
    descEn: 'DIN 6935 K-factor, bend deduction, setback & flat pattern',
    descTr: 'K-faktörü, büküm payı açınım boyu ve sac boyutu hesabı',
    category: 'reference',
    icon: Split,
    color: '#ec4899',
    badge: 'DIN 6935',
    keywords: ['sheet metal', 'bending', 'sac', 'bukum', 'k factor', 'acinim'],
  },
  {
    id: 'welding-heat',
    nameEn: 'Welding Heat Input (EN 1011)',
    nameTr: 'Kaynak Isı Girdisi (EN 1011)',
    descEn: 'EN 1011-2 heat input, carbon equivalent (CEV) & preheat',
    descTr: 'Kaynak ısı girdisi, karbon eşdeğeri ve ön ısıtma hesabı',
    category: 'reference',
    icon: Flame,
    color: '#ef4444',
    badge: 'EN 1011-2',
    keywords: ['welding', 'heat input', 'kaynak', 'isi girdisi', 'cev', 'carbon equivalent'],
  },
  {
    id: 'pipe-flange',
    nameEn: 'Pipe & Flange Standards',
    nameTr: 'Boru & Flanş Standartları',
    descEn: 'ASME B36.10 & EN 10220 Sch 10/40/80/160, PN16/Class 150 PCD',
    descTr: 'ASME/EN boru et kalınlığı, su ağırlığı ve flanş cıvata tablosu',
    category: 'reference',
    icon: CircleDot,
    color: '#06b6d4',
    badge: 'ASME/EN',
    keywords: ['pipe', 'boru', 'flange', 'flans', 'schedule', 'sch 40', 'pn16', 'pcd'],
  },
  {
    id: 'voltage-drop',
    nameEn: 'Cable Sizing & Voltage Drop',
    nameTr: 'Kablo Kesiti & Gerilim Düşümü',
    descEn: 'IEC 60364 & VDE 0100 1-Ph / 3-Ph % drop, current & power loss',
    descTr: '1 ve 3 faz bakır/alüminyum kablo gerilim düşümü ve güç kaybı',
    category: 'reference',
    icon: Zap,
    color: '#eab308',
    badge: 'IEC 60364',
    keywords: ['voltage drop', 'gerilim dusumu', 'kablo', 'cable', 'iec 60364', 'akim', 'kesit'],
  },
  {
    id: 'field-notes',
    nameEn: 'Field Notes & Voice Memo',
    nameTr: 'Saha Notları & Ses Kaydı',
    descEn: 'Record audio memos, measurements & export PDF/JSON',
    descTr: 'Sesli not kaydetme, saha ölçümlerini listeleme ve dışa aktarma',
    category: 'notes',
    icon: FileSpreadsheet,
    color: '#00e5ff',
    badge: 'AUDIO',
    keywords: ['notes', 'voice', 'sesli not', 'kayit', 'memo', 'field notes'],
  },
  {
    id: 'bolt-torque-screening',
    nameEn: 'Bolt Tightening Screening & Checklist',
    nameTr: 'Cıvata Sıkma Torku Saha Kontrolü',
    descEn: 'Fast ISO 898-1 torque lookup (4.8 to 12.9) with shop floor checklist',
    descTr: 'ISO 898-1 hızlı tork taraması (4.8 - 12.9) ve montaj kontrol listesi',
    category: 'reference',
    icon: Wrench,
    color: '#f59e0b',
    badge: 'ISO 898',
    keywords: ['torque', 'tork', 'civata', 'bolt', 'vdi 2230', 'iso 898', 'tightening'],
  },
  {
    id: 'oring-caliper-matcher',
    nameEn: 'O-Ring Caliper & Gland Matcher',
    nameTr: 'O-Ring Kumpas & Yuva Eşleştirici',
    descEn: 'Measure cord & ID with calipers to match standard ISO 3601 gland',
    descTr: 'Kumpasla kord ve iç çap ölçüp standart ISO 3601 yuva boyutunu bulun',
    category: 'measure',
    icon: CircleDot,
    color: '#2dd4bf',
    badge: 'ISO 3601',
    keywords: ['o-ring', 'oring', 'kumpas', 'caliper', 'gland', 'yuva', 'sizdirmazlik'],
  },
  {
    id: 'field-work-order-share',
    nameEn: 'Field Work Order & Engineering Note',
    nameTr: 'Saha İş Emri & Mühendislik Raporu',
    descEn: 'One-tap standardized ASCII report export, WhatsApp & email share',
    descTr: 'Tek tuşla standart mühendislik raporu, WhatsApp ve e-posta paylaşımı',
    category: 'notes',
    icon: FileText,
    color: '#10b981',
    badge: 'EXPORT',
    keywords: ['report', 'rapor', 'is emri', 'work order', 'whatsapp', 'share', 'paylas'],
  },
  {
    id: 'vernier-caliper',
    nameEn: 'Vernier Caliper & Feeler Gauge',
    nameTr: 'Sanal Kumpas & Sentil Çakısı',
    descEn: '0.05 mm vernier scale simulation and feeler blade thickness reference',
    descTr: '0.05 mm hassasiyetli verniyer kumpas ve sentil çakısı referansı',
    category: 'measure',
    icon: Ruler,
    color: '#00e5ff',
    badge: '0.05 mm',
    keywords: ['caliper', 'kumpas', 'vernier', 'feeler', 'sentil', 'olcum', 'micrometer'],
  },
];

export const PIPE_DATA: Record<string, { name: string; od: number; nps: string; sch10: number; sch40: number; sch80: number; sch160: number; pn16_pcd: number; pn16_holes: number; pn16_bolt: string }> = {
  DN15: { name: 'DN15 (1/2")', od: 21.3, nps: '1/2"', sch10: 2.11, sch40: 2.77, sch80: 3.73, sch160: 4.78, pn16_pcd: 65, pn16_holes: 4, pn16_bolt: 'M12' },
  DN20: { name: 'DN20 (3/4")', od: 26.9, nps: '3/4"', sch10: 2.11, sch40: 2.87, sch80: 3.91, sch160: 5.56, pn16_pcd: 75, pn16_holes: 4, pn16_bolt: 'M12' },
  DN25: { name: 'DN25 (1")', od: 33.7, nps: '1"', sch10: 2.77, sch40: 3.38, sch80: 4.55, sch160: 6.35, pn16_pcd: 85, pn16_holes: 4, pn16_bolt: 'M12' },
  DN32: { name: 'DN32 (1-1/4")', od: 42.4, nps: '1-1/4"', sch10: 2.77, sch40: 3.56, sch80: 4.85, sch160: 6.35, pn16_pcd: 100, pn16_holes: 4, pn16_bolt: 'M16' },
  DN40: { name: 'DN40 (1-1/2")', od: 48.3, nps: '1-1/2"', sch10: 2.77, sch40: 3.68, sch80: 5.08, sch160: 7.14, pn16_pcd: 110, pn16_holes: 4, pn16_bolt: 'M16' },
  DN50: { name: 'DN50 (2")', od: 60.3, nps: '2"', sch10: 2.77, sch40: 3.91, sch80: 5.54, sch160: 8.74, pn16_pcd: 125, pn16_holes: 4, pn16_bolt: 'M16' },
  DN65: { name: 'DN65 (2-1/2")', od: 76.1, nps: '2-1/2"', sch10: 3.05, sch40: 5.16, sch80: 7.01, sch160: 9.53, pn16_pcd: 145, pn16_holes: 4, pn16_bolt: 'M16' },
  DN80: { name: 'DN80 (3")', od: 88.9, nps: '3"', sch10: 3.05, sch40: 5.49, sch80: 7.62, sch160: 11.13, pn16_pcd: 160, pn16_holes: 8, pn16_bolt: 'M16' },
  DN100: { name: 'DN100 (4")', od: 114.3, nps: '4"', sch10: 3.05, sch40: 6.02, sch80: 8.56, sch160: 13.49, pn16_pcd: 180, pn16_holes: 8, pn16_bolt: 'M16' },
  DN125: { name: 'DN125 (5")', od: 139.7, nps: '5"', sch10: 3.40, sch40: 6.55, sch80: 9.53, sch160: 15.88, pn16_pcd: 210, pn16_holes: 8, pn16_bolt: 'M16' },
  DN150: { name: 'DN150 (6")', od: 168.3, nps: '6"', sch10: 3.40, sch40: 7.11, sch80: 10.97, sch160: 18.26, pn16_pcd: 240, pn16_holes: 8, pn16_bolt: 'M20' },
  DN200: { name: 'DN200 (8")', od: 219.1, nps: '8"', sch10: 3.76, sch40: 8.18, sch80: 12.70, sch160: 23.01, pn16_pcd: 295, pn16_holes: 12, pn16_bolt: 'M20' },
  DN250: { name: 'DN250 (10")', od: 273.0, nps: '10"', sch10: 4.19, sch40: 9.27, sch80: 15.09, sch160: 28.58, pn16_pcd: 355, pn16_holes: 12, pn16_bolt: 'M24' },
  DN300: { name: 'DN300 (12")', od: 323.8, nps: '12"', sch10: 4.57, sch40: 10.31, sch80: 17.48, sch160: 33.32, pn16_pcd: 410, pn16_holes: 12, pn16_bolt: 'M24' },
};

export default function FieldToolsSuitePage() {
  const { language } = useI18nStore();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FieldCategory>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('alucalc_field_favorites');
        return saved ? JSON.parse(saved) : ['spirit-level', 'clinometer', 'tap-drill', 'material-weight'];
      } catch {
        return ['spirit-level', 'clinometer', 'tap-drill', 'material-weight'];
      }
    }
    return ['spirit-level', 'clinometer', 'tap-drill', 'material-weight'];
  });

  // Active Interactive Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Live Telemetry States (Battery, Network)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // In-Suite Tool States:
  // 1. Material Weight
  const [matType, setMatType] = useState<'al' | 'steel' | 'copper' | 'brass'>('al');
  const [matShape, setMatShape] = useState<'plate' | 'round' | 'tube' | 'rect_tube'>('plate');
  const [dimA, setDimA] = useState(100); // mm
  const [dimB, setDimB] = useState(100); // mm
  const [dimThickness, setDimThickness] = useState(5); // mm
  const [dimLength, setDimLength] = useState(1000); // mm

  // 2. Bolt Circle PCD
  const [pcdDiameter, setPcdDiameter] = useState(150); // mm
  const [pcdHoleCount, setPcdHoleCount] = useState(6);
  const [pcdStartAngle, setPcdStartAngle] = useState(0); // deg
  const [pcdHoleDia, setPcdHoleDia] = useState(12); // mm
  const [pcdMetricStd, setPcdMetricStd] = useState<string>('custom');
  const [pcdFitType, setPcdFitType] = useState<'clearance' | 'close' | 'tap'>('clearance');
  const [selectedHoleIdx, setSelectedHoleIdx] = useState(1);
  const [copiedGCode, setCopiedGCode] = useState(false);

  // 3. Quick Measure
  const [qmLength, setQmLength] = useState(500); // mm
  const [qmWidth, setQmWidth] = useState(300); // mm

  // 4. Pipe & Flange Sizing
  const [pipeDn, setPipeDn] = useState('DN50');
  const [pipeSch, setPipeSch] = useState<'sch10' | 'sch40' | 'sch80' | 'sch160'>('sch40');

  // 5. Voltage Drop Sizing
  const [vdVoltage, setVdVoltage] = useState<'230' | '400'>('230');
  const [vdMaterial, setVdMaterial] = useState<'cu' | 'al'>('cu');
  const [vdSection, setVdSection] = useState(2.5); // mm2
  const [vdLength, setVdLength] = useState(25); // m
  const [vdCurrent, setVdCurrent] = useState(16); // A
  const [vdCosPhi, setVdCosPhi] = useState(0.95);

  // 6. Stopwatch State
  // 7. Hydraulic / Pneumatic Cylinder
  const [cylType, setCylType] = useState<'hydraulic' | 'pneumatic'>('hydraulic');
  const [cylBore, setCylBore] = useState(63); // mm
  const [cylRod, setCylRod] = useState(36); // mm
  const [cylPressure, setCylPressure] = useState(160); // bar
  const [cylSpeed, setCylSpeed] = useState(0.15); // m/s

  // 8. Thermal Expansion
  const [teLength, setTeLength] = useState(6000); // mm
  const [teMaterial, setTeMaterial] = useState<'al' | 'steel' | 'ss304' | 'copper' | 'brass' | 'pvc'>('al');
  const [teT1, setTeT1] = useState(-10); // C
  const [teT2, setTeT2] = useState(50); // C

  // 9. Rigging & Sling
  const [slingWeight, setSlingWeight] = useState(3000); // kg
  const [slingLegs, setSlingLegs] = useState<2 | 3 | 4>(2);
  const [slingAngle, setSlingAngle] = useState(60); // deg

  // 10. V-Belt & Pulley
  const [beltD1, setBeltD1] = useState(100); // mm
  const [beltD2, setBeltD2] = useState(250); // mm
  const [beltCenter, setBeltCenter] = useState(450); // mm

  // 11. Sheet Metal Bending
  const [sbThickness, setSbThickness] = useState(2.0); // mm
  const [sbRadius, setSbRadius] = useState(2.0); // mm
  const [sbAngle, setSbAngle] = useState(90); // deg
  const [sbKFactor, setSbKFactor] = useState(0.40);
  const [sbLeg1, setSbLeg1] = useState(50); // mm
  const [sbLeg2, setSbLeg2] = useState(75); // mm

  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const timerRef = useRef<any>(null);

  // 5. Torch / Flashlight
  const [torchActive, setTorchActive] = useState(false);
  const torchStreamRef = useRef<MediaStream | null>(null);

  // 6. Live Ambient Light Sensor
  const [ambientLux, setAmbientLux] = useState<number | null>(null);

  // 7. Sensor Hub Live Values
  const [sensorValues, setSensorValues] = useState({
    pitch: 0,
    roll: 0,
    yaw: 0,
    accelTotal: 1.0,
  });

  // ──────────────────────────────────────────
  // INITIAL TELEMETRY & LISTENERS
  // ──────────────────────────────────────────

  useEffect(() => {
    // Battery Status
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        setBatteryLevel(Math.round(batt.level * 100));
        batt.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(batt.level * 100));
        });
      }).catch(() => {});
    }

    // Online / Offline Status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Support ?modal=widget-modal or similar URL parameter
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('modal');
      if (m) setActiveModal(m);
    } catch {}

    // Orientation & Motion Listeners
    const handleOrientation = (e: DeviceOrientationEvent) => {
      setSensorValues((prev) => ({
        ...prev,
        pitch: Math.round(e.beta || 0),
        roll: Math.round(e.gamma || 0),
        yaw: Math.round(e.alpha || 0),
      }));
    };

    const handleMotion = (e: DeviceMotionEvent) => {
      if (e.accelerationIncludingGravity) {
        const x = e.accelerationIncludingGravity.x || 0;
        const y = e.accelerationIncludingGravity.y || 0;
        const z = e.accelerationIncludingGravity.z || 0;
        const tot = Math.sqrt(x * x + y * y + z * z) / 9.81;
        setSensorValues((prev) => ({
          ...prev,
          accelTotal: Number(tot.toFixed(2)),
        }));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  // Save favorites to LocalStorage
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('alucalc_field_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Stopwatch interval
  useEffect(() => {
    if (stopwatchRunning) {
      timerRef.current = setInterval(() => {
        setStopwatchTime((t) => t + 10);
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopwatchRunning]);

  // Flashlight toggle
  const toggleFlashlight = async () => {
    const next = !torchActive;
    try {
      if (next) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        torchStreamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities() as any;
        if (caps?.torch) {
          await track.applyConstraints({ advanced: [{ torch: true }] } as any);
          setTorchActive(true);
        } else {
          track.stop();
          alert(t12(language, 'Hardware torch not supported.', 'Cihaz donanım fenerini desteklemiyor.'));
        }
      } else {
        if (torchStreamRef.current) {
          torchStreamRef.current.getTracks().forEach((t) => t.stop());
          torchStreamRef.current = null;
        }
        setTorchActive(false);
      }
    } catch {
      alert(t12(language, 'Could not activate torch.', 'Kamera feneri açılamadı.'));
    }
  };

  // ──────────────────────────────────────────
  // MATHEMATICAL CALCULATIONS FOR INLINE TOOLS
  // ──────────────────────────────────────────

  // 1. Material Density (g/cm3)
  const DENSITIES: Record<string, number> = {
    al: 2.7,
    steel: 7.85,
    copper: 8.96,
    brass: 8.5,
  };

  const calculatedWeightKg = useMemo(() => {
    const density = DENSITIES[matType] || 2.7;
    let volumeMm3 = 0;

    if (matShape === 'plate') {
      volumeMm3 = dimA * dimB * dimThickness;
    } else if (matShape === 'round') {
      const radius = dimA / 2;
      volumeMm3 = Math.PI * radius * radius * dimLength;
    } else if (matShape === 'tube') {
      const rOuter = dimA / 2;
      const rInner = Math.max(0, rOuter - dimThickness);
      volumeMm3 = Math.PI * (rOuter * rOuter - rInner * rInner) * dimLength;
    } else if (matShape === 'rect_tube') {
      const outerVol = dimA * dimB * dimLength;
      const innerA = Math.max(0, dimA - 2 * dimThickness);
      const innerB = Math.max(0, dimB - 2 * dimThickness);
      const innerVol = innerA * innerB * dimLength;
      volumeMm3 = Math.max(0, outerVol - innerVol);
    }

    const volumeCm3 = volumeMm3 / 1000;
    return Number(((volumeCm3 * density) / 1000).toFixed(3));
  }, [matType, matShape, dimA, dimB, dimThickness, dimLength]);

  // 2. Bolt Circle PCD Coordinate List & Telemetry
  const pcdCoordinates = useMemo(() => {
    const coords: { index: number; angle: number; x: number; y: number }[] = [];
    const radius = pcdDiameter / 2;
    const step = 360 / Math.max(1, pcdHoleCount);

    for (let i = 0; i < pcdHoleCount; i++) {
      const angleDeg = pcdStartAngle + i * step;
      const angleRad = (angleDeg * Math.PI) / 180;
      coords.push({
        index: i + 1,
        angle: Number((angleDeg % 360).toFixed(1)),
        x: Number((radius * Math.cos(angleRad)).toFixed(2)),
        y: Number((radius * Math.sin(angleRad)).toFixed(2)),
      });
    }
    return coords;
  }, [pcdDiameter, pcdHoleCount, pcdStartAngle]);

  const pcdChordDistance = useMemo(() => {
    if (pcdHoleCount <= 1) return 0;
    return Number((pcdDiameter * Math.sin(Math.PI / pcdHoleCount)).toFixed(2));
  }, [pcdDiameter, pcdHoleCount]);

  const pcdStepAngle = useMemo(() => {
    return Number((360 / Math.max(1, pcdHoleCount)).toFixed(2));
  }, [pcdHoleCount]);

  const webThickness = useMemo(() => {
    return Number((pcdChordDistance - pcdHoleDia).toFixed(2));
  }, [pcdChordDistance, pcdHoleDia]);

  const isCollision = pcdHoleCount >= 2 && webThickness <= 0;
  const minSafeWeb = Math.max(3, Number((pcdHoleDia * 0.8).toFixed(1)));
  const isTooClose = pcdHoleCount >= 2 && !isCollision && webThickness < minSafeWeb;

  const dynamicFontSize = useMemo(() => {
    if (pcdHoleCount <= 4) return 13;
    if (pcdHoleCount <= 8) return 11;
    if (pcdHoleCount <= 16) return 9.5;
    if (pcdHoleCount <= 28) return 8;
    return 6.5;
  }, [pcdHoleCount]);

  const dynamicBadgeW = useMemo(() => {
    if (pcdHoleCount <= 4) return 28;
    if (pcdHoleCount <= 8) return 24;
    if (pcdHoleCount <= 16) return 20;
    if (pcdHoleCount <= 28) return 16;
    return 13;
  }, [pcdHoleCount]);

  const dynamicBadgeH = useMemo(() => {
    if (pcdHoleCount <= 4) return 18;
    if (pcdHoleCount <= 8) return 16;
    if (pcdHoleCount <= 16) return 14;
    if (pcdHoleCount <= 28) return 11;
    return 9;
  }, [pcdHoleCount]);

  const selectedHole = useMemo(() => {
    return pcdCoordinates.find((c) => c.index === selectedHoleIdx) || pcdCoordinates[0] || { index: 1, angle: 0, x: 0, y: 0 };
  }, [pcdCoordinates, selectedHoleIdx]);

  const handleMetricSelect = (mName: string, fit: 'clearance' | 'close' | 'tap' = pcdFitType) => {
    setPcdMetricStd(mName);
    setPcdFitType(fit);
    if (mName === 'custom') return;
    const found = METRIC_HOLE_STANDARDS.find((m) => m.name === mName);
    if (found) {
      if (fit === 'clearance') setPcdHoleDia(found.dia);
      else if (fit === 'close') setPcdHoleDia(found.close);
      else if (fit === 'tap') setPcdHoleDia(found.tap);
    }
  };

  // 3. Quick Measure
  const qmAreaMm2 = qmLength * qmWidth;
  const qmPerimeterMm = 2 * (qmLength + qmWidth);
  const qmDiagonalMm = Math.sqrt(qmLength * qmLength + qmWidth * qmWidth);

  // Filtered List
  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FIELD_TOOLS.filter((tool) => {
      // Category filter
      if (activeCategory === 'favorites' && !favorites.includes(tool.id)) return false;
      if (activeCategory !== 'all' && activeCategory !== 'favorites' && tool.category !== activeCategory) return false;

      // Search filter
      if (!q) return true;
      const text = `${tool.nameEn} ${tool.nameTr} ${tool.descEn} ${tool.descTr} ${tool.keywords.join(' ')}`.toLowerCase();
      return text.includes(q);
    });
  }, [searchQuery, activeCategory, favorites]);

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] pb-24 px-3 py-4 sm:px-6 max-w-4xl mx-auto space-y-4">
      <div className="rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--cyan)]">AluCalc Field</div>
            <h1 className="text-base sm:text-lg font-semibold font-tech text-[var(--ink)]">
              {t12(language, 'Shop-floor engineering tools', 'Atölye & saha mühendislik araçları')}
            </h1>
            <p className="text-[11px] text-[var(--alu-dim)] mt-0.5">
              {t12(language, 'Gyro, ISO charts and tap-drill lookups — built for a phone in a glove.', 'Jiroskop, ISO tabloları ve kılavuz çapları — eldivenle telefonda.')}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-[var(--alu)]">
            <Wifi size={12} className={isOnline ? 'text-[var(--ok)]' : 'text-[var(--bad)]'} />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
            {batteryLevel !== null && <span>· {batteryLevel}%</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'spirit-level', label: t12(language, 'Level', 'Terazi') },
            { id: 'bolt-torque-screening', label: t12(language, 'Torque', 'Tork') },
            { id: 'tap-drill', label: t12(language, 'Tap/drill', 'Kılavuz') },
            { id: 'limits-fits', label: t12(language, 'ISO 286 Fits', 'Tolerans') },
            { id: 'cnc-feeds', label: t12(language, 'CNC Speeds', 'CNC Devir') },
            { id: 'unit-converter', label: t12(language, 'Units', 'Birim Çevir') },
            { id: 'thread-identifier', label: t12(language, 'Thread Ø', 'Diş Ø') },
            { id: 'device-torch', label: t12(language, 'Torch', 'Fener') },
          ].map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setActiveModal(q.id)}
              className="h-12 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] text-[var(--ink)] text-xs font-mono hover:border-[var(--cyan-dim)] active:scale-98 transition flex items-center justify-center font-bold"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* 📱 ANDROID & PWA HOME SCREEN WIDGET BANNER */}
        <div className="p-3 sm:p-4 rounded-[var(--radius-m)] border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[var(--bg-0)] to-blue-950/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center border border-[var(--cyan)]/40 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>{t12(language, 'AluCAD OS Android & PWA Widget', 'AluCAD OS Android & PWA Widget')}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">APK / PWA</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t12(language, 'Instant shop-floor HUD: Live 2-axis spirit level, VDI 2230 bolt torque, tap-drill, and unit converter directly on your home screen.', 'Atölye & saha araçları telefon ana ekranında: Canlı su terazisi, VDI 2230 cıvata torku, kılavuz ve birim çevirici tek dokunuşla.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveModal('widget-modal')}
              className="flex-1 sm:flex-none h-10 px-4 rounded-[var(--radius-s)] bg-[var(--cyan)] text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
            >
              <Smartphone size={14} />
              <span>{t12(language, 'Launch Widget', 'Widget\'ı Başlat')}</span>
            </button>
            <Link
              href="/field/widget"
              target="_blank"
              className="h-10 px-3 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-slate-300 font-mono text-xs flex items-center justify-center hover:text-white"
              title={t12(language, 'Open in New Tab', 'Yeni Sekmede Aç')}
            >
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        {/* ─── SEARCH & FILTER CHIPS ─── */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t12(language, 'Search tools... (level, PCD, decibel, bolt, sheet)', 'Ara... (su terazisi, PCD, desibel, cıvata, sac)')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
          {[
            { id: 'all', labelEn: 'All', labelTr: 'Tümü', icon: Wrench },
            { id: 'favorites', labelEn: 'Fav', labelTr: 'Favoriler', icon: Star },
            { id: 'sensors', labelEn: 'Sensors', labelTr: 'Sensörler', icon: Radio },
            { id: 'measure', labelEn: 'Measure', labelTr: 'Ölçüm & Geometri', icon: Ruler },
            { id: 'reference', labelEn: 'Reference', labelTr: 'Standartlar & Tablo', icon: FileText },
            { id: 'notes', labelEn: 'Notes', labelTr: 'Ses & Not', icon: FileSpreadsheet },
          ].map((cat) => {
            const Icon = cat.icon;
            const isCatActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as FieldCategory)}
                className={`flex items-center gap-1.5 min-h-10 px-3 py-2 rounded-[var(--radius-s)] border whitespace-nowrap text-xs font-mono ${
                  isCatActive
                    ? 'bg-[var(--cyan)] text-[var(--bg-0)] border-[var(--cyan)] font-semibold'
                    : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu)]'
                }`}
              >
                <Icon size={12} />
                <span>{t12(language, cat.labelEn, cat.labelTr)}{cat.id === 'favorites' ? ` (${favorites.length})` : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TOOLS GRID (34 TOOLS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isFav = favorites.includes(tool.id);

          return (
            <div
              key={tool.id}
              onClick={() => setActiveModal(tool.id)}
              className="flex items-center justify-between min-h-[72px] p-3 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] hover:border-[var(--cyan-dim)] cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 shadow-inner"
                  style={{
                    backgroundColor: `${tool.color}15`,
                    color: tool.color,
                    border: `1px solid ${tool.color}35`,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition-colors truncate">
                      {t12(language, tool.nameEn, tool.nameTr)}
                    </h3>
                    {tool.badge && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider shrink-0"
                        style={{
                          backgroundColor: `${tool.color}15`,
                          color: tool.color,
                          border: `1px solid ${tool.color}30`,
                        }}
                      >
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {t12(language, tool.descEn, tool.descTr)}
                  </p>
                </div>
              </div>

              {/* Star Bookmark / Favorite Button */}
              <button
                type="button"
                onClick={(e) => toggleFavorite(tool.id, e)}
                className={`p-2 rounded-lg transition shrink-0 ${
                  isFav ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600 hover:text-slate-300'
                }`}
                title={t12(language, 'Favorite', 'Favori')}
              >
                <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ─── INTERACTIVE MODALS FOR ALL 34 TOOLS ─── */}
      {/* ──────────────────────────────────────────────────────────── */}

      <FieldShopPanels active={activeModal} onClose={() => setActiveModal(null)} />

      {/* 📱 ANDROID & PWA HOME SCREEN WIDGET MODAL */}
      {activeModal === 'widget-modal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-[var(--bg-0)] p-4 shadow-2xl space-y-3 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Sparkles size={18} />
                <span>{t12(language, 'Android Home Screen Widget Preview', 'Android Ana Ekran Widget Önizleme')}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <FieldHomeScreenWidget isEmbedded={true} />

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-cyan-300 uppercase">
                📱 {t12(language, 'How to add to phone home screen:', 'Telefona Widget Olarak Ekleme:')}
              </div>
              <div>• <b>Android APK:</b> {t12(language, 'Launch app -> Pin shortcut or use Android Webview Widget to pin /field/widget.', 'Uygulamayı açın -> Ana Ekrana Ekle veya Webview Widget ile /field/widget adresini bağlayın.')}</div>
              <div>• <b>Chrome / PWA:</b> {t12(language, 'Tap menu (⋮) -> "Add to Home screen" / "Install App".', 'Tarayıcı menüsü (⋮) -> "Ana Ekrana Ekle" / "Uygulamayı Yükle".')}</div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/field/widget"
                target="_blank"
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={14} />
                <span>{t12(language, 'Open Standalone Widget URL', 'Tam Ekran Widget Aç')}</span>
              </Link>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
              >
                {t12(language, 'Close', 'Kapat')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. SPIRIT LEVEL MODAL */}
      {activeModal === 'spirit-level' && (
        <BubbleLevelModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* 2. CLINOMETER MODAL */}
      {activeModal === 'clinometer' && (
        <ClinometerModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* 3. GPS SURVEYOR MODAL */}
      {activeModal === 'gps-surveyor' && (
        <GPSSurveyorModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* 4. VIBE ANALYZER MODAL */}
      {activeModal === 'vibe-analyzer' && (
        <VibrationAnalyzerModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* 5. SOUND DECIBEL METER MODAL */}
      {activeModal === 'sound-meter' && (
        <SoundMeterModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* 6. QR SCANNER MODAL */}
      {activeModal === 'qr-barcode' && (
        <QRScannerModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* 7. TAP & DRILL CHART MODAL */}
      {activeModal === 'tap-drill' && (
        <TapChartModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* 8. HARDNESS CONVERTER MODAL */}
      {activeModal === 'hardness-converter' && (
        <HardnessConverterModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* 9. FIELD NOTES & VOICE MEMO MODAL */}
      {activeModal === 'field-notes' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <FileSpreadsheet size={18} />
                <span>{t12(language, 'Field Notes & Voice Memos', 'Saha Notları & Sesli Kayıt')}</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <VoiceMemoModule />
          </div>
        </div>
      )}

      {/* BOLT TORQUE SCREENING & CHECKLIST MODAL */}
      {activeModal === 'bolt-torque-screening' && (
        <BoltTorqueScreeningModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* O-RING CALIPER & GLAND MATCHER MODAL */}
      {activeModal === 'oring-caliper-matcher' && (
        <ORingCaliperModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* FIELD WORK ORDER & ENGINEERING NOTE MODAL */}
      {activeModal === 'field-work-order-share' && (
        <FieldWorkOrderModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* 10. MATERIAL WEIGHT CALCULATOR MODAL */}
      {activeModal === 'material-weight' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-purple-500/30 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Scale size={18} />
                <span>{t12(language, 'Material Weight Calculator', 'Malzeme & Profil Ağırlık Hesabı')}</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Calculated Big Result */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center space-y-1">
              <div className="text-[10px] font-mono text-purple-300 uppercase">
                {t12(language, 'NET CALCULATED WEIGHT', 'HESAPLANAN NET AĞIRLIK')}
              </div>
              <div className="text-4xl font-black font-mono text-white">
                {calculatedWeightKg} <span className="text-lg font-normal text-purple-400">kg</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {matType.toUpperCase()} (ρ = {DENSITIES[matType]} g/cm³)
              </div>
            </div>

            {/* ── Dynamic Isometric SVG Profile Visualizer ── */}
            <div className="w-full h-32 rounded-2xl bg-[var(--bg-0)] border border-purple-500/20 flex items-center justify-center p-2 overflow-hidden">
              <svg viewBox="0 0 300 120" className="w-full h-full">
                <defs>
                  <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e1035" />
                    <stop offset="50%" stopColor="#2e1854" />
                    <stop offset="100%" stopColor="#0f071c" />
                  </linearGradient>
                </defs>

                {matShape === 'plate' && (
                  <g className="animate-pulse" style={{ animationDuration: '3s' }}>
                    <polygon points="50,40 180,20 250,50 120,70" fill="url(#metalGrad)" stroke="#a855f7" strokeWidth="1.5" />
                    <polygon points="50,40 120,70 120,85 50,55" fill="#140a24" stroke="#a855f7" strokeWidth="1.5" />
                    <polygon points="120,70 250,50 250,65 120,85" fill="#0d0617" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="75" y="80" fill="#c084fc" fontSize="9" fontFamily="monospace">A: {dimA}mm</text>
                    <text x="195" y="78" fill="#c084fc" fontSize="9" fontFamily="monospace">B: {dimB}mm</text>
                    <text x="35" y="52" fill="#e9d5ff" fontSize="9" fontFamily="monospace">t: {dimThickness}mm</text>
                  </g>
                )}

                {matShape === 'round' && (
                  <g>
                    <ellipse cx="80" cy="60" rx="25" ry="40" fill="url(#metalGrad)" stroke="#a855f7" strokeWidth="1.5" />
                    <path d="M 80,20 L 220,20 C 240,20 240,100 220,100 L 80,100 Z" fill="url(#metalGrad)" stroke="#a855f7" strokeWidth="1.5" />
                    <ellipse cx="220" cy="60" rx="25" ry="40" fill="#0d0617" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="70" y="63" fill="#e9d5ff" fontSize="9" fontFamily="monospace">⌀{dimA}mm</text>
                    <text x="140" y="15" fill="#c084fc" fontSize="9" fontFamily="monospace">L: {dimLength}mm</text>
                  </g>
                )}

                {matShape === 'tube' && (
                  <g>
                    <ellipse cx="80" cy="60" rx="28" ry="42" fill="none" stroke="#a855f7" strokeWidth="2" />
                    <ellipse cx="80" cy="60" rx="18" ry="27" fill="#030206" stroke="#00e5ff" strokeWidth="1" strokeDasharray="3 2" />
                    <path d="M 80,18 L 220,18" stroke="#a855f7" strokeWidth="2" />
                    <path d="M 80,102 L 220,102" stroke="#a855f7" strokeWidth="2" />
                    <ellipse cx="220" cy="60" rx="28" ry="42" fill="#0d0617" stroke="#a855f7" strokeWidth="1.5" />
                    <ellipse cx="220" cy="60" rx="18" ry="27" fill="#030206" stroke="#00e5ff" strokeWidth="1.5" />
                    <text x="65" y="63" fill="#e9d5ff" fontSize="9" fontFamily="monospace">⌀{dimA}×t{dimThickness}</text>
                    <text x="140" y="14" fill="#c084fc" fontSize="9" fontFamily="monospace">L: {dimLength}mm</text>
                  </g>
                )}

                {matShape === 'rect_tube' && (
                  <g>
                    <rect x="40" y="20" width="70" height="80" rx="4" fill="url(#metalGrad)" stroke="#a855f7" strokeWidth="1.5" />
                    <rect x="50" y="30" width="50" height="60" rx="2" fill="#030206" stroke="#00e5ff" strokeWidth="1" strokeDasharray="3 2" />
                    <line x1="110" y1="20" x2="230" y2="20" stroke="#a855f7" strokeWidth="1.5" />
                    <line x1="110" y1="100" x2="230" y2="100" stroke="#a855f7" strokeWidth="1.5" />
                    <line x1="40" y1="100" x2="160" y2="100" stroke="#a855f7" strokeWidth="1.5" />
                    <polygon points="230,20 250,35 250,95 230,100" fill="#0d0617" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="65" y="63" fill="#e9d5ff" fontSize="9" fontFamily="monospace">{dimA}×{dimB}×t{dimThickness}</text>
                    <text x="160" y="15" fill="#c084fc" fontSize="9" fontFamily="monospace">L: {dimLength}mm</text>
                  </g>
                )}
              </svg>
            </div>

            {/* Material & Shape Picker */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400">{t12(language, 'Material', 'Malzeme')}</label>
                <select
                  value={matType}
                  onChange={(e) => setMatType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="al">{t12(language, 'Aluminum (2.70 g/cm³)', 'Alüminyum (2.70 g/cm³)')}</option>
                  <option value="steel">{t12(language, 'Steel (7.85 g/cm³)', 'Çelik (7.85 g/cm³)')}</option>
                  <option value="copper">{t12(language, 'Copper (8.96 g/cm³)', 'Bakır (8.96 g/cm³)')}</option>
                  <option value="brass">{t12(language, 'Brass (8.50 g/cm³)', 'Pirinç (8.50 g/cm³)')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">{t12(language, 'Geometry', 'Geometri')}</label>
                <select
                  value={matShape}
                  onChange={(e) => setMatShape(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="plate">{t12(language, 'Plate / Sheet', 'Plaka / Sac')}</option>
                  <option value="round">{t12(language, 'Round Bar', 'Dolu Mil / Çubuk')}</option>
                  <option value="tube">{t12(language, 'Round Tube', 'Yuvarlak Boru')}</option>
                  <option value="rect_tube">{t12(language, 'Rectangular Tube', 'Kutu Profil')}</option>
                </select>
              </div>
            </div>

            {/* Dimensional Inputs */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400">
                  {matShape === 'round' || matShape === 'tube'
                    ? t12(language, 'Outer Dia (mm)', 'Dış Çap (mm)')
                    : t12(language, 'Width A (mm)', 'Genişlik A (mm)')}
                </label>
                <input
                  type="number"
                  value={dimA}
                  onChange={(e) => setDimA(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-black border border-white/10 text-white"
                />
              </div>

              {matShape !== 'round' && (
                <div className="space-y-1">
                  <label className="text-slate-400">
                    {matShape === 'plate'
                      ? t12(language, 'Length B (mm)', 'Boy B (mm)')
                      : t12(language, 'Height B (mm)', 'Yükseklik B (mm)')}
                  </label>
                  <input
                    type="number"
                    value={dimB}
                    onChange={(e) => setDimB(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-black border border-white/10 text-white"
                  />
                </div>
              )}

              {matShape !== 'round' && (
                <div className="space-y-1">
                  <label className="text-slate-400">{t12(language, 'Thickness t (mm)', 'Et Kalınlığı t (mm)')}</label>
                  <input
                    type="number"
                    value={dimThickness}
                    onChange={(e) => setDimThickness(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-black border border-white/10 text-white"
                  />
                </div>
              )}

              {matShape !== 'plate' && (
                <div className="space-y-1">
                  <label className="text-slate-400">{t12(language, 'Length L (mm)', 'Profil Boyu L (mm)')}</label>
                  <input
                    type="number"
                    value={dimLength}
                    onChange={(e) => setDimLength(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-black border border-white/10 text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11. BOLT CIRCLE PCD MODAL (ADVANCED INTERACTIVE BLUEPRINT) */}
      {activeModal === 'bolt-circle-pcd' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-amber-500/30 bg-[var(--bg-0)] p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <CircleDot size={18} className="text-amber-400 animate-spin-slow" />
                </div>
                <div>
                  <div className="text-white font-bold">{t12(language, 'Bolt Circle PCD Generator', 'Flanş Delik Eksen (PCD) Jeneratörü')}</div>
                  <div className="text-[10px] text-amber-400/80 font-mono">{t12(language, 'Interactive CNC & Caliper Coordinator', 'İnteraktif CNC & Kumpas Koordinatörü')}</div>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Dimensional Inputs & Metric Standards Selector */}
            <div className="space-y-3">
              {/* Metric Standard Fastener & Thread Selector (M1 - M100) */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-black to-amber-950/30 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
                    <Sliders size={14} />
                    <span>{t12(language, 'Metric Hole Standards (M1 - M100)', 'Metrik Standart Delik (M1 - M100)')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">ISO 273 / DIN 13</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">{t12(language, 'Metric Thread / Hole', 'Metrik Vida / Delik Seçimi')}</label>
                    <select
                      value={pcdMetricStd}
                      onChange={(e) => handleMetricSelect(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black border border-cyan-500/40 text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                    >
                      <option value="custom">{t12(language, '⚙️ Custom Diameter (mm)', '⚙️ Özel Çap (Custom mm)')}</option>
                      {METRIC_HOLE_STANDARDS.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} — ({t12(language, 'Clearance', 'Boşluk')}: ⌀{m.dia}mm | {t12(language, 'Tap', 'Kılavuz')}: ⌀{m.tap}mm)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">{t12(language, 'Hole Fit Type', 'Delik Tipi & Tolerans')}</label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => handleMetricSelect(pcdMetricStd, 'clearance')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all truncate ${
                          pcdFitType === 'clearance'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t12(language, 'Normal', 'Normal')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMetricSelect(pcdMetricStd, 'close')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all truncate ${
                          pcdFitType === 'close'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t12(language, 'Close', 'Sıkı')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMetricSelect(pcdMetricStd, 'tap')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all truncate ${
                          pcdFitType === 'tap'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t12(language, 'Tap', 'Kılavuz')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensional Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">{t12(language, 'PCD Dia (mm)', 'PCD Çapı (mm)')}</label>
                  <input
                    type="number"
                    value={pcdDiameter}
                    onChange={(e) => setPcdDiameter(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">{t12(language, 'Holes (N)', 'Delik Sayısı (N)')}</label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={pcdHoleCount}
                    onChange={(e) => {
                      const val = Math.min(64, Math.max(2, Number(e.target.value)));
                      setPcdHoleCount(val);
                      if (selectedHoleIdx > val) setSelectedHoleIdx(1);
                    }}
                    className="w-full p-2 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">{t12(language, 'Start Angle', 'Başlangıç Açısı')}</label>
                  <input
                    type="number"
                    value={pcdStartAngle}
                    onChange={(e) => setPcdStartAngle(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">{t12(language, 'Hole Dia (mm)', 'Delik Çapı (mm)')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pcdHoleDia}
                    onChange={(e) => {
                      setPcdHoleDia(Math.max(0.2, Number(e.target.value)));
                      setPcdMetricStd('custom');
                    }}
                    className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* ── REAL-TIME COLLISION & PROXIMITY SAFETY AUDIT BANNER ── */}
            {isCollision ? (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/50 flex items-start gap-2.5 text-rose-300 text-xs font-mono animate-pulse">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-black text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🚨 {t12(language, 'CRITICAL HOLE COLLISION DETECTED!', 'KRİTİK DELİK ÇAKIŞMASI TESPİT EDİLDİ!')}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-300">
                    {t12(language, `Holes are intersecting! Center chord distance (${pcdChordDistance} mm) is less than hole diameter (${pcdHoleDia} mm)! Overlap: ${Math.abs(webThickness).toFixed(1)} mm. Part cannot be manufactured.`, `Delikler birbiriyle çakışıyor! Delikler arası kiriş mesafesi (${pcdChordDistance} mm) delik çapından (${pcdHoleDia} mm) küçük! Çakışma miktarı: ${Math.abs(webThickness).toFixed(1)} mm. Bu parçayı üretirseniz delikler birbirini keser ve parça imal edilemez.`)}
                  </p>
                  <div className="text-[10px] text-rose-400 font-bold">
                    {t12(language, '💡 Fix: Increase PCD diameter, decrease hole count, or choose smaller M fastener.', '💡 Çözüm: PCD Çapını büyütün, delik sayısını azaltın veya daha küçük delik çapı / M vidası seçin.')}
                  </div>
                </div>
              </div>
            ) : isTooClose ? (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/50 flex items-start gap-2.5 text-amber-300 text-xs font-mono ">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1">
                  <div className="font-black text-amber-200 uppercase tracking-wider">
                    <span>⚠️ {t12(language, 'WARNING: HOLES ARE TOO CLOSE!', 'UYARI: DELİKLER BİRBİRİNE ÇOK YAKIN!')}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-300">
                    {t12(language, `Remaining wall web thickness: ${webThickness.toFixed(1)} mm. Recommended safe minimum: ${minSafeWeb.toFixed(1)} mm. Risk of tear-out during drilling or shear failure under load!`, `Kalan et kalınlığı (Web): ${webThickness.toFixed(1)} mm. Güvenli minimum et kalınlığı: ${minSafeWeb.toFixed(1)} mm önerilir. Talaşlı imalat (delme) sırasında delikler arası etin yırtılması veya yük altında cıvata kesmesi meydana gelebilir!`)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  <span className="font-bold">{t12(language, 'Hole Spacing & Wall Thickness Safe', 'Delik Yerleşimi & Et Payı Güvenli')}</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400">{t12(language, 'Web', 'Et Kalınlığı (Web)')}: {webThickness.toFixed(1)} mm</span>
              </div>
            )}

            {/* ── High-Tech Live Inspector HUD ── */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[var(--bg-1)] to-cyan-950/30 border border-amber-500/30 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
              <div className="space-y-0.5">
                <div className="text-[9px] text-slate-400 uppercase">{t12(language, 'ACTIVE', 'SEÇİLİ')}</div>
                <div className="text-sm font-black text-amber-400">#{selectedHole.index}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] text-slate-400 uppercase">{t12(language, 'ANGLE θ', 'AÇI θ')}</div>
                <div className="text-sm font-black text-white">{selectedHole.angle}°</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] text-cyan-400 uppercase">X (mm)</div>
                <div className="text-sm font-black text-cyan-300">{selectedHole.x > 0 ? `+${selectedHole.x}` : selectedHole.x}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] text-emerald-400 uppercase">Y (mm)</div>
                <div className="text-sm font-black text-emerald-300">{selectedHole.y > 0 ? `+${selectedHole.y}` : selectedHole.y}</div>
              </div>
              <div className="space-y-0.5 col-span-1 sm:col-span-1">
                <div className="text-[9px] text-amber-300 uppercase">{t12(language, 'CHORD (c)', 'KİRİŞ (c)')}</div>
                <div className={`text-sm font-black ${isCollision ? 'text-rose-400' : isTooClose ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {pcdChordDistance} <span className="text-[9px] text-slate-400">mm</span>
                </div>
              </div>
              <div className="space-y-0.5 col-span-2 sm:col-span-1">
                <div className="text-[9px] text-slate-400 uppercase">{t12(language, 'STEP', 'ADIM AÇISI')}</div>
                <div className="text-sm font-black text-slate-200">Δ{pcdStepAngle}°</div>
              </div>
            </div>

            {/* ── Dynamic High-Precision SVG Blueprint Visualizer ── */}
            <div className="relative w-full h-72 sm:h-84 rounded-2xl bg-[var(--bg-0)] border border-amber-500/20 flex items-center justify-center overflow-hidden p-2 shadow-inner">
              {/* Radial backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),rgba(0,229,255,0.03),transparent_75%)] pointer-events-none" />

              {/* Quick tip overlay */}
              <div className="absolute top-2 left-3 text-[9px] font-mono text-slate-500 pointer-events-none flex items-center gap-2">
                <span>{t12(language, '💡 Click holes or table rows to inspect', '💡 Deliklere veya tablodaki satırlara tıklayarak inceleyin')}</span>
                {isCollision && <span className="text-rose-400 font-bold animate-pulse">🚨 {t12(language, 'COLLISION DETECTED', 'ÇAKIŞMA VAR')}</span>}
                {isTooClose && <span className="text-amber-400 font-bold">⚠️ {t12(language, 'TOO CLOSE', 'ÇOK YAKIN')}</span>}
              </div>

              <svg
                viewBox="-170 -170 340 340"
                className="w-full h-full select-none"
                style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))' }}
              >
                <defs>
                  {/* Flange Body Radial Gradient */}
                  <radialGradient id="pcdFlangeGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0f192e" />
                    <stop offset="60%" stopColor="#080e1a" />
                    <stop offset="95%" stopColor="#04070d" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </radialGradient>

                  {/* Hole Normal Metallic Gradient */}
                  <radialGradient id="pcdHoleGrad" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#020408" />
                    <stop offset="80%" stopColor="#0a1220" />
                    <stop offset="100%" stopColor="#00e5ff" />
                  </radialGradient>

                  {/* Hole Collision Gradient */}
                  <radialGradient id="collisionHoleGrad" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#4c0519" />
                    <stop offset="80%" stopColor="#1f0208" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </radialGradient>

                  {/* Active Selected Hole Glow Gradient */}
                  <radialGradient id="activeHoleGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="60%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </radialGradient>

                  {/* Glow Filters */}
                  <filter id="pcdGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="amberGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="roseGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* 1. Outer Flange Body */}
                <circle cx={0} cy={0} r={135} fill="url(#pcdFlangeGrad)" stroke={isCollision ? '#f43f5e' : 'rgba(245,158,11,0.4)'} strokeWidth="2" />
                <circle cx={0} cy={0} r={130} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 4" />
                <circle cx={0} cy={0} r={118} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                {/* 2. Center Hub / Center Bore & Keyway */}
                <circle cx={0} cy={0} r={32} fill="#02050b" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                <circle cx={0} cy={0} r={18} fill="#010307" stroke="rgba(0,229,255,0.4)" strokeWidth="1" strokeDasharray="3 3" />
                <rect x={-4} y={-35} width={8} height={6} fill="#02050b" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

                {/* 3. Coordinate Crosshairs (X, Y Axes) */}
                <line x1={-145} y1={0} x2={145} y2={0} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1={0} y1={-145} x2={0} y2={145} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 4" />

                {/* 4. Pitch Circle Diameter (PCD) Reference Circle */}
                <circle
                  cx={0}
                  cy={0}
                  r={82}
                  fill="none"
                  stroke={isCollision ? '#f43f5e' : isTooClose ? '#f59e0b' : '#00e5ff'}
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />

                {/* 5. Collision Boundary Ring connecting all holes */}
                {isCollision && (
                  <circle
                    cx={0}
                    cy={0}
                    r={82}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                    filter="url(#roseGlow)"
                    opacity="0.8"
                  />
                )}

                {/* 6. Start Angle Reference Datum Ray */}
                {(() => {
                  const startRad = (pcdStartAngle * Math.PI) / 180;
                  const xEnd = 82 * Math.cos(startRad);
                  const yEnd = 82 * Math.sin(startRad);
                  return (
                    <line
                      x1={0}
                      y1={0}
                      x2={xEnd}
                      y2={yEnd}
                      stroke="rgba(245,158,11,0.6)"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                  );
                })()}

                {/* 7. Active Hole Interactive Laser Ray & Projections */}
                {(() => {
                  const activeAngleRad = (selectedHole.angle * Math.PI) / 180;
                  const activeSvgX = 82 * Math.cos(activeAngleRad);
                  const activeSvgY = 82 * Math.sin(activeAngleRad);

                  return (
                    <g>
                      <line
                        x1={0}
                        y1={0}
                        x2={activeSvgX}
                        y2={activeSvgY}
                        stroke={isCollision ? '#f43f5e' : '#f59e0b'}
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        filter="url(#amberGlow)"
                      />
                      <line
                        x1={activeSvgX}
                        y1={0}
                        x2={activeSvgX}
                        y2={activeSvgY}
                        stroke="#00e5ff"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.8"
                      />
                      <line
                        x1={0}
                        y1={activeSvgY}
                        x2={activeSvgX}
                        y2={activeSvgY}
                        stroke="#10b981"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.8"
                      />
                    </g>
                  );
                })()}

                {/* 8. Interactive Clickable Bolt Holes on the PCD with Dynamic Font & Badges */}
                {pcdCoordinates.map((c) => {
                  const angleRad = (c.angle * Math.PI) / 180;
                  const svgX = 82 * Math.cos(angleRad);
                  const svgY = 82 * Math.sin(angleRad);
                  const isSelected = c.index === selectedHoleIdx;

                  // Dynamic hole visual size proportional to real diameter
                  const visualHoleR = Math.max(4, Math.min(14, (pcdHoleDia / (pcdDiameter || 100)) * 70 + 4));

                  // Label radial positioning
                  const labelR = 106;
                  const labelX = labelR * Math.cos(angleRad);
                  const labelY = labelR * Math.sin(angleRad);

                  return (
                    <g
                      key={c.index}
                      onClick={() => setSelectedHoleIdx(c.index)}
                      className="cursor-pointer group"
                    >
                      {/* Active Hole Radar Selection Highlight */}
                      {isSelected && (
                        <circle
                          cx={svgX}
                          cy={svgY}
                          r={visualHoleR + 5}
                          fill="none"
                          stroke={isCollision ? '#f43f5e' : '#f59e0b'}
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          filter="url(#amberGlow)"
                        />
                      )}

                      {/* Outer Chamfer & Bore */}
                      <circle
                        cx={svgX}
                        cy={svgY}
                        r={visualHoleR + (isSelected ? 3 : 1.5)}
                        fill={isCollision ? 'url(#collisionHoleGrad)' : isSelected ? '#17223b' : '#0a1020'}
                        stroke={isCollision ? '#f43f5e' : isSelected ? '#f59e0b' : '#00e5ff'}
                        strokeWidth={isSelected || isCollision ? 2.5 : 1.5}
                        filter={isCollision ? 'url(#roseGlow)' : isSelected ? 'url(#amberGlow)' : 'url(#pcdGlow)'}
                      />

                      {/* Inner Through Hole */}
                      <circle
                        cx={svgX}
                        cy={svgY}
                        r={visualHoleR * 0.55}
                        fill="#020409"
                        stroke={isCollision ? '#f43f5e' : isSelected ? '#f59e0b' : 'rgba(255,255,255,0.7)'}
                        strokeWidth={1}
                      />

                      {/* Hole Center Target Dot */}
                      <circle
                        cx={svgX}
                        cy={svgY}
                        r={1.8}
                        fill={isCollision ? '#f43f5e' : isSelected ? '#00e5ff' : '#f59e0b'}
                      />

                      {/* Radial Outward Dynamic Callout Label */}
                      <g>
                        <rect
                          x={labelX - dynamicBadgeW / 2}
                          y={labelY - dynamicBadgeH / 2}
                          width={dynamicBadgeW}
                          height={dynamicBadgeH}
                          rx={3}
                          fill={isCollision ? '#4c0519' : isSelected ? '#f59e0b' : '#080d1a'}
                          stroke={isCollision ? '#f43f5e' : isSelected ? '#f59e0b' : 'rgba(255,255,255,0.3)'}
                          strokeWidth={isSelected || isCollision ? 1.5 : 1}
                        />
                        <text
                          x={labelX}
                          y={labelY + 0.5}
                          fill={isCollision ? '#ffffff' : isSelected ? '#000000' : '#00e5ff'}
                          fontSize={dynamicFontSize}
                          fontWeight="900"
                          fontFamily="monospace"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          #{c.index}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Center Datum Point */}
                <circle cx={0} cy={0} r={3} fill="#f59e0b" />
                <circle cx={0} cy={0} r={7} fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />

                {/* SVG Footer Annotation */}
                <text x={0} y={152} fill="rgba(255,255,255,0.6)" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  PCD ⌀{pcdDiameter}mm · {pcdHoleCount}×⌀{pcdHoleDia}mm {pcdMetricStd !== 'custom' ? `(${pcdMetricStd})` : ''} @ {pcdStartAngle}°
                </text>
              </svg>
            </div>

            {/* (X, Y) Coordinate Interactive Table */}
            <div className="rounded-2xl border border-white/10 bg-black/60 p-3 space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto">
              <div className="grid grid-cols-5 font-bold text-amber-400 border-b border-white/10 pb-1.5 text-[10px] uppercase">
                <span>{t12(language, 'NUM', 'NO')}</span>
                <span>{t12(language, 'ANGLE', 'AÇI θ')}</span>
                <span>X (mm)</span>
                <span>Y (mm)</span>
                <span className="text-right">{t12(language, 'STATUS', 'DURUM')}</span>
              </div>
              {pcdCoordinates.map((c) => {
                const isSelected = c.index === selectedHoleIdx;
                return (
                  <div
                    key={c.index}
                    onClick={() => setSelectedHoleIdx(c.index)}
                    className={`grid grid-cols-5 py-1.5 px-2 rounded-xl text-[11px] cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border border-amber-500/50 text-white font-bold '
                        : 'text-slate-300 hover:bg-cyan-500/10 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className={isSelected ? 'text-amber-400 font-black' : 'text-amber-400/80 font-bold'}>
                      #{c.index}
                    </span>
                    <span>{c.angle}°</span>
                    <span className="text-cyan-400 font-bold">{c.x > 0 ? `+${c.x}` : c.x}</span>
                    <span className="text-emerald-400 font-bold">{c.y > 0 ? `+${c.y}` : c.y}</span>
                    <span className="text-right text-[10px]">
                      {isSelected ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold">
                          {t12(language, 'ACTIVE', 'SEÇİLİ')}
                        </span>
                      ) : (
                        <span className="text-slate-500">{t12(language, 'Select', 'Seç')}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Action Buttons (CNC G-Code / CSV) */}
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  const gcode = `(--- BOLT CIRCLE PCD G-CODE ---)\n(PCD: ${pcdDiameter}mm, HOLES: ${pcdHoleCount}, DIA: ${pcdHoleDia}mm)\n(CHORD: ${pcdChordDistance}mm, STEP: ${pcdStepAngle} DEG)\nG90 G54 G00 X0. Y0.\nG43 H1 Z50. M08\nS1200 M03\nG81 Z-15.0 R2.0 F120.\n${pcdCoordinates.map(c => `X${c.x > 0 ? '+' : ''}${c.x.toFixed(3)} Y${c.y > 0 ? '+' : ''}${c.y.toFixed(3)}`).join('\n')}\nG80\nM09\nG00 Z100.\nM30`;
                  navigator.clipboard.writeText(gcode);
                  setCopiedGCode(true);
                  setTimeout(() => setCopiedGCode(false), 2500);
                }}
                className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 text-cyan-300 font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>{copiedGCode ? (t12(language, '✓ G-Code Copied!', '✓ G-Code Kopyalandı!')) : (t12(language, '📋 Copy CNC G-Code (G81)', '📋 CNC G-Code (G81) Kopyala'))}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const csv = `Hole,Angle_deg,X_mm,Y_mm\n${pcdCoordinates.map(c => `${c.index},${c.angle},${c.x},${c.y}`).join('\n')}`;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `bolt_circle_pcd_${pcdDiameter}mm.csv`;
                  a.click();
                }}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>{t12(language, '💾 Export CSV Table', '💾 CSV Tablo İndir')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. QUICK MEASURE MODAL */}
      {activeModal === 'quick-measure' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Ruler size={18} />
                <span>{t12(language, 'Quick Measure & Geometry', 'Hızlı Geometri & Alan Hesabı')}</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400">{t12(language, 'Length L (mm)', 'Uzunluk L (mm)')}</label>
                <input
                  type="number"
                  value={qmLength}
                  onChange={(e) => setQmLength(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">{t12(language, 'Width W (mm)', 'Genişlik W (mm)')}</label>
                <input
                  type="number"
                  value={qmWidth}
                  onChange={(e) => setQmWidth(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/20">
                <div className="text-[9px] text-slate-500 uppercase">{t12(language, 'AREA (m²)', 'ALAN (m²)')}</div>
                <div className="text-emerald-400 font-bold">{(qmAreaMm2 / 1000000).toFixed(4)}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/20">
                <div className="text-[9px] text-slate-500 uppercase">{t12(language, 'PERIMETER (mm)', 'ÇEVRE (mm)')}</div>
                <div className="text-cyan-400 font-bold">{qmPerimeterMm}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/20">
                <div className="text-[9px] text-slate-500 uppercase">{t12(language, 'DIAGONAL (mm)', 'KÖŞEGEN (mm)')}</div>
                <div className="text-amber-400 font-bold">{qmDiagonalMm.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. STOPWATCH MODAL */}
      {activeModal === 'stopwatch' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-sky-500/30 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Timer size={18} />
                <span>{t12(language, 'Stopwatch & Lap Timer', 'Saha Kronometresi')}</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Time Display */}
            <div className="p-6 rounded-2xl bg-black/60 border border-sky-500/20 font-mono">
              <div className="text-4xl font-black text-white tracking-wider">
                {Math.floor(stopwatchTime / 60000)
                  .toString()
                  .padStart(2, '0')}
                :
                {Math.floor((stopwatchTime % 60000) / 1000)
                  .toString()
                  .padStart(2, '0')}
                .
                <span className="text-sky-400 text-2xl">
                  {Math.floor((stopwatchTime % 1000) / 10)
                    .toString()
                    .padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStopwatchRunning(!stopwatchRunning)}
                className={`flex-1 py-3 rounded-xl font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 ${
                  stopwatchRunning
                    ? 'bg-red-500 text-white'
                    : 'bg-sky-500 text-black font-black'
                }`}
              >
                {stopwatchRunning ? <Pause size={14} /> : <Play size={14} />}
                <span>{stopwatchRunning ? (t12(language, 'Stop', 'Durdur')) : (t12(language, 'Start', 'Başlat'))}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStopwatchRunning(false);
                  setStopwatchTime(0);
                  setLaps([]);
                }}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-mono text-xs hover:bg-white/10 transition"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. FLASHLIGHT TOGGLE ACTION */}
      {activeModal === 'device-torch' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-yellow-500/30 bg-[var(--bg-0)] p-6 shadow-2xl space-y-5 text-center">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                <Flashlight size={18} />
                <span>{t12(language, 'Hardware Torch', 'Muayene Feneri')}</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFlashlight}
              className={`h-24 w-24 mx-auto rounded-full border-2 transition-all flex items-center justify-center ${
                torchActive
                  ? 'bg-yellow-400 border-white text-black scale-110'
                  : 'bg-white/5 border-white/15 text-slate-400 hover:text-white'
              }`}
            >
              <Flashlight size={36} />
            </button>

            <div className="text-xs font-mono text-slate-300">
              {torchActive ? (t12(language, 'TORCH ACTIVE', 'FENER AÇIK')) : (t12(language, 'TAP TO ACTIVATE', 'AÇMAK İÇİN DOKUNUN'))}
            </div>
          </div>
        </div>
      )}

      {/* 15. UNIFIED SENSOR HUB MODAL */}
      {activeModal === 'sensor-hub' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-indigo-500/30 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Radio size={18} />
                <span>{t12(language, 'Unified Sensor Hub', 'Merkezi Sensör Paneli (HUD)')}</span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <div className="text-[9px] text-slate-500">PITCH (X)</div>
                <div className="text-cyan-400 font-bold">{sensorValues.pitch}°</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <div className="text-[9px] text-slate-500">ROLL (Y)</div>
                <div className="text-sky-400 font-bold">{sensorValues.roll}°</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <div className="text-[9px] text-slate-500">YAW (Z)</div>
                <div className="text-emerald-400 font-bold">{sensorValues.yaw}°</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                <div className="text-[9px] text-slate-500">G-FORCE</div>
                <div className="text-purple-400 font-bold">{sensorValues.accelTotal} g</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PIPE & FLANGE SIZING MODAL ─── */}
      {activeModal === 'pipe-flange' && (() => {
        const curPipe = PIPE_DATA[pipeDn] || PIPE_DATA.DN50;
        const wall = (curPipe as any)[pipeSch] || curPipe.sch40;
        const idMm = Number((curPipe.od - 2 * wall).toFixed(2));
        const steelDensity = 7.85; // g/cm3
        const steelWeightKgM = Number(((Math.PI / 4) * (curPipe.od * curPipe.od - idMm * idMm) * (steelDensity / 1000)).toFixed(2));
        const waterWeightKgM = Number(((Math.PI / 4) * (idMm * idMm) * (1.0 / 1000)).toFixed(2));
        const totalWeightKgM = Number((steelWeightKgM + waterWeightKgM).toFixed(2));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-cyan-500/40 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center border border-[var(--cyan)]/40">
                    <CircleDot size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{t12(language, 'Pipe & Flange Sizing', 'Boru & Flanş Standartları')}</h3>
                    <p className="text-[10px] text-cyan-400 font-mono">ASME B36.10M · EN 10220 · DIN 2448</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {/* Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Pipe Size (DN / NPS)', 'Boru Çapı (DN / NPS)')}</label>
                  <select
                    value={pipeDn}
                    onChange={(e) => setPipeDn(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                  >
                    {Object.keys(PIPE_DATA).map((k) => (
                      <option key={k} value={k}>{PIPE_DATA[k].name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Schedule (Thickness)', 'Et Kalınlığı Serisi')}</label>
                  <select
                    value={pipeSch}
                    onChange={(e) => setPipeSch(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                  >
                    <option value="sch10">Schedule 10 (Light)</option>
                    <option value="sch40">Schedule 40 (Standard)</option>
                    <option value="sch80">Schedule 80 (Extra Strong)</option>
                    <option value="sch160">Schedule 160 (High Pressure)</option>
                  </select>
                </div>
              </div>

              {/* Geometry HUD Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">{t12(language, 'Outer Dia (OD)', 'Dış Çap (OD)')}</div>
                  <div className="text-sm font-black text-cyan-400 font-mono mt-0.5">{curPipe.od} mm</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">{t12(language, 'Wall (t)', 'Et Kalınlığı (t)')}</div>
                  <div className="text-sm font-black text-white font-mono mt-0.5">{wall} mm</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">{t12(language, 'Inner Dia (ID)', 'İç Çap (ID)')}</div>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">{idMm} mm</div>
                </div>
              </div>

              {/* Weight Breakdown */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-cyan-950/30 border border-cyan-500/20 space-y-2">
                <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase flex justify-between">
                  <span>{t12(language, 'Linear Weight (per meter)', 'Birim Metretül Ağırlıkları')}</span>
                  <span>{curPipe.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[9px]">{t12(language, 'Steel Pipe:', 'Çelik Boru:')}</span>
                    <span className="font-bold text-white">{steelWeightKgM} kg/m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">{t12(language, 'Water Filled:', 'Su Hacmi:')}</span>
                    <span className="font-bold text-sky-300">{waterWeightKgM} kg/m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">{t12(language, 'Total (Full):', 'Toplam (Dolu):')}</span>
                    <span className="font-black text-emerald-400">{totalWeightKgM} kg/m</span>
                  </div>
                </div>
              </div>

              {/* Standard Flange Specs */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs font-mono">
                <div className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <span>🔩 {t12(language, 'EN 1092-1 PN16 Flange Compatibility', 'Uyumlu EN 1092-1 PN16 Flanş Ölçüleri')}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300">
                  <div><span className="text-slate-500">PCD:</span> <span className="font-bold text-white">{curPipe.pn16_pcd} mm</span></div>
                  <div><span className="text-slate-500">{t12(language, 'Holes:', 'Delik:')}</span> <span className="font-bold text-white">{curPipe.pn16_holes}x</span></div>
                  <div><span className="text-slate-500">{t12(language, 'Bolt:', 'Cıvata:')}</span> <span className="font-bold text-cyan-300">{curPipe.pn16_bolt}</span></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Pipe: ${curPipe.name}, OD: ${curPipe.od}mm, ID: ${idMm}mm, Wall: ${wall}mm (${pipeSch.toUpperCase()}), Steel Weight: ${steelWeightKgM} kg/m, Water: ${waterWeightKgM} kg/m, Total: ${totalWeightKgM} kg/m, Flange PCD: ${curPipe.pn16_pcd}mm (${curPipe.pn16_holes}x ${curPipe.pn16_bolt})`;
                    navigator.clipboard.writeText(text);
                    alert(t12(language, 'Pipe specs copied to clipboard!', 'Boru ölçüleri kopyalandı!'));
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Copy size={14} />
                  <span>{t12(language, 'Copy Specs', 'Ölçüleri Kopyala')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
                >
                  {t12(language, 'Close', 'Kapat')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── CABLE SIZING & VOLTAGE DROP MODAL ─── */}
      {activeModal === 'voltage-drop' && (() => {
        const rho = vdMaterial === 'cu' ? 0.0175 : 0.028; // ohm*mm2/m
        const is1Ph = vdVoltage === '230';
        const nominalV = is1Ph ? 230 : 400;
        const factor = is1Ph ? 2 : Math.sqrt(3);
        const deltaU = (factor * vdLength * vdCurrent * rho * vdCosPhi) / vdSection;
        const deltaUPct = (deltaU / nominalV) * 100;
        const resistance = (factor * vdLength * rho) / vdSection;
        const powerLossW = (is1Ph ? 2 : 3) * (vdCurrent * vdCurrent) * ((vdLength * rho) / vdSection);
        const isSafe = deltaUPct <= 3.0;
        const isAcceptable = deltaUPct <= 5.0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-amber-500/40 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center border border-[var(--cyan)]/40">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{t12(language, 'Cable Sizing & Voltage Drop', 'Kablo Kesiti & Gerilim Düşümü')}</h3>
                    <p className="text-[10px] text-amber-400 font-mono">IEC 60364-5-52 · VDE 0100</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-400 uppercase">{t12(language, 'System', 'Şebeke')}</label>
                  <select
                    value={vdVoltage}
                    onChange={(e) => setVdVoltage(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs"
                  >
                    <option value="230">230V ({t12(language, '1-Phase', '1-Faz')})</option>
                    <option value="400">400V ({t12(language, '3-Phase', '3-Faz')})</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-400 uppercase">{t12(language, 'Conductor', 'İletken')}</label>
                  <select
                    value={vdMaterial}
                    onChange={(e) => setVdMaterial(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs"
                  >
                    <option value="cu">{t12(language, 'Copper (Cu)', 'Bakır (Cu)')}</option>
                    <option value="al">{t12(language, 'Aluminum (Al)', 'Alüminyum (Al)')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-400 uppercase">{t12(language, 'Size (mm²)', 'Kesit (mm²)')}</label>
                  <select
                    value={vdSection}
                    onChange={(e) => setVdSection(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs font-bold"
                  >
                    {[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240].map((s) => (
                      <option key={s} value={s}>{s} mm²</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-400 uppercase">cos φ</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="1.0"
                    value={vdCosPhi}
                    onChange={(e) => setVdCosPhi(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs text-center"
                  />
                </div>
              </div>

              {/* Sliders for Length & Current */}
              <div className="space-y-2.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">{t12(language, 'Cable Distance (L):', 'Kablo Mesafesi (L):')}</span>
                  <span className="font-black text-cyan-300">{vdLength} m</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={300}
                  value={vdLength}
                  onChange={(e) => setVdLength(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />

                <div className="flex justify-between text-xs font-mono mt-2">
                  <span className="text-slate-400">{t12(language, 'Load Current (I):', 'Çekilen Akım (I):')}</span>
                  <span className="font-black text-amber-300">{vdCurrent} A ({(vdCurrent * nominalV * (is1Ph ? 1 : Math.sqrt(3)) * vdCosPhi / 1000).toFixed(1)} kW)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={150}
                  value={vdCurrent}
                  onChange={(e) => setVdCurrent(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
              </div>

              {/* Result KPI Card */}
              <div className={`p-4 rounded-2xl border text-center transition-all ${
                isSafe
                  ? 'bg-emerald-950/30 border-emerald-500/40 '
                  : isAcceptable
                  ? 'bg-amber-950/30 border-amber-500/40 '
                  : 'bg-rose-950/40 border-rose-500/50 '
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400">{t12(language, 'Total Voltage Drop', 'Toplam Gerilim Düşümü')}</div>
                <div className="text-2xl font-black font-mono mt-1 text-white flex items-center justify-center gap-2">
                  <span>ΔU = {deltaU.toFixed(2)} V</span>
                  <span className={`text-base px-2 py-0.5 rounded-md ${isSafe ? 'bg-emerald-500/20 text-emerald-300' : isAcceptable ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    %{deltaUPct.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold mt-2">
                  {isSafe ? (
                    <span className="text-emerald-400">✅ {t12(language, 'OPTIMAL (≤ 3% Lighting & Power)', 'STANDARDA UYGUN (≤ %3 Aydınlatma & Güç)')}</span>
                  ) : isAcceptable ? (
                    <span className="text-amber-400">⚠️ {t12(language, 'ACCEPTABLE (≤ 5% Power Lines)', 'KABUL EDİLEBİLİR (≤ %5 Motor & Güç Hatları)')}</span>
                  ) : (
                    <span className="text-rose-400">❌ {t12(language, 'VOLTAGE DROP EXCEEDED! UPSIZE CABLE!', 'AŞIRI GERİLİM DÜŞÜMÜ! KESİTİ BÜYÜTÜN!')}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-400 uppercase block">{t12(language, 'Power Loss', 'Hat Güç Kaybı')}</span>
                  <span className="font-bold text-white">{powerLossW.toFixed(1)} W</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-400 uppercase block">{t12(language, 'Resistance (R)', 'Hat Direnci')}</span>
                  <span className="font-bold text-cyan-300">{resistance.toFixed(4)} Ω</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Cable: ${vdSection}mm² ${vdMaterial === 'cu' ? 'Cu' : 'Al'}, System: ${nominalV}V, Length: ${vdLength}m, Load: ${vdCurrent}A, Voltage Drop: ${deltaU.toFixed(2)}V (${deltaUPct.toFixed(2)}%), Loss: ${powerLossW.toFixed(1)}W`;
                    navigator.clipboard.writeText(text);
                    alert(t12(language, 'Cable calculation copied!', 'Kablo hesabı kopyalandı!'));
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Copy size={14} />
                  <span>{t12(language, 'Copy Calculation', 'Hesabı Kopyala')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
                >
                  {t12(language, 'Close', 'Kapat')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── HYDRAULIC & PNEUMATIC CYLINDER MODAL ─── */}
      {activeModal === 'cylinder-force' && (() => {
        const areaPiston = (Math.PI * Math.pow(cylBore / 10, 2)) / 4; // cm2
        const areaRod = (Math.PI * Math.pow(cylRod / 10, 2)) / 4; // cm2
        const areaAnnular = Math.max(0, areaPiston - areaRod); // cm2

        // Force in N: P(bar) * 10^5 * Area(m2) = P(bar) * 10 * Area(cm2)
        const pushForceN = cylPressure * 10 * areaPiston;
        const pullForceN = cylPressure * 10 * areaAnnular;
        const pushForceKg = pushForceN / 9.80665;
        const pullForceKg = pullForceN / 9.80665;
        const pushForceKN = pushForceN / 1000;
        const pullForceKN = pullForceN / 1000;

        // Flow Q (L/min) = Area(m2) * Speed(m/s) * 60 * 1000 = Area(cm2) * Speed(m/s) * 6
        const extFlowLmin = areaPiston * cylSpeed * 6;
        const retFlowLmin = areaAnnular * cylSpeed * 6;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-sky-500/40 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center border border-[var(--cyan)]/40">
                    <Gauge size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{t12(language, 'Cylinder Force & Flow', 'Hidrolik & Pnömatik Piston Hesabı')}</h3>
                    <p className="text-[10px] text-sky-400 font-mono">ISO 6020 · ISO 15552</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCylType('hydraulic');
                    setCylPressure(160);
                  }}
                  className={`py-2 rounded-lg font-bold transition-colors ${cylType === 'hydraulic' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  {t12(language, '💧 Hydraulic', '💧 Hidrolik (160 bar)')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCylType('pneumatic');
                    setCylPressure(6);
                  }}
                  className={`py-2 rounded-lg font-bold transition-colors ${cylType === 'pneumatic' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  {t12(language, '💨 Pneumatic', '💨 Pnömatik (6 bar)')}
                </button>
              </div>

              {/* Preset Combos */}
              <div className="space-y-1">
                <div className="text-[9px] font-mono text-slate-400 uppercase">{t12(language, 'Standard ISO Presets', 'Standart Piston / Mil Çapları')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { b: 40, r: 22 },
                    { b: 50, r: 28 },
                    { b: 63, r: 36 },
                    { b: 80, r: 45 },
                    { b: 100, r: 56 },
                    { b: 125, r: 70 },
                  ].map((p) => (
                    <button
                      key={p.b}
                      onClick={() => {
                        setCylBore(p.b);
                        setCylRod(p.r);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors ${cylBore === p.b ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold' : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25'}`}
                    >
                      Ø{p.b}/Ø{p.r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders & Inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Bore (D):', 'Piston Çapı (D):')} <span className="text-white font-bold">{cylBore} mm</span></label>
                  <input type="range" min={20} max={250} value={cylBore} onChange={(e) => setCylBore(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Rod (d):', 'Mil Çapı (d):')} <span className="text-white font-bold">{cylRod} mm</span></label>
                  <input type="range" min={10} max={cylBore - 5} value={cylRod} onChange={(e) => setCylRod(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Pressure:', 'Basınç (P):')} <span className="text-amber-300 font-bold">{cylPressure} bar</span></label>
                  <input type="range" min={1} max={cylType === 'hydraulic' ? 350 : 16} value={cylPressure} onChange={(e) => setCylPressure(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Speed (v):', 'Piston Hızı (v):')} <span className="text-cyan-300 font-bold">{cylSpeed} m/s</span></label>
                  <input type="range" step={0.05} min={0.05} max={1.0} value={cylSpeed} onChange={(e) => setCylSpeed(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
                </div>
              </div>

              {/* Results Cards */}
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
                  <div className="text-[9px] text-slate-400 uppercase">{t12(language, 'PUSH FORCE', 'İTME KUVVETİ (İLERİ)')}</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">{pushForceKN.toFixed(1)} kN</div>
                  <div className="text-xs text-slate-300">{Math.round(pushForceKg).toLocaleString()} kgf</div>
                  <div className="text-[10px] text-emerald-300/80 mt-1">{extFlowLmin.toFixed(1)} L/dk debi</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/40">
                  <div className="text-[9px] text-slate-400 uppercase">{t12(language, 'PULL FORCE', 'ÇEKME KUVVETİ (GERİ)')}</div>
                  <div className="text-xl font-black text-sky-400 mt-1">{pullForceKN.toFixed(1)} kN</div>
                  <div className="text-xs text-slate-300">{Math.round(pullForceKg).toLocaleString()} kgf</div>
                  <div className="text-[10px] text-sky-300/80 mt-1">{retFlowLmin.toFixed(1)} L/dk debi</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Cylinder: Ø${cylBore}/Ø${cylRod}mm @ ${cylPressure} bar | Push Force: ${pushForceKN.toFixed(1)} kN (${Math.round(pushForceKg)} kgf) | Pull Force: ${pullForceKN.toFixed(1)} kN (${Math.round(pullForceKg)} kgf) | Speed: ${cylSpeed} m/s | Q_ext: ${extFlowLmin.toFixed(1)} L/min, Q_ret: ${retFlowLmin.toFixed(1)} L/min`;
                    navigator.clipboard.writeText(text);
                    alert(t12(language, 'Cylinder specs copied!', 'Piston kuvvet hesabı kopyalandı!'));
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Copy size={14} />
                  <span>{t12(language, 'Copy Specs', 'Kuvvetleri Kopyala')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
                >
                  {t12(language, 'Close', 'Kapat')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── THERMAL EXPANSION & CLEARANCE MODAL ─── */}
      {activeModal === 'thermal-expansion' && (() => {
        const alphas: Record<string, { name: string; val: number }> = {
          al: { name: t12(language, 'Aluminum', 'Alüminyum (6060/6082)'), val: 23.0 },
          steel: { name: t12(language, 'Carbon Steel', 'Yapı Çeliği (S235/S355)'), val: 11.5 },
          ss304: { name: t12(language, 'Stainless Steel', 'Paslanmaz Çelik (304/316)'), val: 16.5 },
          copper: { name: t12(language, 'Copper', 'Bakır (Cu)'), val: 16.8 },
          brass: { name: t12(language, 'Brass', 'Pirinç (Ms58)'), val: 18.5 },
          pvc: { name: t12(language, 'PVC / Plastic', 'PVC / Polimer'), val: 80.0 },
        };

        const curAlpha = alphas[teMaterial] || alphas.al;
        const deltaT = Math.abs(teT2 - teT1);
        const deltaL = (teLength * curAlpha.val * 1e-6 * deltaT);
        const recSlottedHole = Math.ceil(deltaL * 1.5 + 2); // safety margin

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-orange-500/40 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center border border-[var(--cyan)]/40">
                    <Thermometer size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{t12(language, 'Thermal Expansion & Clearance', 'Termal Genleşme & Montaj Boşluğu')}</h3>
                    <p className="text-[10px] text-orange-400 font-mono">ΔL = L · α · ΔT</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {/* Material Selector */}
              <div>
                <label className="text-[9px] font-mono text-slate-400 uppercase">{t12(language, 'Material', 'Malzeme Türü')}</label>
                <select
                  value={teMaterial}
                  onChange={(e) => setTeMaterial(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-orange-400 outline-none"
                >
                  {Object.keys(alphas).map((k) => (
                    <option key={k} value={k}>{alphas[k].name} (α = {alphas[k].val} × 10⁻⁶ /°C)</option>
                  ))}
                </select>
              </div>

              {/* Inputs */}
              <div className="space-y-2 p-3 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Initial Length (L):', 'Profil / Parça Boyu (L):')}</span>
                  <span className="text-white font-bold">{teLength} mm ({(teLength / 1000).toFixed(2)} m)</span>
                </div>
                <input type="range" min={500} max={30000} step={500} value={teLength} onChange={(e) => setTeLength(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Min Temp (T1):', 'Min Sıcaklık (T1):')}</label>
                    <input type="number" value={teT1} onChange={(e) => setTeT1(Number(e.target.value))} className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-sky-300 font-bold text-center" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Max Temp (T2):', 'Max Sıcaklık (T2):')}</label>
                    <input type="number" value={teT2} onChange={(e) => setTeT2(Number(e.target.value))} className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-rose-300 font-bold text-center" />
                  </div>
                </div>
              </div>

              {/* Result KPI Card */}
              <div className="p-4 rounded-2xl bg-orange-950/30 border border-orange-500/40 text-center font-mono space-y-2">
                <div className="text-[10px] text-slate-400 uppercase">{t12(language, 'Total Expansion / Contraction', 'Toplam Uzama / Kısalma Payı')}</div>
                <div className="text-3xl font-black text-orange-400">ΔL = ±{deltaL.toFixed(2)} mm</div>
                <div className="text-xs text-slate-300">
                  {t12(language, `Temp Difference ΔT = ${deltaT} °C`, `Sıcaklık Farkı ΔT = ${deltaT} °C (${(deltaL / (teLength / 1000)).toFixed(2)} mm/metre)`)}
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-emerald-300 font-bold">
                  🔩 {t12(language, `Recommended Slotted Hole Play: Min ${recSlottedHole} mm`, `Önerilen Oval Delik / Derz Boşluğu: Min ${recSlottedHole} mm`)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Thermal Expansion: ${curAlpha.name} (L=${teLength}mm, ΔT=${deltaT}°C) -> ΔL = ${deltaL.toFixed(2)} mm | Min Slot/Gap: ${recSlottedHole} mm`;
                    navigator.clipboard.writeText(text);
                    alert(t12(language, 'Expansion calc copied!', 'Genleşme hesabı kopyalandı!'));
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Copy size={14} />
                  <span>{t12(language, 'Copy Specs', 'Hesabı Kopyala')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
                >
                  {t12(language, 'Close', 'Kapat')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── CRANE RIGGING & SLING ANGLE SAFETY MODAL ─── */}
      {activeModal === 'rigging-sling' && (() => {
        const rad = (slingAngle * Math.PI) / 180;
        const sinVal = Math.sin(rad);
        const tensionPerLegKg = slingWeight / (slingLegs * sinVal);
        const loadFactor = 1 / sinVal;

        const isSafe = slingAngle >= 60;
        const isCaution = slingAngle >= 45 && slingAngle < 60;
        const isDanger = slingAngle < 45;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-emerald-500/40 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center border border-[var(--cyan)]/40">
                    <Anchor size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{t12(language, 'Crane Rigging & Sling Angle', 'Sapan Açısı & Vinç Emniyeti')}</h3>
                    <p className="text-[10px] text-emerald-400 font-mono">OSHA 1910.184 · EN 1492</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-3 p-3 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Total Load (W):', 'Kaldırılacak Yük (W):')}</span>
                  <span className="text-white font-bold">{slingWeight.toLocaleString()} kg ({(slingWeight / 1000).toFixed(2)} Ton)</span>
                </div>
                <input type="range" min={100} max={25000} step={100} value={slingWeight} onChange={(e) => setSlingWeight(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Sling Legs', 'Sapan Kolu Sayısı')}</label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {[2, 3, 4].map((n) => (
                        <button
                          key={n}
                          onClick={() => setSlingLegs(n as any)}
                          className={`py-1.5 rounded-lg border text-center font-bold transition-colors ${slingLegs === n ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-emerald-400' : 'bg-black/60 border-white/15 text-slate-300'}`}
                        >
                          {n}x
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Sling Angle (α):', 'Yatay Sapan Açısı (α):')} <span className="text-amber-300 font-bold">{slingAngle}°</span></label>
                    <input type="range" min={20} max={90} step={5} value={slingAngle} onChange={(e) => setSlingAngle(Number(e.target.value))} className="w-full accent-[var(--cyan)] mt-2" />
                  </div>
                </div>
              </div>

              {/* KPI Results */}
              <div className={`p-4 rounded-2xl border text-center font-mono space-y-2 ${isSafe ? 'bg-emerald-950/30 border-emerald-500/40' : isCaution ? 'bg-amber-950/30 border-amber-500/40' : 'bg-rose-950/40 border-rose-500/50'}`}>
                <div className="text-[10px] uppercase text-slate-400">{t12(language, 'TENSION PER SLING LEG', 'SAPAN KOLU BAŞINA DÜŞEN GERİLME')}</div>
                <div className="text-3xl font-black text-white">{Math.round(tensionPerLegKg).toLocaleString()} kg</div>
                <div className="text-xs text-slate-300">
                  {t12(language, `Load Angle Factor: ${loadFactor.toFixed(3)}x`, `Açı Çarpan Faktörü: ${loadFactor.toFixed(3)}x (${slingAngle}°)`)}
                </div>
                <div className="text-xs font-bold pt-1">
                  {isSafe ? (
                    <span className="text-emerald-400">✅ {t12(language, 'SAFE & OPTIMAL (≥ 60°)', 'İDEAL VE EMNİYETLİ AÇI (≥ 60° Önerilen)')}</span>
                  ) : isCaution ? (
                    <span className="text-amber-400">⚠️ {t12(language, 'CAUTION! 41% TENSION INCREASE (45°-59°)', 'DİKKAT! GERİLME %41 ARTTI (45° - 59°)')}</span>
                  ) : (
                    <span className="text-rose-400">❌ {t12(language, 'CRITICAL HAZARD! DO NOT RIG UNDER 45°!', 'TEHLİKELİ VE YASAK AÇI! (< 45° KULLANMAYIN!)')}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Rigging: Load ${slingWeight}kg on ${slingLegs} legs @ ${slingAngle}° -> Tension per leg = ${Math.round(tensionPerLegKg)} kg (${loadFactor.toFixed(2)}x factor)`;
                    navigator.clipboard.writeText(text);
                    alert(t12(language, 'Rigging calc copied!', 'Sapan hesabı kopyalandı!'));
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Copy size={14} />
                  <span>{t12(language, 'Copy Specs', 'Hesabı Kopyala')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
                >
                  {t12(language, 'Close', 'Kapat')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── V-BELT & PULLEY CENTER DISTANCE MODAL ─── */}
      {activeModal === 'v-belt-calc' && (() => {
        const C = beltCenter;
        const d = beltD1;
        const D = beltD2;
        const pitchLength = 2 * C + (Math.PI / 2) * (D + d) + Math.pow(D - d, 2) / (4 * C);
        const contactAngleDeg = 180 - (2 * Math.asin(Math.abs(D - d) / (2 * C)) * 180) / Math.PI;
        const ratio = D / d;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-purple-500/40 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center border border-[var(--cyan)]/40">
                    <Disc size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{t12(language, 'V-Belt & Pulley Center', 'V-Kayış & Kasnak Eksen Mesafesi')}</h3>
                    <p className="text-[10px] text-purple-400 font-mono">DIN 2215 · ISO 4184</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-2.5 p-3 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Small Pulley (d1):', 'Küçük Kasnak (d1):')} <span className="text-white font-bold">{beltD1} mm</span></label>
                    <input type="range" min={40} max={300} value={beltD1} onChange={(e) => setBeltD1(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Large Pulley (d2):', 'Büyük Kasnak (d2):')} <span className="text-white font-bold">{beltD2} mm</span></label>
                    <input type="range" min={50} max={600} value={beltD2} onChange={(e) => setBeltD2(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t12(language, 'Center Distance (C):', 'Eksen Mesafesi (C):')}</span>
                    <span className="text-cyan-300 font-bold">{beltCenter} mm</span>
                  </div>
                  <input type="range" min={Math.round((beltD1 + beltD2) / 2 + 30)} max={1500} value={beltCenter} onChange={(e) => setBeltCenter(Number(e.target.value))} className="w-full accent-[var(--cyan)]" />
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                  <div className="text-[9px] text-slate-400 uppercase">{t12(language, 'Pitch Length (Lp)', 'Kayış Hatve Boyu (Lp)')}</div>
                  <div className="text-lg font-black text-purple-300 mt-1">{Math.round(pitchLength)} mm</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-slate-400 uppercase">{t12(language, 'Wrap Angle (β1)', 'Sarım Açısı (β1)')}</div>
                  <div className="text-lg font-black text-amber-300 mt-1">{contactAngleDeg.toFixed(1)}°</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-slate-400 uppercase">{t12(language, 'Speed Ratio (i)', 'Çevrim Oranı (i)')}</div>
                  <div className="text-lg font-black text-cyan-300 mt-1">1:{ratio.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `V-Belt: d1=${beltD1}mm, d2=${beltD2}mm, C=${beltCenter}mm -> Belt Pitch Length Lp=${Math.round(pitchLength)}mm, Wrap Angle=${contactAngleDeg.toFixed(1)}°, Ratio=1:${ratio.toFixed(2)}`;
                    navigator.clipboard.writeText(text);
                    alert(t12(language, 'Belt specs copied!', 'Kayış ölçüleri kopyalandı!'));
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Copy size={14} />
                  <span>{t12(language, 'Copy Specs', 'Ölçüleri Kopyala')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
                >
                  {t12(language, 'Close', 'Kapat')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── SHEET METAL BENDING (DIN 6935) MODAL ─── */}
      {activeModal === 'sheet-bending' && (() => {
        const rad = ((180 - sbAngle) * Math.PI) / 180;
        const BA = (Math.PI / 180) * (180 - sbAngle) * (sbRadius + sbKFactor * sbThickness);
        const SB = (sbRadius + sbThickness) * Math.tan(rad / 2);
        const BD = 2 * SB - BA;
        const blankSize = sbLeg1 + sbLeg2 - BD;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-pink-500/40 bg-[var(--bg-0)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--cyan-glow)] text-[var(--cyan)] flex items-center justify-center border border-[var(--cyan)]/40">
                    <Split size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{t12(language, 'Sheet Bending & Flat Pattern', 'Sac Büküm K-Faktörü & Açınım')}</h3>
                    <p className="text-[10px] text-pink-400 font-mono">DIN 6935 · ISO 7438</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Thickness (t)', 'Sac Kalınlığı (t)')}</label>
                  <input type="number" step="0.5" value={sbThickness} onChange={(e) => setSbThickness(Number(e.target.value))} className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-bold text-center" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Inner Radius (R)', 'İç Radyus (R)')}</label>
                  <input type="number" step="0.5" value={sbRadius} onChange={(e) => setSbRadius(Number(e.target.value))} className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-bold text-center" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Angle (θ)', 'Büküm Açısı (θ)')}</label>
                  <input type="number" value={sbAngle} onChange={(e) => setSbAngle(Number(e.target.value))} className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-amber-300 font-bold text-center" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'K-Factor (K)', 'K-Faktörü (K)')}</label>
                  <input type="number" step="0.02" min="0.2" max="0.5" value={sbKFactor} onChange={(e) => setSbKFactor(Number(e.target.value))} className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-cyan-300 font-bold text-center" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Leg 1 (L1)', 'Flanş 1 (L1)')}</label>
                  <input type="number" value={sbLeg1} onChange={(e) => setSbLeg1(Number(e.target.value))} className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-bold text-center" />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase">{t12(language, 'Leg 2 (L2)', 'Flanş 2 (L2)')}</label>
                  <input type="number" value={sbLeg2} onChange={(e) => setSbLeg2(Number(e.target.value))} className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-bold text-center" />
                </div>
              </div>

              {/* Results */}
              <div className="p-4 rounded-2xl bg-pink-950/30 border border-pink-500/40 font-mono text-center space-y-2">
                <div className="text-[10px] text-slate-400 uppercase">{t12(language, 'FLAT PATTERN BLANK SIZE', 'AÇINIM SAC BOYU (BLANK LENGTH)')}</div>
                <div className="text-3xl font-black text-pink-400">{blankSize.toFixed(2)} mm</div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[9px] text-slate-400 block uppercase">{t12(language, 'Bend Allowance (BA)', 'Büküm Payı (BA)')}</span>
                    <span className="font-bold text-white">{BA.toFixed(2)} mm</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[9px] text-slate-400 block uppercase">{t12(language, 'Bend Deduction (BD)', 'Büküm Kesintisi (BD)')}</span>
                    <span className="font-bold text-cyan-300">{BD.toFixed(2)} mm</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Sheet Bending: t=${sbThickness}mm, R=${sbRadius}mm, Angle=${sbAngle}°, K=${sbKFactor}, L1=${sbLeg1}mm, L2=${sbLeg2}mm -> Flat Blank=${blankSize.toFixed(2)}mm, BA=${BA.toFixed(2)}mm, BD=${BD.toFixed(2)}mm`;
                    navigator.clipboard.writeText(text);
                    alert(t12(language, 'Bending calc copied!', 'Sac açınım hesabı kopyalandı!'));
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-pink-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Copy size={14} />
                  <span>{t12(language, 'Copy Specs', 'Hesabı Kopyala')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
                >
                  {t12(language, 'Close', 'Kapat')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── PWA QUICK WIDGET & HOMESCREEN HELPER ─── */}
      <div className="p-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-slate-900 to-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cyan-glow)] text-[var(--cyan)]">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="font-bold text-white">{t12(language, 'Add Field Widget to Home Screen', 'Telefon Ana Ekranına Widget Olarak Ekle')}</div>
            <div className="text-[10px] text-slate-400">
              {t12(language, 'Tap "Add to Home Screen" in your browser to install as an instant offline widget.', 'Safari / Chrome menüsünden "Ana Ekrana Ekle" seçeneğiyle tek dokunuşla internetsiz de açın.')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
