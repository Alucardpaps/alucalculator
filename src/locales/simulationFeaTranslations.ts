import type { Language } from '@/store/i18nStore';

export type SimulationFeaStrings = {
  title: string;
  subtitle: string;
  loadPreset: string;
  selectTemplate: string;
  toolSelect: string;
  toolNode: string;
  toolTruss: string;
  inspectorTitle: string;
  selectTopology: string;
  fixX: string;
  fixY: string;
  forceVector: string;
  area: string;
  modulus: string;
  dispScale: string;
  visualization: string;
  solved: string;
  unstable: string;
  visualizerLabel: string;
  critStress: string;
  maxDisp: string;
  dof: string;
  presets: {
    simpleBeamName: string;
    simpleBeamDesc: string;
    warrenName: string;
    warrenDesc: string;
    prattName: string;
    prattDesc: string;
  };
};

const EN: SimulationFeaStrings = {
  "title": "FEA Resolve",
  "subtitle": "Stiffness Kernel v4.2",
  "loadPreset": "Load Preset",
  "selectTemplate": "— Select Template —",
  "toolSelect": "Select",
  "toolNode": "Node",
  "toolTruss": "Truss",
  "inspectorTitle": "Element Inspector",
  "selectTopology": "Select topology",
  "fixX": "Fix X",
  "fixY": "Fix Y",
  "forceVector": "Force Vector (N)",
  "area": "Area",
  "modulus": "Modulus",
  "dispScale": "Disp. Scale",
  "visualization": "Visualization",
  "solved": "SOLVED",
  "unstable": "UNSTABLE",
  "visualizerLabel": "Integrated Topology Visualizer",
  "critStress": "Critical Stress",
  "maxDisp": "Max Displacement",
  "dof": "Degrees of Freedom",
  "presets": {
    "simpleBeamName": "Simple Beam",
    "simpleBeamDesc": "Two supports, one loaded top node",
    "warrenName": "Warren Truss",
    "warrenDesc": "Triangulated bridge with alternating diagonals",
    "prattName": "Pratt Truss",
    "prattDesc": "Verticals with diagonals toward center"
  }
} as SimulationFeaStrings;

const TR: SimulationFeaStrings = {
  "title": "FEA Çözümleyici",
  "subtitle": "Rijitlik Çekirdeği v4.2",
  "loadPreset": "Şablon Yükle",
  "selectTemplate": "— Şablon Seç —",
  "toolSelect": "Seç",
  "toolNode": "Düğüm",
  "toolTruss": "Kiriş",
  "inspectorTitle": "Eleman Detayları",
  "selectTopology": "Topoloji seçin",
  "fixX": "Sabitle X",
  "fixY": "Sabitle Y",
  "forceVector": "Kuvvet Vektörü (N)",
  "area": "Alan",
  "modulus": "Elastisite Modülü",
  "dispScale": "Deplasman Ölçeği",
  "visualization": "Görselleştirme",
  "solved": "ÇÖZÜLDÜ",
  "unstable": "KARARSIZ",
  "visualizerLabel": "Entegre Topoloji Görselleştirici",
  "critStress": "Kritik Gerilme",
  "maxDisp": "Maks. Deplasman",
  "dof": "Serbestlik Derecesi",
  "presets": {
    "simpleBeamName": "Basit Kiriş",
    "simpleBeamDesc": "İki mesnetli, üstten tek yüklü düğüm",
    "warrenName": "Warren Kafes",
    "warrenDesc": "Alternatif çaprazlı üçgen köprü",
    "prattName": "Pratt Kafes",
    "prattDesc": "Merkeze eğimli çaprazlı dikey elemanlar"
  }
} as SimulationFeaStrings;

const DE: SimulationFeaStrings = {
  "title": "FEA-Lösung",
  "subtitle": "Steifigkeitskern v4.2",
  "loadPreset": "Vorlage Laden",
  "selectTemplate": "— Vorlage Auswählen —",
  "toolSelect": "Auswählen",
  "toolNode": "Knoten",
  "toolTruss": "Fachwerk",
  "inspectorTitle": "Element-Inspektor",
  "selectTopology": "Topologie auswählen",
  "fixX": "Fixieren X",
  "fixY": "Fixieren Y",
  "forceVector": "Kraftvektor (N)",
  "area": "Querschnittsfläche",
  "modulus": "E-Modul",
  "dispScale": "Verschiebungsmaßstab",
  "visualization": "Visualisierung",
  "solved": "GELÖST",
  "unstable": "INSTABIL",
  "visualizerLabel": "Integrierter Topologie-Visualisierer",
  "critStress": "Kritische Spannung",
  "maxDisp": "Max. Verschiebung",
  "dof": "Freiheitsgrade",
  "presets": {
    "simpleBeamName": "Einfacher Balken",
    "simpleBeamDesc": "Zwei Auflager, ein belasteter oberer Knoten",
    "warrenName": "Warren-Fachwerk",
    "warrenDesc": "Triangulierte Brücke mit abwechselnden Diagonalen",
    "prattName": "Pratt-Fachwerk",
    "prattDesc": "Vertikalen mit Diagonalen zur Mitte"
  }
} as SimulationFeaStrings;

