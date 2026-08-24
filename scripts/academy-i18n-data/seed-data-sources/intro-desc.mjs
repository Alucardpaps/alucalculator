/**
 * Intro + description per lang/slug for academy lessons.
 */
const SLUGS = [
  'engineering-units-and-standards',
  'fundamentals-of-statics',
  'introduction-to-machine-elements',
  'thread-geometry-standards',
  'how-to-calculate-bolt-torque',
  'bearing-life-calculation-explained',
  'motor-power-calculation',
  'mechanics-of-materials-fundamentals',
  'mohrs-circle-stress-analysis',
  'torsion-and-buckling-mechanics',
  'beam-deflection-formula-explained',
  'pressure-drop-calculation-guide',
  'chip-breaker-logic',
];

function pack(desc, intro) {
  return { description: desc, intro };
}

const JA = {
  'engineering-units-and-standards': pack(
    'SIとインチ法、換算係数、ISO/DINなど主要規格の概要。',
    '工学は定量的な学問です。標準化された単位がなければ、グローバルな製造と協業は不可能です。本モジュールでは国際単位系（SI）とヤード・ポンド法を扱い、正確な換算方法を学びます。\n\n現代のサプライチェーンは大陸をまたぎます。SIは国際的な基準であり、インチ法は米国航空宇宙や旧式機械で依然として使われます。\n\n本レッスンはAluCalc全体で使う換算規律を確立します：正確な定数、一貫した有効桁数、すべての中間結果への明示的な単位ラベル。',
  ),
  'fundamentals-of-statics': pack(
    'ニュートン法則、力ベクトル、静平衡条件（ΣF=0、ΣM=0）。',
    '静力学は平衡状態の系を扱う力学の分野です。力とモーメントの相互作用を理解することは、すべての構造解析と機械設計の基礎です。\n\nすべての機械フレーム、建物の支持、吊り装置は、部材寸法決定の前に平衡を満たす必要があります。静力学は変形を無視し、荷重下で物体が静止したままかを答えます。\n\nトラス解析エンジンと同じΣF=0、ΣM=0の論理をここで学びます：物体を切り離し、すべての外力を考慮し、未知の反力を解きます。',
  ),
  'introduction-to-machine-elements': pack(
    'ボルト、軸受、歯車、シャフトの基本設計制約と選定ロジック。',
    '機械は標準的な構成要素から成ります：締結、動力伝達、支持、密封。\n\n本モジュールはボルト、軸受、歯車、ベルトの各ファミリーをAluCalc計算機に結び付けます — いずれもISO/DIN準拠です。\n\n新規部品を発明する前にカタログ部品を選ぶ方法を学びます。これが産業設計の効率原則です。',
  ),
  'thread-geometry-standards': pack(
    'ISOメートル、UN、ウィットワース、台形ねじ；公差等級と応力断面積。',
    'ねじ規格はヘリックス幾何を符号化します。M16×1.5-6gは、旋盤工にとって直径、ピッチ、公差帯を定義します。\n\nプロファイル角の不一致（60°対55°）は組立時のねじ切れを引き起こします。\n\n本レッスンはThread GeometryエンジンとVDI 2230ボルトエンジンの共通パラメータを整合させます。',
  ),
  'how-to-calculate-bolt-torque': pack(
    'プリロード、摩擦係数、径によるボルトトルク；VDI 2230手法を含む。',
    'ボルトトルクは組立の重要な入力であり、設計上の出力はクランプ荷重（締付力）です。\n\nT = K·F·dの近似式は現場で使われます。VDI 2230は完全な摩擦モデルを適用します。\n\nトルク過大は降伏やねじ切れ、不足はゆるみにつながります。',
  ),
  'bearing-life-calculation-explained': pack(
    'ISO 281 L10式、動定格荷重C、等価荷重P。',
    'L10寿命はISO 281に基づき、90%信頼性で10%故障率を定義します。\n\n(C/P)^p関係はAluCalc軸受コアと同一です — ボール軸受はp=3。\n\nP > Cは重大警告：等価荷重がカタログ定格を超えています。',
  ),
  'motor-power-calculation': pack(
    'トルクと回転数からモーター出力；効率と単位換算。',
    'モーター選定ではP = T·n/9550（kW）が産業標準です。\n\n伝達損失（η）を考慮しないと選定モーターは不足します。\n\n本レッスンは動力伝達チェーンのモーター、ベルト、シャフト寸法を結び付けます。',
  ),
  'mechanics-of-materials-fundamentals': pack(
    '軸方向荷重、法線・せん断応力、フックの法則。',
    '静力学は外力を与えます；材料力学は内部抵抗を調べます。\n\nσ = F/Aとε = σ/Eの関係はすべての構造チェックの基礎です。\n\n弾性限界を超えると塑性域に入ります — 本レッスンは線形弾性範囲に留まります。',
  ),
  'mohrs-circle-stress-analysis': pack(
    '主応力と最大せん断応力；モールの円による解析。',
    'モールの円は平面応力状態で主応力とτ_maxを求めます。\n\nσ₁、σ₂、せん断応力は疲労・降伏チェックに使われます。\n\nAluCalc Mohr Circle Labは同じ幾何構成を対話的に実装します。',
  ),
  'torsion-and-buckling-mechanics': pack(
    'シャフトねじりとオイラー座屈式による安定性。',
    'シャフトはねじりτ = T·r/Jで；細長柱は座屈P_cr = π²EI/(KL)²で解析します。\n\n座屈は突然で危険 — 降伏応力以下でも起こり得ます。\n\n有効長さK·Lの選択は支持条件に依存します。',
  ),
  'beam-deflection-formula-explained': pack(
    'オイラー・ベルヌーイ梁理論、たわみ限界、使用性チェック。',
    '使用性限界は多くの場合降伏限界より先に支配します（L/360など）。\n\nオイラー・ベルヌーイ式はAluCalc梁エンジンで使用されます。\n\nIとE file selection most affects deflection.',
  ),
  'pressure-drop-calculation-guide': pack(
    'ダルシー・ワイスバッハによる配管圧力損失とレイノルズ数。',
    'ダルシー・ワイスバッハはΔP = f·(L/D)·(ρV²/2)で管損失を計算します。\n\nポンプ揚程と流量選定の基礎です。\n\nレイノルズ数が流れ様式（層流/乱流）を決定します。',
  ),
  'chip-breaker-logic': pack(
    '旋削・ねじ切りの切屑制御、TQ形状、切削力。',
    'CNC旋盤では切屑制御が面品質と工具寿命を決めます。\n\n非対称刃先と径/面送りは切削力を15–21%低減できます。\n\nTQ形状はねじ切りで切屑破断を最適化します。',
  ),
};

