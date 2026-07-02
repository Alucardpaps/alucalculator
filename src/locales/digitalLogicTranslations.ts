import type { Language } from '@/store/i18nStore';

export type DigitalLogicStrings = {
  title: string;
  subtitle: string;
  description: string;
  gateInspector: string;
  clickToInspect: string;
  manualHigh: string;
  manualLow: string;
  outputLabel: string;
  inputLabel: string;
  inputALabel: string;
  inputBLabel: string;
  truthAnalysis: string;
  nodeId: string;
  type: string;
  outputHeader: string;
  signalTiming: string;
  clockingStatus: string;
  footerHelp: string;
  propagationPlane: string;
  gateDescriptions: {
    AND: string;
    OR: string;
    NOT: string;
    XOR: string;
    NAND: string;
    BUFFER: string;
  };
};

const EN: DigitalLogicStrings = {
  "title": "Logic Lab",
  "subtitle": "Binary Systems v2.8",
  "description": "Interactive digital logic gate simulator. Build combinational circuits by adding gates, connecting inputs to outputs, and observing real-time signal propagation through the truth table and oscilloscope.",
  "gateInspector": "Gate Inspector",
  "clickToInspect": "Click a gate on the canvas to inspect and configure its inputs.",
  "manualHigh": "Manual HIGH",
  "manualLow": "Manual LOW",
  "outputLabel": "Output",
  "inputLabel": "Input",
  "inputALabel": "Input A",
  "inputBLabel": "Input B",
  "truthAnalysis": "Truth Analysis",
  "nodeId": "Node ID",
  "type": "Type",
  "outputHeader": "Output",
  "signalTiming": "Signal Timing",
  "clockingStatus": "Clocking: Continuous",
  "footerHelp": "Select a gate to configure inputs. Use dropdowns to wire gates together.",
  "propagationPlane": "Real-Time Logic Propagation Plane",
  "gateDescriptions": {
    "AND": "Output is HIGH only when ALL inputs are HIGH",
    "OR": "Output is HIGH when ANY input is HIGH",
    "NOT": "Inverts the input signal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Output is HIGH when inputs DIFFER",
    "NAND": "Inverted AND — LOW only when all inputs HIGH",
    "BUFFER": "Passes input directly to output (signal conditioning)"
  }
} as DigitalLogicStrings;

const TR: DigitalLogicStrings = {
  "title": "Mantık Laboratuvarı",
  "subtitle": "İkili Sistemler v2.8",
  "description": "Etkileşimli dijital mantık kapısı simülatörü. Doğruluk tablosu ve osiloskop aracılığıyla gerçek zamanlı sinyal yayılımını gözlemleyerek kapılar ekleyin, girişleri çıkışlara bağlayın ve mantıksal devreler kurun.",
  "gateInspector": "Kapı Müfettişi",
  "clickToInspect": "Girişlerini incelemek ve yapılandırmak için tuvaldeki bir kapıya tıklayın.",
  "manualHigh": "Manuel HIGH (1)",
  "manualLow": "Manuel LOW (0)",
  "outputLabel": "Çıkış",
  "inputLabel": "Giriş",
  "inputALabel": "Giriş A",
  "inputBLabel": "Giriş B",
  "truthAnalysis": "Doğruluk Analizi",
  "nodeId": "Düğüm ID",
  "type": "Tip",
  "outputHeader": "Çıkış",
  "signalTiming": "Sinyal Zamanlaması",
  "clockingStatus": "Sinyal: Sürekli",
  "footerHelp": "Girişleri yapılandırmak için bir kapı seçin. Kapıları birbirine bağlamak için açılır menüleri kullanın.",
  "propagationPlane": "Gerçek Zamanlı Mantık Yayılım Düzlemi",
  "gateDescriptions": {
    "AND": "Çıkış sadece TÜM girişler HIGH olduğunda HIGH olur",
    "OR": "Çıkış HERHANGİ bir giriş HIGH olduğunda HIGH olur",
    "NOT": "Giriş sinyalini tersine çevirir (HIGH→LOW, LOW→HIGH)",
    "XOR": "Çıkış, girişler FARKLI olduğunda HIGH olur",
    "NAND": "Ters AND — Sadece tüm girişler HIGH olduğunda LOW olur",
    "BUFFER": "Girişi doğrudan çıkışa iletir (sinyal koşullandırma)"
  }
} as DigitalLogicStrings;

