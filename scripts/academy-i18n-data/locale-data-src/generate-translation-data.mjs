/**
 * Generates translation-data.mjs with LESSONS and EXTRAS for all target languages.
 * Run: node scripts/academy-i18n-data/locale-data-src/generate-translation-data.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const trUrl = pathToFileURL(path.join(__dirname, '..', 'langs', 'tr-academy-extras.mjs')).href;
const tr = await import(trUrl);

const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

// Per-language extras: walkthroughs, quizzes, practice (translated from TR structure)
const EXTRAS = {
  de: {
    walkthroughs: {
      'engineering-units-and-standards': {
        engineName: 'Einheitenumrechner-Kernel',
        sourceFile: 'schemas-v2/unit-converter',
        inputs: ['Quellwert', 'Quelleinheit', 'Zieleinheitenkategorie'],
        outputs: ['Umgerechneter Wert', 'SI-normalisierter Wert'],
        steps: [
          { title: 'Auf SI-Basis normalisieren', detail: 'Jeder Eingang wird vor der Berechnung in eine SI-Größe (m, kg, s, A, K, mol, cd) umgewandelt.', formula: 'value_SI = value × factor' },
          { title: 'Kategorieprüfung anwenden', detail: 'Länge kann nicht in Kraft umgerechnet werden — der Motor prüft dimensionslose Homogenität und lehnt gemischte Kategorien ab.' },
          { title: 'Genauigkeitsrundung', detail: 'Die Ausgabe wird gemäß Eingabegenauigkeit auf signifikante Stellen gerundet — passend zu Werkstattzeichnungen.' },
        ],
      },
      'fundamentals-of-statics': {
        engineName: 'Gleichgewichtslöser',
        sourceFile: 'schemas/truss-analysis',
        inputs: ['Knotenkoordinaten', 'Stabsteifigkeit', 'Angreifende Lasten', 'Lagerarten'],
        outputs: ['Reaktionskräfte', 'Stabnormalkräfte', 'Gleichgewichtsprüfung (ΣF, ΣM)'],
        steps: [
          { title: 'FBD-Matrix aufbauen', detail: 'Jeder Knoten wird ein Freiheitsgrad; Lasten und unbekannte Reaktionen werden in einen Kraftvektor zusammengefasst.' },
          { title: 'Gleichgewicht lösen', detail: 'Der Motor erzwingt ΣFx = 0, ΣFy = 0 an jedem freien Knoten — dieselben Regeln wie bei Handrechnung.', formula: 'ΣF = 0, ΣM = 0' },
          { title: 'Instabile Systeme markieren', detail: 'Mechanismen (Determinante null) werden erkannt und gemeldet statt sinnlose Zahlen auszugeben.' },
        ],
      },
      'introduction-to-machine-elements': {
        engineName: 'Maschinenelemente-Karte',
        sourceFile: 'schemas-v2/fasteners',
        inputs: ['Elementtyp', 'Lastpfad', 'Betriebsdrehzahl'],
        outputs: ['Empfohlenes Rechnermodul', 'Design-Check-Zusammenfassung'],
        steps: [
          { title: 'Element klassifizieren', detail: 'Schrauben, Lager, Zahnräder und Wellen leiten zu separaten ISO/DIN-Kernen in AluCalc OS.' },
          { title: 'Lastpfad verfolgen', detail: 'Leistung fließt Motor → Getriebe → Lager → Gehäuse. Jede Schnittstelle nutzt einen anderen Elementrechner.' },
          { title: 'Normen verknüpfen', detail: 'Gewindegeometrie nach ISO 965 speist direkt in den VDI-2230-Vorspannkern — ohne manuelle Eingabe.' },
        ],
      },
      'thread-geometry-standards': {
        engineName: 'Gewindegeometrie-Engine',
        sourceFile: 'schemas/thread-geometry',
        inputs: ['Gewindenorm (M, UN, Tr)', 'Nenn diameter', 'Steigung', 'Toleranzklasse'],
        outputs: ['Flankendurchmesser d2', 'Kerndurchmesser d1', 'Spannungsquerschnitt As', 'Bohrerdurchmesser'],
        steps: [
          { title: 'Profilwinkel auflösen', detail: 'Metrisch (60°), Whitworth (55°) und ACME (29°) nutzen unterschiedliche Höhen- und Stumpfformeln — Auswahl nach Norm.', formula: 'd2 = d − 0.6495P' },
          { title: 'Spannungsquerschnitt berechnen', detail: 'Zugspannungsfläche As nach ISO 898 (Flankendurchmesser), nicht physischem Kerndurchmesser.', formula: 'As = π/4 × (d − 0.9382P)²' },
          { title: 'An Schrauben-Engine übergeben', detail: 'd2, As und Steigung gehen ohne Copy-Paste in den VDI-2230-Drehmomentkern.' },
        ],
      },
      'how-to-calculate-bolt-torque': {
        engineName: 'VDI 2230 Schrauben-Engine',
        sourceFile: 'schemas-v2/fasteners + lib/fastener/sharedEngine.ts',
        inputs: ['Durchmesser d', 'Steigung P', 'Festigkeitsklasse', 'Reibung μ_thread, μ_head', 'Ausnutzung v'],
        outputs: ['Flankendurchmesser d2', 'Spannungsquerschnitt As', 'Vorspannkraft F_M', 'Anzugsmoment M_A'],
        steps: [
          { title: 'Geometrie aus Gewindetabellen', detail: 'Flankendurchmesser und Spannungsquerschnitt aus ISO-Metrikformeln, nicht nur Nenn diameter.', formula: 'd2 = d − 0.6495P' },
          { title: 'Vorspannung aus Streckgrenzennutzung', detail: 'Zulässige Vorspannkraft = Anteil v der Streckgrenze × Spannungsquerschnitt — wie VDI 2230 vereinfacht.', formula: 'F_M = v × Rp0.2 × A_s' },
          { title: 'Drehmoment mit getrennter Reibung', detail: 'Gewinde- und Kopfreibung getrennt. Kopfdurchmesser D_km aus ISO-4017-Kopfbreitentabellen.', formula: 'M_A = F_M × (0.16P + 0.58·d2·μ_t + D_km/2·μ_h)' },
          { title: 'K-Faktor-Shortcut prüfen', detail: 'Vereinfachtes T = K·F·d zum Vergleich; der Motor nutzt immer das volle VDI-Reibungsmodell.' },
        ],
      },
      'bearing-life-calculation-explained': {
        engineName: 'ISO 281 Lagerlebensdauer-Engine',
        sourceFile: 'schemas-v2/bearings.tsx',
        inputs: ['Dynamische Tragzahl C', 'Radiallast Fr', 'Axialast Fa', 'Drehzahl rpm', 'Lagertyp (Kugel/Rolle)'],
        outputs: ['Äquivalente Last P', 'Nennlebensdauer L10 (Mio. Umdr.)', 'Lebensdauer L10h (Stunden)'],
        steps: [
          { title: 'Äquivalente Last P', detail: 'Radial- und Axialasten kombiniert mit X/Y-Faktoren aus Fa/Fr und Fa/C0 — SKF-Methodik.', formula: 'P = X·Fr + Y·Fa' },
          { title: 'Nennlebensdauer', detail: 'Kugellager p = 3, Rollenlager p = 10/3 nach ISO 281.', formula: 'L10 = (C/P)^p' },
          { title: 'In Stunden umrechnen', detail: 'Umdrehungen werden mit Betriebsdrehzahl in Stunden umgerechnet.', formula: 'L10h = 10⁶ / (60 × n) × L10' },
          { title: 'Sicherheitshinweise', detail: 'P > C löst kritische Warnung aus; L10h < 1000 h empfiehlt größeres Lager.' },
        ],
      },
      'motor-power-calculation': {
        engineName: 'Kraftübertragungs-Engine',
        sourceFile: 'schemas-v2/belt-drive.tsx',
        inputs: ['Drehmoment T', 'Drehzahl n', 'Wirkungsgrad η', 'Betriebsfaktor'],
        outputs: ['Wellenleistung P', 'Erforderliche Motor-kW', 'Riemenspannung'],
        steps: [
          { title: 'Mechanische Leistung', detail: 'Rotationsleistung verknüpft Drehmoment und Winkelgeschwindigkeit.', formula: 'P = T × ω = T × 2πn/60' },
          { title: 'Verluste berücksichtigen', detail: 'Riemen-, Getriebe- und Lagerwirkungsgrade multiplizieren zu η — der Motor wendet jede Stufe nacheinander an.' },
          { title: 'Betriebsfaktor-Aufschlag', detail: 'Unterbrochener vs. Dauerbetrieb fügt Sicherheitsmultiplikator vor Motorauswahl hinzu.' },
        ],
      },
      'mechanics-of-materials-fundamentals': {
        engineName: 'Spannungs-Dehnungs-Engine',
        sourceFile: 'schemas/strength-analysis',
        inputs: ['Kraft F', 'Querschnittsfläche A', 'Elastizitätsmodul E', 'Länge L'],
        outputs: ['Normalspannung σ', 'Dehnung ε', 'Verlängerung δ'],
        steps: [
          { title: 'Normalspannung', detail: 'Axialkraft geteilt durch Fläche — Grundlage aller Festigkeitskriterien.', formula: 'σ = F/A' },
          { title: 'Hooke\'sche Dehnung', detail: 'Elastische Verformung bleibt bis zur Streckgrenze linear.', formula: 'ε = σ/E' },
          { title: 'Verformung', detail: 'Gesamtverlängerung integriert Dehnung über Messlänge.', formula: 'δ = F·L / (A·E)' },
        ],
      },
      'mohrs-circle-stress-analysis': {
        engineName: 'Mohr-Kreis-Kernel',
        sourceFile: 'schemas/mohrs-circle',
        inputs: ['σx', 'σy', 'τxy', 'Drehwinkel θ'],
        outputs: ['Hauptspannungen σ1, σ2', 'Max. Schubspannung τ_max', 'Ebenspannung bei θ'],
        steps: [
          { title: 'Mittelpunkt und Radius', detail: 'Kreismittelpunkt ist mittlere Normalspannung; Radius aus Schub- und Normalspannungsdifferenz.', formula: 'C = (σx+σy)/2, R = √[(σx−σy)/2)² + τxy²]' },
          { title: 'Hauptspannungen', detail: 'Maximale und minimale Normalspannungen dort, wo Schubspannung null ist.', formula: 'σ1,2 = C ± R' },
          { title: 'Interaktive Drehung', detail: 'Das Akademie-Labor dreht θ in Echtzeit — dieselbe Transformation wie der OS-Kernel für Ebenspannung.' },
        ],
      },
      'torsion-and-buckling-mechanics': {
        engineName: 'Stabilitäts-Engine',
        sourceFile: 'schemas/column-buckling',
        inputs: ['Länge L', 'Elastizitätsmodul E', 'Flächenträgheitsmoment I', 'Euler-Knicklänge K', 'Last P'],
        outputs: ['Kritische Knicklast Pcr', 'Schlankheitsgrad λ', 'Sicherheitsfaktor'],
        steps: [
          { title: 'Euler-Knicklast', detail: 'Schlanke Stäbe versagen durch Instabilität, nicht Materialfließen.', formula: 'Pcr = π²EI / (KL)²' },
          { title: 'Effektive Knicklänge K', detail: 'Gelenk-Gelenk K=1, eingespannt-frei K=2 — Motor mappt Lagerbedingungen auf K.' },
          { title: 'Torsionsprüfung', detail: 'Für Wellen wird maximale Torsionsschubspannung separat berechnet: τ = T·r/J.' },
        ],
      },
      'beam-deflection-formula-explained': {
        engineName: 'Balkendurchbiegungs-Engine',
        sourceFile: 'schemas-v2/beam-deflection.tsx',
        inputs: ['Spannweite L', 'Punktlast P', 'Modul E', 'Profiltyp & Abmessungen', 'Lagerbedingung'],
        outputs: ['Flächenträgheitsmoment Ix', 'Durchbiegung δ', 'Biegespannung σ', 'Steifigkeit k'],
        steps: [
          { title: 'Querschnittswert Ix', detail: 'I-, Kasten- und U-Profile nutzen zusammengesetzte Rechteckformeln — kein einfacher Tabellenlookup.', formula: 'Ix = Σ(I_rect + A·d²)' },
          { title: 'Lagerspezifische Durchbiegung', detail: 'Einfach gelagert Mitte vs. Kragarm Ende nutzen unterschiedliche Koeffizienten.', formula: 'δ = PL³/(48EI) oder PL³/(3EI)' },
          { title: 'Biegespannung', detail: 'Maximales Moment wird auf Faserspannung am äußeren Faserpunkt abgebildet.', formula: 'σ = M·y/I' },
          { title: 'Steifigkeitsausgabe', detail: 'Kraft pro Durchbiegung hilft bei Feder- und Schwingungsprüfungen.', formula: 'k = P/δ' },
        ],
      },
      'pressure-drop-calculation-guide': {
        engineName: 'Darcy-Weisbach Strömungs-Engine',
        sourceFile: 'schemas-v2/fluid-flow.tsx',
        inputs: ['Rohrdurchmesser D', 'Länge L', 'Volumenstrom Q', 'Dichte ρ', 'Viskosität μ', 'Rauheit ε'],
        outputs: ['Geschwindigkeit V', 'Reynolds-Zahl Re', 'Reibungsbeiwert f', 'Druckverlust ΔP'],
        steps: [
          { title: 'Geschwindigkeit aus Volumenstrom', detail: 'Kontinuität wandelt Volumenstrom in mittlere Rohrgeschwindigkeit um.', formula: 'V = Q / A' },
          { title: 'Reynolds-Zahl', detail: 'Laminar vs. turbulent bestimmt das Reibungsmodell.', formula: 'Re = ρVD/μ' },
          { title: 'Reibungsbeiwert f', detail: 'Swamee–Jain-Näherung löst Colebrook für turbulente Rohrströmung.' },
          { title: 'Darcy-Weisbach Druckverlust', detail: 'Motor liefert ΔP in Pa — dieselbe Formel für Pumpenauslegung.', formula: 'ΔP = f · (L/D) · (ρV²/2)' },
        ],
      },
      'chip-breaker-logic': {
        engineName: 'Bearbeitungsparameter-Engine',
        sourceFile: 'schemas/machining-grinding',
        inputs: ['Insert-Geometrie', 'Vorschub f', 'Schnitttiefe ap', 'Werkstückmaterial'],
        outputs: ['Spandicke h', 'Empfohlener Spanbrecher-Typ', 'Oberflächengüte-Schätzung'],
        steps: [
          { title: 'Spandicken-Schätzung', detail: 'Unzerschnittene Spandicke steuert Spanbrecherwahl — zu dünn reibt, zu dick nestet.', formula: 'h ≈ f · sin(κ)' },
          { title: 'Spanbrecher-Geometrie zuordnen', detail: 'J-, T- und W-Profile werden Kyocera-Katalog-Vorschub/Drehzahl-Bereichen zugeordnet.' },
          { title: 'Rauheits-Korrelation', detail: 'Vorschub und Eckenradius speisen theoretische Ra-Schätzung für QS-Planung.' },
        ],
      },
    },
    quizzes: {
      'engineering-units-and-standards': [
        { id: 'u1', question: 'Wie viele Millimeter entsprechen laut ISO-Definition 1 Zoll?', options: ['25,0 mm', '25,4 mm', '26,0 mm', '2,54 mm'], correctIndex: 1, explanation: 'Die exakte Umrechnung ist 25,4 mm/in — AluCalc nutzt diese Konstante im Einheitenumrechner.' },
        { id: 'u2', question: 'Welcher Fehler führte zum Verlust des Mars Climate Orbiter?', options: ['Falsches Schraubenmoment', 'Imperial-/Metrik-Mix', 'Falsche Lagerlebensdauer', 'Euler-Knickung'], correctIndex: 1, explanation: 'Navigationssoftware nutzte metrische Newton, Schubdaten waren in Pound-force.' },
        { id: 'u3', question: 'SI-Basiseinheit der Kraft:', options: ['Kilogramm (kg)', 'Newton (N)', 'Pound (lb)', 'Joule (J)'], correctIndex: 1, explanation: 'N = kg·m/s². Masse (kg) und Kraft (N) dürfen nie vertauscht werden.' },
      ],
      'fundamentals-of-statics': [
        { id: 's1', question: 'Statisches Gleichgewicht erfordert:', options: ['Nur ΣF ≠ 0', 'Nur ΣM ≠ 0', 'ΣF = 0 und ΣM = 0', 'Nur Nullgeschwindigkeit'], correctIndex: 2, explanation: 'Für einen ruhenden starren Körper sind Kraft- und Momentgleichgewicht nötig.' },
        { id: 's2', question: 'Erster Schritt bei jedem Statikproblem:', options: ['Euler-Knickung anwenden', 'Freikörperbild zeichnen', 'L10-Lebensdauer berechnen', 'Schraubenklasse wählen'], correctIndex: 1, explanation: 'Das FKB isoliert den Körper und zeigt alle äußeren Kräfte und Momente.' },
        { id: 's3', question: '100 N nach oben, Reaktion R nach unten — R gleich:', options: ['50 N', '100 N', '200 N', '0 N'], correctIndex: 1, explanation: 'ΣFy = 100 − R = 0 → R = 100 N. Dieselbe Logik wie im Fachwerklöser.' },
      ],
      'how-to-calculate-bolt-torque': [
        { id: 'b1', question: 'Was bedeutet der K-Faktor in T = K·F·d?', options: ['Schraubenklasse', 'Kombinierter Reib-/Mutterfaktor', 'Gewindesteigung', 'Sicherheitsfaktor'], correctIndex: 1, explanation: 'K fasst Gewinde- und Kopfreibung zusammen. AluCalc trennt sie im VDI-Motor.' },
        { id: 'b2', question: 'Überdrehen führt typischerweise zu:', options: ['Höherer Ermüdungslebensdauer', 'Fließen oder Gewindeausreißen', 'Geringerer Vorspannung', 'Nur besserer Dichtung'], correctIndex: 1, explanation: 'Streckgrenze überschreiten verursacht plastische Verformung — Vorspannung kann sinken.' },
        { id: 'b3', question: 'Gewindeschmierung bewirkt meist:', options: ['Mehr Drehmoment bei gleicher Vorspannung', 'Weniger erforderliches Drehmoment', 'Keinen Effekt', 'Verdoppelte Spannungsfläche'], correctIndex: 1, explanation: 'Geringere Reibung μ bedeutet weniger Drehmoment für dieselbe Klemmkraft F.' },
      ],
      'bearing-life-calculation-explained': [
        { id: 'br1', question: 'L10-Lebensdauer bedeutet:', options: ['10 % versagen vor dieser Lebensdauer', '90 % versagen vor dieser Lebensdauer', '100 % Überleben', 'Mindestens 10 Stunden'], correctIndex: 0, explanation: 'ISO 281: 90 % Zuverlässigkeit — 10 % der Lager versagen vor L10 unter äquivalenter Last P.' },
        { id: 'br2', question: 'Exponent p in L10 = (C/P)^p bei Kugellagern:', options: ['3', '10/3', '2', '1,5'], correctIndex: 0, explanation: 'Kugellager p = 3; Rollenlager p = 10/3 nach ISO 281.' },
        { id: 'br3', question: 'Wenn P > C (dynamische Tragzahl), dann:', options: ['Überdimensioniert', 'Schnelles Versagen — kritische Warnung', 'Unendliche Lebensdauer', 'Nur Schmierung nötig'], correctIndex: 1, explanation: 'AluCalc markiert P > C als kritisch — äquivalente Last übersteigt Katalogwert.' },
      ],
      'beam-deflection-formula-explained': [
        { id: 'bm1', question: 'Durchbiegung bei mittiger Last, einfach gelagert, skaliert mit L als:', options: ['L', 'L²', 'L³', 'L⁴'], correctIndex: 3, explanation: 'δ = PL³/(48EI) — Spannweite ist bei Gebrauchstauglichkeitsprüfungen am empfindlichsten.' },
        { id: 'bm2', question: 'Verdoppelt sich I, dann Durchbiegung:', options: ['Verdoppelt sich', 'Halbiert sich', 'Viertelt sich', 'Unverändert'], correctIndex: 1, explanation: 'δ ∝ 1/I — steiferer Querschnitt reduziert Durchbiegung proportional.' },
        { id: 'bm3', question: 'Euler-Bernoulli-Theorie setzt voraus:', options: ['Große Verformungen', 'Linear-elastisch, schlanke Balken', 'Plastisches Versagen', 'Nur Torsion'], correctIndex: 1, explanation: 'Kleine Drehungen, elastisches Material — Basis für Roark- und AISC-Grenzen.' },
      ],
      'pressure-drop-calculation-guide': [
        { id: 'p1', question: 'Darcy-Weisbach verknüpft ΔP mit:', options: ['Spannung und Strom', 'Reibungsbeiwert, L/D und Geschwindigkeitskopf', 'Schraubenvorspannung', 'Übersetzungsverhältnis'], correctIndex: 1, explanation: 'ΔP = f·(L/D)·(ρV²/2) — Strömungsmotor für Pumpenauslegung.' },
        { id: 'p2', question: 'Reynolds-Zahl Re > 4000 bedeutet meist:', options: ['Laminare Strömung', 'Turbulente Strömung', 'Ruhende Flüssigkeit', 'Vakuum'], correctIndex: 1, explanation: 'Re = ρVD/μ — Regime bestimmt gültige Reibungskorrelation.' },
        { id: 'p3', question: 'Bei gleichem Q verdoppelt sich Rohrdurchmesser — Geschwindigkeit:', options: ['4× höher', '4× niedriger', 'Unverändert', 'ΔP verdoppelt'], correctIndex: 1, explanation: 'V = Q/A und A ∝ D² — größeres Rohr senkt V und meist ΔP deutlich.' },
      ],
      'mohrs-circle-stress-analysis': [
        { id: 'm1', question: 'Hauptspannungen treten auf, wo:', options: ['Schub maximal', 'Schub null ist', 'Normalspannung null', 'Torsion null'], correctIndex: 1, explanation: 'In Hauptebenen τ = 0 — Mohr-Kreisradius liefert σ1, σ2 als Mittelpunkt ± R.' },
        { id: 'm2', question: 'Maximale Schubspannung gleich:', options: ['σ1 + σ2', 'Mohr-Kreisradius', 'Nur σ1', 'Immer null'], correctIndex: 1, explanation: 'τ_max = R = √[(σx−σy)/2)² + τxy²] — dieselbe Formel im OS-Mohr-Kernel.' },
        { id: 'm3', question: 'Drehen des Spannungselements ändert:', options: ['Hauptspannungen', 'Spannungskomponenten σ, τ in dieser Ebene', 'Elastizitätsmodul', 'Streckgrenze'], correctIndex: 1, explanation: 'σ1, σ2 bleiben; nur σ(θ) und τ(θ) ändern sich mit Orientierung.' },
      ],
      'introduction-to-machine-elements': [
        { id: 'me1', question: 'Welches Element überträgt Drehleistung primär auf Wellen?', options: ['Lager', 'Zahnrad oder Riemenantrieb', 'Unterlegscheibe', 'Nur Keil'], correctIndex: 1, explanation: 'Antriebselemente (Zahnrad, Riemen, Kette) wandeln Drehmoment und Drehzahl zwischen Wellen um.' },
        { id: 'me2', question: 'Warum Standard-Maschinenelemente?', options: ['Höhere Kosten', 'Austauschbarkeit und Katalogbezug', 'Eliminiert jede Analyse', 'Verhindert Wartung'], correctIndex: 1, explanation: 'ISO/DIN-Standardteile sind global aus Katalogen austauschbar ohne Sonderfertigung.' },
        { id: 'me3', question: 'Demontierbares Design ist wichtig, weil:', options: ['Verbindungen nie gewartet werden', 'Wartung und Prüfung trennbare Baugruppen erfordern', 'Schweißen immer schwächer', 'Schrauben veraltet'], correctIndex: 1, explanation: 'Bei bewusst nicht dauerhaften Verbindungen plant man Demontage und Austausch.' },
      ],
      'thread-geometry-standards': [
        { id: 'tg1', question: 'Profilwinkel ISO-Metrik und UN:', options: ['55°', '60°', '30°', '90°'], correctIndex: 1, explanation: 'Metrisch (M) und Unified National (UN) nutzen 60° — Whitworth 55°.' },
        { id: 'tg2', question: 'Toleranz 4h im Vergleich zu 6g:', options: ['Lockerer Pass', 'Engerer Präzisionspass', 'Gleicher Pass', 'Nur Rohrgewinde'], correctIndex: 1, explanation: '4h ist engere Toleranz für hohe Vibration oder Präzisionsmontage.' },
        { id: 'tg3', question: 'UN-Schraube in metrischem M-Loch:', options: ['Funktioniert problemlos', 'Zerstört Gewinde bei Montage', 'Erhöht Vorspannung', 'Senkt nur Reibung'], correctIndex: 1, explanation: 'Profil- und Steigungs-Mismatch reißt oder klemmt Gewinde — Systeme abstimmen.' },
      ],
      'chip-breaker-logic': [
        { id: 'cb1', question: 'TQ-Spanbrecher-Geometrie reduziert vor allem:', options: ['Gewindesteigung', 'Schnittkräfte und Vibration', 'Kühlmitteldruck', 'Nur Wellendrehzahl'], correctIndex: 1, explanation: 'Asymmetrische TQ-Spitzen steuern Spanfluss; Schnittkraft −15–21 %.' },
        { id: 'cb2', question: 'Modifizierter Flankenvorschub (3°–5°) hilft:', options: ['Wärme auf beiden Kanten erhöhen', 'Eine Insert-Kante zu belasten, Vibration zu senken', 'Kühlung entfernen', 'Schnitttiefe verdoppeln'], correctIndex: 1, explanation: 'Flankenvorschub verteilt Wärme und stabilisiert gegenüber rein radialem Vorschub.' },
        { id: 'cb3', question: 'Nestende Späne beim Gewindeschneiden führen zu:', options: ['Besserer Oberfläche', 'Werkzeugausfall und Ausschuss', 'Geringerer Schnittkraft', 'Immer längerer Standzeit'], correctIndex: 1, explanation: 'Unkontrollierte Späne wickeln sich um Werkzeug — Hauptursache für Insert-Ausfall.' },
      ],
      'motor-power-calculation': [
        { id: 'mp1', question: 'Motorleistung kW aus T (Nm) und n (rpm):', options: ['P = T × n', 'P = (T × n) / 9550', 'P = T / n', 'P = 9550 × T × n'], correctIndex: 1, explanation: 'P[kW] = T[Nm] × n[rpm] / 9550 — Standardgröße für Antriebe.' },
        { id: 'mp2', question: 'Getriebewirkungsgrad η < 1 bedeutet:', options: ['Motor braucht weniger Leistung', 'Motor muss mehr als Wellenleistung liefern', 'Drehmoment immer gleich', 'Drehzahl erhöht η'], correctIndex: 1, explanation: 'Übertragungsverluste erfordern höhere Motor-Nennleistung als Wellenleistung.' },
        { id: 'mp3', question: 'Typische Motor-Auslegungsreserve:', options: ['0 %', '15–20 % über berechneter Leistung', '50 % unter berechnet', 'Keine — exakte Übereinstimmung'], correctIndex: 1, explanation: 'Reserve deckt Fertigungstoleranzen, Alterung und Spitzenlast über Dauerbetrieb.' },
      ],
      'mechanics-of-materials-fundamentals': [
        { id: 'mom1', question: 'Normalspannung σ definiert als:', options: ['F × A', 'F / A', 'A / F', 'E × L'], correctIndex: 1, explanation: 'σ = F/A — innere Kraft pro Flächeneinheit senkrecht zur Last.' },
        { id: 'mom2', question: 'Hookesches Gesetz im elastischen Bereich:', options: ['σ = E / ε', 'ε = σ / E', 'ε = E × σ²', 'σ = konstant'], correctIndex: 1, explanation: 'Dehnung ε = σ/E verknüpft Spannung und Verformung vor Fließen.' },
        { id: 'mom3', question: 'Spannungskonzentration an Bohrung:', options: ['Senkt Spitzenspannung', 'Erhöht lokale Spannung über nominal σ', 'Kein Effekt', 'Nur bei Druck'], correctIndex: 1, explanation: 'Geometrische Kerben erhöhen lokale Spannung — Kt-Faktoren im Design.' },
      ],
      'torsion-and-buckling-mechanics': [
        { id: 'tb1', question: 'Euler-Knicklast Pcr skaliert mit L als:', options: ['L', 'L²', '1/L²', 'L³'], correctIndex: 2, explanation: 'Pcr = π²EI/(KL)² — doppelte Länge quarteriert kritische Last.' },
        { id: 'tb2', question: 'Welches I bestimmt Knickung?', options: ['Maximum I', 'Minimum I (schwache Achse)', 'Nur polares J', 'Mittel aus Ix und Iy'], correctIndex: 1, explanation: 'Stäbe knicken um schwächste Biegeachse — immer minimales I verwenden.' },
        { id: 'tb3', question: 'Polares Trägheitsmoment J dient für:', options: ['Stabknickung', 'Wellentorsion', 'Nur Balkendurchbiegung', 'Nur Druckbehälter'], correctIndex: 1, explanation: 'τ = Tr/J — J für Torsion; I für Biegung/Knickung.' },
      ],
    },
    practice: {
      'engineering-units-and-standards': { fields: { mm: { label: 'Länge', unit: 'mm' } }, results: { Inches: { label: 'Zoll', detail: 'mm ÷ 25,4' }, Meters: { label: 'Meter' } } },
      'fundamentals-of-statics': { fields: { F1: { label: 'Kraft nach oben', unit: 'N' }, F2: { label: 'Kraft nach unten', unit: 'N' } }, results: { 'Reaction R': { label: 'Reaktion R', detail: 'ΣFy = F1 − F2 − R = 0' }, Equilibrium: { label: 'Gleichgewicht' } } },
      'how-to-calculate-bolt-torque': { fields: { d: { label: 'Durchmesser', unit: 'mm' }, F: { label: 'Vorspannkraft', unit: 'N' }, K: { label: 'K-Faktor' } }, results: { 'T = K·F·d (shortcut)': { label: 'T = K·F·d (Kurzform)' }, 'VDI 2230 engine': { label: 'VDI-2230-Engine', detail: 'Volles Reibungsmodell aus sharedEngine.ts' } } },
      'bearing-life-calculation-explained': { fields: { C: { label: 'Dynamische Tragzahl C', unit: 'N' }, P: { label: 'Äquivalente Last P', unit: 'N' }, rpm: { label: 'Drehzahl', unit: 'rpm' } }, results: { L10: { label: 'L10', detail: 'Für Kugellager (C/P)³' }, L10h: { label: 'L10h' }, Status: { label: 'Status' } } },
      'beam-deflection-formula-explained': { fields: { P: { label: 'Mittige Last P', unit: 'N' }, L: { label: 'Spannweite L', unit: 'mm' }, E: { label: 'E', unit: 'GPa' }, I: { label: 'I', unit: 'mm⁴' } }, results: { 'Deflection δ': { label: 'Durchbiegung δ', detail: 'PL³/(48EI)' }, 'Max moment M': { label: 'Max. Moment M' }, 'L/δ ratio': { label: 'L/δ-Verhältnis' } } },
      'pressure-drop-calculation-guide': { fields: { L: { label: 'Rohrlänge', unit: 'm' }, D: { label: 'Durchmesser', unit: 'mm' }, Q: { label: 'Volumenstrom Q', unit: 'L/min' }, f: { label: 'Reibung f' } }, results: { 'Velocity V': { label: 'Geschwindigkeit V' }, 'ΔP (Darcy)': { label: 'ΔP (Darcy)', detail: 'f·(L/D)·ρV²/2' }, 'Head loss': { label: 'Druckverlust (Höhe)' } } },
      'mechanics-of-materials-fundamentals': { fields: { F: { label: 'Axialkraft F', unit: 'N' }, A: { label: 'Fläche A', unit: 'mm²' }, E: { label: 'E', unit: 'GPa' }, L: { label: 'Messlänge L', unit: 'mm' } }, results: { 'Stress σ': { label: 'Spannung σ', detail: 'F/A' }, 'Strain ε': { label: 'Dehnung ε' }, 'Elongation δ': { label: 'Verlängerung δ' } } },
      'motor-power-calculation': { fields: { T: { label: 'Drehmoment T', unit: 'Nm' }, n: { label: 'Drehzahl n', unit: 'rpm' }, eta: { label: 'Wirkungsgrad η' } }, results: { 'Shaft power': { label: 'Wellenleistung' }, 'Motor required': { label: 'Erforderlicher Motor', detail: 'Inkl. η-Verluste' } } },
      'torsion-and-buckling-mechanics': { fields: { E: { label: 'E', unit: 'GPa' }, I: { label: 'I', unit: 'mm⁴' }, L: { label: 'Stablänge L', unit: 'mm' }, K: { label: 'Knicklänge K' } }, results: { 'Euler Pcr': { label: 'Euler Pcr', detail: 'π²EI/(KL)²' }, 'Slenderness hint': { label: 'Schlankheitshinweis' } } },
      'thread-geometry-standards': { fields: { D: { label: 'Außendurchmesser D', unit: 'mm' }, P: { label: 'Steigung P', unit: 'mm' } }, results: { 'Pitch diameter d2 (approx)': { label: 'Flankendurchmesser d2 (ca.)', detail: 'ISO-Metrik-Näherung' }, 'Stress area As': { label: 'Spannungsquerschnitt As', detail: 'Für Vorspann-/Festigkeitsprüfung' }, 'Threads per mm': { label: 'Gänge pro mm' } } },
      'chip-breaker-logic': { fields: { feed: { label: 'Vorschub f', unit: 'mm/U' }, doc: { label: 'Schnitttiefe ap', unit: 'mm' }, Kc: { label: 'Kc', unit: 'N/mm²' }, length: { label: 'Gewindelänge', unit: 'mm' } }, results: { 'Cutting force Fc (approx)': { label: 'Schnittkraft Fc (ca.)', detail: 'Fc ∝ ap × f × Kc' }, 'Suggested passes': { label: 'Empfohlene Zustellungen', detail: 'Regel für Gewindeschneiden' }, 'Machining time hint': { label: 'Bearbeitungszeit-Hinweis', detail: 'Vereinfacht — im Bearbeitungsmotor prüfen' } } },
      'introduction-to-machine-elements': { fields: { torque: { label: 'Erforderliches Drehmoment', unit: 'Nm' }, speed: { label: 'Ausgangsdrehzahl', unit: 'rpm' }, element: { label: 'Elementtyp (1=Schraube,2=Lager,3=Zahnrad)' } }, results: { 'Transmitted power': { label: 'Übertragene Leistung', detail: 'P = T·n/9550' }, 'Suggested element family': { label: 'Empfohlene Elementfamilie' }, 'Next step': { label: 'Nächster Schritt' } } },
      'mohrs-circle-stress-analysis': { fields: { sx: { label: 'σx', unit: 'MPa' }, sy: { label: 'σy', unit: 'MPa' }, txy: { label: 'τxy', unit: 'MPa' } }, results: { 'Principal σ1': { label: 'Hauptspannung σ1' }, 'Principal σ2': { label: 'Hauptspannung σ2' }, 'τ_max': { label: 'τ_max', detail: 'Mohr-Kreisradius' } } },
    },
  },
};

// For remaining languages, clone TR extras structure with translated strings via lang packs from separate imports
const { LANG_EXTRAS } = await import('./lang-extras.mjs');
const { LANG_LESSONS } = await import('./lang-lessons.mjs');

const LESSONS = {};
const EXTRAS_OUT = { ...EXTRAS };

for (const lang of LANGS) {
  LESSONS[lang] = LANG_LESSONS[lang];
  if (!EXTRAS_OUT[lang]) EXTRAS_OUT[lang] = LANG_EXTRAS[lang];
}

const out = `/** Auto-generated — run generate-translation-data.mjs */
export const LESSONS = ${JSON.stringify(LESSONS, null, 2)};

export const EXTRAS = ${JSON.stringify(EXTRAS_OUT, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'translation-data.mjs'), out, 'utf8');
console.log('Wrote translation-data.mjs for', LANGS.join(', '));
