/**
 * 📐 AluCAD — Parametric Construction Methods Catalog
 * 
 * Defines AutoCAD-grade geometry construction methods for all primary tools:
 * 1. Circle: Center-Radius, Center-Diameter, 2-Point, 3-Point, Tan-Tan-Radius, Tan-Tan-Tan.
 * 2. Arc: 3-Point, Start-Center-End, Start-Center-Angle, Start-Center-Length,
 *         Start-End-Radius, Start-End-Direction, Center-Start-End, Center-Start-Angle, Continue.
 * 3. Rectangle: 2-Corner, Center-Corner, 3-Point Rotated, Filleted, Chamfered.
 * 4. Polygon: Inscribed in Circle, Circumscribed about Circle, Edge-Based.
 * 5. Ellipse: Center & Radii, Axis Endpoints, Elliptical Arc.
 * 6. Line: 2-Point Segment, Infinite Construction Line (XLine), Semi-Infinite Ray.
 * 7. Dimension: Smart Auto, Linear (H/V), Aligned, Angular, Radial (R), Diameter (Ø).
 */

import React from 'react';
import {
  CircleRadiusIcon,
  CircleDiameterIcon,
  Circle2PIcon,
  Circle3PIcon,
  CircleTtrIcon,
  CircleTttIcon,
  Arc3PIcon,
  ArcSceIcon,
  ArcScaIcon,
  ArcSclIcon,
  ArcSerIcon,
  ArcSedIcon,
  ArcCseIcon,
  ArcCsaIcon,
  ArcContinueIcon,
  Rec2PIcon,
  RecCenterIcon,
  Rec3PIcon,
  RecFilletIcon,
  RecChamferIcon,
  PolyInscribedIcon,
  PolyCircumscribedIcon,
  PolyEdgeIcon,
  EllipseCenterIcon,
  EllipseAxisIcon,
  EllipseArcIcon,
  Line2PIcon,
  LineXlineIcon,
  LineRayIcon,
  DimSmartIcon,
  DimLinearIcon,
  DimAlignedIcon,
  DimAngularIcon,
  DimRadialIcon,
  DimDiameterIcon,
  SurfaceFinishIcon,
  SurfaceLeaderIcon,
} from '../components/CadIcons';
import { t12 } from '../../locales/t12';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type SurfaceMode =
  | 'LEADER'
  | 'DIRECT'
  | 'RA_3_2'
  | 'RA_1_6'
  | 'RA_0_8'
  | 'RA_0_4'
  | 'RA_0_2'
  | 'RA_6_3'
  | 'RA_12_5';

export type CircleMode =
  | 'CENTER_RADIUS'
  | 'CENTER_DIAMETER'
  | '2P'
  | '3P'
  | 'TTR'
  | 'TTT';

export type ArcMode =
  | '3P'
  | 'START_CENTER_END'
  | 'START_CENTER_ANGLE'
  | 'START_CENTER_LENGTH'
  | 'START_END_RADIUS'
  | 'START_END_DIRECTION'
  | 'CENTER_START_END'
  | 'CENTER_START_ANGLE'
  | 'CONTINUE';

export type RectangleMode =
  | '2P'
  | 'CENTER'
  | '3P'
  | 'FILLET'
  | 'CHAMFER';

export type PolygonMode =
  | 'INSCRIBED'
  | 'CIRCUMSCRIBED'
  | 'EDGE';

export type EllipseMode =
  | 'CENTER'
  | 'AXIS'
  | 'ARC';

export type LineMode =
  | '2P'
  | 'XLINE'
  | 'RAY';

export type DimensionMode =
  | 'SMART'
  | 'LINEAR'
  | 'ALIGNED'
  | 'ANGULAR'
  | 'RADIAL'
  | 'DIAMETER';

export interface ConstructionMethodDef<TMode extends string> {
  id: TMode;
  commandId: string;
  shortcut: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: {
    en: string;
    tr: string;
  };
  getTitle: (lang: string) => string;
  getDescription: (lang: string) => string;
}

// ═══════════════════════════════════════════════════════════════
// 1. CIRCLE METHODS
// ═══════════════════════════════════════════════════════════════