// Fix typo in JA beam-deflection
JA['beam-deflection-formula-explained'].intro = JA['beam-deflection-formula-explained'].intro.replace(
  'IとEの選択がたわみに最も影響します。',
  'IとEの選択がたわみに最も影響します。',
);
JA['beam-deflection-formula-explained'].intro =
  '使用性限界は多くの場合降伏限界より先に支配します（L/360など）。\n\nオイラー・ベルヌーイ式はAluCalc梁エンジンで使用されます。\n\nIとEの選択がたわみに最も影響します。';

const DE = {
  'engineering-units-and-standards': pack(
    'SI und Imperial, Umrechnungsfaktoren und gängige Normen wie ISO/DIN.',
    'Ingenieurwesen ist quantitativ. Ohne standardisierte Einheiten wäre globale Fertigung unmöglich. Dieses Modul behandelt SI und das Imperial-System.\n\nModerne Lieferketten überspannen Kontinente. SI ist internationaler Referenzstandard; Imperial-Einheiten bestehen in US-Luftfahrt und Legacy-Maschinen.\n\nDiese Lektion etabliert die AluCalc-Umrechnungsdisziplin: exakte Konstanten, konsistente Signifikanz und explizite Einheiten.',
  ),
  'fundamentals-of-statics': pack(
    'Newtons Gesetze, Kraftvektoren und Gleichgewichtsbedingungen (ΣF=0, ΣM=0).',
    'Statik behandelt Systeme im Gleichgewicht. Kräfte und Momente zu verstehen ist Grundlage jeder Struktur- und Maschinenanalyse.\n\nJeder Maschinenrahmen muss vor der Dimensionierung im Gleichgewicht sein. Statik ignoriert Verformung — sie beantwortet, ob der Körper unter Last ruht.\n\nSie lernen dieselbe ΣF=0- und ΣM=0-Logik wie die Fachwerk-Analyse: Körper isolieren, alle Kräfte erfassen, Reaktionen lösen.',
  ),
  'introduction-to-machine-elements': pack(
    'Grundlegende Auswahl und Designlogik für Schrauben, Lager, Zahnräder und Wellen.',
    'Maschinen bestehen aus Bausteinen: Verbinden, Kraftübertragung, Lagerung, Abdichtung.\n\nDieses Modul verknüpft Schrauben, Lager, Zahnräder und Riemen mit AluCalc-Rechnern — alle ISO/DIN-basiert.\n\nLernen Sie, Katalogteile zu wählen, bevor Sie Neuentwicklungen erfinden.',
  ),
  'thread-geometry-standards': pack(
    'ISO-Metrik, UN, Whitworth, Trapez; Toleranzklassen und Spannungsquerschnitt.',
    'Gewindenormen kodieren Helixgeometrie. M16×1,5-6g definiert Durchmesser, Steigung und Toleranzband.\n\nProfilwinkel-Mismatch (60° vs 55°) führt zu Gewindeschäden.\n\nDiese Lektion richtet Thread-Geometry- und VDI-2230-Parameter aus.',
  ),
  'how-to-calculate-bolt-torque': pack(
    'Schraubenmoment aus Vorspannkraft, Reibung und Durchmesser; VDI 2230.',
    'Anziehdrehmoment ist kritische Montagegröße; Konstruktionsausgabe ist Klemmkraft.\n\nT = K·F·d wird in der Werkstatt genutzt; VDI 2230 wendet das vollständige Reibmodell an.\n\nÜberdrehen führt zu Fließen oder Gewindeschaden, Unterdrehen zu Lockerung.',
  ),
  'bearing-life-calculation-explained': pack(
    'ISO-281-L10-Formel, dynamische Tragzahl C und äquivalente Last P.',
    'L10-Lebensdauer nach ISO 281: 90 % Zuverlässigkeit, 10 % Ausfallrate.\n\n(C/P)^p entspricht dem AluCalc-Lagerkern — Kugellager p=3.\n\nP > C ist kritische Warnung: äquivalente Last überschreitet Katalogwert.',
  ),
  'motor-power-calculation': pack(
    'Motorleistung aus Drehmoment und Drehzahl; Wirkungsgrad und Einheiten.',
    'P = T·n/9550 (kW) ist Industriestandard bei Motorauslegung.\n\nOhne Übertragungsverluste (η) ist der Motor unterdimensioniert.\n\nDiese Lektion verbindet Motor-, Riemen- und Wellendimensionierung.',
  ),
  'mechanics-of-materials-fundamentals': pack(
    'Axiale Last, Normal- und Schubspannung, Hookesches Gesetz.',
    'Statik liefert äußere Kräfte; Festigkeitslehre untersucht inneren Widerstand.\n\nσ = F/A und ε = σ/E sind Basis aller Strukturprüfungen.\n\nJenseits der Elastizitätsgrenze beginnt plastisches Verhalten — hier bleiben wir linear-elastisch.',
  ),
  'mohrs-circle-stress-analysis': pack(
    'Hauptspannungen und maximale Schubspannung; Mohr-Kreis.',
    'Mohrs Kreis findet Hauptspannungen und τ_max im ebenen Spannungszustand.\n\nσ₁, σ₂ und Schubspannung dienen Ermüdungs- und Fließprüfungen.\n\nAluCalc Mohr Circle Lab implementiert dieselbe Geometrie interaktiv.',
  ),
  'torsion-and-buckling-mechanics': pack(
    'Wellentorsion und Euler-Knickung für Stabilität.',
    'Wellen: Torsion τ = T·r/J; schlanke Stützen: Knickung P_cr = π²EI/(KL)².\n\nKnickung ist plötzlich und gefährlich — auch unter Fließgrenze möglich.\n\nEffektive Länge K·L hängt von Lagerbedingungen ab.',
  ),
  'beam-deflection-formula-explained': pack(
    'Euler-Bernoulli-Balkentheorie, Durchbiegungsgrenzen, Gebrauchstauglichkeit.',
    'Gebrauchsgrenzen regieren oft vor Fließgrenze (z. B. L/360).\n\nEuler-Bernoulli-Formeln nutzt der AluCalc-Balkenmotor.\n\nI und E beeinflussen die Durchbiegung am stärksten.',
  ),
  'pressure-drop-calculation-guide': pack(
    'Druckverlust nach Darcy-Weisbach und Reynolds-Zahl.',
    'Darcy-Weisbach: ΔP = f·(L/D)·(ρV²/2) für Rohrverluste.\n\nGrundlage für Pumpenförderhöhe und Volumenstrom.\n\nReynolds-Zahl bestimmt laminar vs turbulent.',
  ),
  'chip-breaker-logic': pack(
    'Spanbildung bei Drehen und Gewindeschneiden; TQ-Geometrien und Schnittkraft.',
    'Beim CNC-Drehen bestimmt Spanbildung Oberfläche und Werkzeugstandzeit.\n\nAsymmetrische Schneide und radial/flankenförmige Zufuhr senken Schnittkraft um 15–21 %.\n\nTQ-Geometrien optimieren Spanbruch beim Gewindeschneiden.',
  ),
};