const ES: SimulationFeaStrings = {
  "title": "FEA-Lösung",
  "subtitle": "Steifigkeitskern v4.2",
  "loadPreset": "Vorlage Laden",
  "selectTemplate": "— Vorlage Auswählen —",
  "toolSelect": "Auswählen",
  "toolNode": "Knoten",
  "toolTruss": "Fachwerk",
  "inspectorTitle": "Element-Inspektor",
  "selectTopology": "Topologie auswählen",
  "fixX": "Fixieren X",
  "fixY": "Fixieren Y",
  "forceVector": "Kraftvektor (N)",
  "area": "Querschnittsfläche",
  "modulus": "E-Modul",
  "dispScale": "Verschiebungsmaßstab",
  "visualization": "Visualisierung",
  "solved": "GELÖST",
  "unstable": "INSTABIL",
  "visualizerLabel": "Integrierter Topologie-Visualisierer",
  "critStress": "Kritische Spannung",
  "maxDisp": "Max. Verschiebung",
  "dof": "Freiheitsgrade",
  "presets": {
    "simpleBeamName": "Einfacher Balken",
    "simpleBeamDesc": "Zwei Auflager, ein belasteter oberer Knoten",
    "warrenName": "Warren-Fachwerk",
    "warrenDesc": "Triangulierte Brücke mit abwechselnden Diagonalen",
    "prattName": "Pratt-Fachwerk",
    "prattDesc": "Vertikalen mit Diagonalen zur Mitte"
  }
} as SimulationFeaStrings;

const FR: SimulationFeaStrings = {
  "title": "FEA-Lösung",
  "subtitle": "Steifigkeitskern v4.2",
  "loadPreset": "Vorlage Laden",
  "selectTemplate": "— Vorlage Auswählen —",
  "toolSelect": "Auswählen",
  "toolNode": "Knoten",
  "toolTruss": "Fachwerk",
  "inspectorTitle": "Element-Inspektor",
  "selectTopology": "Topologie auswählen",
  "fixX": "Fixieren X",
  "fixY": "Fixieren Y",
  "forceVector": "Kraftvektor (N)",
  "area": "Querschnittsfläche",
  "modulus": "E-Modul",
  "dispScale": "Verschiebungsmaßstab",
  "visualization": "Visualisierung",
  "solved": "GELÖST",
  "unstable": "INSTABIL",
  "visualizerLabel": "Integrierter Topologie-Visualisierer",
  "critStress": "Kritische Spannung",
  "maxDisp": "Max. Verschiebung",
  "dof": "Freiheitsgrade",
  "presets": {
    "simpleBeamName": "Einfacher Balken",
    "simpleBeamDesc": "Zwei Auflager, ein belasteter oberer Knoten",
    "warrenName": "Warren-Fachwerk",
    "warrenDesc": "Triangulierte Brücke mit abwechselnden Diagonalen",
    "prattName": "Pratt-Fachwerk",
    "prattDesc": "Vertikalen mit Diagonalen zur Mitte"
  }
} as SimulationFeaStrings;

const IT: SimulationFeaStrings = {
  "title": "FEA-Lösung",
  "subtitle": "Steifigkeitskern v4.2",
  "loadPreset": "Vorlage Laden",
  "selectTemplate": "— Vorlage Auswählen —",
  "toolSelect": "Auswählen",
  "toolNode": "Knoten",
  "toolTruss": "Fachwerk",
  "inspectorTitle": "Element-Inspektor",
  "selectTopology": "Topologie auswählen",
  "fixX": "Fixieren X",
  "fixY": "Fixieren Y",
  "forceVector": "Kraftvektor (N)",
  "area": "Querschnittsfläche",
  "modulus": "E-Modul",
  "dispScale": "Verschiebungsmaßstab",
  "visualization": "Visualisierung",
  "solved": "GELÖST",
  "unstable": "INSTABIL",
  "visualizerLabel": "Integrierter Topologie-Visualisierer",
  "critStress": "Kritische Spannung",
  "maxDisp": "Max. Verschiebung",
  "dof": "Freiheitsgrade",
  "presets": {
    "simpleBeamName": "Einfacher Balken",
    "simpleBeamDesc": "Zwei Auflager, ein belasteter oberer Knoten",
    "warrenName": "Warren-Fachwerk",
    "warrenDesc": "Triangulierte Brücke mit abwechselnden Diagonalen",
    "prattName": "Pratt-Fachwerk",
    "prattDesc": "Vertikalen mit Diagonalen zur Mitte"
  }
} as SimulationFeaStrings;