export const CIRCLE_METHODS: ConstructionMethodDef<CircleMode>[] = [
  {
    id: 'CENTER_RADIUS',
    commandId: 'CIRCLE_RADIUS',
    shortcut: 'C / CR',
    icon: CircleRadiusIcon,
    category: { en: 'Center-Based', tr: 'Merkez Tabanlı' },
    getTitle: (lang) => t12(lang, 'Center, Radius', 'Merkez, Yarıçap'),
    getDescription: (lang) => t12(lang, 'Create circle using center point and radius distance', 'Merkez noktası ve yarıçap mesafesi ile daire'),
  },
  {
    id: 'CENTER_DIAMETER',
    commandId: 'CIRCLE_DIAMETER',
    shortcut: 'CD',
    icon: CircleDiameterIcon,
    category: { en: 'Center-Based', tr: 'Merkez Tabanlı' },
    getTitle: (lang) => t12(lang, 'Center, Diameter', 'Merkez, Çap'),
    getDescription: (lang) => t12(lang, 'Create circle using center point and full diameter measure', 'Merkez noktası ve tam çap ölçüsü ile daire'),
  },
  {
    id: '2P',
    commandId: 'CIRCLE_2P',
    shortcut: '2P',
    icon: Circle2PIcon,
    category: { en: 'Point-Based', tr: 'Nokta Tabanlı' },
    getTitle: (lang) => t12(lang, '2-Point (Diameter Endpoints)', '2 Nokta (Çap Uçları)'),
    getDescription: (lang) => t12(lang, 'Create circle by specifying two opposite diameter points', 'Çapın iki uç noktasını belirterek daire'),
  },
  {
    id: '3P',
    commandId: 'CIRCLE_3P',
    shortcut: '3P',
    icon: Circle3PIcon,
    category: { en: 'Point-Based', tr: 'Nokta Tabanlı' },
    getTitle: (lang) => t12(lang, '3-Point (Circumcircle)', '3 Nokta (Çevrel Çember)'),
    getDescription: (lang) => t12(lang, 'Create circle passing through three circumference points', 'Çevre üzerindeki 3 referans noktadan geçen daire'),
  },
  {
    id: 'TTR',
    commandId: 'CIRCLE_TTR',
    shortcut: 'TTR',
    icon: CircleTtrIcon,
    category: { en: 'Tangent-Based', tr: 'Teğet Tabanlı' },
    getTitle: (lang) => t12(lang, 'Tan, Tan, Radius', 'Teğet, Teğet, Yarıçap'),
    getDescription: (lang) => t12(lang, 'Circle tangent to two entities with specified radius', 'İki nesneye teğet ve belirli yarıçapta daire'),
  },
  {
    id: 'TTT',
    commandId: 'CIRCLE_TTT',
    shortcut: 'TTT',
    icon: CircleTttIcon,
    category: { en: 'Tangent-Based', tr: 'Teğet Tabanlı' },
    getTitle: (lang) => t12(lang, 'Tan, Tan, Tan', '3 Teğet (Tan, Tan, Tan)'),
    getDescription: (lang) => t12(lang, 'Circle tangent to three lines, circles, or curves', 'Üç çizgi, daire veya eğriye teğet daire'),
  },
];

// ═══════════════════════════════════════════════════════════════
// 2. ARC METHODS
// ═══════════════════════════════════════════════════════════════