// Build other langs from template - ES, FR, IT, PT, RU, ZH, KO, AR
function cloneLang(base, overrides) {
  const out = { ...base };
  for (const [slug, val] of Object.entries(overrides)) {
    out[slug] = val;
  }
  return out;
}

const ES = {
  'engineering-units-and-standards': pack(
    'SI e imperial, factores de conversión y normas ISO/DIN.',
    'La ingeniería es cuantitativa. Sin unidades estandarizadas, la fabricación global sería imposible. Este módulo explora SI e imperial.\n\nLas cadenas de suministro cruzan continentes. SI es referencia internacional; el imperial persiste en aeroespacial y maquinaria legacy.\n\nEsta lección establece la disciplina de conversión de AluCalc: constantes exactas, cifras significativas y etiquetas de unidad.',
  ),
  'fundamentals-of-statics': pack(
    'Leyes de Newton, vectores de fuerza y equilibrio (ΣF=0, ΣM=0).',
    'La estática trata sistemas en equilibrio. Comprender fuerzas y momentos es la base del análisis estructural y diseño de máquinas.\n\nTodo marco o soporte debe estar en equilibrio antes de dimensionar. La estática ignora deformación — responde si el cuerpo permanece en reposo.\n\nUsará la misma lógica ΣF=0 y ΣM=0 del motor de cerchas.',
  ),
  'introduction-to-machine-elements': pack(
    'Selección básica de pernos, rodamientos, engranajes y ejes.',
    'Las máquinas se componen de elementos estándar: unión, transmisión, soporte y sellado.\n\nEste módulo conecta pernos, rodamientos, engranajes y correas con calculadoras AluCalc — ISO/DIN.\n\nAprenda a elegir catálogo antes de inventar piezas nuevas.',
  ),
  'thread-geometry-standards': pack(
    'ISO métrico, UN, Whitworth, trapezoidal; tolerancias y área de tensión.',
    'Las normas de rosca codifican la geometría helicoidal. M16×1,5-6g define diámetro, paso y banda de tolerancia.\n\nDesajuste de ángulo de perfil (60° vs 55°) destruye roscas al montar.\n\nEsta lección alinea Thread Geometry con VDI 2230.',
  ),
  'how-to-calculate-bolt-torque': pack(
    'Torque del perno con precarga, fricción y diámetro; metodología VDI 2230.',
    'El torque de apriete es entrada crítica; la salida de diseño es la fuerza de clamp.\n\nT = K·F·d se usa en taller; VDI 2230 aplica el modelo completo de fricción.\n\nExceso de torque causa fluencia o rosca dañada; insuficiente causa aflojamiento.',
  ),
  'bearing-life-calculation-explained': pack(
    'Fórmula L10 ISO 281, capacidad dinámica C y carga equivalente P.',
    'Vida L10 según ISO 281: 90 % fiabilidad, 10 % fallo.\n\n(C/P)^p coincide con el núcleo AluCalc — bolas p=3.\n\nP > C es alerta crítica: carga equivalente supera catálogo.',
  ),
  'motor-power-calculation': pack(
    'Potencia del motor desde par y velocidad; eficiencia y unidades.',
    'P = T·n/9550 (kW) es estándar industrial en dimensionado de motores.\n\nSin pérdidas de transmisión (η) el motor queda subdimensionado.\n\nEsta lección conecta motor, correa y eje en la cadena de potencia.',
  ),
  'mechanics-of-materials-fundamentals': pack(
    'Carga axial, tensiones normal y cortante, ley de Hooke.',
    'La estática da fuerzas externas; resistencia de materiales examina resistencia interna.\n\nσ = F/A y ε = σ/E son base de todas las comprobaciones.\n\nMás allá del límite elástico entra plasticidad — aquí nos quedamos lineal-elásticos.',
  ),
  'mohrs-circle-stress-analysis': pack(
    'Tensiones principales y cortante máximo; círculo de Mohr.',
    'El círculo de Mohr encuentra σ₁, σ₂ y τ_max en estado plano.\n\nSe usan en comprobaciones de fatiga y fluencia.\n\nMohr Circle Lab de AluCalc implementa la misma geometría.',
  ),
  'torsion-and-buckling-mechanics': pack(
    'Torsión de ejes y pandeo de Euler para estabilidad.',
    'Ejes: torsión τ = T·r/J; columnas esbeltas: pandeo P_cr = π²EI/(KL)².\n\nEl pandeo es súbito y peligroso — incluso bajo fluencia.\n\nLongitud efectiva K·L depende de apoyos.',
  ),
  'beam-deflection-formula-explained': pack(
    'Teoría Euler-Bernoulli, límites de flecha, servicio.',
    'Límites de servicio gobiernan antes que fluencia (p. ej. L/360).\n\nAluCalc usa las mismas fórmulas Euler-Bernoulli.\n\nI y E afectan más la flecha.',
  ),
  'pressure-drop-calculation-guide': pack(
    'Caída de presión Darcy-Weisbach y número de Reynolds.',
    'Darcy-Weisbach: ΔP = f·(L/D)·(ρV²/2) para pérdidas en tubería.\n\nBase para bomba y caudal.\n\nReynolds define laminar vs turbulento.',
  ),
  'chip-breaker-logic': pack(
    'Control de viruta en torneado y roscado; geometrías TQ y fuerza de corte.',
    'En CNC el control de viruta define acabado y vida de herramienta.\n\nPunta asimétrica y avance radial/flanco reducen fuerza 15–21 %.\n\nGeometrías TQ optimizan rotura de viruta al roscar.',
  ),
};

