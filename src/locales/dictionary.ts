/**
 * Single-Source Colocated Dictionary
 * 
 * All translations in one place. TypeScript enforces all locales are defined.
 * If you add a new key without all 10 locales, you get a compile error.
 */

import { TranslationEntry, t } from './types';

export const dictionary = {
    nav: {
        home: t({ en: "Home", tr: "Anasayfa", de: "Startseite", fr: "Accueil", es: "Inicio", it: "Home", pt: "Início", ru: "Главная", ja: "ホーム", zh: "首页" }),
        homeDesc: t({ en: "Main Dashboard", tr: "Ana Kontrol Paneli", de: "Haupt-Dashboard", fr: "Tableau de Bord", es: "Tablero Principal", it: "Dashboard Principale", pt: "Painel Principal", ru: "Панель управления", ja: "ダッシュボード", zh: "仪表板" }),
        fits: t({ en: "Fit Calculator", tr: "Tolerans Hesaplayıcı", de: "Passungsrechner", fr: "Calculateur d'Ajustement", es: "Ajustes ISO", it: "Calcolo Accoppiamenti", pt: "Ajustes e Tolerâncias", ru: "Допуски и посадки", ja: "はめあい計算", zh: "公差配合" }),
        handbook: t({ en: "Engineer's Handbook", tr: "Mühendis El Kitabı", de: "Ingenieur-Handbuch", fr: "Manuel de l'Ingénieur", es: "Manual del Ingeniero", it: "Manuale Ingnere", pt: "Manual do Engenheiro", ru: "Справочник", ja: "技術便覧", zh: "工程师手册" }),
        library: t({ en: "Module Library", tr: "Modül Kütüphanesi", de: "Modulbibliothek", fr: "Bibliothèque Modules", es: "Biblioteca de Módulos", it: "Libreria Moduli", pt: "Biblioteca de Módulos", ru: "Библиотека Модулей", ja: "モジュールライブラリ", zh: "模块库" }),
        available: t({ en: "Modules Available", tr: "Mevcut Modül", de: "Module verfügbar", fr: "Modules Disponibles", es: "Módulos Disponibles", it: "Moduli Disponibili", pt: "Módulos Disponíveis", ru: "Доступно Модулей", ja: "利用可能モジュール", zh: "可用模块" }),
        news: t({ en: "Industry News", tr: "Haberler", de: "Industry News", fr: "Industry News", es: "Industry News", it: "Industry News", pt: "Industry News", ru: "Industry News", ja: "Industry News", zh: "Industry News" }),
    },

    modules: {
        aluminum: {
            title: t({ en: "Profile Weight Calculator", tr: "Genel Malzeme Profil Hesabı", de: "Profilgewichtsrechner", fr: "Calculateur de Profilé", es: "Calculadora de Perfiles", it: "Calcolatore Profili", pt: "Calc. de Perfis", ru: "Калькулятор Профилей", ja: "プロファイル重量計算機", zh: "型材重量计算器" }),
            desc: t({ en: "Mass & Cost Estimation", tr: "Kütle & Maliyet Tahmini", de: "Masse & Kostenschätzung", fr: "Masse & Estimation Coût", es: "Masa y Costes", it: "Stima Massa & Costi", pt: "Massa e Custo", ru: "Расчет массы и стоимости", ja: "質量とコスト見積もり", zh: "质量与成本估算" }),
        },
        fits: {
            title: t({ en: "Fits & Tolerances", tr: "Geçme & Toleranslar", de: "Passungsrechner", fr: "Ajustements & Tolérances", es: "Ajustes y Tolerancias", it: "Tolleranze & Accoppiamenti", pt: "Ajustes e Tolerâncias", ru: "Допуски и Посадки", ja: "公差とはめあい", zh: "公差配合" }),
            desc: t({ en: "ISO 286 Shaft/Hole", tr: "ISO 286 Mil/Delik", de: "ISO 286 Welle/Bohrung", fr: "ISO 286 Arbre/Alésage", es: "ISO 286 Eje/Agujero", it: "ISO 286 Albero/Foro", pt: "ISO 286 Eixo/Furo", ru: "ISO 286 Вал/Отверстие", ja: "ISO 286 軸/穴", zh: "ISO 286 轴/孔" }),
        },
        gears: {
            title: t({ en: "Gear Calculator", tr: "Dişli Hesaplayıcı", de: "Zahnradrechner", fr: "Calculateur Engrenages", es: "Calculadora Engranajes", it: "Calcolo Ingranaggi", pt: "Calculadora de Engrenagens", ru: "Зубчатые Колеса", ja: "歯車計算機", zh: "齿轮计算器" }),
            desc: t({ en: "Spur & Helical Geometry", tr: "Düz & Helisel Geometri", de: "Stirn- & Schrägverzahnung", fr: "Géométrie Droit/Hélicoïdal", es: "Geometría Recto/Helicoidal", it: "Geometria Cilindrica/Elica", pt: "Geometria Reta/Helicoidal", ru: "Цилиндрические/Косозубые", ja: "平歯車・はすば歯車", zh: "直齿轮与斜齿轮几何" }),
        },
        strength: {
            title: t({ en: "Strength (Mohr)", tr: "Mukavemet (Mohr)", de: "Festigkeitsrechner", fr: "Résistance (Mohr)", es: "Resistencia (Mohr)", it: "Resistenza (Mohr)", pt: "Resistência (Mohr)", ru: "Сопромат (Круг Мора)", ja: "材料力学 (モール円)", zh: "强度计算 (Mohr)" }),
            desc: t({ en: "Stress Analysis", tr: "Gerilme Analizi", de: "Spannungsanalyse (Mohr)", fr: "Analyse de Contrainte", es: "Análisis de Esfuerzos", it: "Analisi Sforzi", pt: "Análise de Tensão", ru: "Анализ Напряжений", ja: "応力解析", zh: "应力分析" }),
        },
        bearings: {
            title: t({ en: "Bearings (L10)", tr: "Rulman Ömrü (L10)", de: "Lagerlebensdauer (L10)", fr: "Roulements (L10)", es: "Rodamientos (L10)", it: "Cuscinetti (L10)", pt: "Rolamentos (L10)", ru: "Подшипники (L10)", ja: "軸受寿命 (L10)", zh: "轴承寿命 (L10)" }),
            desc: t({ en: "Life Expectancy", tr: "Ömür Beklentisi", de: "Lebensdauererwartung", fr: "Durée de Vie", es: "Expectativa de Vida", it: "Durata Prevista", pt: "Expectativa de Vida", ru: "Расчет Ресурса", ja: "寿命予測", zh: "预期寿命" }),
        },
        welding: {
            title: t({ en: "Welding Heat", tr: "Kaynak Isı Girdisi", de: "Schweißwärme", fr: "Chaleur Soudage", es: "Calor de Soldadura", it: "Calore Saldatura", pt: "Calor de Soldagem", ru: "Сварка", ja: "溶接熱入力", zh: "焊接热输入" }),
            desc: t({ en: "Process Inputs", tr: "Proses Girdileri", de: "Prozessparameter", fr: "Entrées Procédé", es: "Entradas de Proceso", it: "Input Processo", pt: "Parâmetros de Processo", ru: "Тепловложения", ja: "プロセス入力", zh: "工艺参数" }),
        },
        sheetMetal: {
            title: t({ en: "Sheet Metal", tr: "Sac Metal Büküm", de: "Blechbearbeitung", fr: "Tôlerie", es: "Chapa Metálica", it: "Lamiera", pt: "Chapas Metálicas", ru: "Листовой Металл", ja: "板金曲げ", zh: "钣金计算" }),
            desc: t({ en: "Bending Force", tr: "Bükme Kuvveti", de: "Biegekraft", fr: "Force de Pliage", es: "Fuerza de Doblado", it: "Forza Piegatura", pt: "Força de Dobra", ru: "Усилие Гибки", ja: "曲げ加圧力", zh: "折弯力" }),
        },
        pumps: {
            title: t({ en: "Pumps", tr: "Pompa Hesabı", de: "Pumpenrechner", fr: "Pompes", es: "Bombas", it: "Pompe", pt: "Bombas", ru: "Насосы", ja: "ポンプ", zh: "泵计算器" }),
            desc: t({ en: "Power & NPSH", tr: "Güç & NPSH", de: "Leistung & NPSH", fr: "Puissance & NPSH", es: "Potencia y NPSH", it: "Potenza & NPSH", pt: "Potência e NPSH", ru: "Мощность и NPSH", ja: "動力とNPSH", zh: "功率与 NPSH" }),
        },
        fasteners: {
            title: t({ en: "Fasteners", tr: "Bağlantı Elemanları", de: "Verbindungselemente", fr: "Fixations", es: "Sujetadores", it: "Bulloneria", pt: "Fixadores", ru: "Крепеж", ja: "ねじ・締結", zh: "紧固件" }),
            desc: t({ en: "ISO Metric Threads", tr: "ISO Metrik Diş", de: "ISO Metrisches Gewinde", fr: "Filetage Métrique ISO", es: "Roscas Métricas ISO", it: "Filettature ISO", pt: "Roscas Métricas ISO", ru: "Метрическая Резьба", ja: "ISOメートルねじ", zh: "ISO 公制螺纹" }),
        },
        converter: {
            title: t({ en: "Converter", tr: "Birim Çevirici", de: "Umrechner", fr: "Convertisseur", es: "Conversor", it: "Convertitore", pt: "Conversor", ru: "Конвертер", ja: "単位変換", zh: "单位转换器" }),
            desc: t({ en: "Units & Power", tr: "Birimler & Güç", de: "Einheiten & Leistung", fr: "Unités & Puissance", es: "Unidades y Potencia", it: "Unità & Potenza", pt: "Unidades e Potência", ru: "Единицы и Мощность", ja: "単位と動力", zh: "单位与功率" }),
        },
        handbook: {
            title: t({ en: "Handbook", tr: "El Kitabı", de: "Handbuch", fr: "Manuel", es: "Manual", it: "Manuale", pt: "Manual", ru: "Справочник", ja: "便覧", zh: "工程师手册" }),
            desc: t({ en: "Bearing tables, ISO Tolerances, G-Code reference.", tr: "Rulman tabloları, ISO Toleranslar, G-Code referansı.", de: "Lagertabellen, ISO-Toleranzen, G-Code.", fr: "Roulements, Tolérances, G-Code.", es: "Tablas rodamientos, ISO, G-Code.", it: "Tabelle cuscinetti, ISO, G-Code.", pt: "Tabelas, ISO, Código G.", ru: "Таблицы, Допуски, G-Kод.", ja: "軸受表、公差、Gコード他", zh: "轴承表、公差、G代码。" }),
        },
    },

    common: {
        calculate: t({ en: "Calculate Weight", tr: "Ağırlık Hesapla", de: "Berechnen", fr: "Calculer", es: "Calcular", it: "Calcola", pt: "Calcular", ru: "Рассчитать", ja: "計算する", zh: "计算" }),
        result: t({ en: "Result", tr: "Sonuç", de: "Ergebnis", fr: "Résultat", es: "Resultado", it: "Risultato", pt: "Resultado", ru: "Результат", ja: "結果", zh: "结果" }),
        inputs: t({ en: "Inputs", tr: "Girdiler", de: "Eingaben", fr: "Entrées", es: "Entradas", it: "Input", pt: "Entradas", ru: "Входные данные", ja: "入力", zh: "输入" }),
        dimensions: t({ en: "Dimensions", tr: "Boyutlar", de: "Abmessungen", fr: "Dimensions", es: "Dimensiones", it: "Dimensioni", pt: "Dimensões", ru: "Размеры", ja: "寸法", zh: "尺寸" }),
        hole: t({ en: "Hole", tr: "Delik", de: "Bohrung", fr: "Alésage", es: "Agujero", it: "Foro", pt: "Furo", ru: "Отверстие", ja: "穴", zh: "孔" }),
        shaft: t({ en: "Shaft", tr: "Mil", de: "Welle", fr: "Arbre", es: "Eje", it: "Albero", pt: "Eixo", ru: "Вал", ja: "軸", zh: "轴" }),
        min: t({ en: "Min", tr: "Min", de: "Min", fr: "Min", es: "Mín", it: "Min", pt: "Mín", ru: "Мин", ja: "最小", zh: "最小" }),
        max: t({ en: "Max", tr: "Maks", de: "Max", fr: "Max", es: "Máx", it: "Max", pt: "Máx", ru: "Макс", ja: "最大", zh: "最大" }),
        nominalDia: t({ en: "Nominal Diameter", tr: "Nominal Çap", de: "Nennmaß", fr: "Diamètre Nominal", es: "Diámetro Nominal", it: "Diametro Nominale", pt: "Diâmetro Nominal", ru: "Номинальный диаметр", ja: "呼び径", zh: "公称直径" }),
        explanation: t({ en: "Detailed Explanation", tr: "Detaylı Açıklama", de: "Detaillierte Erklärung", fr: "Explication", es: "Explicación", it: "Spiegazione", pt: "Explicação", ru: "Пояснение", ja: "解説", zh: "详细说明" }),
        toleranceValues: t({ en: "Tolerance Values", tr: "Tolerans Değerleri", de: "Toleranzwerte", fr: "Valeurs de Tolérance", es: "Valores de Tolerancia", it: "Valori Tolleranza", pt: "Valores de Tolerância", ru: "Значения полей допусков", ja: "公差値", zh: "公差值" }),
        mountingCalc: t({ en: "Mounting Calculations", tr: "Montaj Hesapları", de: "Montageberechnungen", fr: "Calculs de Montage", es: "Cálculos de Montaje", it: "Calcoli Montaggio", pt: "Cálculos de Montagem", ru: "Расчет монтажа", ja: "取付計算", zh: "装配计算" }),
        pressure: t({ en: "Interface Pressure", tr: "Arayüz Basıncı", de: "Fugendruck", fr: "Pression de Contact", es: "Presión de Contacto", it: "Pressione Interfaccia", pt: "Pressão de Contato", ru: "Давление в стыке", ja: "面圧", zh: "接触压力" }),
        force: t({ en: "Push Force", tr: "Çakma Kuvveti", de: "Einpresskraft", fr: "Force de Montage", es: "Fuerza de Montaje", it: "Forza Piantaggio", pt: "Força de Montagem", ru: "Усилие запрессовки", ja: "圧入力", zh: "压入力" }),
        torque: t({ en: "Transmittable Torque", tr: "Aktarılabilir Tork", de: "Übertragbares Moment", fr: "Couple Transmissible", es: "Par Transmisible", it: "Coppia Trasmissibile", pt: "Torque Transmissível", ru: "Передаваемый момент", ja: "伝達トルク", zh: "传递扭矩" }),
        metric: t({ en: "Metric", tr: "Metrik", de: "Metrisch", fr: "Métrique", es: "Métrico", it: "Metrico", pt: "Métrico", ru: "Метрическая", ja: "メートル法", zh: "公制" }),
        imperial: t({ en: "Imperial", tr: "İnç", de: "Zoll", fr: "Impérial", es: "Imperial", it: "Imperiale", pt: "Imperial", ru: "Дюймовая", ja: "ヤード・ポンド法", zh: "英制" }),
        from: t({ en: "From", tr: "Giriş", de: "Eingang", fr: "De", es: "De", it: "Da", pt: "De", ru: "Из", ja: "入力", zh: "从" }),
        to: t({ en: "To", tr: "Çıkış", de: "Ausgang", fr: "À", es: "A", it: "A", pt: "Para", ru: "В", ja: "出力", zh: "到" }),
        language: t({ en: "Language", tr: "Dil", de: "Sprache", fr: "Langue", es: "Idioma", it: "Lingua", pt: "Idioma", ru: "Язык", ja: "言語", zh: "语言" }),
        calcTool: t({ en: "Calculator Tool", tr: "Hesaplama Aracı", de: "Rechner-Tool", fr: "Outil de Calcul", es: "Herramienta", it: "Strumento", pt: "Ferramenta", ru: "Калькулятор", ja: "計算ツール", zh: "计算工具" }),
        formula: t({ en: "Calculation Formula", tr: "Hesap Formülü", de: "Berechnungsformel", fr: "Formule", es: "Fórmula", it: "Formula", pt: "Fórmula", ru: "Формула", ja: "計算式", zh: "计算公式" }),
        totalWeight: t({ en: "Total Weight", tr: "Toplam Ağırlık", de: "Gesamtgewicht", fr: "Poids Total", es: "Peso Total", it: "Peso Totale", pt: "Peso Total", ru: "Общий вес", ja: "総重量", zh: "总重量" }),
        ratio: t({ en: "Ratio", tr: "Oran", de: "Verhältnis", fr: "Rapport", es: "Relación", it: "Rapporto", pt: "Razão", ru: "Отношение", ja: "比率", zh: "比率" }),
        stress: t({ en: "Stress", tr: "Gerilme", de: "Spannung", fr: "Contrainte", es: "Esfuerzo", it: "Sforzo", pt: "Tensão", ru: "Напряжение", ja: "応力", zh: "应力" }),
        beam: t({ en: "Beam", tr: "Kiriş", de: "Balken", fr: "Poutre", es: "Viga", it: "Trave", pt: "Viga", ru: "Балка", ja: "梁", zh: "梁" }),
        cantilever: t({ en: "Cantilever", tr: "Ankastre", de: "Freiträger", fr: "Porte-à-faux", es: "Voladizo", it: "Sbalzo", pt: "Mísula", ru: "Консоль", ja: "片持ち梁", zh: "悬臂梁" }),
        simple: t({ en: "Simple Supported", tr: "Basit Mesnetli", de: "Einfach gelagert", fr: "Simple", es: "Apoyo Simple", it: "Appoggio Semplice", pt: "Apoiada", ru: "Шарнирная опора", ja: "単純支持", zh: "简支梁" }),
        share: t({ en: "Share Calculation", tr: "Hesaplamayı Paylaş", de: "Berechnung teilen", fr: "Partager", es: "Compartir", it: "Condividi", pt: "Partilhar", ru: "Поделиться", ja: "計算結果を共有", zh: "分享计算" }),
        copied: t({ en: "Copied!", tr: "Kopyalandı!", de: "Kopiert!", fr: "Copié !", es: "¡Copiado!", it: "Copiato!", pt: "Copiado!", ru: "Скопировано!", ja: "コピーしました！", zh: "已复制！" }),
        loadGeometry: t({ en: "Load & Geometry", tr: "Yük & Geometri", de: "Last & Geometrie", fr: "Charge & Géométrie", es: "Carga y Geometría", it: "Carico e Geometria", pt: "Carga e Geometria", ru: "Нагрузка и Геометрия", ja: "荷重と形状", zh: "载荷与几何" }),
        beamParams: t({ en: "Beam Parameters", tr: "Kiriş Parametreleri", de: "Balkenparameter", fr: "Paramètres de Poutre", es: "Parámetros de Viga", it: "Parametri Trave", pt: "Parâmetros da Viga", ru: "Параметры Балки", ja: "梁パラメータ", zh: "梁参数" }),
        calculatedStress: t({ en: "Calculated Stress", tr: "Hesaplanan Gerilme", de: "Berechnete Spannung", fr: "Contrainte Calculée", es: "Esfuerzo Calculado", it: "Sforzo Calcolato", pt: "Tensão Calculada", ru: "Расчетное Напряжение", ja: "計算応力", zh: "计算应力" }),
        maxDeflection: t({ en: "Max Deflection", tr: "Maksimum Sehim", de: "Max. Durchbiegung", fr: "Flèche Max", es: "Deflexión Máx", it: "Deflessione Max", pt: "Deflexão Máx", ru: "Макс. Прогиб", ja: "最大たわみ", zh: "最大挠度" }),
        safetyFactor: t({ en: "Safety Factor", tr: "Güvenlik Faktörü", de: "Sicherheitsfaktor", fr: "Facteur de Sécurité", es: "Factor de Seguridad", it: "Fattore di Sicurezza", pt: "Fator de Segurança", ru: "Коэффициент Запаса", ja: "安全率", zh: "安全系数" }),
        centerDist: t({ en: "Center Dist (awt)", tr: "Eksen Aralığı (awt)", de: "Achsabstand (awt)", fr: "Entraxe (awt)", es: "Distancia entre Centros", it: "Interasse (awt)", pt: "Distância entre Centros", ru: "Межосевое Расстояние", ja: "中心距離 (awt)", zh: "中心距 (awt)" }),
        outputSpeed: t({ en: "Output Speed", tr: "Çıkış Hızı", de: "Abtriebsdrehzahl", fr: "Vitesse de Sortie", es: "Velocidad de Salida", it: "Velocità in Uscita", pt: "Velocidade de Saída", ru: "Выходная Скорость", ja: "出力速度", zh: "输出速度" }),
    },

    dimensions: {
        width: t({ en: "Width", tr: "Genişlik", de: "Breite", fr: "Largeur", es: "Anchura", it: "Larghezza", pt: "Largura", ru: "Ширина", ja: "幅", zh: "宽度" }),
        height: t({ en: "Height", tr: "Yükseklik", de: "Höhe", fr: "Hauteur", es: "Altura", it: "Altezza", pt: "Altura", ru: "Высота", ja: "高さ", zh: "高度" }),
        thickness: t({ en: "Thickness", tr: "Kalınlık", de: "Dicke", fr: "Épaisseur", es: "Espesor", it: "Spessore", pt: "Espessura", ru: "Толщина", ja: "厚さ", zh: "厚度" }),
        wallThickness: t({ en: "Wall Thickness", tr: "Et Kalınlığı", de: "Wandstärke", fr: "Ép. Paroi", es: "Espesor Pared", it: "Spessore Parete", pt: "Esp. Parede", ru: "Стенка", ja: "肉厚", zh: "壁厚" }),
        outerDiameter: t({ en: "Outer Diameter", tr: "Dış Çap", de: "Außendurchmesser", fr: "Ø Extérieur", es: "Ø Exterior", it: "Ø Esterno", pt: "Ø Externo", ru: "Нар. диаметр", ja: "外径", zh: "外径" }),
        diameter: t({ en: "Diameter", tr: "Çap", de: "Durchmesser", fr: "Diamètre", es: "Diámetro", it: "Diametro", pt: "Diâmetro", ru: "Диаметр", ja: "直径", zh: "直径" }),
        length: t({ en: "Length", tr: "Uzunluk", de: "Länge", fr: "Longueur", es: "Longitud", it: "Lunghezza", pt: "Comprimento", ru: "Длина", ja: "長さ", zh: "长度" }),
    },

    aluminum: {
        title: t({ en: "Aluminum Weight Calculator", tr: "Aluminyum Ağırlık Hesaplayıcı", de: "Aluminium Gewichtsrechner", fr: "Calculateur Poids Alu", es: "Calculadora Peso Aluminio", it: "Calcolatore Peso Alu", pt: "Calculadora Peso Alumínio", ru: "Калькулятор веса Al", ja: "アルミ重量計算", zh: "铝重量计算器" }),
        shapes: {
            box: t({ en: "Rectangular Tube", tr: "Kutu Profil", de: "Rechteckrohr", fr: "Tube Rectangulaire", es: "Tubo Rectangular", it: "Tubo Quadrato", pt: "Tubo Quadrado", ru: "Квадратная труба", ja: "角パイプ", zh: "方管" }),
            sheet: t({ en: "Plate / Sheet", tr: "Levha / Plaka", de: "Blech / Platte", fr: "Tôle / Plaque", es: "Chapa / Placa", it: "Lamiera / Piastra", pt: "Chapa / Placa", ru: "Лист / Плита", ja: "板 / プレート", zh: "板 / 板材" }),
            pipe: t({ en: "Round Tube", tr: "Yuvarlak Boru", de: "Rundrohr", fr: "Tube Rond", es: "Tubo Redondo", it: "Tubo Tondo", pt: "Tubo Redondo", ru: "Круглая труба", ja: "丸パイプ", zh: "圆管" }),
            bar: t({ en: "Solid Bar", tr: "Dolu Çubuk", de: "Vollstab", fr: "Barre Pleine", es: "Barra Maciza", it: "Barra Piena", pt: "Barra Maciça", ru: "Кругляк", ja: "丸棒", zh: "圆棒" }),
        },
        theory: {
            densityTitle: t({ en: "Density (ρ)", tr: "Yoğunluk (ρ)", de: "Dichte (ρ)", fr: "Densité (ρ)", es: "Densidad (ρ)", it: "Densità (ρ)", pt: "Densidade (ρ)", ru: "Плотность (ρ)", ja: "密度 (ρ)", zh: "密度 (ρ)" }),
            densityDesc: t({ en: "Density is mass per unit volume. It varies slightly depending on the alloy composition.", tr: "Yoğunluk, birim hacim başına kütledir. Alaşım bileşimine bağlı olarak hafif farklılık gösterir.", de: "Dichte ist die Masse pro Volumeneinheit. Sie variiert je nach Legierung.", fr: "La densité est la masse par unité de volume. Elle varie selon l'alliage.", es: "La densidad es masa por unidad de volumen. Varía según la aleación.", it: "La densità è massa per unità di volume. Varia leggermente per lega.", pt: "A densidade é massa por unidade de volume. Varia com a liga.", ru: "Плотность - это масса на единицу объема. Зависит от сплава.", ja: "密度は単位体積あたりの質量です。合金成分によりわずかに異なります。", zh: "密度是单位体积的质量。不同铝合金因成分不同略有差异。" }),
            series1000: t({ en: "1000 Series (Pure): ~2.70 g/cm³", tr: "1000 Serisi (Saf): ~2.70 g/cm³", de: "1000er Serie (Rein): ~2.70 g/cm³", fr: "Série 1000 (Pur) : ~2.70 g/cm³", es: "Serie 1000 (Puro): ~2.70 g/cm³", it: "Serie 1000 (Puro): ~2.70 g/cm³", pt: "Série 1000 (Puro): ~2.70 g/cm³", ru: "Серия 1000 (Чистый): ~2.70 г/см³", ja: "1000系 (純アルミ): ~2.70 g/cm³", zh: "1000系列 (纯铝): ~2.70 g/cm³" }),
            series6000: t({ en: "6000 Series (Mg+Si): ~2.70 g/cm³", tr: "6000 Serisi (Mg+Si): ~2.70 g/cm³", de: "6000er Serie (Mg+Si): ~2.70 g/cm³", fr: "Série 6000 (Mg+Si) : ~2.70 g/cm³", es: "Serie 6000 (Mg+Si): ~2.70 g/cm³", it: "Serie 6000 (Mg+Si): ~2.70 g/cm³", pt: "Série 6000 (Mg+Si): ~2.70 g/cm³", ru: "Серия 6000 (Mg+Si): ~2.70 г/см³", ja: "6000系 (Mg+Si): ~2.70 g/cm³", zh: "6000系列 (Mg+Si): ~2.70 g/cm³" }),
            series7000: t({ en: "7000 Series (Zn): ~2.81 g/cm³ (Heavier)", tr: "7000 Serisi (Zn): ~2.81 g/cm³ (Ağır)", de: "7000er Serie (Zn): ~2.81 g/cm³ (schwerer)", fr: "Série 7000 (Zn) : ~2.81 g/cm³ (Plus lourd)", es: "Serie 7000 (Zn): ~2.81 g/cm³ (Pesado)", it: "Serie 7000 (Zn): ~2.81 g/cm³ (Pesante)", pt: "Série 7000 (Zn): ~2.81 g/cm³ (Pesado)", ru: "Серия 7000 (Zn): ~2.81 г/см³ (Тяжелый)", ja: "7000系 (Zn): ~2.81 g/cm³ (重い)", zh: "7000系列 (Zn): ~2.81 g/cm³ (重)" }),
            formula: t({ en: "Mass = Volume × Density", tr: "Kütle = Hacim × Yoğunluk", de: "Masse = Volumen × Dichte", fr: "Masse = Volume × Densité", es: "Masa = Volumen × Densidad", it: "Massa = Volume × Densità", pt: "Massa = Volume × Densidade", ru: "Масса = Объем × Плотность", ja: "質量 = 体積 × 密度", zh: "质量 = 体积 × 密度" }),
            plateFormula: t({ en: "Plate: Length × Width × Thickness × ρ", tr: "Plaka: Uzunluk × Genişlik × Kalınlık × ρ", de: "Platte: Länge × Breite × Dicke × ρ", fr: "Plaque : Longueur × Largeur × Épaisseur × ρ", es: "Placa: Largo × Ancho × Espesor × ρ", it: "Piastra: Lunghezza × Larghezza × Sp. × ρ", pt: "Placa: Comp. × Larg. × Esp. × ρ", ru: "Плита: Длина × Ширина × Толщина × ρ", ja: "平板: 長さ × 幅 × 厚さ × 密度", zh: "板材: 长度 × 宽度 × 厚度 × ρ" }),
        },
        disclaimer: t({ en: "Calculations based on theoretical density (~2.70 g/cm³). Actual weight may vary ±5% due to manufacturing tolerances (ASTM B221).", tr: "Hesaplamalar teorik yoğunluğa göre yapılmıştır (~2.70 g/cm³). Gerçek ağırlık, üretim toleransları (ASTM B221) nedeniyle ±%5 farklılık gösterebilir.", de: "Berechnung basiert auf theoretischer Dichte (~2.70 g/cm³). Tatsächliches Gewicht kann ±5% abweichen (ASTM B221).", fr: "Calculs basés sur la densité théorique (~2.70 g/cm³). Poids réel ±5% selon tolérances (ASTM B221).", es: "Basado en densidad teórica (~2.70 g/cm³). Peso real ±5% según tolerancias (ASTM B221).", it: "Calcoli basati su densità teorica (~2.70 g/cm³). Peso reale ±5% secondo tolleranze (ASTM B221).", pt: "Baseado na densidade teórica (~2.70 g/cm³). Peso real ±5% conf. tolerâncias (ASTM B221).", ru: "Расчет по теор. плотности (~2.70 г/см³). Реал. вес ±5% (допуски ASTM B221).", ja: "計算は理論密度 (~2.70 g/cm³) に基づきます。実重量は製造公差 (ASTM B221) により±5%変動する可能性があります。", zh: "基于理论密度 (~2.70 g/cm³)。实际重量根据生产公差 (ASTM B221) 可能有 ±5% 偏差。" }),
        projectList: {
            title: t({ en: "Project List (BOM)", tr: "Proje Listesi (BOM)", de: "Projektliste (BOM)", fr: "Liste Projet (BOM)", es: "Project List (BOM)", it: "Project List (BOM)", pt: "Project List (BOM)", ru: "Project List (BOM)", ja: "Project List (BOM)", zh: "Project List (BOM)" }),
            add: t({ en: "Add to List", tr: "Listeye Ekle", de: "Zur Liste hinzufügen", fr: "Ajouter à la Liste", es: "Add to List", it: "Add to List", pt: "Add to List", ru: "Add to List", ja: "Add to List", zh: "Add to List" }),
            clear: t({ en: "Clear List", tr: "Listeyi Temizle", de: "Liste leeren", fr: "Vider la Liste", es: "Clear List", it: "Clear List", pt: "Clear List", ru: "Clear List", ja: "Clear List", zh: "Clear List" }),
            empty: t({ en: "List is empty.", tr: "Liste boş.", de: "Liste ist leer.", fr: "Liste vide.", es: "List is empty.", it: "List is empty.", pt: "List is empty.", ru: "List is empty.", ja: "List is empty.", zh: "List is empty." }),
            totalWeight: t({ en: "Grand Total Weight", tr: "Toplam Ağırlık", de: "Gesamtgewicht", fr: "Poids Total", es: "Grand Total Weight", it: "Grand Total Weight", pt: "Grand Total Weight", ru: "Grand Total Weight", ja: "Grand Total Weight", zh: "Grand Total Weight" }),
            totalCost: t({ en: "Total Project Cost", tr: "Toplam Proje Maliyeti", de: "Gesamtkosten", fr: "Coût Total", es: "Total Project Cost", it: "Total Project Cost", pt: "Total Project Cost", ru: "Total Project Cost", ja: "Total Project Cost", zh: "Total Project Cost" }),
        },
        export: {
            pdf: t({ en: "Download Quote (PDF)", tr: "Teklif İndir (PDF)", de: "Angebot herunterladen (PDF)", fr: "Télécharger Devis (PDF)", es: "Download Quote (PDF)", it: "Download Quote (PDF)", pt: "Download Quote (PDF)", ru: "Download Quote (PDF)", ja: "Download Quote (PDF)", zh: "Download Quote (PDF)" }),
            dxf: t({ en: "Download DXF (CAD)", tr: "DXF İndir (CAD)", de: "DXF herunterladen (CAD)", fr: "Télécharger DXF (CAD)", es: "Download DXF (CAD)", it: "Download DXF (CAD)", pt: "Download DXF (CAD)", ru: "Download DXF (CAD)", ja: "Download DXF (CAD)", zh: "Download DXF (CAD)" }),
        },
    },

    handbook: {
        title: t({ en: "Materials Science Guide", tr: "Malzeme Bilimi Rehberi", de: "Werkstoffkunde-Leitfaden", fr: "Guide des Matériaux", es: "Ciencia de Materiales", it: "Guida Scienza Materiali", pt: "Ciência dos Materiais", ru: "Материаловедение", ja: "材料工学ガイド", zh: "材料科学指南" }),
    },

    fit: {
        title: t({ en: "Fit Calculator", tr: "Geçme Hesaplayıcı", de: "Passungsrechner", fr: "Calculateur d'Ajustement", es: "Calculadora de Ajustes", it: "Accoppiamenti ISO", pt: "Calculadora de Ajustes", ru: "Калькулятор посадок", ja: "はめあい計算", zh: "配合计算器" }),
        subtitle: t({ en: "ISO Tolerances", tr: "ISO Toleranslar", de: "ISO-Toleranzen", fr: "Tolérances ISO", es: "Tolerancias ISO", it: "Tolleranze e interferenze", pt: "Tolerâncias ISO", ru: "Система допусков ISO", ja: "ISO公差とはめあい", zh: "ISO 公差配合" }),
        tabs: {
            standard: t({ en: "Standard Fit", tr: "Standart Geçme", de: "Standard-Passung", fr: "Ajustement Standard", es: "Estándar", it: "Standard", pt: "Padrão", ru: "Стандартные", ja: "標準はめあい", zh: "标准配合" }),
            manual: t({ en: "Manual Entry", tr: "Elle Giriş", de: "Manuelle Eingabe", fr: "Entrée Manuelle", es: "Manual", it: "Manuale", pt: "Manual", ru: "Ручной ввод", ja: "任意公差", zh: "手动公差" }),
        },
        inputs: {
            nominalSize: t({ en: "Nominal Size", tr: "Nominal Ölçü", de: "Nennmaß", fr: "Dimension Nominale", es: "Medida Nominal", it: "Dimensione Nominale", pt: "Dimensão Nominal", ru: "Номинальный размер", ja: "呼び寸法", zh: "公称尺寸" }),
            fitLength: t({ en: "Fit Length", tr: "Geçme Uzunluğu", de: "Passungslänge", fr: "Longueur d'Ajustement", es: "Longitud de Ajuste", it: "Lunghezza Accoppiamento", pt: "Comprimento", ru: "Длина соединения", ja: "はめあい長さ", zh: "配合长度" }),
            elasticModulus: t({ en: "Elastic Modulus", tr: "Elastik Modül", de: "Elastizitätsmodul", fr: "Module Élastique", es: "Módulo Elástico", it: "Modulo Elastico", pt: "Módulo Elástico", ru: "Модуль упругости", ja: "ヤング率", zh: "弹性模量" }),
            frictionCoeff: t({ en: "Friction (μ)", tr: "Sürtünme (μ)", de: "Reibung (μ)", fr: "Frottement (μ)", es: "Fricción (μ)", it: "Attrito (μ)", pt: "Fricção (μ)", ru: "Коэфф. трения (μ)", ja: "摩擦係数 (μ)", zh: "摩擦系数 (μ)" }),
        },
        results: {
            fitType: t({ en: "Fit Type", tr: "Geçme Tipi", de: "Passungsart", fr: "Type d'Ajustement", es: "Tipo de Ajuste", it: "Tipo Accoppiamento", pt: "Tipo de Ajuste", ru: "Тип посадки", ja: "はめあい種類", zh: "配合类型" }),
            clearance: t({ en: "Clearance", tr: "Boşluk", de: "Spiel", fr: "Jeu", es: "Juego", it: "Gioco", pt: "Folga", ru: "Зазор", ja: "すきま", zh: "间隙" }),
            transition: t({ en: "Transition", tr: "Geçiş", de: "Übergang", fr: "Transition", es: "Transición", it: "Transizione", pt: "Transição", ru: "Переходная", ja: "中間", zh: "过渡" }),
            interference: t({ en: "Interference", tr: "Sıkı Geçme", de: "Übermaß", fr: "Serrage", es: "Interferencia", it: "Interferenza", pt: "Interferência", ru: "Натяг", ja: "しめしろ", zh: "过盈" }),
        },
    },

    gear: {
        title: t({ en: "Gear Calculator", tr: "Dişli Hesaplama", de: "Zahnradrechner", fr: "Calcul Engrenages", es: "Cálculo de Engranajes", it: "Calcolo Ingranaggi", pt: "Cálculo de Engrenagens", ru: "Расчет зубчатых передач", ja: "歯車計算", zh: "齿轮计算器" }),
        subtitle: t({ en: "Spur, Helical, Bevel", tr: "Düz, Helisel, Konik", de: "Stirn-, Schräg-, Kegelrad", fr: "Droit, Hélicoïdal, Conique", es: "Recto, Helicoidal, Cónico", it: "Dcilindrici, Elicoidali, Conici", pt: "Retas, Helicoidais, Cônicas", ru: "Цилиндрические и конические", ja: "平歯車・はすば・かさ歯車", zh: "圆柱齿轮、锥齿轮" }),
        types: {
            spur: t({ en: "Spur Gear", tr: "Düz Dişli", de: "Stirnrad", fr: "Denture Droite", es: "Recto", it: "Cilindrici", pt: "Retas", ru: "Прямозубая", ja: "平歯車", zh: "直齿轮" }),
            helical: t({ en: "Helical", tr: "Helisel", de: "Schrägverzahnung", fr: "Hélicoïdal", es: "Helicoidal", it: "Elicoidali", pt: "Helicoidal", ru: "Косозубая", ja: "はすば歯車", zh: "斜齿轮" }),
            bevel: t({ en: "Bevel", tr: "Konik", de: "Kegelrad", fr: "Conique", es: "Cónico", it: "Conici", pt: "Cônica", ru: "Коническая", ja: "かさ歯車", zh: "锥齿轮" }),
            worm: t({ en: "Worm", tr: "Sonsuz Vida", de: "Schnecke", fr: "Vis sans Fin", es: "Sinfín", it: "Vite Senza Fine", pt: "Sem-Fim", ru: "Червячная", ja: "ウォーム", zh: "蜗轮蜗杆" }),
        },
        inputs: {
            module: t({ en: "Module (m)", tr: "Modül (m)", de: "Modul (m)", fr: "Module (m)", es: "Módulo (m)", it: "Modulo (m)", pt: "Módulo (m)", ru: "Модуль (m)", ja: "モジュール (m)", zh: "模数 (m)" }),
            pressureAngle: t({ en: "Pressure Angle", tr: "Kavrama Açısı", de: "Eingriffswinkel", fr: "Angle de Pression", es: "Ángulo de Presión", it: "Angolo Pressione", pt: "Ângulo de Pressão", ru: "Угол профиля", ja: "圧力角", zh: "压力角" }),
            pinionTeeth: t({ en: "Z1 (Pinion)", tr: "Z1 (Pinyon)", de: "Z1 (Ritzel)", fr: "Z1 (Pignon)", es: "Z1 (Piñón)", it: "Z1 (Pignone)", pt: "Z1 (Pinhão)", ru: "Z1 (Шестерня)", ja: "Z1 (小歯車)", zh: "Z1 (小齿轮)" }),
            gearTeeth: t({ en: "Z2 (Gear)", tr: "Z2 (Dişli)", de: "Z2 (Rad)", fr: "Z2 (Roue)", es: "Z2 (Rueda)", it: "Z2 (Ruota)", pt: "Z2 (Coroa)", ru: "Z2 (Колесо)", ja: "Z2 (大歯車)", zh: "Z2 (大齿轮)" }),
            helixAngle: t({ en: "Helix Angle", tr: "Helis Açısı", de: "Schrägungswinkel", fr: "Angle d'Hélice", es: "Ángulo de Hélice", it: "Angolo Elica", pt: "Ângulo de Hélice", ru: "Угол наклона", ja: "ねじれ角", zh: "螺旋角" }),
            faceWidth: t({ en: "Face Width", tr: "Diş Genişliği", de: "Zahnbreite", fr: "Largeur de Denture", es: "Ancho de Cara", it: "Larghezza Fascia", pt: "Largura", ru: "Ширина венца", ja: "歯幅", zh: "齿宽" }),
            power: t({ en: "Power (kW)", tr: "Güç (kW)", de: "Leistung (kW)", fr: "Puissance (kW)", es: "Potencia (kW)", it: "Potenza (kW)", pt: "Potência (kW)", ru: "Мощность (кВт)", ja: "動力 (kW)", zh: "功率 (kW)" }),
            rpm: t({ en: "Speed (RPM)", tr: "Hız (RPM)", de: "Drehzahl (U/min)", fr: "Vitesse (tr/min)", es: "Velocidad (RPM)", it: "Velocità (RPM)", pt: "Rotação (RPM)", ru: "Скорость (об/мин)", ja: "回転数 (rpm)", zh: "转速 (rpm)" }),
        },
        results: {
            calculatedTorque: t({ en: "Torque", tr: "Tork", de: "Drehmoment", fr: "Couple", es: "Par Torsor", it: "Coppia", pt: "Torque", ru: "Крутящий момент", ja: "トルク", zh: "扭矩" }),
            transmissionRatio: t({ en: "Ratio", tr: "Oran", de: "Übersetzung", fr: "Rapport", es: "Relación", it: "Rapporto", pt: "Relação", ru: "Передаточное число", ja: "減速比", zh: "传动比" }),
            pitchDiameter: t({ en: "Pitch Diameter", tr: "Taksimat Çapı", de: "Teilkreisdurchmesser", fr: "Diamètre Primitif", es: "Diámetro Primitivo", it: "Diametro Primitivo", pt: "Diâmetro Primitivo", ru: "Делительный диаметр", ja: "基準円直径", zh: "分度圆直径" }),
            forcesAndStress: t({ en: "Forces & Stress", tr: "Kuvvetler & Gerilme", de: "Kräfte & Spannungen", fr: "Forces & Contraintes", es: "Fuerzas y Esfuerzos", it: "Forze & Sforzi", pt: "Forças e Tensões", ru: "Силы и Напряжения", ja: "荷重と応力", zh: "受力与应力" }),
        },
    },

    driveTrain: {
        title: t({ en: "Drive Train Designer", tr: "Tahrik Sistemi Tasarımcısı", de: "Antriebsstrang-Designer", fr: "Concepteur Transmission", es: "Diseñador de Transmisión", it: "Progettista Trasmissioni", pt: "Projetista de Transmissão", ru: "Проектирование Привода", ja: "駆動系設計", zh: "动力传动设计" }),
        subtitle: t({ en: "Motor • Gearbox • Load", tr: "Motor • Redüktör • Yük", de: "Motor • Getriebe • Last", fr: "Moteur • Réducteur • Charge", es: "Motor • Caja • Carga", it: "Motore • Cambio • Carico", pt: "Motor • Caixa • Carga", ru: "Двигатель • Редуктор • Нагрузка", ja: "モータ • 減速機 • 負荷", zh: "电机 • 变速箱 • 负载" }),
        primeMover: t({ en: "1. Prime Mover (IEC)", tr: "1. Birincil Hareket (IEC)", de: "1. Antrieb (IEC)", fr: "1. Moteur (IEC)", es: "1. Motor Principal (IEC)", it: "1. Motore Primo (IEC)", pt: "1. Motor Principal (IEC)", ru: "1. Двигатель (IEC)", ja: "1. 原動機 (IEC)", zh: "1. 原动机 (IEC)" }),
        application: t({ en: "2. Service Factor", tr: "2. Servis Faktörü", de: "2. Betriebsfaktor", fr: "2. Facteur de Service", es: "2. Factor de Servicio", it: "2. Fattore Servizio", pt: "2. Fator de Serviço", ru: "2. Коэфф. эксплуатации", ja: "2. 使用係数", zh: "2. 工况系数" }),
        transmission: t({ en: "3. Transmission Design", tr: "3. Transmisyon Tasarımı", de: "3. Getriebeauslegung", fr: "3. Conception Transmission", es: "3. Diseño de Transmisión", it: "3. Progetto Trasmissione", pt: "3. Projeto de Engrenagem", ru: "3. Зубчатая передача", ja: "3. 歯車設計", zh: "3. 传动设计" }),
        analysis: t({ en: "4. Engineering Analysis", tr: "4. Mühendislik Analizi", de: "4. Ingenieuranalyse", fr: "4. Analyse Technique", es: "4. Análisis de Ingeniería", it: "4. Analisi Ingegneristica", pt: "4. Análise de Engenharia", ru: "4. Инженерный анализ", ja: "4. 工学解析", zh: "4. 工程分析" }),
        manufacturing: t({ en: "4a. Inspection (M / Wk)", tr: "4a. Denetim (M / Wk)", de: "4a. Kontrolldaten (M / Wk)", fr: "4a. Inspection (M / Wk)", es: "4a. Datos de Inspección", it: "4a. Ispezione (M / Wk)", pt: "4a. Inspeção (M / Wk)", ru: "4a. Контрольные данные (M / Wk)", ja: "4a. 検査データ (M / Wk)", zh: "4a. 检验数据 (M / Wk)" }),
        engineering: t({ en: "4b. Stress Analysis", tr: "4b. Gerilme Analizi", de: "4b. Festigkeitsanalyse", fr: "4b. Analyse Contraintes", es: "4b. Análisis de Esfuerzos", it: "4b. Analisi Sforzi", pt: "4b. Análise de Tensões", ru: "4b. Расчет на прочность", ja: "4b. 強度計算", zh: "4b. 强度分析" }),
    },

    safety: {
        loadFactors: t({ en: "Load Factors", tr: "Yük Faktörleri", de: "Lastfaktoren", fr: "Facteurs de Charge", es: "Factores de Carga", it: "Fattori di Carico", pt: "Fatores de Carga", ru: "Коэффициенты нагрузки", ja: "荷重係数", zh: "载荷系数" }),
        tangentialForce: t({ en: "Tangential Force (Ft)", tr: "Teğet Kuvvet (Ft)", de: "Umfangskraft (Ft)", fr: "Force Tangentielle (Ft)", es: "Fuerza Tangencial (Ft)", it: "Forza Tangenziale (Ft)", pt: "Força Tangencial (Ft)", ru: "Окружная сила (Ft)", ja: "接線力 (Ft)", zh: "切向力 (Ft)" }),
        radialForce: t({ en: "Radial Force (Fr)", tr: "Radyal Kuvvet (Fr)", de: "Radialkraft (Fr)", fr: "Force Radiale (Fr)", es: "Fuerza Radial (Fr)", it: "Forza Radiale (Fr)", pt: "Força Radial (Fr)", ru: "Радиальная сила (Fr)", ja: "半径方向力 (Fr)", zh: "径向力 (Fr)" }),
        axialForce: t({ en: "Axial Force (Fa)", tr: "Eksenel Kuvvet (Fa)", de: "Axialkraft (Fa)", fr: "Force Axiale (Fa)", es: "Fuerza Axial (Fa)", it: "Forza Assiale (Fa)", pt: "Força Axial (Fa)", ru: "Осевая сила (Fa)", ja: "スラスト力 (Fa)", zh: "轴向力 (Fa)" }),
        safetyWarning: t({ en: "Safety factors are estimates. For critical applications, use ISO 6336 or AGMA 2001.", tr: "Güvenlik faktörleri tahminidir. Kritik uygulamalar için ISO 6336 veya AGMA 2001 kullanın.", de: "Sicherheitsfaktoren sind Schätzungen. Für kritische Anwendungen ISO 6336 oder AGMA 2001 verwenden.", fr: "Les facteurs de sécurité sont des estimations. Pour applications critiques, utiliser ISO 6336 ou AGMA 2001.", es: "Los factores de seguridad son estimaciones. Para aplicaciones críticas, use ISO 6336 o AGMA 2001.", it: "I fattori di sicurezza sono stime. Per applicazioni critiche, usare ISO 6336 o AGMA 2001.", pt: "Fatores de segurança são estimativas. Para aplicações críticas, use ISO 6336 ou AGMA 2001.", ru: "Коэффициенты запаса являются оценочными. Для ответственных узлов используйте расчет по ISO 6336 или ГОСТ 21354.", ja: "安全率は簡易計算です。重要部品にはISO 6336またはAGMA 2001の詳細計算を推奨します。", zh: "安全系数基于简化公式估算。对于关键应用，建议使用 ISO 6336 或 AGMA 2001 标准分析。" }),
    },

    converter: {
        title: t({ en: "Converter", tr: "Çevirici", de: "Umrechner", fr: "Convertisseur", es: "Conversor", it: "Convertitore", pt: "Conversor", ru: "Конвертер", ja: "単位変換", zh: "单位转换" }),
        categories: {
            length: t({ en: "Length", tr: "Uzunluk", de: "Länge", fr: "Longueur", es: "Longitud", it: "Lunghezza", pt: "Comprimento", ru: "Длина", ja: "長さ", zh: "长度" }),
            weight: t({ en: "Weight", tr: "Ağırlık", de: "Gewicht", fr: "Poids", es: "Peso", it: "Peso", pt: "Peso", ru: "Вес", ja: "重量", zh: "重量" }),
            pressure: t({ en: "Pressure", tr: "Basınç", de: "Druck", fr: "Pression", es: "Presión", it: "Pressione", pt: "Pressão", ru: "Давление", ja: "圧力", zh: "压力" }),
            power: t({ en: "Power", tr: "Güç", de: "Leistung", fr: "Puissance", es: "Potencia", it: "Potenza", pt: "Potência", ru: "Мощность", ja: "動力", zh: "功率" }),
        },
    },

    strength: {
        title: t({ en: "Strength Calculator", tr: "Mukavemet Hesaplayıcı", de: "Festigkeitsrechner", fr: "Calcul Résistance", es: "Calculadora de Resistencia", it: "Calcolo Resistenza", pt: "Calculadora de Resistência", ru: "Расчет прочности", ja: "強度計算", zh: "强度计算器" }),
        subtitle: t({ en: "Mohr's Circle Analysis", tr: "Mohr Çemberi Analizi", de: "Mohr'scher Spannungskreis", fr: "Cercle de Mohr", es: "Círculo de Mohr", it: "Cerchio di Mohr", pt: "Círculo de Mohr", ru: "Круг Мора", ja: "モール円解析", zh: "莫尔圆分析" }),
        inputs: {
            sigmaX: t({ en: "Normal Stress σx", tr: "Normal Gerilme σx", de: "Normalspannung σx", fr: "Contrainte Normale σx", es: "Esfuerzo Normal σx", it: "Sforzo Normale σx", pt: "Tensão Normal σx", ru: "Норм. напряжение σx", ja: "垂直応力 σx", zh: "正应力 σx" }),
            sigmaY: t({ en: "Normal Stress σy", tr: "Normal Gerilme σy", de: "Normalspannung σy", fr: "Contrainte Normale σy", es: "Esfuerzo Normal σy", it: "Sforzo Normale σy", pt: "Tensão Normal σy", ru: "Норм. напряжение σy", ja: "垂直応力 σy", zh: "正应力 σy" }),
            tauXY: t({ en: "Shear Stress τxy", tr: "Kayma Gerilmesi τxy", de: "Schubspannung τxy", fr: "Contrainte Cisaillement τxy", es: "Esfuerzo Cortante τxy", it: "Sforzo Taglio τxy", pt: "Tensão Cisalhamento τxy", ru: "Касательное τxy", ja: "せん断応力 τxy", zh: "剪应力 τxy" }),
        },
        results: {
            principalStresses: t({ en: "Principal Stresses", tr: "Asal Gerilmeler", de: "Hauptspannungen", fr: "Contraintes Principales", es: "Esfuerzos Principales", it: "Sforzi Principali", pt: "Tensões Principais", ru: "Главные напряжения", ja: "主応力", zh: "主应力" }),
            maxShear: t({ en: "Max Shear Stress", tr: "Maks Kayma Gerilmesi", de: "Max. Schubspannung", fr: "Cisaillement Max", es: "Cortante Máximo", it: "Taglio Massimo", pt: "Cisalhamento Máx", ru: "Макс. касательное", ja: "最大せん断応力", zh: "最大剪应力" }),
            vonMises: t({ en: "von Mises Stress", tr: "von Mises Gerilmesi", de: "von-Mises-Spannung", fr: "Contrainte von Mises", es: "Esfuerzo von Mises", it: "Sforzo von Mises", pt: "Tensão von Mises", ru: "Напряжение Мизеса", ja: "ミーゼス応力", zh: "冯·米塞斯应力" }),
            angle: t({ en: "Principal Angle", tr: "Asal Açı", de: "Hauptachsenwinkel", fr: "Angle Principal", es: "Ángulo Principal", it: "Angolo Principale", pt: "Ângulo Principal", ru: "Главный угол", ja: "主軸角", zh: "主应力角" }),
        },
    },

    bearing: {
        title: t({ en: "Bearing Life Calculator", tr: "Rulman Ömrü Hesaplayıcı", de: "Lagerlebensdauerrechner", fr: "Calculateur Durée de Vie", es: "Calculadora Vida Rodamiento", it: "Calcolatore Vita Cuscinetto", pt: "Calculadora Vida Rolamento", ru: "Расчет ресурса подшипника", ja: "軸受寿命計算", zh: "轴承寿命计算器" }),
        subtitle: t({ en: "L10 Life Calculation", tr: "L10 Ömür Hesabı", de: "L10 Lebensdauer", fr: "Durée de Vie L10", es: "Vida L10", it: "Vita L10", pt: "Vida L10", ru: "Ресурс L10", ja: "L10寿命計算", zh: "L10寿命计算" }),
        inputs: {
            radialLoad: t({ en: "Radial Load (Fr)", tr: "Radyal Yük (Fr)", de: "Radiallast (Fr)", fr: "Charge Radiale (Fr)", es: "Carga Radial (Fr)", it: "Carico Radiale (Fr)", pt: "Carga Radial (Fr)", ru: "Радиальная нагрузка (Fr)", ja: "ラジアル荷重 (Fr)", zh: "径向载荷 (Fr)" }),
            axialLoad: t({ en: "Axial Load (Fa)", tr: "Eksenel Yük (Fa)", de: "Axiallast (Fa)", fr: "Charge Axiale (Fa)", es: "Carga Axial (Fa)", it: "Carico Assiale (Fa)", pt: "Carga Axial (Fa)", ru: "Осевая нагрузка (Fa)", ja: "アキシアル荷重 (Fa)", zh: "轴向载荷 (Fa)" }),
            rpm: t({ en: "Rotational Speed", tr: "Dönüş Hızı", de: "Drehzahl", fr: "Vitesse de Rotation", es: "Velocidad de Rotación", it: "Velocità di Rotazione", pt: "Velocidade Rotacional", ru: "Частота вращения", ja: "回転速度", zh: "转速" }),
            dynamicCapacity: t({ en: "Dynamic Capacity (C)", tr: "Dinamik Kapasite (C)", de: "Dynamische Tragzahl (C)", fr: "Capacité Dynamique (C)", es: "Capacidad Dinámica (C)", it: "Capacità Dinamica (C)", pt: "Capacidade Dinâmica (C)", ru: "Динамическая грузоподъемность (C)", ja: "動定格荷重 (C)", zh: "动额定载荷 (C)" }),
        },
        results: {
            lifeHours: t({ en: "Life (hours)", tr: "Ömür (saat)", de: "Lebensdauer (Stunden)", fr: "Durée de Vie (heures)", es: "Vida (horas)", it: "Vita (ore)", pt: "Vida (horas)", ru: "Ресурс (часов)", ja: "寿命 (時間)", zh: "寿命 (小时)" }),
            lifeRevolutions: t({ en: "Life (revolutions)", tr: "Ömür (devir)", de: "Lebensdauer (Umdrehungen)", fr: "Durée de Vie (tours)", es: "Vida (revoluciones)", it: "Vita (giri)", pt: "Vida (rotações)", ru: "Ресурс (оборотов)", ja: "寿命 (回転)", zh: "寿命 (转数)" }),
            equivalentLoad: t({ en: "Equivalent Load (P)", tr: "Eşdeğer Yük (P)", de: "Äquivalente Last (P)", fr: "Charge Équivalente (P)", es: "Carga Equivalente (P)", it: "Carico Equivalente (P)", pt: "Carga Equivalente (P)", ru: "Эквивалентная нагрузка (P)", ja: "等価荷重 (P)", zh: "当量载荷 (P)" }),
        },
    },

    welding: {
        title: t({ en: "Welding Heat Calculator", tr: "Kaynak Isı Hesaplayıcı", de: "Schweißwärmerechner", fr: "Calculateur Chaleur Soudage", es: "Calculadora Calor Soldadura", it: "Calcolatore Calore Saldatura", pt: "Calculadora Calor Soldagem", ru: "Расчет тепловложения", ja: "溶接熱入力計算", zh: "焊接热输入计算" }),
        subtitle: t({ en: "Heat Input & Preheat", tr: "Isı Girdisi & Ön Isıtma", de: "Wärmeeintrag & Vorwärmen", fr: "Apport Thermique & Préchauffage", es: "Aporte Térmico & Precalentamiento", it: "Apporto Termico & Preriscaldo", pt: "Aporte Térmico & Pré-aquecimento", ru: "Погонная энергия и подогрев", ja: "入熱と予熱", zh: "热输入与预热" }),
        inputs: {
            current: t({ en: "Welding Current", tr: "Kaynak Akımı", de: "Schweißstrom", fr: "Courant de Soudage", es: "Corriente de Soldadura", it: "Corrente di Saldatura", pt: "Corrente de Soldagem", ru: "Сварочный ток", ja: "溶接電流", zh: "焊接电流" }),
            voltage: t({ en: "Arc Voltage", tr: "Ark Voltajı", de: "Lichtbogenspannung", fr: "Tension d'Arc", es: "Voltaje de Arco", it: "Tensione Arco", pt: "Tensão do Arco", ru: "Напряжение дуги", ja: "アーク電圧", zh: "电弧电压" }),
            speed: t({ en: "Travel Speed", tr: "İlerleme Hızı", de: "Schweißgeschwindigkeit", fr: "Vitesse d'Avance", es: "Velocidad de Avance", it: "Velocità di Avanzamento", pt: "Velocidade de Avanço", ru: "Скорость сварки", ja: "溶接速度", zh: "焊接速度" }),
            efficiency: t({ en: "Process Efficiency", tr: "Proses Verimi", de: "Prozesswirkungsgrad", fr: "Rendement du Procédé", es: "Eficiencia del Proceso", it: "Efficienza Processo", pt: "Eficiência do Processo", ru: "КПД процесса", ja: "プロセス効率", zh: "工艺效率" }),
        },
        results: {
            heatInput: t({ en: "Heat Input (Q)", tr: "Isı Girdisi (Q)", de: "Wärmeeintrag (Q)", fr: "Apport Thermique (Q)", es: "Aporte Térmico (Q)", it: "Apporto Termico (Q)", pt: "Aporte Térmico (Q)", ru: "Погонная энергия (Q)", ja: "入熱量 (Q)", zh: "热输入 (Q)" }),
            preheatTemp: t({ en: "Preheat Temperature", tr: "Ön Isıtma Sıcaklığı", de: "Vorwärmtemperatur", fr: "Température de Préchauffage", es: "Temperatura de Precalentamiento", it: "Temperatura Preriscaldo", pt: "Temperatura de Pré-aquecimento", ru: "Температура подогрева", ja: "予熱温度", zh: "预热温度" }),
        },
    },

    sheetMetal: {
        title: t({ en: "Sheet Metal Calculator", tr: "Sac Metal Hesaplayıcı", de: "Blechbiegerechner", fr: "Calculateur Tôlerie", es: "Calculadora Chapa", it: "Calcolatore Lamiera", pt: "Calculadora Chapa", ru: "Расчет листового металла", ja: "板金曲げ計算", zh: "钣金计算器" }),
        subtitle: t({ en: "Bending Force & K-Factor", tr: "Bükme Kuvveti & K-Faktörü", de: "Biegekraft & K-Faktor", fr: "Force de Pliage & K-Factor", es: "Fuerza de Doblado & Factor K", it: "Forza Piegatura & K-Factor", pt: "Força de Dobra & Fator K", ru: "Усилие гибки и K-фактор", ja: "曲げ力とK係数", zh: "折弯力与K因子" }),
        inputs: {
            thickness: t({ en: "Sheet Thickness", tr: "Sac Kalınlığı", de: "Blechdicke", fr: "Épaisseur de Tôle", es: "Espesor de Chapa", it: "Spessore Lamiera", pt: "Espessura da Chapa", ru: "Толщина листа", ja: "板厚", zh: "板厚" }),
            length: t({ en: "Bend Length", tr: "Bükme Uzunluğu", de: "Biegelänge", fr: "Longueur de Pli", es: "Longitud de Doblado", it: "Lunghezza Piega", pt: "Comprimento de Dobra", ru: "Длина гиба", ja: "曲げ長さ", zh: "折弯长度" }),
            angle: t({ en: "Bend Angle", tr: "Bükme Açısı", de: "Biegewinkel", fr: "Angle de Pliage", es: "Ángulo de Doblado", it: "Angolo Piega", pt: "Ângulo de Dobra", ru: "Угол гиба", ja: "曲げ角度", zh: "折弯角度" }),
            dieOpening: t({ en: "Die Opening (V)", tr: "Kalıp Açıklığı (V)", de: "Matrizenöffnung (V)", fr: "Ouverture Matrice (V)", es: "Abertura de Matriz (V)", it: "Apertura Matrice (V)", pt: "Abertura da Matriz (V)", ru: "Раскрытие матрицы (V)", ja: "ダイ開口 (V)", zh: "V型槽开口 (V)" }),
            tensileStrength: t({ en: "Tensile Strength", tr: "Çekme Mukavemeti", de: "Zugfestigkeit", fr: "Résistance à la Traction", es: "Resistencia a la Tracción", it: "Resistenza a Trazione", pt: "Resistência à Tração", ru: "Предел прочности", ja: "引張強度", zh: "抗拉强度" }),
        },
        results: {
            force: t({ en: "Bending Force", tr: "Bükme Kuvveti", de: "Biegekraft", fr: "Force de Pliage", es: "Fuerza de Doblado", it: "Forza di Piegatura", pt: "Força de Dobra", ru: "Усилие гибки", ja: "曲げ加圧力", zh: "折弯力" }),
            flatLength: t({ en: "Flat Pattern Length", tr: "Açınım Uzunluğu", de: "Abwicklungslänge", fr: "Longueur Déployée", es: "Longitud Desplegada", it: "Lunghezza Sviluppo", pt: "Comprimento Planificado", ru: "Длина развертки", ja: "展開長", zh: "展开长度" }),
            innerRadius: t({ en: "Inner Bend Radius", tr: "İç Bükme Yarıçapı", de: "Innerer Biegeradius", fr: "Rayon de Pliage Intérieur", es: "Radio Interior de Doblado", it: "Raggio Interno Piega", pt: "Raio Interno de Dobra", ru: "Внутренний радиус", ja: "内側曲げ半径", zh: "内弯曲半径" }),
        },
    },

    pump: {
        title: t({ en: "Pump Calculator", tr: "Pompa Hesaplayıcı", de: "Pumpenrechner", fr: "Calculateur de Pompe", es: "Calculadora de Bomba", it: "Calcolatore Pompa", pt: "Calculadora de Bomba", ru: "Расчет насоса", ja: "ポンプ計算", zh: "泵计算器" }),
        subtitle: t({ en: "Power & NPSH Analysis", tr: "Güç & NPSH Analizi", de: "Leistung & NPSH", fr: "Puissance & NPSH", es: "Potencia & NPSH", it: "Potenza & NPSH", pt: "Potência & NPSH", ru: "Мощность и NPSH", ja: "動力とNPSH", zh: "功率与NPSH" }),
        inputs: {
            flow: t({ en: "Flow Rate (Q)", tr: "Debi (Q)", de: "Volumenstrom (Q)", fr: "Débit (Q)", es: "Caudal (Q)", it: "Portata (Q)", pt: "Vazão (Q)", ru: "Расход (Q)", ja: "流量 (Q)", zh: "流量 (Q)" }),
            head: t({ en: "Total Head (H)", tr: "Toplam Basma Yüksekliği (H)", de: "Förderhöhe (H)", fr: "Hauteur Manométrique (H)", es: "Altura Total (H)", it: "Prevalenza (H)", pt: "Altura Manométrica (H)", ru: "Напор (H)", ja: "全揚程 (H)", zh: "总扬程 (H)" }),
            eff: t({ en: "Pump Efficiency (η)", tr: "Pompa Verimi (η)", de: "Pumpenwirkungsgrad (η)", fr: "Rendement Pompe (η)", es: "Eficiencia de Bomba (η)", it: "Rendimento Pompa (η)", pt: "Rendimento da Bomba (η)", ru: "КПД насоса (η)", ja: "ポンプ効率 (η)", zh: "泵效率 (η)" }),
            density: t({ en: "Fluid Density", tr: "Akışkan Yoğunluğu", de: "Fluiddichte", fr: "Densité du Fluide", es: "Densidad del Fluido", it: "Densità Fluido", pt: "Densidade do Fluido", ru: "Плотность жидкости", ja: "流体密度", zh: "流体密度" }),
        },
        results: {
            hydPower: t({ en: "Hydraulic Power", tr: "Hidrolik Güç", de: "Hydraulische Leistung", fr: "Puissance Hydraulique", es: "Potencia Hidráulica", it: "Potenza Idraulica", pt: "Potência Hidráulica", ru: "Гидравлическая мощность", ja: "水動力", zh: "水力功率" }),
            shaftPower: t({ en: "Shaft Power", tr: "Mil Gücü", de: "Wellenleistung", fr: "Puissance sur Arbre", es: "Potencia en Eje", it: "Potenza Albero", pt: "Potência do Eixo", ru: "Мощность на валу", ja: "軸動力", zh: "轴功率" }),
            npshRequired: t({ en: "NPSH Required", tr: "Gerekli NPSH", de: "NPSH erforderlich", fr: "NPSH Requis", es: "NPSH Requerido", it: "NPSH Richiesto", pt: "NPSH Requerido", ru: "Требуемый NPSH", ja: "必要NPSH", zh: "必需NPSH" }),
        },
    },

    fastener: {
        title: t({ en: "Fastener Calculator", tr: "Bağlantı Elemanı Hesaplayıcı", de: "Verbindungselementrechner", fr: "Calculateur de Fixations", es: "Calculadora de Sujetadores", it: "Calcolatore Bulloneria", pt: "Calculadora de Fixadores", ru: "Расчет крепежа", ja: "ねじ計算", zh: "紧固件计算器" }),
        subtitle: t({ en: "ISO Metric Threads", tr: "ISO Metrik Diş", de: "ISO Metrisches Gewinde", fr: "Filetages Métriques ISO", es: "Roscas Métricas ISO", it: "Filettature Metriche ISO", pt: "Roscas Métricas ISO", ru: "Метрическая резьба ISO", ja: "ISOメートルねじ", zh: "ISO公制螺纹" }),
        inputs: {
            size: t({ en: "Nominal Size (M)", tr: "Nominal Ölçü (M)", de: "Nennmaß (M)", fr: "Taille Nominale (M)", es: "Tamaño Nominal (M)", it: "Dimensione Nominale (M)", pt: "Tamanho Nominal (M)", ru: "Номинальный размер (M)", ja: "呼び径 (M)", zh: "公称尺寸 (M)" }),
            pitch: t({ en: "Thread Pitch", tr: "Diş Adımı", de: "Gewindesteigung", fr: "Pas de Filetage", es: "Paso de Rosca", it: "Passo Filettatura", pt: "Passo da Rosca", ru: "Шаг резьбы", ja: "ピッチ", zh: "螺距" }),
            propertyClass: t({ en: "Property Class", tr: "Mukavemet Sınıfı", de: "Festigkeitsklasse", fr: "Classe de Résistance", es: "Clase de Resistencia", it: "Classe di Resistenza", pt: "Classe de Resistência", ru: "Класс прочности", ja: "強度区分", zh: "性能等级" }),
        },
        results: {
            tapDrill: t({ en: "Tap Drill Diameter", tr: "Kılavuz Matkap Çapı", de: "Kernlochdurchmesser", fr: "Diamètre de Perçage", es: "Diámetro de Taladro", it: "Diametro Foro", pt: "Diâmetro de Furo", ru: "Диаметр сверла", ja: "下穴径", zh: "攻丝钻径" }),
            minorDia: t({ en: "Minor Diameter", tr: "Küçük Çap", de: "Kerndurchmesser", fr: "Diamètre Mineur", es: "Diámetro Menor", it: "Diametro Minore", pt: "Diâmetro Menor", ru: "Внутренний диаметр", ja: "谷径", zh: "小径" }),
            tensileArea: t({ en: "Tensile Stress Area", tr: "Çekme Gerilme Alanı", de: "Spannungsquerschnitt", fr: "Section Résistante", es: "Área de Tensión", it: "Area Resistente", pt: "Área de Tensão", ru: "Расчетная площадь", ja: "有効断面積", zh: "应力截面积" }),
            proofLoad: t({ en: "Proof Load", tr: "Dayanım Yükü", de: "Prüflast", fr: "Charge d'Épreuve", es: "Carga de Prueba", it: "Carico di Prova", pt: "Carga de Prova", ru: "Пробная нагрузка", ja: "保証荷重", zh: "保证载荷" }),
        },
    },

    project: {
        title: t({ en: "Project Manager", tr: "Proje Yöneticisi", de: "Projektmanager", fr: "Gestionnaire de Projet", es: "Gestor de Proyecto", it: "Gestore Progetto", pt: "Gerenciador de Projeto", ru: "Менеджер проектов", ja: "プロジェクト管理", zh: "项目管理" }),
        grid: t({ en: "Grid View", tr: "Izgara Görünümü", de: "Rasteransicht", fr: "Vue Grille", es: "Vista de Cuadrícula", it: "Vista Griglia", pt: "Visualização em Grade", ru: "Табличный вид", ja: "グリッド表示", zh: "网格视图" }),
        nesting: t({ en: "Nesting View", tr: "Yerleştirme Görünümü", de: "Verschachtelungsansicht", fr: "Vue Imbrication", es: "Vista de Anidamiento", it: "Vista Nesting", pt: "Visualização de Aninhamento", ru: "Раскрой", ja: "ネスティング表示", zh: "排料视图" }),
        empty: t({ en: "No items in project", tr: "Projede öğe yok", de: "Keine Elemente im Projekt", fr: "Aucun élément dans le projet", es: "Sin elementos en el proyecto", it: "Nessun elemento nel progetto", pt: "Nenhum item no projeto", ru: "Проект пуст", ja: "プロジェクトにアイテムがありません", zh: "项目中没有项目" }),
        settings: t({ en: "Cutting Settings", tr: "Kesim Ayarları", de: "Schnitteinstellungen", fr: "Paramètres de Coupe", es: "Configuración de Corte", it: "Impostazioni Taglio", pt: "Configurações de Corte", ru: "Настройки резки", ja: "切断設定", zh: "切割设置" }),
        rawLength: t({ en: "Stock Length", tr: "Ham Uzunluk", de: "Rohlänge", fr: "Longueur Brute", es: "Longitud de Barra", it: "Lunghezza Barra", pt: "Comprimento do Estoque", ru: "Длина заготовки", ja: "素材長さ", zh: "原料长度" }),
        bladeWidth: t({ en: "Blade Width", tr: "Testere Genişliği", de: "Sägeblattbreite", fr: "Largeur de Lame", es: "Ancho de Hoja", it: "Larghezza Lama", pt: "Largura da Lâmina", ru: "Ширина реза", ja: "刃幅", zh: "刀片宽度" }),
        calculate: t({ en: "Optimize Cutting", tr: "Kesimi Optimize Et", de: "Schnitt optimieren", fr: "Optimiser la Coupe", es: "Optimizar Corte", it: "Ottimizza Taglio", pt: "Otimizar Corte", ru: "Оптимизировать раскрой", ja: "切断を最適化", zh: "优化切割" }),
        exportPdf: t({ en: "Export PDF", tr: "PDF Dışa Aktar", de: "PDF exportieren", fr: "Exporter PDF", es: "Exportar PDF", it: "Esporta PDF", pt: "Exportar PDF", ru: "Экспорт PDF", ja: "PDFエクスポート", zh: "导出PDF" }),
        clear: t({ en: "Clear Project", tr: "Projeyi Temizle", de: "Projekt leeren", fr: "Vider le Projet", es: "Limpiar Proyecto", it: "Svuota Progetto", pt: "Limpar Projeto", ru: "Очистить проект", ja: "プロジェクトをクリア", zh: "清空项目" }),
        totalBars: t({ en: "Total Bars", tr: "Toplam Çubuk", de: "Gesamtstangen", fr: "Total Barres", es: "Total de Barras", it: "Barre Totali", pt: "Total de Barras", ru: "Всего заготовок", ja: "必要本数", zh: "总棒数" }),
        efficiency: t({ en: "Efficiency", tr: "Verimlilik", de: "Effizienz", fr: "Efficacité", es: "Eficiencia", it: "Efficienza", pt: "Eficiência", ru: "Эффективность", ja: "効率", zh: "效率" }),
        waste: t({ en: "Total Waste", tr: "Toplam Fire", de: "Gesamtabfall", fr: "Déchets Totaux", es: "Desperdicio Total", it: "Scarti Totali", pt: "Desperdício Total", ru: "Общие отходы", ja: "総端材", zh: "总废料" }),
        rem: t({ en: "Remaining", tr: "Kalan", de: "Rest", fr: "Restant", es: "Restante", it: "Rimanente", pt: "Restante", ru: "Остаток", ja: "残り", zh: "剩余" }),
    },

} as const;

export type Dictionary = typeof dictionary;