export const ARC_METHODS: ConstructionMethodDef<ArcMode>[] = [
  {
    id: '3P',
    commandId: 'ARC_3P',
    shortcut: '3P / A',
    icon: Arc3PIcon,
    category: { en: '3-Point', tr: '3 Nokta' },
    getTitle: (lang) => t12(lang, '3-Point Arc', '3 Noktadan Yay'),
    getDescription: (lang) => t12(lang, 'Start point, through point on arc, and end point', 'Başlangıç, yay üzeri nokta ve bitiş noktası ile yay'),
  },
  {
    id: 'START_CENTER_END',
    commandId: 'ARC_SCE',
    shortcut: 'SCE',
    icon: ArcSceIcon,
    category: { en: 'Start, Center', tr: 'Başlangıç, Merkez' },
    getTitle: (lang) => t12(lang, 'Start, Center, End', 'Başlangıç, Merkez, Bitiş'),
    getDescription: (lang) => t12(lang, 'Start point, center point, and end ray direction', 'Başlangıç, merkez ve bitiş noktası doğrultusu ile'),
  },
  {
    id: 'START_CENTER_ANGLE',
    commandId: 'ARC_SCA',
    shortcut: 'SCA',
    icon: ArcScaIcon,
    category: { en: 'Start, Center', tr: 'Başlangıç, Merkez' },
    getTitle: (lang) => t12(lang, 'Start, Center, Angle', 'Başlangıç, Merkez, Açı'),
    getDescription: (lang) => t12(lang, 'Start point, center point, and included sweep angle', 'Başlangıç, merkez ve taranacak yay açısı ile'),
  },
  {
    id: 'START_CENTER_LENGTH',
    commandId: 'ARC_SCL',
    shortcut: 'SCL',
    icon: ArcSclIcon,
    category: { en: 'Start, Center', tr: 'Başlangıç, Merkez' },
    getTitle: (lang) => t12(lang, 'Start, Center, Chord Length', 'Başlangıç, Merkez, Kiriş Boyu'),
    getDescription: (lang) => t12(lang, 'Start point, center point, and chord length (L <= 2R)', 'Başlangıç, merkez ve kiriş uzunluğu ile yay'),
  },
  {
    id: 'START_END_RADIUS',
    commandId: 'ARC_SER',
    shortcut: 'SER',
    icon: ArcSerIcon,
    category: { en: 'Start, End', tr: 'Başlangıç, Bitiş' },
    getTitle: (lang) => t12(lang, 'Start, End, Radius', 'Başlangıç, Bitiş, Yarıçap'),
    getDescription: (lang) => t12(lang, 'Start point, end point, and arc radius / bulge', 'İki uç nokta ve yay yarıçapı ile kavis oluşturma'),
  },
  {
    id: 'START_END_DIRECTION',
    commandId: 'ARC_SED',
    shortcut: 'SED',
    icon: ArcSedIcon,
    category: { en: 'Start, End', tr: 'Başlangıç, Bitiş' },
    getTitle: (lang) => t12(lang, 'Start, End, Direction', 'Başlangıç, Bitiş, Teğet Açısı'),
    getDescription: (lang) => t12(lang, 'Start point, end point, and tangent vector at start', 'Başlangıç, bitiş ve başlangıç noktasındaki teğet yönü'),
  },
  {
    id: 'CENTER_START_END',
    commandId: 'ARC_CSE',
    shortcut: 'CSE',
    icon: ArcCseIcon,
    category: { en: 'Center, Start', tr: 'Merkez, Başlangıç' },
    getTitle: (lang) => t12(lang, 'Center, Start, End', 'Merkez, Başlangıç, Bitiş'),
    getDescription: (lang) => t12(lang, 'Center point first, then start radius point and end angle', 'Önce merkez, sonra başlangıç ve bitiş noktaları'),
  },
  {
    id: 'CENTER_START_ANGLE',
    commandId: 'ARC_CSA',
    shortcut: 'CSA',
    icon: ArcCsaIcon,
    category: { en: 'Center, Start', tr: 'Merkez, Başlangıç' },
    getTitle: (lang) => t12(lang, 'Center, Start, Angle', 'Merkez, Başlangıç, Açı'),
    getDescription: (lang) => t12(lang, 'Center point, start point radius, and sweep angle', 'Merkez, başlangıç noktası ve taranacak yay açısı'),
  },
  {
    id: 'CONTINUE',
    commandId: 'ARC_CONTINUE',
    shortcut: 'CONT',
    icon: ArcContinueIcon,
    category: { en: 'Tangent Continue', tr: 'Teğetsel Devam' },
    getTitle: (lang) => t12(lang, 'Continue (Tangent Arc)', 'Teğetsel Devam (Teğet Yay)'),
    getDescription: (lang) => t12(lang, 'Draw arc tangent to last line or arc endpoint', 'Son çizgi veya yaydan teğet olarak devam eden yay'),
  },
];

// ═══════════════════════════════════════════════════════════════
// 3. RECTANGLE METHODS
// ═══════════════════════════════════════════════════════════════