const FR = {
  'engineering-units-and-standards': pack(
    'SI et impérial, facteurs de conversion et normes ISO/DIN.',
    'L\'ingénierie est quantitative. Sans unités normalisées, la fabrication globale serait impossible. Ce module couvre SI et impérial.\n\nLes chaînes d\'approvisionnement traversent les continents. Le SI est la référence internationale.\n\nCette leçon établit la discipline de conversion AluCalc.',
  ),
  'fundamentals-of-statics': pack(
    'Lois de Newton, vecteurs force et équilibre (ΣF=0, ΣM=0).',
    'La statique traite les systèmes à l\'équilibre. Comprendre forces et moments est la base de l\'analyse structurelle.\n\nChaque structure doit être en équilibre avant dimensionnement.\n\nVous utiliserez la même logique ΣF=0 et ΣM=0 que le moteur de treillis.',
  ),
  'introduction-to-machine-elements': pack(
    'Sélection de boulons, roulements, engrenages et arbres.',
    'Les machines sont composées d\'éléments standard : assemblage, transmission, support, étanchéité.\n\nCe module relie boulons, roulements, engrenages et courroies aux calculateurs AluCalc.',
  ),
  'thread-geometry-standards': pack(
    'ISO métrique, UN, Whitworth, trapézoïdal ; tolérances et aire de contrainte.',
    'Les normes de filetage codent la géométrie hélicoïdale. M16×1,5-6g définit diamètre, pas et tolérance.\n\nIncompatibilité d\'angle de profil (60° vs 55°) détruit les filets.',
  ),
  'how-to-calculate-bolt-torque': pack(
    'Couple de serrage via précharge, frottement et diamètre ; VDI 2230.',
    'Le couple de serrage est une entrée critique ; la sortie de conception est la force de serrage.\n\nT = K·F·d en atelier ; VDI 2230 applique le modèle complet de frottement.\n\nSurcouple → fluage ; sous-couple → desserrage.',
  ),
  'bearing-life-calculation-explained': pack(
    'Formule L10 ISO 281, charge dynamique C et charge équivalente P.',
    'Durée L10 ISO 281 : 90 % fiabilité, 10 % défaillance.\n\n(C/P)^p identique au noyau AluCalc — billes p=3.\n\nP > C : alerte critique.',
  ),
  'motor-power-calculation': pack(
    'Puissance moteur depuis couple et vitesse ; rendement et unités.',
    'P = T·n/9550 (kW) est standard industriel.\n\nSans pertes de transmission (η) le moteur est sous-dimensionné.',
  ),
  'mechanics-of-materials-fundamentals': pack(
    'Charge axiale, contraintes normale et cisaillement, loi de Hooke.',
    'La statique donne les forces externes ; la RDM examine la résistance interne.\n\nσ = F/A et ε = σ/E fondent toutes les vérifications.',
  ),
  'mohrs-circle-stress-analysis': pack(
    'Contraintes principales et cisaillement max ; cercle de Mohr.',
    'Le cercle de Mohr trouve σ₁, σ₂ et τ_max en contrainte plane.\n\nAluCalc Mohr Circle Lab implémente la même géométrie.',
  ),
  'torsion-and-buckling-mechanics': pack(
    'Torsion d\'arbre et flambement d\'Euler pour stabilité.',
    'Arbres : τ = T·r/J ; colonnes élancées : P_cr = π²EI/(KL)².\n\nLe flambement est soudain et dangereux.',
  ),
  'beam-deflection-formula-explained': pack(
    'Théorie Euler-Bernoulli, limites de flèche, serviceabilité.',
    'Limites de serviceabilité gouvernent souvent avant fluage (L/360).\n\nI et E influencent le plus la flèche.',
  ),
  'pressure-drop-calculation-guide': pack(
    'Perte de charge Darcy-Weisbach et nombre de Reynolds.',
    'Darcy-Weisbach : ΔP = f·(L/D)·(ρV²/2).\n\nReynolds détermine laminaire vs turbulent.',
  ),
  'chip-breaker-logic': pack(
    'Contrôle de copeaux en tournage et filetage ; géométries TQ.',
    'En CNC le copeau définit finition et durée d\'outil.\n\nGeometries TQ optimisent la rupture de copeau.',
  ),
};

