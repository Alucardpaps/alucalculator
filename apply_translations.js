const fs = require('fs');
const path = require('path');

const dictionariesDir = path.join(__dirname, 'src', 'dictionaries');

const translations = {
  de: {
    nav: {
      mechanical: "Maschinenbau",
      civil: "Bauwesen",
      electrical: "Elektrotechnik",
      science: "Wissenschaft",
      finance: "Finanzen",
      software: "Software",
      other: "Sonstiges"
    },
    modules: {
      thermalExpansion: {
        title: "Wärmeausdehnung",
        desc: "Analyse der Dimensionsstabilität"
      },
      manufacturingSandbox: {
        title: "Mfg. Sandbox",
        desc: "Virtuelle Produktionslinie"
      },
      simulationFea: {
        title: "FEA-Simulation",
        desc: "Spannung & Verformung"
      },
      analytics: {
        title: "Analytics-Dashboard",
        desc: "Systemleistungsdaten"
      },
      fileExplorer: {
        title: "Dateiexplorer",
        desc: "OS-Dateisystem"
      },
      terminal: {
        title: "Terminal",
        desc: "Kommandozeilenschnittstelle"
      },
      settings: {
        title: "Einstellungen",
        desc: "Systemkonfiguration"
      }
    },
    gear: {
      outputs: {
        tipDia: "Kopfkreisdurchmesser",
        rootDia: "Fußkreisdurchmesser"
      }
    },
    "beam-deflection": {
      title: "Trägerdurchbiegung",
      desc: "Durchbiegung & Spannung berechnen"
    },
    "concrete-reinforcement": {
      title: "Stahlbetonbewehrung",
      desc: "Bewehrungsbereich"
    },
    "ohms-law": {
      title: "Ohmsches Gesetz",
      desc: "V = I × R"
    },
    "voltage-drop": {
      title: "Spannungsabfall",
      desc: "Kabeldimensionierung"
    },
    "periodic-table": {
      title: "Periodensystem",
      desc: "Chemische Elemente"
    },
    calculator: {
      title: "Wissenschaftlicher Taschenrechner",
      desc: "Höhere Mathematik"
    },
    "vat-calculator": {
      title: "MwSt.-Rechner",
      desc: "Steuerberechnung"
    },
    "excel-helper": {
      title: "Excel-Helfer",
      desc: "Formelgenerator"
    },
    "json-formatter": {
      title: "JSON-Formatierer",
      desc: "JSON verschönern"
    },
    "regex-tester": {
      title: "Regex-Tester",
      desc: "Muster testen"
    },
    feedback: {
      title: "Feedback",
      desc: "Senden Sie uns Ihre Gedanken"
    },
    thermal: {
      initialLength: "Anfangslänge",
      tempDelta: "Temperaturdifferenz",
      finalLength: "Endlänge",
      expansion: "Ausdehnungsbetrag",
      strain: "Dehnungsrate"
    }
  },
  es: {
    nav: {
      mechanical: "Mecánica",
      civil: "Civil",
      electrical: "Eléctrica",
      science: "Ciencia",
      finance: "Finanzas",
      software: "Software",
      other: "Otro"
    },
    modules: {
      thermalExpansion: {
        title: "Dilatación Térmica",
        desc: "Análisis de Estabilidad Dimensional"
      },
      manufacturingSandbox: {
        title: "Sandbox de Fabricación",
        desc: "Línea de Producción Virtual"
      },
      simulationFea: {
        title: "Simulación FEA",
        desc: "Esfuerzo y Deformación"
      },
      analytics: {
        title: "Panel de Análisis",
        desc: "Datos de Rendimiento del Sistema"
      },
      fileExplorer: {
        title: "Explorador de Archivos",
        desc: "Sistema de Archivos del SO"
      },
      terminal: {
        title: "Terminal",
        desc: "Interfaz de Línea de Comandos"
      },
      settings: {
        title: "Ajustes",
        desc: "Configuración del Sistema"
      }
    },
    gear: {
      outputs: {
        tipDia: "Diámetro de Cabeza",
        rootDia: "Diámetro de Raíz"
      }
    },
    "beam-deflection": {
      title: "Deflexión de Viga",
      desc: "Calcular Deflexión y Esfuerzo"
    },
    "concrete-reinforcement": {
      title: "Refuerzo de Hormigón",
      desc: "Área de Armadura"
    },
    "ohms-law": {
      title: "Ley de Ohm",
      desc: "V = I × R"
    },
    "voltage-drop": {
      title: "Caída de Tensión",
      desc: "Dimensionamiento de Cables"
    },
    "periodic-table": {
      title: "Tabla Periódica",
      desc: "Elementos Químicos"
    },
    calculator: {
      title: "Calculadora Científica",
      desc: "Matemáticas Avanzadas"
    },
    "vat-calculator": {
      title: "Calculadora de IVA",
      desc: "Cálculo de Impuestos"
    },
    "excel-helper": {
      title: "Asistente de Excel",
      desc: "Generador de Fórmulas"
    },
    "json-formatter": {
      title: "Formateador JSON",
      desc: "Embellecer JSON"
    },
    "regex-tester": {
      title: "Probador de Regex",
      desc: "Probar Patrones"
    },
    feedback: {
      title: "Comentarios",
      desc: "Envíanos tus ideas"
    },
    thermal: {
      initialLength: "Longitud Inicial",
      tempDelta: "Delta de Temperatura",
      finalLength: "Longitud Final",
      expansion: "Cantidad de Dilatación",
      strain: "Tasa de Deformación"
    }
  },
  fr: {
    nav: {
      mechanical: "Mécanique",
      civil: "Génie Civil",
      electrical: "Électricité",
      science: "Sciences",
      finance: "Finance",
      software: "Logiciel",
      other: "Autre"
    },
    modules: {
      thermalExpansion: {
        title: "Dilatation Thermique",
        desc: "Analyse de Stabilité Dimensionnelle"
      },
      manufacturingSandbox: {
        title: "Sandbox de Fabrication",
        desc: "Ligne de Production Virtuelle"
      },
      simulationFea: {
        title: "Simulation FEA",
        desc: "Contrainte & Déformation"
      },
      analytics: {
        title: "Tableau de Bord d'Analyse",
        desc: "Données de Performance Système"
      },
      fileExplorer: {
        title: "Explorateur de Fichiers",
        desc: "Système de Fichiers de l'OS"
      },
      terminal: {
        title: "Terminal",
        desc: "Interface en Ligne de Commande"
      },
      settings: {
        title: "Paramètres",
        desc: "Configuration Système"
      }
    },
    gear: {
      outputs: {
        tipDia: "Diamètre de Tête",
        rootDia: "Diamètre de Pied"
      }
    },
    "beam-deflection": {
      title: "Flèche de Poutre",
      desc: "Calculer la Flèche & Contrainte"
    },
    "concrete-reinforcement": {
      title: "Armature de Béton",
      desc: "Section d'Armature"
    },
    "ohms-law": {
      title: "Loi d'Ohm",
      desc: "V = I × R"
    },
    "voltage-drop": {
      title: "Chute de Tension",
      desc: "Dimensionnement de Câbles"
    },
    "periodic-table": {
      title: "Tableau Périodique",
      desc: "Éléments Chimiques"
    },
    calculator: {
      title: "Calculatrice Scientifique",
      desc: "Mathématiques Avancées"
    },
    "vat-calculator": {
      title: "Calculateur de TVA",
      desc: "Calcul des Taxes"
    },
    "excel-helper": {
      title: "Assistant Excel",
      desc: "Générateur de Formules"
    },
    "json-formatter": {
      title: "Formateur JSON",
      desc: "Mettre en Forme JSON"
    },
    "regex-tester": {
      title: "Testeur de Regex",
      desc: "Tester des Motifs"
    },
    feedback: {
      title: "Commentaires",
      desc: "Envoyez-nous vos avis"
    },
    thermal: {
      initialLength: "Longueur Initiale",
      tempDelta: "Delta de Température",
      finalLength: "Longueur Finale",
      expansion: "Montant de Dilatation",
      strain: "Taux de Déformation"
    }
  },
  it: {
    nav: {
      mechanical: "Meccanica",
      civil: "Edile",
      electrical: "Elettrotecnica",
      science: "Scienza",
      finance: "Finanza",
      software: "Software",
      other: "Altro"
    },
    modules: {
      thermalExpansion: {
        title: "Dilatazione Termica",
        desc: "Analisi di Stabilità Dimensionale"
      },
      manufacturingSandbox: {
        title: "Sandbox di Fabbricazione",
        desc: "Linea di Produzione Virtuale"
      },
      simulationFea: {
        title: "Simulazione FEA",
        desc: "Sollecitazione & Deformazione"
      },
      analytics: {
        title: "Dashboard Analisi",
        desc: "Dati Prestazioni Sistema"
      },
      fileExplorer: {
        title: "Esplora Risorse",
        desc: "File System del SO"
      },
      terminal: {
        title: "Terminale",
        desc: "Interfaccia Riga di Comando"
      },
      settings: {
        title: "Impostazioni",
        desc: "Configurazione Sistema"
      }
    },
    gear: {
      outputs: {
        tipDia: "Diametro di Testa",
        rootDia: "Diametro di Piede"
      }
    },
    "beam-deflection": {
      title: "Flessione della Trave",
      desc: "Calcola Flessione & Sollecitazione"
    },
    "concrete-reinforcement": {
      title: "Armatura Cemento",
      desc: "Area dell'Armatura"
    },
    "ohms-law": {
      title: "Legge di Ohm",
      desc: "V = I × R"
    },
    "voltage-drop": {
      title: "Caduta di Tensione",
      desc: "Dimensionamento Cavi"
    },
    "periodic-table": {
      title: "Tavola Periodica",
      desc: "Elementi Chimici"
    },
    calculator: {
      title: "Calcolatrice Scientifica",
      desc: "Matematica Avanzata"
    },
    "vat-calculator": {
      title: "Calcolatore IVA",
      desc: "Calcolo delle Tasse"
    },
    "excel-helper": {
      title: "Assistente Excel",
      desc: "Generatore di Formule"
    },
    "json-formatter": {
      title: "Formattatore JSON",
      desc: "Abbellisci JSON"
    },
    "regex-tester": {
      title: "Tester Regex",
      desc: "Test dei Pattern"
    },
    feedback: {
      title: "Feedback",
      desc: "Inviaci le tue opinioni"
    },
    thermal: {
      initialLength: "Lunghezza Iniziale",
      tempDelta: "Delta Temperatura",
      finalLength: "Lunghezza Finale",
      expansion: "Valore Dilatazione",
      strain: "Tasso di Deformazione"
    }
  },
  pt: {
    nav: {
      mechanical: "Mecânica",
      civil: "Construção Civil",
      electrical: "Eletrotécnica",
      science: "Ciência",
      finance: "Finanças",
      software: "Software",
      other: "Outro"
    },
    modules: {
      thermalExpansion: {
        title: "Dilatação Térmica",
        desc: "Análise de Estabilidade Dimensional"
      },
      manufacturingSandbox: {
        title: "Sandbox de Fabricação",
        desc: "Linha de Produção Virtual"
      },
      simulationFea: {
        title: "Simulação FEA",
        desc: "Tensão e Deformação"
      },
      analytics: {
        title: "Painel de Análise",
        desc: "Dados de Desempenho do Sistema"
      },
      fileExplorer: {
        title: "Explorador de Arquivos",
        desc: "Sistema de Arquivos do SO"
      },
      terminal: {
        title: "Terminal",
        desc: "Interface de Linha de Comando"
      },
      settings: {
        title: "Configurações",
        desc: "Configuração do Sistema"
      }
    },
    gear: {
      outputs: {
        tipDia: "Diámetro de Cabeça",
        rootDia: "Diámetro de Raiz"
      }
    },
    "beam-deflection": {
      title: "Deflexão de Viga",
      desc: "Calcular Deflexão e Tensão"
    },
    "concrete-reinforcement": {
      title: "Armadura de Betão",
      desc: "Área de Reforço"
    },
    "ohms-law": {
      title: "Lei de Ohm",
      desc: "V = I × R"
    },
    "voltage-drop": {
      title: "Queda de Tensão",
      desc: "Dimensionamento de Cabos"
    },
    "periodic-table": {
      title: "Tabela Periódica",
      desc: "Elementos Químicos"
    },
    calculator: {
      title: "Calculadora Científica",
      desc: "Matemática Avançada"
    },
    "vat-calculator": {
      title: "Calculadora de IVA",
      desc: "Cálculo de Impostos"
    },
    "excel-helper": {
      title: "Assistente de Excel",
      desc: "Gerador de Fórmulas"
    },
    "json-formatter": {
      title: "Formatador JSON",
      desc: "Formatador de JSON"
    },
    "regex-tester": {
      title: "Testador de Regex",
      desc: "Testar Padrões"
    },
    feedback: {
      title: "Comentários",
      desc: "Envie-nos as suas ideias"
    },
    thermal: {
      initialLength: "Comprimento Inicial",
      tempDelta: "Delta de Temperatura",
      finalLength: "Comprimento Final",
      expansion: "Quantidade de Dilatação",
      strain: "Taxa de Deformação"
    }
  },
  ru: {
    nav: {
      mechanical: "Машиностроение",
      civil: "Строительство",
      electrical: "Электротехника",
      science: "Наука",
      finance: "Финансы",
      software: "ПО",
      other: "Другое"
    },
    modules: {
      thermalExpansion: {
        title: "Тепловое расширение",
        desc: "Анализ размерной стабильности"
      },
      manufacturingSandbox: {
        title: "Виртуальный завод",
        desc: "Виртуальная сборочная линия"
      },
      simulationFea: {
        title: "МКЭ Моделирование",
        desc: "Напряжения и деформации"
      },
      analytics: {
        title: "Аналитическая панель",
        desc: "Данные производительности системы"
      },
      fileExplorer: {
        title: "Проводник",
        desc: "Файловая система ОС"
      },
      terminal: {
        title: "Терминал",
        desc: "Интерфейс командной строки"
      },
      settings: {
        title: "Настройки",
        desc: "Конфигурация системы"
      }
    },
    gear: {
      outputs: {
        tipDia: "Диаметр вершин",
        rootDia: "Диаметр впадин"
      }
    },
    "beam-deflection": {
      title: "Прогиб балки",
      desc: "Расчет прогиба и напряжений"
    },
    "concrete-reinforcement": {
      title: "Арматура железобетона",
      desc: "Площадь армирования"
    },
    "ohms-law": {
      title: "Закон Ома",
      desc: "V = I × R"
    },
    "voltage-drop": {
      title: "Падение напряжения",
      desc: "Расчет сечения кабеля"
    },
    "periodic-table": {
      title: "Таблица Менделеева",
      desc: "Химические элементы"
    },
    calculator: {
      title: "Инженерный калькулятор",
      desc: "Высшая математика"
    },
    "vat-calculator": {
      title: "Калькулятор НДС",
      desc: "Расчет налога"
    },
    "excel-helper": {
      title: "Помощник Excel",
      desc: "Генератор формул"
    },
    "json-formatter": {
      title: "Форматирование JSON",
      desc: "Красивый вывод JSON"
    },
    "regex-tester": {
      title: "Тестер Regex",
      desc: "Проверка шаблонов"
    },
    feedback: {
      title: "Обратная связь",
      desc: "Отправьте нам свои мысли"
    },
    thermal: {
      initialLength: "Начальная длина",
      tempDelta: "Дельта температур",
      finalLength: "Конечная длина",
      expansion: "Величина расширения",
      strain: "Скорость деформации"
    }
  },
  zh: {
    nav: {
      mechanical: "机械工程",
      civil: "土木工程",
      electrical: "电气工程",
      science: "科学领域",
      finance: "财务计算",
      software: "软件开发",
      other: "其他分类"
    },
    modules: {
      thermalExpansion: {
        title: "热膨胀分析",
        desc: "尺寸稳定性评估"
      },
      manufacturingSandbox: {
        title: "数字化工厂",
        desc: "虚拟化生产流水线"
      },
      simulationFea: {
        title: "有限元仿真",
        desc: "应力与形变评估"
      },
      analytics: {
        title: "数据分析面板",
        desc: "系统级运行性能数据"
      },
      fileExplorer: {
        title: "文件资源管理器",
        desc: "系统核心文件体系"
      },
      terminal: {
        title: "终端命令行",
        desc: "底层命令控制台"
      },
      settings: {
        title: "系统设置",
        desc: "系统高级参数配置"
      }
    },
    gear: {
      outputs: {
        tipDia: "齿顶圆直径",
        rootDia: "齿根圆直径"
      }
    },
    "beam-deflection": {
      title: "梁弯曲变形",
      desc: "计算弯曲变形与应力"
    },
    "concrete-reinforcement": {
      title: "钢筋混凝土配筋",
      desc: "截面配筋面积"
    },
    "ohms-law": {
      title: "欧姆定律",
      desc: "V = I × R"
    },
    "voltage-drop": {
      title: "电缆压降",
      desc: "电缆截面选型"
    },
    "periodic-table": {
      title: "元素周期表",
      desc: "化学基本元素"
    },
    calculator: {
      title: "科学计算器",
      desc: "高阶数学运算"
    },
    "vat-calculator": {
      title: "增值税计算",
      desc: "税金快捷计算"
    },
    "excel-helper": {
      title: "Excel助手",
      desc: "公式智能生成"
    },
    "json-formatter": {
      title: "JSON格式化",
      desc: "美化JSON数据"
    },
    "regex-tester": {
      title: "正则表达式",
      desc: "文本模式测试"
    },
    feedback: {
      title: "用户反馈",
      desc: "分享您的意见"
    },
    thermal: {
      initialLength: "初始长度",
      tempDelta: "温度变化量",
      finalLength: "最终长度",
      expansion: "热膨胀量",
      strain: "应变速率"
    }
  },
  ja: {
    nav: {
      mechanical: "机械工学",
      civil: "土木・建築",
      electrical: "電気工学",
      science: "科学・技術",
      finance: "財務・会計",
      software: "IT・開発",
      other: "その他"
    },
    modules: {
      thermalExpansion: {
        title: "熱膨脹計算",
        desc: "熱ひずみ寸法変化測定"
      },
      manufacturingSandbox: {
        title: "スマート工場",
        desc: "仮想生産・組立ライン"
      },
      simulationFea: {
        title: "FEA構造解析",
        desc: "応力・たわみシミュレーション"
      },
      analytics: {
        title: "性能ダッシュボード",
        desc: "システム稼働データの可視化"
      },
      fileExplorer: {
        title: "ファイルマネージャー",
        desc: "OSファイルシステム"
      },
      terminal: {
        title: "コンソール端末",
        desc: "コマンドライン入力"
      },
      settings: {
        title: "環境設定",
        desc: "システム制御と初期設定"
      }
    },
    gear: {
      outputs: {
        tipDia: "歯先円直径",
        rootDia: "歯底円直径"
      }
    },
    "beam-deflection": {
      title: "梁のたわみ計算",
      desc: "たわみと曲げ応力解析"
    },
    "concrete-reinforcement": {
      title: "RC配筋計算",
      desc: "鉄筋断面積設計"
    },
    "ohms-law": {
      title: "オームの法則",
      desc: "V = I × R"
    },
    "voltage-drop": {
      title: "配線電圧降下",
      desc: "許容電流・ケーブル選定"
    },
    "periodic-table": {
      title: "元素周期表",
      desc: "化学元素データ"
    },
    calculator: {
      title: "関数電卓",
      desc: "高度な数学計算"
    },
    "vat-calculator": {
      title: "消費税計算",
      desc: "税額計算ツール"
    },
    "excel-helper": {
      title: "Excel式生成",
      desc: "数式自動作成"
    },
    "json-formatter": {
      title: "JSON整形",
      desc: "JSONコード整形ツール"
    },
    "regex-tester": {
      title: "正規表現テスト",
      desc: "パターンマッチ検証"
    },
    feedback: {
      title: "フィードバック",
      desc: "ご意見・ご要望の送信"
    },
    thermal: {
      initialLength: "初期寸法 (L0)",
      tempDelta: "温度変化差 (ΔT)",
      finalLength: "熱膨脹後寸法 (Lf)",
      expansion: "寸法変化量 (ΔL)",
      strain: "熱ひずみ率"
    }
  },
  ko: {
    modules: {
      thermalExpansion: {
        title: "열팽창 해석",
        desc: "치수 안정성 평가"
      },
      manufacturingSandbox: {
        title: "스마트 팩토리",
        desc: "가상 생산 파이프라인"
      },
      simulationFea: {
        title: "FEA 응력 해석",
        desc: "응력 및 변형률 시뮬레이션"
      },
      analytics: {
        title: "대시보드 분석",
        desc: "시스템 자원 성능 데이터"
      },
      fileExplorer: {
        title: "파일 탐색기",
        desc: "OS 시스템 파일 탐색"
      },
      terminal: {
        title: "콘솔 터미널",
        desc: "명령줄 실행 인터페이스"
      },
      settings: {
        title: "시스템 설정",
        desc: "환경 변수 파라미터 제어"
      }
    },
    thermal: {
      initialLength: "초기 길이 (L0)",
      tempDelta: "온도 변화량 (ΔT)",
      finalLength: "열팽창 후 길이",
      expansion: "치수 팽창량",
      strain: "열변형률"
    }
  },
  ar: {
    modules: {
      thermalExpansion: {
        title: "التمدد الحراري",
        desc: "تحليل الثبات البعدي"
      },
      manufacturingSandbox: {
        title: "مصنع افتراضي",
        desc: "خط الإنتاج الافتراضي"
      },
      simulationFea: {
        title: "محاكاة العناصر المحدودة",
        desc: "الإجهاد والتشوه الهيكلي"
      },
      analytics: {
        title: "لوحة التحليلات",
        desc: "بيانات أداء النظام الأساسية"
      },
      fileExplorer: {
        title: "مستكشف الملفات",
        desc: "نظام ملفات نظام التشغيل"
      },
      terminal: {
        title: "الطرفية البرمجية",
        desc: "واجهة إدخال الأوامر النصية"
      },
      settings: {
        title: "إعدادات النظام",
        desc: "تعديل معلمات النظام والتفضيلات"
      }
    },
    thermal: {
      initialLength: "الطول الابتدائي",
      tempDelta: "فرق درجات الحرارة",
      finalLength: "الطول النهائي",
      expansion: "مقدار التمدد",
      strain: "معدل الانفعال الحراري"
    }
  }
};

// Helper to deep merge objects
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

Object.keys(translations).forEach(loc => {
  const locPath = path.join(dictionariesDir, `${loc}.json`);
  if (!fs.existsSync(locPath)) {
    console.log(`Missing file: ${locPath}`);
    return;
  }
  
  const current = JSON.parse(fs.readFileSync(locPath, 'utf8'));
  const updated = deepMerge(current, translations[loc]);
  
  // Save with 2-space formatting
  fs.writeFileSync(locPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`Merged and updated translations for locale: ${loc.toUpperCase()}`);
});

console.log('Language integration audit completed successfully.');