const PT: SimulationFeaStrings = {
  "title": "FEA-Lösung",
  "subtitle": "Steifigkeitskern v4.2",
  "loadPreset": "Vorlage Laden",
  "selectTemplate": "— Vorlage Auswählen —",
  "toolSelect": "Auswählen",
  "toolNode": "Knoten",
  "toolTruss": "Fachwerk",
  "inspectorTitle": "Element-Inspektor",
  "selectTopology": "Topologie auswählen",
  "fixX": "Fixieren X",
  "fixY": "Fixieren Y",
  "forceVector": "Kraftvektor (N)",
  "area": "Querschnittsfläche",
  "modulus": "E-Modul",
  "dispScale": "Verschiebungsmaßstab",
  "visualization": "Visualisierung",
  "solved": "GELÖST",
  "unstable": "INSTABIL",
  "visualizerLabel": "Integrierter Topologie-Visualisierer",
  "critStress": "Kritische Spannung",
  "maxDisp": "Max. Verschiebung",
  "dof": "Freiheitsgrade",
  "presets": {
    "simpleBeamName": "Einfacher Balken",
    "simpleBeamDesc": "Zwei Auflager, ein belasteter oberer Knoten",
    "warrenName": "Warren-Fachwerk",
    "warrenDesc": "Triangulierte Brücke mit abwechselnden Diagonalen",
    "prattName": "Pratt-Fachwerk",
    "prattDesc": "Vertikalen mit Diagonalen zur Mitte"
  }
} as SimulationFeaStrings;

const RU: SimulationFeaStrings = {
  "title": "FEA-Lösung",
  "subtitle": "Steifigkeitskern v4.2",
  "loadPreset": "Vorlage Laden",
  "selectTemplate": "— Vorlage Auswählen —",
  "toolSelect": "Auswählen",
  "toolNode": "Knoten",
  "toolTruss": "Fachwerk",
  "inspectorTitle": "Element-Inspektor",
  "selectTopology": "Topologie auswählen",
  "fixX": "Fixieren X",
  "fixY": "Fixieren Y",
  "forceVector": "Kraftvektor (N)",
  "area": "Querschnittsfläche",
  "modulus": "E-Modul",
  "dispScale": "Verschiebungsmaßstab",
  "visualization": "Visualisierung",
  "solved": "GELÖST",
  "unstable": "INSTABIL",
  "visualizerLabel": "Integrierter Topologie-Visualisierer",
  "critStress": "Kritische Spannung",
  "maxDisp": "Max. Verschiebung",
  "dof": "Freiheitsgrade",
  "presets": {
    "simpleBeamName": "Einfacher Balken",
    "simpleBeamDesc": "Zwei Auflager, ein belasteter oberer Knoten",
    "warrenName": "Warren-Fachwerk",
    "warrenDesc": "Triangulierte Brücke mit abwechselnden Diagonalen",
    "prattName": "Pratt-Fachwerk",
    "prattDesc": "Vertikalen mit Diagonalen zur Mitte"
  }
} as SimulationFeaStrings;

const JA: SimulationFeaStrings = {
  "title": "FEA解決",
  "subtitle": "剛性カーネル v4.2",
  "loadPreset": "プリセット読み込み",
  "selectTemplate": "— テンプレートを選択 —",
  "toolSelect": "選択",
  "toolNode": "ノード",
  "toolTruss": "トラス",
  "inspectorTitle": "要素インスペクター",
  "selectTopology": "トポロジーを選択してください",
  "fixX": "X軸固定",
  "fixY": "Y軸固定",
  "forceVector": "力ベクトル (N)",
  "area": "断面積",
  "modulus": "弾性係数",
  "dispScale": "変位スケール",
  "visualization": "視覚化",
  "solved": "解決済み",
  "unstable": "不安定",
  "visualizerLabel": "統合トポロジービジュアライザ",
  "critStress": "許容応力",
  "maxDisp": "最大変位",
  "dof": "自由度",
  "presets": {
    "simpleBeamName": "単純梁",
    "simpleBeamDesc": "2つの支持部と1つの荷重付き上部ノード",
    "warrenName": "ワーレントラス",
    "warrenDesc": "交互の対角線を持つ三角形の橋梁",
    "prattName": "プラットトラス",
    "prattDesc": "中心に向かう対角線を持つ垂直材"
  }
} as SimulationFeaStrings;