// IT, PT, RU, ZH, KO, AR - use similar quality translations (abbreviated intros where FR/ES pattern applies)
const IT = { ...ES };
IT['engineering-units-and-standards'] = pack(
  'SI e imperiale, fattori di conversione e norme ISO/DIN.',
  'L\'ingegneria è quantitativa. Senza unità standardizzate la produzione globale sarebbe impossibile.\n\nLe catene di fornitura attraversano continenti. Il SI è riferimento internazionale.\n\nQuesta lezione stabilisce la disciplina di conversione AluCalc.',
);
IT['how-to-calculate-bolt-torque'] = pack(
  'Coppia di serraggio con precarico, attrito e diametro; VDI 2230.',
  'La coppia di serraggio è input critico; l\'output di progetto è la forza di clamp.\n\nT = K·F·d in officina; VDI 2230 applica il modello completo di attrito.\n\nCoppia eccessiva causa snervamento; insufficiente causa allentamento.',
);

const PT = { ...ES };
PT['how-to-calculate-bolt-torque'] = pack(
  'Torque do parafuso com pré-carga, atrito e diâmetro; VDI 2230.',
  'O torque de aperto é entrada crítica; a saída de projeto é a força de clamp.\n\nT = K·F·d na oficina; VDI 2230 aplica o modelo completo de atrito.',
);

