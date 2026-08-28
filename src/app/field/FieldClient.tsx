'use client';

/**
 * AluCalc OS — Professional Field Engineering Suite (24+ Field Tools)
 * Route: /field
 * 
 * High-performance mobile & desktop field toolkit for engineers and technicians.
 * Integrates all 24 hardware & empirical field modules, offline storage,
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
  X
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

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
import { AppDownloadModal } from '@/components/modals/AppDownloadModal';

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
    id: 'android-apk',
    nameEn: 'Android APK & Wear OS',
    nameTr: 'Android APK & Saat İndir',
    descEn: 'Official signed APK downloads for Android & Wear OS watch',
    descTr: 'Telefon, tablet ve akıllı saat için resmi imzalı APK indirme',
    category: 'sensors',
    icon: Download,
    color: '#38bdf8',
    badge: 'APK v5.0',
    keywords: ['apk', 'android', 'wear os', 'saat', 'mobil', 'download', 'indir'],
  },
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
    id: 'color-sampler',
    nameEn: 'Color Sampler / RAL',
    nameTr: 'Renk & RAL Örnekleyici',
    descEn: 'Live camera RGB, HEX & RAL color picker',
    descTr: 'Kamera üzerinden anlık renk, HEX ve RAL ton tespiti',
    category: 'measure',
    icon: Pipette,
    color: '#ec4899',
    keywords: ['color', 'renk', 'ral', 'hex', 'rgb', 'sampler', 'eyedropper'],
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
    id: 'ambient-light',
    nameEn: 'Ambient Light (Lux)',
    nameTr: 'Işık Şiddeti (Lux)',
    descEn: 'Illuminance lux estimation for workstation safety',
    descTr: 'Çalışma alanı aydınlatma güvenlik seviyesi (Lux)',
    category: 'sensors',
    icon: Sun,
    color: '#eab308',
    badge: 'LUX',
    keywords: ['light', 'isik', 'lux', 'lumen', 'ambient', 'aydinlatma'],
  },
  {
    id: 'sensor-hub',
    nameEn: 'Unified Sensor Hub',
    nameTr: 'Merkezi Sensör Paneli',
    descEn: 'Orientation, motion, GPS & battery status in one HUD',
    descTr: 'Tüm donanım sensörlerinin tek ekranda canlı takibi',
    category: 'sensors',
    icon: Radio,
    color: '#6366f1',
    badge: 'ALL-IN-1',
    keywords: ['sensor', 'hub', 'telemetry', 'battery', 'panel', 'all sensors'],
  },
  {
    id: 'device-torch',
    nameEn: 'Device Flashlight',
    nameTr: 'Muayene Feneri (LED)',
    descEn: 'Hardware camera LED torch with strobe mode',
    descTr: 'Donanım kamera LED feneri ve flaş modu',
    category: 'sensors',
    icon: Flashlight,
    color: '#eab308',
    badge: 'TORCH',
    keywords: ['torch', 'fener', 'flashlight', 'led', 'isik'],
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
    id: 'sheet-bending',
    nameEn: 'Sheet Metal Bending',
    nameTr: 'Sac Büküm & Açınım (DIN 6935)',
    descEn: 'DIN 6935 K-factor, bend deduction & press tonnage',
    descTr: 'K-faktörü, büküm payı açınım boyu ve abkant pres tonajı',
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
  const tr = language === 'tr';

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
          alert(tr ? 'Cihaz donanım fenerini desteklemiyor.' : 'Hardware torch not supported.');
        }
      } else {
        if (torchStreamRef.current) {
          torchStreamRef.current.getTracks().forEach((t) => t.stop());
          torchStreamRef.current = null;
        }
        setTorchActive(false);
      }
    } catch {
      alert(tr ? 'Kamera feneri açılamadı.' : 'Could not activate torch.');
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
    <div className="w-full min-h-[calc(100vh-3.5rem)] pb-24 px-3 py-4 sm:px-6 max-w-4xl mx-auto space-y-4 select-none">
      {/* ─── TOP FIELD BRAND & STATUS TELEMETRY ─── */}
      <div className="rounded-2xl border border-white/10 bg-[#070b14]/90 p-4 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-md">
              <Smartphone size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span>ALUCALC</span>
                <span className="px-1 py-0.5 rounded text-[8px] bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">FIELD</span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white">
                {tr ? 'Saha Mühendislik Kiti' : 'Field Engineering Suite'}
              </h1>
            </div>
          </div>

          {/* Quick Telemetry Indicators */}
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setActiveModal('android-apk')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold transition shadow-sm"
            >
              <Download size={12} />
              <span>{tr ? 'APK / Saat İndir' : 'APK / Watch App'}</span>
            </button>

            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 border border-white/5 text-slate-300">
              <Wifi size={12} className={isOnline ? 'text-emerald-400' : 'text-red-400'} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {batteryLevel !== null && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 border border-white/5 text-slate-300">
                <Battery size={12} className={batteryLevel > 20 ? 'text-cyan-400' : 'text-amber-400'} />
                <span>{batteryLevel}%</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── SEARCH & FILTER CHIPS ─── */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr ? 'Ara... (su terazisi, PCD, desibel, cıvata, sac)' : 'Search tools... (level, PCD, decibel, bolt, sheet)'}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
          {[
            { id: 'all', labelEn: 'All Tools', labelTr: 'Tümü (24)', icon: Sparkles },
            { id: 'favorites', labelEn: `Fav (${favorites.length})`, labelTr: `Favoriler (${favorites.length})`, icon: Star },
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border whitespace-nowrap transition active:scale-95 ${
                  isCatActive
                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={12} />
                <span>{tr ? cat.labelTr : cat.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TOOLS GRID (24 TOOLS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isFav = favorites.includes(tool.id);

          return (
            <div
              key={tool.id}
              onClick={() => setActiveModal(tool.id)}
              className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#070c16]/80 hover:border-cyan-500/40 hover:bg-[#0a1020] transition-all cursor-pointer group active:scale-[0.98] shadow-md relative overflow-hidden"
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
                      {tr ? tool.nameTr : tool.nameEn}
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
                    {tr ? tool.descTr : tool.descEn}
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
                title="Favori"
              >
                <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ─── INTERACTIVE MODALS FOR ALL 24 TOOLS ─── */}
      {/* ──────────────────────────────────────────────────────────── */}

      {/* 0. ANDROID & WEAR OS APK DOWNLOAD MODAL */}
      {activeModal === 'android-apk' && (
        <AppDownloadModal isOpen={true} onClose={() => setActiveModal(null)} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-[#070b14] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <FileSpreadsheet size={18} />
                <span>{tr ? 'Saha Notları & Sesli Kayıt' : 'Field Notes & Voice Memos'}</span>
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

      {/* 10. MATERIAL WEIGHT CALCULATOR MODAL */}
      {activeModal === 'material-weight' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-purple-500/30 bg-[#070b14] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Scale size={18} />
                <span>{tr ? 'Malzeme & Profil Ağırlık Hesabı' : 'Material Weight Calculator'}</span>
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
                {tr ? 'HESAPLANAN NET AĞIRLIK' : 'NET CALCULATED WEIGHT'}
              </div>
              <div className="text-4xl font-black font-mono text-white">
                {calculatedWeightKg} <span className="text-lg font-normal text-purple-400">kg</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {matType.toUpperCase()} (ρ = {DENSITIES[matType]} g/cm³)
              </div>
            </div>

            {/* ── Dynamic Isometric SVG Profile Visualizer ── */}
            <div className="w-full h-32 rounded-2xl bg-[#040711] border border-purple-500/20 flex items-center justify-center p-2 overflow-hidden">
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
                <label className="text-slate-400">{tr ? 'Malzeme' : 'Material'}</label>
                <select
                  value={matType}
                  onChange={(e) => setMatType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="al">Alüminyum (2.70 g/cm³)</option>
                  <option value="steel">Çelik (7.85 g/cm³)</option>
                  <option value="copper">Bakır (8.96 g/cm³)</option>
                  <option value="brass">Pirinç (8.50 g/cm³)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">{tr ? 'Geometri' : 'Geometry'}</label>
                <select
                  value={matShape}
                  onChange={(e) => setMatShape(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="plate">{tr ? 'Plaka / Sac' : 'Plate / Sheet'}</option>
                  <option value="round">{tr ? 'Dolu Mil / Çubuk' : 'Round Bar'}</option>
                  <option value="tube">{tr ? 'Yuvarlak Boru' : 'Round Tube'}</option>
                  <option value="rect_tube">{tr ? 'Kutu Profil' : 'Rectangular Tube'}</option>
                </select>
              </div>
            </div>

            {/* Dimensional Inputs */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400">{matShape === 'round' || matShape === 'tube' ? 'Dış Çap (mm)' : 'Genişlik A (mm)'}</label>
                <input
                  type="number"
                  value={dimA}
                  onChange={(e) => setDimA(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-black border border-white/10 text-white"
                />
              </div>

              {matShape !== 'round' && (
                <div className="space-y-1">
                  <label className="text-slate-400">{matShape === 'plate' ? 'Boy B (mm)' : 'Yükseklik B (mm)'}</label>
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
                  <label className="text-slate-400">{tr ? 'Et Kalınlığı t (mm)' : 'Thickness t (mm)'}</label>
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
                  <label className="text-slate-400">{tr ? 'Profil Boyu L (mm)' : 'Length L (mm)'}</label>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-amber-500/30 bg-[#070b14] p-4 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.15)] space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <CircleDot size={18} className="text-amber-400 animate-spin-slow" />
                </div>
                <div>
                  <div className="text-white font-bold">{tr ? 'Flanş Delik Eksen (PCD) Jeneratörü' : 'Bolt Circle PCD Generator'}</div>
                  <div className="text-[10px] text-amber-400/80 font-mono">{tr ? 'İnteraktif CNC & Kumpas Koordinatörü' : 'Interactive CNC & Caliper Coordinator'}</div>
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
                    <span>{tr ? 'Metrik Standart Delik (M1 - M100)' : 'Metric Hole Standards (M1 - M100)'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">ISO 273 / DIN 13</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">{tr ? 'Metrik Vida / Delik Seçimi' : 'Metric Thread / Hole'}</label>
                    <select
                      value={pcdMetricStd}
                      onChange={(e) => handleMetricSelect(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black border border-cyan-500/40 text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                    >
                      <option value="custom">{tr ? '⚙️ Özel Çap (Custom mm)' : '⚙️ Custom Diameter (mm)'}</option>
                      {METRIC_HOLE_STANDARDS.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} — (Boşluk: ⌀{m.dia}mm | Kılavuz: ⌀{m.tap}mm)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">{tr ? 'Delik Tipi & Tolerans' : 'Hole Fit Type'}</label>
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
                        {tr ? 'Normal' : 'Normal'}
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
                        {tr ? 'Sıkı' : 'Close'}
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
                        {tr ? 'Kılavuz' : 'Tap'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimensional Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">{tr ? 'PCD Çapı (mm)' : 'PCD Dia (mm)'}</label>
                  <input
                    type="number"
                    value={pcdDiameter}
                    onChange={(e) => setPcdDiameter(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">{tr ? 'Delik Sayısı (N)' : 'Holes (N)'}</label>
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
                  <label className="text-slate-400 text-[11px]">{tr ? 'Başlangıç Açısı' : 'Start Angle'}</label>
                  <input
                    type="number"
                    value={pcdStartAngle}
                    onChange={(e) => setPcdStartAngle(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">{tr ? 'Delik Çapı (mm)' : 'Hole Dia (mm)'}</label>
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
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/50 flex items-start gap-2.5 text-rose-300 text-xs font-mono shadow-[0_0_25px_rgba(244,63,94,0.25)] animate-pulse">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-black text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🚨 {tr ? 'KRİTİK DELİK ÇAKIŞMASI TESPİT EDİLDİ!' : 'CRITICAL HOLE COLLISION DETECTED!'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-300">
                    {tr
                      ? `Delikler birbiriyle çakışıyor! Delikler arası kiriş mesafesi (${pcdChordDistance} mm) delik çapından (${pcdHoleDia} mm) küçük! Çakışma miktarı: ${Math.abs(webThickness).toFixed(1)} mm. Bu parçayı üretirseniz delikler birbirini keser ve parça imal edilemez.`
                      : `Holes are intersecting! Center chord distance (${pcdChordDistance} mm) is less than hole diameter (${pcdHoleDia} mm)! Overlap: ${Math.abs(webThickness).toFixed(1)} mm. Part cannot be manufactured.`}
                  </p>
                  <div className="text-[10px] text-rose-400 font-bold">
                    {tr ? '💡 Çözüm: PCD Çapını büyütün, delik sayısını azaltın veya daha küçük delik çapı / M vidası seçin.' : '💡 Fix: Increase PCD diameter, decrease hole count, or choose smaller M fastener.'}
                  </div>
                </div>
              </div>
            ) : isTooClose ? (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/50 flex items-start gap-2.5 text-amber-300 text-xs font-mono shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1">
                  <div className="font-black text-amber-200 uppercase tracking-wider">
                    <span>⚠️ {tr ? 'UYARI: DELİKLER BİRBİRİNE ÇOK YAKIN!' : 'WARNING: HOLES ARE TOO CLOSE!'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-300">
                    {tr
                      ? `Kalan et kalınlığı (Web): ${webThickness.toFixed(1)} mm. Güvenli minimum et kalınlığı: ${minSafeWeb.toFixed(1)} mm önerilir. Talaşlı imalat (delme) sırasında delikler arası etin yırtılması veya yük altında cıvata kesmesi meydana gelebilir!`
                      : `Remaining wall web thickness: ${webThickness.toFixed(1)} mm. Recommended safe minimum: ${minSafeWeb.toFixed(1)} mm. Risk of tear-out during drilling or shear failure under load!`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  <span className="font-bold">{tr ? 'Delik Yerleşimi & Et Payı Güvenli' : 'Hole Spacing & Wall Thickness Safe'}</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400">{tr ? 'Et Kalınlığı (Web)' : 'Web'}: {webThickness.toFixed(1)} mm</span>
              </div>
            )}

            {/* ── High-Tech Live Inspector HUD ── */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#0a1120] to-cyan-950/30 border border-amber-500/30 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
              <div className="space-y-0.5">
                <div className="text-[9px] text-slate-400 uppercase">{tr ? 'SEÇİLİ' : 'ACTIVE'}</div>
                <div className="text-sm font-black text-amber-400">#{selectedHole.index}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] text-slate-400 uppercase">{tr ? 'AÇI θ' : 'ANGLE θ'}</div>
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
                <div className="text-[9px] text-amber-300 uppercase">{tr ? 'KİRİŞ (c)' : 'CHORD (c)'}</div>
                <div className={`text-sm font-black ${isCollision ? 'text-rose-400' : isTooClose ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {pcdChordDistance} <span className="text-[9px] text-slate-400">mm</span>
                </div>
              </div>
              <div className="space-y-0.5 col-span-2 sm:col-span-1">
                <div className="text-[9px] text-slate-400 uppercase">{tr ? 'ADIM AÇISI' : 'STEP'}</div>
                <div className="text-sm font-black text-slate-200">Δ{pcdStepAngle}°</div>
              </div>
            </div>

            {/* ── Dynamic High-Precision SVG Blueprint Visualizer ── */}
            <div className="relative w-full h-72 sm:h-84 rounded-2xl bg-[#03060d] border border-amber-500/20 flex items-center justify-center overflow-hidden p-2 shadow-inner">
              {/* Radial backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),rgba(0,229,255,0.03),transparent_75%)] pointer-events-none" />

              {/* Quick tip overlay */}
              <div className="absolute top-2 left-3 text-[9px] font-mono text-slate-500 pointer-events-none flex items-center gap-2">
                <span>{tr ? '💡 Deliklere veya tablodaki satırlara tıklayarak inceleyin' : '💡 Click holes or table rows to inspect'}</span>
                {isCollision && <span className="text-rose-400 font-bold animate-pulse">🚨 ÇAKIŞMA VAR</span>}
                {isTooClose && <span className="text-amber-400 font-bold">⚠️ ÇOK YAKIN</span>}
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
                <span>{tr ? 'NO' : 'NUM'}</span>
                <span>{tr ? 'AÇI θ' : 'ANGLE'}</span>
                <span>X (mm)</span>
                <span>Y (mm)</span>
                <span className="text-right">{tr ? 'DURUM' : 'STATUS'}</span>
              </div>
              {pcdCoordinates.map((c) => {
                const isSelected = c.index === selectedHoleIdx;
                return (
                  <div
                    key={c.index}
                    onClick={() => setSelectedHoleIdx(c.index)}
                    className={`grid grid-cols-5 py-1.5 px-2 rounded-xl text-[11px] cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border border-amber-500/50 text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]'
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
                          {tr ? 'SEÇİLİ' : 'ACTIVE'}
                        </span>
                      ) : (
                        <span className="text-slate-500">{tr ? 'Seç' : 'Select'}</span>
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
                <span>{copiedGCode ? (tr ? '✓ G-Code Kopyalandı!' : '✓ G-Code Copied!') : (tr ? '📋 CNC G-Code (G81) Kopyala' : '📋 Copy CNC G-Code (G81)')}</span>
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
                <span>{tr ? '💾 CSV Tablo İndir' : '💾 Export CSV Table'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. QUICK MEASURE MODAL */}
      {activeModal === 'quick-measure' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-[#070b14] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Ruler size={18} />
                <span>{tr ? 'Hızlı Geometri & Alan Hesabı' : 'Quick Measure & Geometry'}</span>
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
                <label className="text-slate-400">{tr ? 'Uzunluk L (mm)' : 'Length L (mm)'}</label>
                <input
                  type="number"
                  value={qmLength}
                  onChange={(e) => setQmLength(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">{tr ? 'Genişlik W (mm)' : 'Width W (mm)'}</label>
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
                <div className="text-[9px] text-slate-500">ALAN (m²)</div>
                <div className="text-emerald-400 font-bold">{(qmAreaMm2 / 1000000).toFixed(4)}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/20">
                <div className="text-[9px] text-slate-500">ÇEVRE (mm)</div>
                <div className="text-cyan-400 font-bold">{qmPerimeterMm}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/20">
                <div className="text-[9px] text-slate-500">KÖŞEGEN (mm)</div>
                <div className="text-amber-400 font-bold">{qmDiagonalMm.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. STOPWATCH MODAL */}
      {activeModal === 'stopwatch' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-sky-500/30 bg-[#070b14] p-5 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Timer size={18} />
                <span>{tr ? 'Saha Kronometresi' : 'Stopwatch & Lap Timer'}</span>
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
                <span>{stopwatchRunning ? (tr ? 'Durdur' : 'Stop') : (tr ? 'Başlat' : 'Start')}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-yellow-500/30 bg-[#070b14] p-6 shadow-2xl space-y-5 text-center">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                <Flashlight size={18} />
                <span>{tr ? 'Muayene Feneri' : 'Hardware Torch'}</span>
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
                  ? 'bg-yellow-400 border-white text-black shadow-[0_0_35px_rgba(234,179,8,0.8)] scale-110'
                  : 'bg-white/5 border-white/15 text-slate-400 hover:text-white'
              }`}
            >
              <Flashlight size={36} />
            </button>

            <div className="text-xs font-mono text-slate-300">
              {torchActive ? (tr ? 'FENER AÇIK' : 'TORCH ACTIVE') : (tr ? 'AÇMAK İÇİN DOKUNUN' : 'TAP TO ACTIVATE')}
            </div>
          </div>
        </div>
      )}

      {/* 15. UNIFIED SENSOR HUB MODAL */}
      {activeModal === 'sensor-hub' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-indigo-500/30 bg-[#070b14] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Radio size={18} />
                <span>{tr ? 'Merkezi Sensör Paneli (HUD)' : 'Unified Sensor Hub'}</span>
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

      {/* DIRECT NAVIGATION FOR OTHER STANDARDS SOLVERS */}
      {activeModal === 'unit-converter' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-cyan-500/30 bg-[#070b14] p-5 shadow-2xl space-y-4 text-center">
            <h3 className="text-sm font-bold text-white">{tr ? 'Birim Dönüştürücü' : 'Unit Converter'}</h3>
            <p className="text-xs text-slate-400">{tr ? 'Gelişmiş çözücüye yönlendiriliyorsunuz.' : 'Redirecting to dedicated solver.'}</p>
            <Link
              href="/unit-converter"
              className="block w-full py-3 rounded-xl bg-cyan-500 text-black font-bold font-mono text-xs uppercase"
            >
              {tr ? 'Dönüştürücüyü Aç →' : 'Open Converter →'}
            </Link>
            <button onClick={() => setActiveModal(null)} className="text-xs text-slate-500">Kapat</button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-cyan-500/40 bg-[#070b14] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <CircleDot size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{tr ? 'Boru & Flanş Standartları' : 'Pipe & Flange Sizing'}</h3>
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
                  <label className="text-[10px] font-mono text-slate-400 uppercase">{tr ? 'Boru Çapı (DN / NPS)' : 'Pipe Size (DN / NPS)'}</label>
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
                  <label className="text-[10px] font-mono text-slate-400 uppercase">{tr ? 'Et Kalınlığı Serisi' : 'Schedule (Thickness)'}</label>
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
                  <div className="text-[9px] text-slate-400 font-mono uppercase">{tr ? 'Dış Çap (OD)' : 'Outer Dia (OD)'}</div>
                  <div className="text-sm font-black text-cyan-400 font-mono mt-0.5">{curPipe.od} mm</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">{tr ? 'Et Kalınlığı (t)' : 'Wall (t)'}</div>
                  <div className="text-sm font-black text-white font-mono mt-0.5">{wall} mm</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">{tr ? 'İç Çap (ID)' : 'Inner Dia (ID)'}</div>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">{idMm} mm</div>
                </div>
              </div>

              {/* Weight Breakdown */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-cyan-950/30 border border-cyan-500/20 space-y-2">
                <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase flex justify-between">
                  <span>{tr ? 'Birim Metretül Ağırlıkları' : 'Linear Weight (per meter)'}</span>
                  <span>{curPipe.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[9px]">{tr ? 'Çelik Boru:' : 'Steel Pipe:'}</span>
                    <span className="font-bold text-white">{steelWeightKgM} kg/m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">{tr ? 'Su Hacmi:' : 'Water Filled:'}</span>
                    <span className="font-bold text-sky-300">{waterWeightKgM} kg/m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">{tr ? 'Toplam (Dolu):' : 'Total (Full):'}</span>
                    <span className="font-black text-emerald-400">{totalWeightKgM} kg/m</span>
                  </div>
                </div>
              </div>

              {/* Standard Flange Specs */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs font-mono">
                <div className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <span>🔩 {tr ? 'Uyumlu EN 1092-1 PN16 Flanş Ölçüleri' : 'EN 1092-1 PN16 Flange Compatibility'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-300">
                  <div><span className="text-slate-500">PCD:</span> <span className="font-bold text-white">{curPipe.pn16_pcd} mm</span></div>
                  <div><span className="text-slate-500">{tr ? 'Delik:' : 'Holes:'}</span> <span className="font-bold text-white">{curPipe.pn16_holes}x</span></div>
                  <div><span className="text-slate-500">{tr ? 'Cıvata:' : 'Bolt:'}</span> <span className="font-bold text-cyan-300">{curPipe.pn16_bolt}</span></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Pipe: ${curPipe.name}, OD: ${curPipe.od}mm, ID: ${idMm}mm, Wall: ${wall}mm (${pipeSch.toUpperCase()}), Steel Weight: ${steelWeightKgM} kg/m, Water: ${waterWeightKgM} kg/m, Total: ${totalWeightKgM} kg/m, Flange PCD: ${curPipe.pn16_pcd}mm (${curPipe.pn16_holes}x ${curPipe.pn16_bolt})`;
                    navigator.clipboard.writeText(text);
                    alert(tr ? 'Boru ölçüleri kopyalandı!' : 'Pipe specs copied to clipboard!');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Copy size={14} />
                  <span>{tr ? 'Ölçüleri Kopyala' : 'Copy Specs'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
                >
                  {tr ? 'Kapat' : 'Close'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-amber-500/40 bg-[#070b14] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{tr ? 'Kablo Kesiti & Gerilim Düşümü' : 'Cable Sizing & Voltage Drop'}</h3>
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
                  <label className="text-[9px] font-mono text-slate-400 uppercase">{tr ? 'Şebeke' : 'System'}</label>
                  <select
                    value={vdVoltage}
                    onChange={(e) => setVdVoltage(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs"
                  >
                    <option value="230">230V (1-Faz)</option>
                    <option value="400">400V (3-Faz)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-400 uppercase">{tr ? 'İletken' : 'Conductor'}</label>
                  <select
                    value={vdMaterial}
                    onChange={(e) => setVdMaterial(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs"
                  >
                    <option value="cu">Bakır (Cu)</option>
                    <option value="al">Alüminyum (Al)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-400 uppercase">{tr ? 'Kesit (mm²)' : 'Size (mm²)'}</label>
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
                  <span className="text-slate-400">{tr ? 'Kablo Mesafesi (L):' : 'Cable Distance (L):'}</span>
                  <span className="font-black text-cyan-300">{vdLength} m</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={300}
                  value={vdLength}
                  onChange={(e) => setVdLength(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />

                <div className="flex justify-between text-xs font-mono mt-2">
                  <span className="text-slate-400">{tr ? 'Çekilen Akım (I):' : 'Load Current (I):'}</span>
                  <span className="font-black text-amber-300">{vdCurrent} A ({(vdCurrent * nominalV * (is1Ph ? 1 : Math.sqrt(3)) * vdCosPhi / 1000).toFixed(1)} kW)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={150}
                  value={vdCurrent}
                  onChange={(e) => setVdCurrent(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Result KPI Card */}
              <div className={`p-4 rounded-2xl border text-center transition-all ${
                isSafe
                  ? 'bg-emerald-950/30 border-emerald-500/40 shadow-emerald-500/10'
                  : isAcceptable
                  ? 'bg-amber-950/30 border-amber-500/40 shadow-amber-500/10'
                  : 'bg-rose-950/40 border-rose-500/50 shadow-rose-500/20'
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400">{tr ? 'Toplam Gerilim Düşümü' : 'Total Voltage Drop'}</div>
                <div className="text-2xl font-black font-mono mt-1 text-white flex items-center justify-center gap-2">
                  <span>ΔU = {deltaU.toFixed(2)} V</span>
                  <span className={`text-base px-2 py-0.5 rounded-md ${isSafe ? 'bg-emerald-500/20 text-emerald-300' : isAcceptable ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    %{deltaUPct.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold mt-2">
                  {isSafe ? (
                    <span className="text-emerald-400">✅ {tr ? 'STANDARDA UYGUN (≤ %3 Aydınlatma & Güç)' : 'OPTIMAL (≤ 3% Lighting & Power)'}</span>
                  ) : isAcceptable ? (
                    <span className="text-amber-400">⚠️ {tr ? 'KABUL EDİLEBİLİR (≤ %5 Motor & Güç Hatları)' : 'ACCEPTABLE (≤ 5% Power Lines)'}</span>
                  ) : (
                    <span className="text-rose-400">❌ {tr ? 'AŞIRI GERİLİM DÜŞÜMÜ! KESİTİ BÜYÜTÜN!' : 'VOLTAGE DROP EXCEEDED! UPSIZE CABLE!'}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-400 uppercase block">{tr ? 'Hat Güç Kaybı' : 'Power Loss'}</span>
                  <span className="font-bold text-white">{powerLossW.toFixed(1)} W</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-400 uppercase block">{tr ? 'Hat Direnci' : 'Resistance (R)'}</span>
                  <span className="font-bold text-cyan-300">{resistance.toFixed(4)} Ω</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Cable: ${vdSection}mm² ${vdMaterial === 'cu' ? 'Cu' : 'Al'}, System: ${nominalV}V, Length: ${vdLength}m, Load: ${vdCurrent}A, Voltage Drop: ${deltaU.toFixed(2)}V (${deltaUPct.toFixed(2)}%), Loss: ${powerLossW.toFixed(1)}W`;
                    navigator.clipboard.writeText(text);
                    alert(tr ? 'Kablo hesabı kopyalandı!' : 'Cable calculation copied!');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-bold font-mono text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Copy size={14} />
                  <span>{tr ? 'Hesabı Kopyala' : 'Copy Calculation'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-mono text-xs hover:bg-white/15"
                >
                  {tr ? 'Kapat' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {activeModal === 'sheet-bending' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-pink-500/30 bg-[#070b14] p-5 shadow-2xl space-y-4 text-center">
            <h3 className="text-sm font-bold text-white">{tr ? 'Sac Büküm (DIN 6935)' : 'Sheet Bending'}</h3>
            <p className="text-xs text-slate-400">{tr ? 'K-faktörü ve açınım boyu hesabı.' : 'K-factor & bend allowance.'}</p>
            <Link
              href="/sheet-metal"
              className="block w-full py-3 rounded-xl bg-pink-500 text-black font-bold font-mono text-xs uppercase"
            >
              {tr ? 'Hesaplayıcıyı Aç →' : 'Open Solver →'}
            </Link>
            <button onClick={() => setActiveModal(null)} className="text-xs text-slate-500">Kapat</button>
          </div>
        </div>
      )}

      {activeModal === 'welding-heat' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/30 bg-[#070b14] p-5 shadow-2xl space-y-4 text-center">
            <h3 className="text-sm font-bold text-white">{tr ? 'Kaynak Mukavemeti' : 'Welding Stress & Heat'}</h3>
            <p className="text-xs text-slate-400">{tr ? 'EN 1011-2 ısı girdisi ve dikiş kontrolü.' : 'EN 1011-2 heat input solver.'}</p>
            <Link
              href="/welding"
              className="block w-full py-3 rounded-xl bg-red-500 text-white font-bold font-mono text-xs uppercase"
            >
              {tr ? 'Hesaplayıcıyı Aç →' : 'Open Solver →'}
            </Link>
            <button onClick={() => setActiveModal(null)} className="text-xs text-slate-500">Kapat</button>
          </div>
        </div>
      )}

      {/* ─── PWA QUICK WIDGET & HOMESCREEN HELPER ─── */}
      <div className="p-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-slate-900 to-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="font-bold text-white">{tr ? 'Telefon Ana Ekranına Widget Olarak Ekle' : 'Add Field Widget to Home Screen'}</div>
            <div className="text-[10px] text-slate-400">
              {tr
                ? 'Safari / Chrome menüsünden "Ana Ekrana Ekle" seçeneğiyle tek dokunuşla internetsiz de açın.'
                : 'Tap "Add to Home Screen" in your browser to install as an instant offline widget.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