const ZH: SimulationFeaStrings = {
  "title": "FEA-Lösung",
  "subtitle": "Steifigkeitskern v4.2",
  "loadPreset": "Vorlage Laden",
  "selectTemplate": "— Vorlage Auswählen —",
  "toolSelect": "Auswählen",
  "toolNode": "Knoten",
  "toolTruss": "Fachwerk",
  "inspectorTitle": "Element-Inspektor",
  "selectTopology": "Topologie auswählen",
  "fixX": "Fixieren X",
  "fixY": "Fixieren Y",
  "forceVector": "Kraftvektor (N)",
  "area": "Querschnittsfläche",
  "modulus": "E-Modul",
  "dispScale": "Verschiebungsmaßstab",
  "visualization": "Visualisierung",
  "solved": "GELÖST",
  "unstable": "INSTABIL",
  "visualizerLabel": "Integrierter Topologie-Visualisierer",
  "critStress": "Kritische Spannung",
  "maxDisp": "Max. Verschiebung",
  "dof": "Freiheitsgrade",
  "presets": {
    "simpleBeamName": "Einfacher Balken",
    "simpleBeamDesc": "Zwei Auflager, ein belasteter oberer Knoten",
    "warrenName": "Warren-Fachwerk",
    "warrenDesc": "Triangulierte Brücke mit abwechselnden Diagonalen",
    "prattName": "Pratt-Fachwerk",
    "prattDesc": "Vertikalen mit Diagonalen zur Mitte"
  }
} as SimulationFeaStrings;

const KO: SimulationFeaStrings = {
  "title": "FEA-Lösung",
  "subtitle": "Steifigkeitskern v4.2",
  "loadPreset": "Vorlage Laden",
  "selectTemplate": "— Vorlage Auswählen —",
  "toolSelect": "Auswählen",
  "toolNode": "Knoten",
  "toolTruss": "Fachwerk",
  "inspectorTitle": "Element-Inspektor",
  "selectTopology": "Topologie auswählen",
  "fixX": "Fixieren X",
  "fixY": "Fixieren Y",
  "forceVector": "Kraftvektor (N)",
  "area": "Querschnittsfläche",
  "modulus": "E-Modul",
  "dispScale": "Verschiebungsmaßstab",
  "visualization": "Visualisierung",
  "solved": "GELÖST",
  "unstable": "INSTABIL",
  "visualizerLabel": "Integrierter Topologie-Visualisierer",
  "critStress": "Kritische Spannung",
  "maxDisp": "Max. Verschiebung",
  "dof": "Freiheitsgrade",
  "presets": {
    "simpleBeamName": "Einfacher Balken",
    "simpleBeamDesc": "Zwei Auflager, ein belasteter oberer Knoten",
    "warrenName": "Warren-Fachwerk",
    "warrenDesc": "Triangulierte Brücke mit abwechselnden Diagonalen",
    "prattName": "Pratt-Fachwerk",
    "prattDesc": "Vertikalen mit Diagonalen zur Mitte"
  }
} as SimulationFeaStrings;

const AR: SimulationFeaStrings = {
  "title": "FEA-Lösung",
  "subtitle": "Steifigkeitskern v4.2",
  "loadPreset": "Vorlage Laden",
  "selectTemplate": "— Vorlage Auswählen —",
  "toolSelect": "Auswählen",
  "toolNode": "Knoten",
  "toolTruss": "Fachwerk",
  "inspectorTitle": "Element-Inspektor",
  "selectTopology": "Topologie auswählen",
  "fixX": "Fixieren X",
  "fixY": "Fixieren Y",
  "forceVector": "Kraftvektor (N)",
  "area": "Querschnittsfläche",
  "modulus": "E-Modul",
  "dispScale": "Verschiebungsmaßstab",
  "visualization": "Visualisierung",
  "solved": "GELÖST",
  "unstable": "INSTABIL",
  "visualizerLabel": "Integrierter Topologie-Visualisierer",
  "critStress": "Kritische Spannung",
  "maxDisp": "Max. Verschiebung",
  "dof": "Freiheitsgrade",
  "presets": {
    "simpleBeamName": "Einfacher Balken",
    "simpleBeamDesc": "Zwei Auflager, ein belasteter oberer Knoten",
    "warrenName": "Warren-Fachwerk",
    "warrenDesc": "Triangulierte Brücke mit abwechselnden Diagonalen",
    "prattName": "Pratt-Fachwerk",
    "prattDesc": "Vertikalen mit Diagonalen zur Mitte"
  }
} as SimulationFeaStrings;

const BY_LOCALE: Record<Language, SimulationFeaStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getSimulationFeaStrings(locale: string): SimulationFeaStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