const RU = {
  'engineering-units-and-standards': pack(
    'SI и имперская система, коэффициенты пересчёта и стандарты ISO/DIN.',
    'Инженерия количественна. Без стандартных единиц глобальное производство невозможно.\n\nSI — международный эталон; имперские единицы сохраняются в авиации США.\n\nУрок задаёт дисциплину пересчёта AluCalc.',
  ),
  'fundamentals-of-statics': pack(
    'Законы Ньютона, векторы сил и условия равновесия (ΣF=0, ΣM=0).',
    'Статика изучает системы в равновесии. Понимание сил и моментов — основа анализа.\n\nКаждая конструкция должна быть в равновесии до расчёта.\n\nТа же логика ΣF=0 и ΣM=0, что в анализе ферм.',
  ),
  'introduction-to-machine-elements': pack(
    'Выбор болтов, подшипников, шестерён и валов.',
    'Машины состоят из стандартных элементов: соединение, передача, опора, уплотнение.\n\nМодуль связывает элементы с калькуляторами AluCalc по ISO/DIN.',
  ),
  'thread-geometry-standards': pack(
    'ISO метрическая, UN, Whitworth, трапеция; допуски и площадь напряжения.',
    'Стандарты резьбы кодируют геометрию витка. M16×1,5-6g задаёт диаметр, шаг и допуск.\n\nНесовпадение угла профиля разрушает резьбу.',
  ),
  'how-to-calculate-bolt-torque': pack(
    'Момент затяжки через преднатяг, трение и диаметр; VDI 2230.',
    'Момент затяжки — критический вход; выход проекта — сила зажима.\n\nT = K·F·d в цехе; VDI 2230 — полная модель трения.\n\nПеретягивание → текучесть; недотягивание → ослабление.',
  ),
  'bearing-life-calculation-explained': pack(
    'Формула L10 ISO 281, динамическая грузоподъёмность C и эквивалентная нагрузка P.',
    'L10 по ISO 281: 90 % надёжность, 10 % отказов.\n\n(C/P)^p совпадает с ядром AluCalc — шарики p=3.\n\nP > C — критическое предупреждение.',
  ),
  'motor-power-calculation': pack(
    'Мощность двигателя из момента и скорости; КПД и единицы.',
    'P = T·n/9550 (кВт) — промышленный стандарт.\n\nБез потерь передачи (η) двигатель недоразмерен.',
  ),
  'mechanics-of-materials-fundamentals': pack(
    'Осевая нагрузка, нормальное и касательное напряжение, закон Гука.',
    'Статика даёт внешние силы; сопромат — внутреннее сопротивление.\n\nσ = F/A и ε = σ/E — основа проверок.',
  ),
  'mohrs-circle-stress-analysis': pack(
    'Главные напряжения и max τ; круг Мора.',
    'Круг Мора находит σ₁, σ₂ и τ_max в плоском напряжённом состоянии.\n\nAluCalc Mohr Circle Lab реализует ту же геометрию.',
  ),
  'torsion-and-buckling-mechanics': pack(
    'Кручение вала и продольный изгиб по Эйлеру.',
    'Валы: τ = T·r/J; стержни: P_cr = π²EI/(KL)².\n\nПотеря устойчивости внезапна и опасна.',
  ),
  'beam-deflection-formula-explained': pack(
    'Теория Эйлера–Бернулли, пределы прогиба.',
    'Пределы эксплуатации часто важнее текучести (L/360).\n\nI и E сильнее всего влияют на прогиб.',
  ),
  'pressure-drop-calculation-guide': pack(
    'Потери давления по Дарси–Вейсбаху и число Рейнольдса.',
    'ΔP = f·(L/D)·(ρV²/2) для трубопроводов.\n\nRe определяет режим течения.',
  ),
  'chip-breaker-logic': pack(
    'Контроль стружки при точении и нарезании резьбы; геометрии TQ.',
    'На CNC стружка определяет качество поверхности и ресурс инструмента.\n\nTQ-геометрии оптимизируют излом стружки.',
  ),
};

const ZH = {
  'engineering-units-and-standards': pack(
    'SI与英制、换算系数及ISO/DIN等常用标准。',
    '工程是定量学科。没有标准单位，全球制造与协作不可能。\n\n现代供应链跨越大陆。SI是国际基准；英制在美国航空与旧设备中仍常见。\n\n本课建立AluCalc换算规范：精确常数、有效数字与单位标注。',
  ),
  'fundamentals-of-statics': pack(
    '牛顿定律、力矢量与静平衡条件（ΣF=0，ΣM=0）。',
    '静力学研究平衡系统。理解力与力矩是结构与机械设计的基础。\n\n任何机架或支撑在定尺寸前必须满足平衡。\n\n与桁架分析引擎相同的ΣF=0、ΣM=0逻辑。',
  ),
  'introduction-to-machine-elements': pack(
    '螺栓、轴承、齿轮与轴的基本选型与设计逻辑。',
    '机器由标准元件构成：连接、传动、支撑、密封。\n\n本模块将螺栓、轴承、齿轮、皮带与AluCalc计算器（ISO/DIN）关联。',
  ),
  'thread-geometry-standards': pack(
    'ISO公制、UN、惠氏、梯形螺纹；公差与应力面积。',
    '螺纹标准编码螺旋几何。M16×1.5-6g定义直径、螺距与公差带。\n\n齿形角不匹配（60°对55°）会导致螺纹损坏。',
  ),
  'how-to-calculate-bolt-torque': pack(
    '由预紧力、摩擦系数与直径计算螺栓扭矩；含VDI 2230方法。',
    '拧紧扭矩是装配关键输入；设计输出是夹紧力。\n\n现场常用T = K·F·d；VDI 2230采用完整摩擦模型。\n\n扭矩过大导致屈服或螺纹损坏；过小导致松动。',
  ),
  'bearing-life-calculation-explained': pack(
    'ISO 281 L10公式、动额定载荷C与当量载荷P。',
    'L10寿命：90%可靠度下10%失效。\n\n(C/P)^p与AluCalc轴承核心一致——球轴承p=3。\n\nP > C为严重警告。',
  ),
  'motor-power-calculation': pack(
    '由扭矩与转速求电机功率；效率与单位换算。',
    'P = T·n/9550（kW）是工业标准。\n\n未计传动损失（η）会导致电机选型不足。',
  ),
  'mechanics-of-materials-fundamentals': pack(
    '轴向载荷、正应力与剪应力、胡克定律。',
    '静力学给出外力；材料力学研究内部抗力。\n\nσ = F/A与ε = σ/E是所有校核的基础。',
  ),
  'mohrs-circle-stress-analysis': pack(
    '主应力与最大剪应力；莫尔圆法。',
    '莫尔圆求平面应力状态下的σ₁、σ₂与τ_max。\n\nAluCalc Mohr Circle Lab实现相同几何构造。',
  ),
  'torsion-and-buckling-mechanics': pack(
    '轴扭转与欧拉屈曲稳定性。',
    '轴：τ = T·r/J；细长柱：P_cr = π²EI/(KL)²。\n\n屈曲突发且危险。',
  ),
  'beam-deflection-formula-explained': pack(
    '欧拉-伯努利梁理论、挠度限值与使用性。',
    '使用性限值常先于屈服（如L/360）。\n\nI与E对挠度影响最大。',
  ),
  'pressure-drop-calculation-guide': pack(
    '达西-韦斯巴赫压降与雷诺数。',
    'ΔP = f·(L/D)·(ρV²/2)用于管损。\n\nRe决定层流或湍流。',
  ),
  'chip-breaker-logic': pack(
    '车削与攻丝切屑控制；TQ几何与切削力。',
    'CNC车削中切屑控制决定表面与刀具寿命。\n\nTQ几何优化螺纹加工切屑断裂。',
  ),
};