export const RECTANGLE_METHODS: ConstructionMethodDef<RectangleMode>[] = [
  {
    id: '2P',
    commandId: 'RECTANGLE_2P',
    shortcut: 'REC',
    icon: Rec2PIcon,
    category: { en: 'Corner Based', tr: 'Köşe Tabanlı' },
    getTitle: (lang) => t12(lang, '2-Point Corner to Corner', '2 Köşe (Köşegen)'),
    getDescription: (lang) => t12(lang, 'Specify first corner and opposite diagonal corner', 'İlk köşe ve karşıt çapraz köşe noktasıyla'),
  },
  {
    id: 'CENTER',
    commandId: 'RECTANGLE_CENTER',
    shortcut: 'RC / RCTR',
    icon: RecCenterIcon,
    category: { en: 'Center Based', tr: 'Merkez Tabanlı' },
    getTitle: (lang) => t12(lang, 'Center, Corner', 'Merkez, Köşe'),
    getDescription: (lang) => t12(lang, 'Specify center point and expand symmetrically outwards', 'Merkez noktasından dışa simetrik dikdörtgen'),
  },
  {
    id: '3P',
    commandId: 'RECTANGLE_3P',
    shortcut: 'R3P',
    icon: Rec3PIcon,
    category: { en: 'Rotated / 3-Point', tr: 'Eğik / 3 Nokta' },
    getTitle: (lang) => t12(lang, '3-Point Rotated', '3 Nokta Açılı (Rotated)'),
    getDescription: (lang) => t12(lang, 'Baseline start, baseline end, and height point', 'Taban doğrusu ve yükseklik ile istenen açıda'),
  },
  {
    id: 'FILLET',
    commandId: 'RECTANGLE_FILLET',
    shortcut: 'RFILLET',
    icon: RecFilletIcon,
    category: { en: 'Corner Radii', tr: 'Köşe İşlemleri' },
    getTitle: (lang) => t12(lang, 'Filleted Rectangle', 'Radyuslu Dikdörtgen'),
    getDescription: (lang) => t12(lang, 'Automatic circular rounded corners with radius R', 'Tüm 4 köşesi R yarıçapıyla yuvarlatılmış'),
  },
  {
    id: 'CHAMFER',
    commandId: 'RECTANGLE_CHAMFER',
    shortcut: 'RCHAMFER',
    icon: RecChamferIcon,
    category: { en: 'Corner Radii', tr: 'Köşe İşlemleri' },
    getTitle: (lang) => t12(lang, 'Chamfered Rectangle', 'Pahlı Dikdörtgen'),
    getDescription: (lang) => t12(lang, 'Automatic 45-degree beveled corners with distance C', 'Tüm 4 köşesi pah mesafesiyle kırılmış'),
  },
];

// ═══════════════════════════════════════════════════════════════
// 4. POLYGON METHODS
// ═══════════════════════════════════════════════════════════════

export const POLYGON_METHODS: ConstructionMethodDef<PolygonMode>[] = [
  {
    id: 'INSCRIBED',
    commandId: 'POLYGON_INSCRIBED',
    shortcut: 'POL / I',
    icon: PolyInscribedIcon,
    category: { en: 'Circle Fitting', tr: 'Çember Uyumu' },
    getTitle: (lang) => t12(lang, 'Inscribed in Circle', 'Çembere İçten Teğet (Inscribed)'),
    getDescription: (lang) => t12(lang, 'Center and radius to vertices; vertices touch circle', 'Merkez ve köşelere uzanan yarıçap; köşeler çemberde'),
  },
  {
    id: 'CIRCUMSCRIBED',
    commandId: 'POLYGON_CIRCUMSCRIBED',
    shortcut: 'POL / C',
    icon: PolyCircumscribedIcon,
    category: { en: 'Circle Fitting', tr: 'Çember Uyumu' },
    getTitle: (lang) => t12(lang, 'Circumscribed about Circle', 'Çembere Dıştan Teğet (AF / Anahtar)'),
    getDescription: (lang) => t12(lang, 'Radius to midpoint of flat sides (Across Flats)', 'Düz kenarların ortasına yarıçap (Anahtar Ağzı)'),
  },
  {
    id: 'EDGE',
    commandId: 'POLYGON_EDGE',
    shortcut: 'POL / E',
    icon: PolyEdgeIcon,
    category: { en: 'Edge Based', tr: 'Kenar Tabanlı' },
    getTitle: (lang) => t12(lang, 'Edge Length', 'Kenar Boyu (Edge)'),
    getDescription: (lang) => t12(lang, 'Specify two endpoints of first edge to construct polygon', 'İlk kenarın iki uç noktasını belirterek çokgen'),
  },
];

// ═══════════════════════════════════════════════════════════════
// 5. ELLIPSE METHODS
// ═══════════════════════════════════════════════════════════════