const DE: DigitalLogicStrings = {
  "title": "Logik-Labor",
  "subtitle": "Binärsysteme v2.8",
  "description": "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
  "gateInspector": "Gatter-Inspektor",
  "clickToInspect": "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
  "manualHigh": "Manuell HIGH",
  "manualLow": "Manuell LOW",
  "outputLabel": "Ausgang",
  "inputLabel": "Eingang",
  "inputALabel": "Eingang A",
  "inputBLabel": "Eingang B",
  "truthAnalysis": "Wahrheitsanalyse",
  "nodeId": "Knoten-ID",
  "type": "Gattertyp",
  "outputHeader": "Ausgang",
  "signalTiming": "Signalzeitverlauf",
  "clockingStatus": "Taktung: Kontinuierlich",
  "footerHelp": "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
  "propagationPlane": "Echtzeit-Logikfortpflanzungsebene",
  "gateDescriptions": {
    "AND": "Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind",
    "OR": "Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist",
    "NOT": "Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN",
    "NAND": "Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind",
    "BUFFER": "Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)"
  }
} as DigitalLogicStrings;

const ES: DigitalLogicStrings = {
  "title": "Logik-Labor",
  "subtitle": "Binärsysteme v2.8",
  "description": "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
  "gateInspector": "Gatter-Inspektor",
  "clickToInspect": "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
  "manualHigh": "Manuell HIGH",
  "manualLow": "Manuell LOW",
  "outputLabel": "Ausgang",
  "inputLabel": "Eingang",
  "inputALabel": "Eingang A",
  "inputBLabel": "Eingang B",
  "truthAnalysis": "Wahrheitsanalyse",
  "nodeId": "Knoten-ID",
  "type": "Gattertyp",
  "outputHeader": "Ausgang",
  "signalTiming": "Signalzeitverlauf",
  "clockingStatus": "Taktung: Kontinuierlich",
  "footerHelp": "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
  "propagationPlane": "Echtzeit-Logikfortpflanzungsebene",
  "gateDescriptions": {
    "AND": "Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind",
    "OR": "Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist",
    "NOT": "Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN",
    "NAND": "Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind",
    "BUFFER": "Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)"
  }
} as DigitalLogicStrings;

const FR: DigitalLogicStrings = {
  "title": "Logik-Labor",
  "subtitle": "Binärsysteme v2.8",
  "description": "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
  "gateInspector": "Gatter-Inspektor",
  "clickToInspect": "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
  "manualHigh": "Manuell HIGH",
  "manualLow": "Manuell LOW",
  "outputLabel": "Ausgang",
  "inputLabel": "Eingang",
  "inputALabel": "Eingang A",
  "inputBLabel": "Eingang B",
  "truthAnalysis": "Wahrheitsanalyse",
  "nodeId": "Knoten-ID",
  "type": "Gattertyp",
  "outputHeader": "Ausgang",
  "signalTiming": "Signalzeitverlauf",
  "clockingStatus": "Taktung: Kontinuierlich",
  "footerHelp": "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
  "propagationPlane": "Echtzeit-Logikfortpflanzungsebene",
  "gateDescriptions": {
    "AND": "Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind",
    "OR": "Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist",
    "NOT": "Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN",
    "NAND": "Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind",
    "BUFFER": "Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)"
  }
} as DigitalLogicStrings;

const IT: DigitalLogicStrings = {
  "title": "Logik-Labor",
  "subtitle": "Binärsysteme v2.8",
  "description": "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
  "gateInspector": "Gatter-Inspektor",
  "clickToInspect": "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
  "manualHigh": "Manuell HIGH",
  "manualLow": "Manuell LOW",
  "outputLabel": "Ausgang",
  "inputLabel": "Eingang",
  "inputALabel": "Eingang A",
  "inputBLabel": "Eingang B",
  "truthAnalysis": "Wahrheitsanalyse",
  "nodeId": "Knoten-ID",
  "type": "Gattertyp",
  "outputHeader": "Ausgang",
  "signalTiming": "Signalzeitverlauf",
  "clockingStatus": "Taktung: Kontinuierlich",
  "footerHelp": "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
  "propagationPlane": "Echtzeit-Logikfortpflanzungsebene",
  "gateDescriptions": {
    "AND": "Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind",
    "OR": "Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist",
    "NOT": "Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN",
    "NAND": "Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind",
    "BUFFER": "Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)"
  }
} as DigitalLogicStrings;