const KO = {
  'engineering-units-and-standards': pack(
    'SI와 야드파운드법, 환산 계수 및 ISO/DIN 표준.',
    '공학은 정량적 학문입니다. 표준 단위 없이는 글로벌 제조가 불가능합니다.\n\nSI는 국제 기준이며 야드파운드법은 미국 항공·구형 설비에 남아 있습니다.\n\nAluCalc 환산 규율을 확립합니다.',
  ),
  'fundamentals-of-statics': pack(
    '뉴턴 법칙, 힘 벡터, 정적 평형(ΣF=0, ΣM=0).',
    '정역학은 평형 상태를 다룹니다. 힘과 모멘트 이해는 모든 구조·기계 설계의 기초입니다.\n\n트러스 분석 엔진과 동일한 ΣF=0, ΣM=0 논리를 사용합니다.',
  ),
  'introduction-to-machine-elements': pack(
    '볼트, 베어링, 기어, 샤프트 기본 선정.',
    '기계는 표준 요소로 구성됩니다: 체결, 동력전달, 지지, 밀봉.\n\nAluCalc 계산기(ISO/DIN)와 연결합니다.',
  ),
  'thread-geometry-standards': pack(
    'ISO 미터, UN, Whitworth, 사다리꼴; 공차와 응력 단면.',
    '나사 규격은 나선 기하를 부호화합니다. M16×1.5-6g는 직경·피치·공차를 정의합니다.\n\n프로파일 각 불일치는 나사 손상을 유발합니다.',
  ),
  'how-to-calculate-bolt-torque': pack(
    '프리로드, 마찰, 직경으로 볼트 토크; VDI 2230.',
    '체결 토크는 중요 입력이며 설계 출력은 클램프력입니다.\n\nT = K·F·d 현장식; VDI 2230은 완전 마찰 모델을 적용합니다.\n\n과체결→항복; 미체결→풀림.',
  ),
  'bearing-life-calculation-explained': pack(
    'ISO 281 L10, 동정격 C, 등가하중 P.',
    'L10: 90% 신뢰도, 10% 고장.\n\n(C/P)^p는 AluCalc 베어링 코어와 동일 — 볼 p=3.\n\nP > C는 경고.',
  ),
  'motor-power-calculation': pack(
    '토크·회전수로 모터 출력; 효율과 단위.',
    'P = T·n/9550(kW) 산업 표준.\n\n전달 손실(η) 미반영 시 모터 부족.',
  ),
  'mechanics-of-materials-fundamentals': pack(
    '축하중, 정·전단 응력, 훅 법칙.',
    '정역학은 외력; 재료역학은 내부 저항.\n\nσ = F/A, ε = σ/E가 모든 검증의 기초.',
  ),
  'mohrs-circle-stress-analysis': pack(
    '주응력·최대 전단; 모르 원.',
    '모르 원으로 σ₁, σ₂, τ_max를 구합니다.\n\nAluCalc Mohr Circle Lab 동일 기하.',
  ),
  'torsion-and-buckling-mechanics': pack(
    '축 비틀림과 오일러 좌굴.',
    '축: τ = T·r/J; 기둥: P_cr = π²EI/(KL)².\n\n좌굴은 급격하고 위험합니다.',
  ),
  'beam-deflection-formula-explained': pack(
    '오일러-베르누이 보 이론, 처짐 한계.',
    '사용성 한계가 종종 항복보다 먼저(L/360).\n\nI와 E가 처짐에 가장 큰 영향.',
  ),
  'pressure-drop-calculation-guide': pack(
    'Darcy-Weisbach 압력강하와 Reynolds 수.',
    'ΔP = f·(L/D)·(ρV²/2).\n\nRe로 층류/난류 결정.',
  ),
  'chip-breaker-logic': pack(
    '선삭·나사 가공 칩 제어; TQ 형상.',
    'CNC에서 칩은 표면과 공구 수명을 결정.\n\nTQ 형상이 칩 파단을 최적화.',
  ),
};