export const ELLIPSE_METHODS: ConstructionMethodDef<EllipseMode>[] = [
  {
    id: 'CENTER',
    commandId: 'ELLIPSE_CENTER',
    shortcut: 'EL / C',
    icon: EllipseCenterIcon,
    category: { en: 'Center Based', tr: 'Merkez Tabanlı' },
    getTitle: (lang) => t12(lang, 'Center, Major, Minor', 'Merkez, Eksenler'),
    getDescription: (lang) => t12(lang, 'Specify center point, major axis radius, and minor radius', 'Merkez noktası, majör ve minör eksen yarıçapları'),
  },
  {
    id: 'AXIS',
    commandId: 'ELLIPSE_AXIS',
    shortcut: 'EL / A',
    icon: EllipseAxisIcon,
    category: { en: 'Axis Endpoints', tr: 'Eksen Uçları' },
    getTitle: (lang) => t12(lang, 'Axis Endpoints', 'Eksen Uç Noktaları'),
    getDescription: (lang) => t12(lang, 'Specify two endpoints of major axis and distance to other axis', 'Birinci eksenin iki ucu ve diğer eksen mesafesi'),
  },
  {
    id: 'ARC',
    commandId: 'ELLIPSE_ARC',
    shortcut: 'EL / ARC',
    icon: EllipseArcIcon,
    category: { en: 'Elliptical Arc', tr: 'Elips Yayı' },
    getTitle: (lang) => t12(lang, 'Elliptical Arc', 'Eliptik Yay'),
    getDescription: (lang) => t12(lang, 'Create partial ellipse with start and end angle sweeps', 'Başlangıç ve bitiş açıları ile açık elips yayı'),
  },
];

// ═══════════════════════════════════════════════════════════════
// 6. LINE & CONSTRUCTION METHODS
// ═══════════════════════════════════════════════════════════════

export const LINE_METHODS: ConstructionMethodDef<LineMode>[] = [
  {
    id: '2P',
    commandId: 'LINE',
    shortcut: 'L / LINE',
    icon: Line2PIcon,
    category: { en: 'Line Segment', tr: 'Çizgi Parçası' },
    getTitle: (lang) => t12(lang, '2-Point Line Segment', '2 Nokta Çizgi'),
    getDescription: (lang) => t12(lang, 'Standard line segment connecting start and end points', 'Başlangıç ve bitiş noktalarını birleştiren doğru parçası'),
  },
  {
    id: 'XLINE',
    commandId: 'XLINE',
    shortcut: 'XL / XLINE',
    icon: LineXlineIcon,
    category: { en: 'Construction Guide', tr: 'Konstrüksiyon Kılavuzu' },
    getTitle: (lang) => t12(lang, 'Construction Line (XLine)', 'Sonsuz Kılavuz Çizgisi (XLine)'),
    getDescription: (lang) => t12(lang, 'Infinite reference line passing through 2 points in both directions', 'İki yöne sonsuz uzayan hizalama kılavuz çizgisi'),
  },
  {
    id: 'RAY',
    commandId: 'RAY',
    shortcut: 'RAY',
    icon: LineRayIcon,
    category: { en: 'Construction Guide', tr: 'Konstrüksiyon Kılavuzu' },
    getTitle: (lang) => t12(lang, 'Semi-Infinite Ray', 'Yarı-Sonsuz Işın (Ray)'),
    getDescription: (lang) => t12(lang, 'Line starting at origin point and extending infinitely in one ray', 'Başlangıç noktasından tek yöne sonsuz uzayan ışın'),
  },
];

// ═══════════════════════════════════════════════════════════════
// 7. DIMENSION METHODS
// ═══════════════════════════════════════════════════════════════