const PT: DigitalLogicStrings = {
  "title": "Logik-Labor",
  "subtitle": "Binärsysteme v2.8",
  "description": "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
  "gateInspector": "Gatter-Inspektor",
  "clickToInspect": "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
  "manualHigh": "Manuell HIGH",
  "manualLow": "Manuell LOW",
  "outputLabel": "Ausgang",
  "inputLabel": "Eingang",
  "inputALabel": "Eingang A",
  "inputBLabel": "Eingang B",
  "truthAnalysis": "Wahrheitsanalyse",
  "nodeId": "Knoten-ID",
  "type": "Gattertyp",
  "outputHeader": "Ausgang",
  "signalTiming": "Signalzeitverlauf",
  "clockingStatus": "Taktung: Kontinuierlich",
  "footerHelp": "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
  "propagationPlane": "Echtzeit-Logikfortpflanzungsebene",
  "gateDescriptions": {
    "AND": "Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind",
    "OR": "Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist",
    "NOT": "Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN",
    "NAND": "Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind",
    "BUFFER": "Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)"
  }
} as DigitalLogicStrings;

const RU: DigitalLogicStrings = {
  "title": "Logik-Labor",
  "subtitle": "Binärsysteme v2.8",
  "description": "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
  "gateInspector": "Gatter-Inspektor",
  "clickToInspect": "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
  "manualHigh": "Manuell HIGH",
  "manualLow": "Manuell LOW",
  "outputLabel": "Ausgang",
  "inputLabel": "Eingang",
  "inputALabel": "Eingang A",
  "inputBLabel": "Eingang B",
  "truthAnalysis": "Wahrheitsanalyse",
  "nodeId": "Knoten-ID",
  "type": "Gattertyp",
  "outputHeader": "Ausgang",
  "signalTiming": "Signalzeitverlauf",
  "clockingStatus": "Taktung: Kontinuierlich",
  "footerHelp": "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
  "propagationPlane": "Echtzeit-Logikfortpflanzungsebene",
  "gateDescriptions": {
    "AND": "Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind",
    "OR": "Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist",
    "NOT": "Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN",
    "NAND": "Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind",
    "BUFFER": "Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)"
  }
} as DigitalLogicStrings;

const JA: DigitalLogicStrings = {
  "title": "論理回路ラボ",
  "subtitle": "バイナリシステム v2.8",
  "description": "インタラクティブなデジタル論理ゲートシミュレータ。ゲートを追加し、入力を出力に接続し、真理値表とオシロスコープを介してリアルタイムの信号伝播を観察することにより、組み合わせ回路を構築します。",
  "gateInspector": "ゲートインスペクター",
  "clickToInspect": "キャンバス上のゲートをクリックして、入力を検査および設定します。",
  "manualHigh": "手動 HIGH",
  "manualLow": "手動 LOW",
  "outputLabel": "出力",
  "inputLabel": "入力",
  "inputALabel": "入力 A",
  "inputBLabel": "入力 B",
  "truthAnalysis": "真理値分析",
  "nodeId": "ノード ID",
  "type": "タイプ",
  "outputHeader": "出力",
  "signalTiming": "信号タイミング",
  "clockingStatus": "クロック: 連続",
  "footerHelp": "ゲートを選択して入力を設定します。ドロップダウンを使用してゲート間を配線します。",
  "propagationPlane": "リアルタイムロジック伝播プレーン",
  "gateDescriptions": {
    "AND": "すべての入力がHIGHの場合のみ出力がHIGHになります",
    "OR": "いずれかの入力がHIGHの場合に出力がHIGHになります",
    "NOT": "入力信号を反転します (HIGH→LOW, LOW→HIGH)",
    "XOR": "入力が異なる場合に出力がHIGHになります",
    "NAND": "反反転AND — すべての入力がHIGHの場合のみLOWになります",
    "BUFFER": "入力を直接出力に渡します（信号調整）"
  }
} as DigitalLogicStrings;