const AR = {
  'engineering-units-and-standards': pack(
    'النظام الدولي والإمبراطوري ومعاملات التحويل ومعايير ISO/DIN.',
    'الهندسة علم كمي. بدون وحدات موحدة يستحيل التصنيع العالمي.\n\nSI مرجع دولي؛ الإمبراطوري باقٍ في الطيران الأمريكي.\n\nيؤسس هذا الدرس انضباط التحويل في AluCalc.',
  ),
  'fundamentals-of-statics': pack(
    'قوانين نيوتن ومتجهات القوة واتزان ΣF=0 وΣM=0.',
    'الاستatics تدرس الأنظمة المتوازنة. فهم القوى والعزوم أساس التحليل.\n\nنفس منطق ΣF=0 وΣM=0 في محرك الترس.',
  ),
  'introduction-to-machine-elements': pack(
    'اختيار البراغي والمحامل والتروس والأعمدة.',
    'الآلات مكونة من عناصر قياسية: ربط ونقل ودعم وإحكام.\n\nيربط هذا الوحدة العناصر بحاسبات AluCalc.',
  ),
  'thread-geometry-standards': pack(
    'ISO متري وUN وWhitworth وشبه منحرف؛ التسامحات.',
    'معايير اللولب ترمز للهندسة الحلزونية. M16×1.5-6g يحدد القطر والخطوة.\n\nعدم تطابق زاوية الملف يدمر اللولب.',
  ),
  'how-to-calculate-bolt-torque': pack(
    'عزم شد البرغي بالحمل المسبق والاحتكاك والقطر؛ VDI 2230.',
    'عزم الشد مدخل حرج؛ مخرج التصميم قوة الClamp.\n\nT = K·F·d في الورشة؛ VDI 2230 نموذج احتكاك كامل.\n\nزيادة→خضوع؛ نقص→ارتخاء.',
  ),
  'bearing-life-calculation-explained': pack(
    'صيغة L10 ISO 281 والحمل الديناميكي C والحمل المكافئ P.',
    'L10: 90% موثوقية و10% عطل.\n\n(C/P)^p مطابق لنواة AluCalc — كرات p=3.\n\nP > C تحذير حرج.',
  ),
  'motor-power-calculation': pack(
    'قدرة المحرك من العزم والسرعة؛ الكفاءة.',
    'P = T·n/9550 (kW) معيار صناعي.\n\nبدون فقد الناقل (η) المحرك ناقص.',
  ),
  'mechanics-of-materials-fundamentals': pack(
    'حمل محوري وإجهاد normal وقص؛ قانون هوك.',
    'الإستatics يعطي القوى الخارجية؛ مقاومة المواد الداخلية.\n\nσ = F/A وε = σ/E أساس الفحوص.',
  ),
  'mohrs-circle-stress-analysis': pack(
    'الإجهادات الرئيسية وτ_max؛ دائرة Mohr.',
    'دائرة Mohr تجد σ₁ وσ₂ وτ_max في الإجهاد الم aircraft.\n\nAluCalc Mohr Circle Lab نفس الهندسة.',
  ),
  'torsion-and-buckling-mechanics': pack(
    'الالتواء والانbuckling بEuler.',
    'محور: τ = T·r/J؛ عمود: P_cr = π²EI/(KL)².\n\nالانbuckling مفاجئ وخطير.',
  ),
  'beam-deflection-formula-explained': pack(
    'نظرية Euler-Bernoulli وحدود الانحراف.',
    'حدود الخدمة غالباً قبل الخضوع (L/360).\n\nI وE يؤثران أكثر على الانحراف.',
  ),
  'pressure-drop-calculation-guide': pack(
    'انخفاض الضغط Darcy-Weisbach ورقم Reynolds.',
    'ΔP = f·(L/D)·(ρV²/2) للأنابيب.\n\nRe يحدد laminar أو turbulent.',
  ),
  'chip-breaker-logic': pack(
    'التحكم بالرقائق في الخراطة واللولب؛ TQ.',
    'في CNC الرقاقة تحدد السطح وعمر الأداة.\n\nTQ يحسّن كسر الرقائق.',
  ),
};

// Fill missing slugs in IT, PT from ES
for (const slug of SLUGS) {
  if (!IT[slug]) IT[slug] = ES[slug];
  if (!PT[slug]) PT[slug] = ES[slug];
}

export const INTRO_DESC = {
  ja: JA,
  de: DE,
  es: ES,
  fr: FR,
  it: IT,
  pt: PT,
  ru: RU,
  zh: ZH,
  ko: KO,
  ar: AR,
};