export const DIMENSION_METHODS: ConstructionMethodDef<DimensionMode>[] = [
  {
    id: 'SMART',
    commandId: 'DIMENSION_SMART',
    shortcut: 'DIM / SMART',
    icon: DimSmartIcon,
    category: { en: 'Auto Detection', tr: 'Otomatik Algılama' },
    getTitle: (lang) => t12(lang, 'Smart Auto Dimension', 'Akıllı Otomatik Ölçü'),
    getDescription: (lang) => t12(lang, 'Automatically detects line, circle, arc or box and dimensions it', 'Çizgi, daire, yay veya kutuyu otomatik tanır ve ölçülendirir'),
  },
  {
    id: 'LINEAR',
    commandId: 'DIMENSION_LINEAR',
    shortcut: 'DLI',
    icon: DimLinearIcon,
    category: { en: 'Linear Measure', tr: 'Doğrusal Ölçü' },
    getTitle: (lang) => t12(lang, 'Linear (Horizontal / Vertical)', 'Doğrusal (Yatay / Dikey)'),
    getDescription: (lang) => t12(lang, 'Forces strictly horizontal or vertical projected dimension', 'Sadece yatay veya dikey izdüşüm ölçüsü yerleştirir'),
  },
  {
    id: 'ALIGNED',
    commandId: 'DIMENSION_ALIGNED',
    shortcut: 'DAL',
    icon: DimAlignedIcon,
    category: { en: 'Linear Measure', tr: 'Doğrusal Ölçü' },
    getTitle: (lang) => t12(lang, 'Aligned Dimension', 'Hizalı Ölçü (Gerçek Boy)'),
    getDescription: (lang) => t12(lang, 'Dimension parallel to the true tilted angle of two points', 'Eğik iki nokta arasındaki gerçek mesafeye paralel ölçü'),
  },
  {
    id: 'ANGULAR',
    commandId: 'DIMENSION_ANGULAR',
    shortcut: 'DAN',
    icon: DimAngularIcon,
    category: { en: 'Angular Measure', tr: 'Açısal Ölçü' },
    getTitle: (lang) => t12(lang, 'Angular Dimension', 'Açısal Ölçülendirme'),
    getDescription: (lang) => t12(lang, 'Measures included angle between two intersecting lines or 3 points', 'İki doğru veya 3 nokta arasındaki dahil açıyı ölçer'),
  },
  {
    id: 'RADIAL',
    commandId: 'DIMENSION_RADIAL',
    shortcut: 'DRA',
    icon: DimRadialIcon,
    category: { en: 'Curvature Measure', tr: 'Kavis Ölçüleri' },
    getTitle: (lang) => t12(lang, 'Radius Dimension (R)', 'Yarıçap Ölçüsü (R)'),
    getDescription: (lang) => t12(lang, 'Radial leader dimension for arcs and circular fillets', 'Yaylar ve kavisler için R önekli yarıçap ölçüsü'),
  },
  {
    id: 'DIAMETER',
    commandId: 'DIMENSION_DIAMETER',
    shortcut: 'DDI',
    icon: DimDiameterIcon,
    category: { en: 'Curvature Measure', tr: 'Kavis Ölçüleri' },
    getTitle: (lang) => t12(lang, 'Diameter Dimension (Ø)', 'Çap Ölçüsü (Ø)'),
    getDescription: (lang) => t12(lang, 'Diametral dimension leader for complete circles and holes', 'Daire ve delikler için Ø çap ölçüsü ve lider çizgisi'),
  },
];

// ═══════════════════════════════════════════════════════════════
// 8. SURFACE TEXTURE / FINISH METHODS (ISO 1302)
// ═══════════════════════════════════════════════════════════════