const ZH: DigitalLogicStrings = {
  "title": "Logik-Labor",
  "subtitle": "Binärsysteme v2.8",
  "description": "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
  "gateInspector": "Gatter-Inspektor",
  "clickToInspect": "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
  "manualHigh": "Manuell HIGH",
  "manualLow": "Manuell LOW",
  "outputLabel": "Ausgang",
  "inputLabel": "Eingang",
  "inputALabel": "Eingang A",
  "inputBLabel": "Eingang B",
  "truthAnalysis": "Wahrheitsanalyse",
  "nodeId": "Knoten-ID",
  "type": "Gattertyp",
  "outputHeader": "Ausgang",
  "signalTiming": "Signalzeitverlauf",
  "clockingStatus": "Taktung: Kontinuierlich",
  "footerHelp": "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
  "propagationPlane": "Echtzeit-Logikfortpflanzungsebene",
  "gateDescriptions": {
    "AND": "Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind",
    "OR": "Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist",
    "NOT": "Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN",
    "NAND": "Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind",
    "BUFFER": "Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)"
  }
} as DigitalLogicStrings;

const KO: DigitalLogicStrings = {
  "title": "Logik-Labor",
  "subtitle": "Binärsysteme v2.8",
  "description": "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
  "gateInspector": "Gatter-Inspektor",
  "clickToInspect": "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
  "manualHigh": "Manuell HIGH",
  "manualLow": "Manuell LOW",
  "outputLabel": "Ausgang",
  "inputLabel": "Eingang",
  "inputALabel": "Eingang A",
  "inputBLabel": "Eingang B",
  "truthAnalysis": "Wahrheitsanalyse",
  "nodeId": "Knoten-ID",
  "type": "Gattertyp",
  "outputHeader": "Ausgang",
  "signalTiming": "Signalzeitverlauf",
  "clockingStatus": "Taktung: Kontinuierlich",
  "footerHelp": "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
  "propagationPlane": "Echtzeit-Logikfortpflanzungsebene",
  "gateDescriptions": {
    "AND": "Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind",
    "OR": "Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist",
    "NOT": "Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN",
    "NAND": "Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind",
    "BUFFER": "Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)"
  }
} as DigitalLogicStrings;

const AR: DigitalLogicStrings = {
  "title": "Logik-Labor",
  "subtitle": "Binärsysteme v2.8",
  "description": "Interaktiver digitaler Logikgatter-Simulator. Bauen Sie kombinatorische Schaltungen auf, indem Sie Gatter hinzufügen, Eingänge mit Ausgängen verbinden und die Echtzeit-Signalübertragung durch die Wahrheitstabelle und das Oszilloskop beobachten.",
  "gateInspector": "Gatter-Inspektor",
  "clickToInspect": "Klicken Sie auf ein Gatter auf der Arbeitsfläche, um seine Eingänge zu inspizieren und zu konfigurieren.",
  "manualHigh": "Manuell HIGH",
  "manualLow": "Manuell LOW",
  "outputLabel": "Ausgang",
  "inputLabel": "Eingang",
  "inputALabel": "Eingang A",
  "inputBLabel": "Eingang B",
  "truthAnalysis": "Wahrheitsanalyse",
  "nodeId": "Knoten-ID",
  "type": "Gattertyp",
  "outputHeader": "Ausgang",
  "signalTiming": "Signalzeitverlauf",
  "clockingStatus": "Taktung: Kontinuierlich",
  "footerHelp": "Wählen Sie ein Gatter aus, um Eingänge zu konfigurieren. Verwenden Sie Dropdowns, um Gatter zu verbinden.",
  "propagationPlane": "Echtzeit-Logikfortpflanzungsebene",
  "gateDescriptions": {
    "AND": "Ausgang ist nur HIGH, wenn ALLE Eingänge HIGH sind",
    "OR": "Ausgang ist HIGH, wenn MINDESTENS ein Eingang HIGH ist",
    "NOT": "Invertiert das Eingangssignal (HIGH→LOW, LOW→HIGH)",
    "XOR": "Ausgang ist HIGH, wenn sich die Eingänge UNTERSCHEIDEN",
    "NAND": "Invertiertes AND — nur LOW, wenn alle Eingänge HIGH sind",
    "BUFFER": "Gibt den Eingang direkt an den Ausgang weiter (Signalkonditionierung)"
  }
} as DigitalLogicStrings;

const BY_LOCALE: Record<Language, DigitalLogicStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getDigitalLogicStrings(locale: string): DigitalLogicStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