export const SURFACE_METHODS: ConstructionMethodDef<SurfaceMode>[] = [
  {
    id: 'LEADER',
    commandId: 'SURF_LEADER',
    shortcut: 'SLEAD',
    icon: SurfaceLeaderIcon,
    category: { en: 'Placement Mode', tr: 'Yerleşim Yöntemi' },
    getTitle: (lang) => t12(lang, 'Surface Finish with Leader', 'Lider Ok ile Yüzey İşareti'),
    getDescription: (lang) => t12(lang, 'Arrow points to surface, ISO 1302 symbol sits on landing shoulder', 'Ok ucu yüzeyi gösterir, ISO 1302 sembolü iniş çizgisine eklenir'),
  },
  {
    id: 'DIRECT',
    commandId: 'SURFACE_DIRECT',
    shortcut: 'SURF',
    icon: SurfaceFinishIcon,
    category: { en: 'Placement Mode', tr: 'Yerleşim Yöntemi' },
    getTitle: (lang) => t12(lang, 'Direct Surface Placement', 'Doğrudan Yüzeye Yerleşim'),
    getDescription: (lang) => t12(lang, 'Place ISO 1302 surface symbol directly at cursor click', 'Tıklanan konuma doğrudan ISO 1302 sembolü yerleştirir'),
  },
  {
    id: 'RA_3_2',
    commandId: 'SURF_RA_32',
    shortcut: 'Ra 3.2',
    icon: SurfaceFinishIcon,
    category: { en: 'Standard ISO Presets', tr: 'Standart ISO Şablonları' },
    getTitle: (lang) => t12(lang, 'Ra 3.2 μm — General Machined', 'Ra 3.2 μm — Genel Talaşlı'),
    getDescription: (lang) => t12(lang, 'ISO 1302 standard commercial milling / turning surface', 'ISO 1302 standart frezeleme ve tornalama yüzeyi'),
  },
  {
    id: 'RA_1_6',
    commandId: 'SURF_RA_16',
    shortcut: 'Ra 1.6',
    icon: SurfaceFinishIcon,
    category: { en: 'Standard ISO Presets', tr: 'Standart ISO Şablonları' },
    getTitle: (lang) => t12(lang, 'Ra 1.6 μm — Bearing Seat / Fine Machined', 'Ra 1.6 μm — Rulman Yatağı / Hassas İşleme'),
    getDescription: (lang) => t12(lang, 'Fine turned or finished milled surface for bearing seats', 'Rulman yatakları ve hassas işleme yüzeyi'),
  },
  {
    id: 'RA_0_8',
    commandId: 'SURF_RA_08',
    shortcut: 'Ra 0.8',
    icon: SurfaceFinishIcon,
    category: { en: 'Standard ISO Presets', tr: 'Standart ISO Şablonları' },
    getTitle: (lang) => t12(lang, 'Ra 0.8 μm — Precision Ground / Reamed', 'Ra 0.8 μm — Yüzey Taşlama / Hassas Rayba'),
    getDescription: (lang) => t12(lang, 'Precision ground surfaces, reamed H7 holes', 'Hassas taşlanmış yüzeyler, H7 raybalanmış delikler'),
  },
  {
    id: 'RA_0_4',
    commandId: 'SURF_RA_04',
    shortcut: 'Ra 0.4',
    icon: SurfaceFinishIcon,
    category: { en: 'Standard ISO Presets', tr: 'Standart ISO Şablonları' },
    getTitle: (lang) => t12(lang, 'Ra 0.4 μm — Oil Seal Seat / Superfinish', 'Ra 0.4 μm — Yağ Keçesi / Hassas Taşlama'),
    getDescription: (lang) => t12(lang, 'Cylindrical ground seal journals and high precision surfaces', 'Döner mil keçeleri ve yüksek hassasiyetli sızdırmazlık yüzeyleri'),
  },
  {
    id: 'RA_0_2',
    commandId: 'SURF_RA_02',
    shortcut: 'Ra 0.2',
    icon: SurfaceFinishIcon,
    category: { en: 'Standard ISO Presets', tr: 'Standart ISO Şablonları' },
    getTitle: (lang) => t12(lang, 'Ra 0.2 μm — Honed Cylinder Bore', 'Ra 0.2 μm — Honlanmış Silindir'),
    getDescription: (lang) => t12(lang, 'Honed engine cylinder walls, hydraulic cylinders, precision lapping', 'Hidrolik silindirler, motor gömlekleri ve lepleme'),
  },
  {
    id: 'RA_6_3',
    commandId: 'SURF_RA_63',
    shortcut: 'Ra 6.3',
    icon: SurfaceFinishIcon,
    category: { en: 'Standard ISO Presets', tr: 'Standart ISO Şablonları' },
    getTitle: (lang) => t12(lang, 'Ra 6.3 μm — Rough Machined', 'Ra 6.3 μm — Kaba Talaşlı'),
    getDescription: (lang) => t12(lang, 'Rough milling, sawing or flame cutting with high feed rate', 'Kaba talaş alma, şerit testere ve kaba yüzeyler'),
  },
  {
    id: 'RA_12_5',
    commandId: 'SURF_RA_125',
    shortcut: 'Ra 12.5',
    icon: SurfaceFinishIcon,
    category: { en: 'Standard ISO Presets', tr: 'Standart ISO Şablonları' },
    getTitle: (lang) => t12(lang, 'Ra 12.5 μm — Removal Prohibited / As-Cast', 'Ra 12.5 μm — Talaşsız / Döküm Yüzey'),
    getDescription: (lang) => t12(lang, 'As-cast, forged, or unmachined surfaces (inscribed circle)', 'Döküm, dövme veya talaş kaldırılması yasak yüzeyler'),
  },
];

