/** Compact UI translation table. Columns: de es fr it pt ru zh ja ko ar */
export const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

const ROWS = [];
function r(en, ...vals) {
  const o = { en };
  LANGS.forEach((l, i) => { o[l] = vals[i] ?? en; });
  ROWS.push(o);
}

r('Home', 'Startseite', 'Inicio', 'Accueil', 'Home', 'Início', 'Главная', '首页', 'ホーム', '홈', 'الرئيسية');
r('Dashboard', 'Dashboard', 'Panel', 'Tableau de bord', 'Cruscotto', 'Painel', 'Панель', '仪表板', 'ダッシュボード', '대시보드', 'لوحة التحكم');
r('Modules', 'Module', 'Módulos', 'Modules', 'Moduli', 'Módulos', 'Модули', '模块', 'モジュール', '모듈', 'الوحدات');
r('Settings', 'Einstellungen', 'Ajustes', 'Paramètres', 'Impostazioni', 'Configurações', 'Настройки', '设置', '設定', '설정', 'الإعدادات');
r('Main Dashboard', 'Haupt-Dashboard', 'Tablero principal', 'Tableau de bord principal', 'Dashboard principale', 'Painel principal', 'Главная панель', '主仪表板', 'メインダッシュボード', '메인 대시보드', 'لوحة التحكم الرئيسية');
r('Fit Calculator', 'Passungsrechner', 'Calculadora de ajustes', 'Calculateur d’ajustement', 'Calcolo accoppiamenti', 'Calculadora de ajustes', 'Калькулятор посадок', '公差配合计算', 'はめあい計算', '끼워맞춤 계산기', 'حاسبة التفاوتات');
r("Engineer's Handbook", 'Ingenieur-Handbuch', 'Manual del ingeniero', 'Manuel de l’ingénieur', 'Manuale ingegnere', 'Manual do engenheiro', 'Справочник инженера', '工程师手册', '技術便覧', '엔지니어 핸드북', 'دليل المهندس');
r('Module Library', 'Modulbibliothek', 'Biblioteca de módulos', 'Bibliothèque de modules', 'Libreria moduli', 'Biblioteca de módulos', 'Библиотека модулей', '模块库', 'モジュールライブラリ', '모듈 라이브러리', 'مكتبة الوحدات');
r('Modules Available', 'Module verfügbar', 'Módulos disponibles', 'Modules disponibles', 'Moduli disponibili', 'Módulos disponíveis', 'Модули доступны', '可用模块', '利用可能なモジュール', '사용 가능한 모듈', 'وحدات متاحة');
r('Profile Weight Calculator', 'Profilgewichtsrechner', 'Calculadora de peso de perfil', 'Calculateur de poids de profilé', 'Calcolatore peso profilo', 'Calculadora de peso de perfil', 'Калькулятор массы профиля', '型材重量计算器', '形材重量計算機', '프로파일 중량 계산기', 'حاسبة وزن القطاع');
r('Mass & Cost Estimation', 'Masse- und Kostenschätzung', 'Estimación de masa y coste', 'Estimation masse et coût', 'Stima massa e costo', 'Estimativa de massa e custo', 'Оценка массы и стоимости', '质量与成本估算', '質量とコスト見積', '질량 및 비용 추정', 'تقدير الكتلة والتكلفة');
r('Fits & Tolerances', 'Passungen & Toleranzen', 'Ajustes y tolerancias', 'Ajustements et tolérances', 'Accoppiamenti e tolleranze', 'Ajustes e tolerâncias', 'Посадки и допуски', '公差配合', '公差とはめあい', '끼워맞춤 및 공차', 'التفاوتات والخلوص');
r('ISO 286 Shaft/Hole', 'ISO 286 Welle/Bohrung', 'ISO 286 eje/agujero', 'ISO 286 arbre/alésage', 'ISO 286 albero/foro', 'ISO 286 eixo/furo', 'ISO 286 вал/отверстие', 'ISO 286 轴/孔', 'ISO 286 軸/穴', 'ISO 286 축/구멍', 'ISO 286 عمود/ثقب');
r('Gear Calculator', 'Zahnradrechner', 'Calculadora de engranajes', 'Calculateur d’engrenages', 'Calcolo ingranaggi', 'Calculadora de engrenagens', 'Калькулятор зубчатых колёс', '齿轮计算器', '歯車計算機', '기어 계산기', 'حاسبة التروس');
r('Spur & Helical Geometry', 'Gerad- & Schrägverzahnung', 'Geometría recta y helicoidal', 'Géométrie droite et hélicoïdale', 'Geometria cilindrica ed elica', 'Geometria reta e helicoidal', 'Прямозубая и косозубая геометрия', '直齿与斜齿几何', '平歯車・はすば幾何', '스퍼 및 헬리컬 기하', 'هندسة التروس المستقيمة والحلزونية');
r('Strength (Mohr)', 'Festigkeit (Mohr)', 'Resistencia (Mohr)', 'Résistance (Mohr)', 'Resistenza (Mohr)', 'Resistência (Mohr)', 'Сопромат (Мор)', '强度 (Mohr)', '材料力学 (モール)', '강도 (Mohr)', 'المقاومة (مور)');
r('Stress Analysis', 'Spannungsanalyse', 'Análisis de esfuerzos', 'Analyse des contraintes', 'Analisi degli sforzi', 'Análise de tensões', 'Анализ напряжений', '应力分析', '応力解析', '응력 해석', 'تحليل الإجهاد');
r('Bearings (L10)', 'Lager (L10)', 'Rodamientos (L10)', 'Roulements (L10)', 'Cuscinetti (L10)', 'Rolamentos (L10)', 'Подшипники (L10)', '轴承 (L10)', '軸受 (L10)', '베어링 (L10)', 'المحامل (L10)');
r('Life Expectancy', 'Lebensdauererwartung', 'Vida útil prevista', 'Durée de vie prévue', 'Durata prevista', 'Vida útil prevista', 'Ожидаемый ресурс', '预期寿命', '寿命予測', '수명 예측', 'العمر المتوقع');
r('Welding Heat', 'Schweißwärme', 'Calor de soldadura', 'Chaleur de soudage', 'Calore di saldatura', 'Calor de soldagem', 'Тепло вложения', '焊接热输入', '溶接熱', '용접 입열', 'حرارة اللحام');
r('Process Inputs', 'Prozessparameter', 'Entradas de proceso', 'Entrées de procédé', 'Input di processo', 'Parâmetros de processo', 'Параметры процесса', '工艺输入', 'プロセス入力', '공정 입력', 'مدخلات العملية');
r('Sheet Metal', 'Blech', 'Chapa metálica', 'Tôlerie', 'Lamiera', 'Chapa metálica', 'Листовой металл', '钣金', '板金', '판금', 'الصاج');
r('Bending Force', 'Biegekraft', 'Fuerza de doblado', 'Force de pliage', 'Forza di piegatura', 'Força de dobragem', 'Усилие гибки', '折弯力', '曲げ力', '굽힘력', 'قوة الثني');
r('Pumps', 'Pumpen', 'Bombas', 'Pompes', 'Pompe', 'Bombas', 'Насосы', '泵', 'ポンプ', '펌프', 'المضخات');
r('Power & NPSH', 'Leistung & NPSH', 'Potencia y NPSH', 'Puissance et NPSH', 'Potenza e NPSH', 'Potência e NPSH', 'Мощность и NPSH', '功率与 NPSH', '動力とNPSH', '동력 및 NPSH', 'القدرة وNPSH');
r('Fasteners', 'Verbindungselemente', 'Sujetadores', 'Fixations', 'Bulloneria', 'Fixadores', 'Крепёж', '紧固件', '締結部品', '체결 부품', 'المثبتات');
r('ISO Metric Threads', 'ISO-metrische Gewinde', 'Roscas métricas ISO', 'Filetages métriques ISO', 'Filettature metriche ISO', 'Roscas métricas ISO', 'Метрическая резьба ISO', 'ISO 公制螺纹', 'ISOメートルねじ', 'ISO 미터 나사', 'سنون مترية ISO');
r('Converter', 'Umrechner', 'Conversor', 'Convertisseur', 'Convertitore', 'Conversor', 'Конвертер', '转换器', '変換器', '변환기', 'المحوّل');
r('Units & Power', 'Einheiten & Leistung', 'Unidades y potencia', 'Unités et puissance', 'Unità e potenza', 'Unidades e potência', 'Единицы и мощность', '单位与功率', '単位と動力', '단위 및 동력', 'الوحدات والقدرة');
r('Handbook', 'Handbuch', 'Manual', 'Manuel', 'Manuale', 'Manual', 'Справочник', '手册', '便覧', '핸드북', 'الدليل');
r('Bearing tables, ISO Tolerances, G-Code reference.', 'Lagertabellen, ISO-Toleranzen, G-Code-Referenz.', 'Tablas de rodamientos, tolerancias ISO, referencia G-Code.', 'Tables de roulements, tolérances ISO, référence G-Code.', 'Tabelle cuscinetti, tolleranze ISO, riferimento G-Code.', 'Tabelas de rolamentos, tolerâncias ISO, referência G-Code.', 'Таблицы подшипников, допуски ISO, справочник G-кода.', '轴承表、ISO公差、G代码参考。', '軸受表、ISO公差、Gコード参照。', '베어링 표, ISO 공차, G코드 참조.', 'جداول المحامل وتفاوتات ISO ومرجع G-Code.');
r('Calculate', 'Berechnen', 'Calcular', 'Calculer', 'Calcola', 'Calcular', 'Рассчитать', '计算', '計算', '계산', 'احسب');
r('Reset', 'Zurücksetzen', 'Restablecer', 'Réinitialiser', 'Reimposta', 'Redefinir', 'Сброс', '重置', 'リセット', '재설정', 'إعادة تعيين');
r('Inputs', 'Eingaben', 'Entradas', 'Entrées', 'Input', 'Entradas', 'Ввод', '输入', '入力', '입력', 'المدخلات');
r('Results', 'Ergebnisse', 'Resultados', 'Résultats', 'Risultati', 'Resultados', 'Результаты', '结果', '結果', '결과', 'النتائج');
r('Dimensions', 'Abmessungen', 'Dimensiones', 'Dimensions', 'Dimensioni', 'Dimensões', 'Размеры', '尺寸', '寸法', '치수', 'الأبعاد');
r('Material', 'Werkstoff', 'Material', 'Matériau', 'Materiale', 'Material', 'Материал', '材料', '材料', '재료', 'المادة');
r('Weight', 'Gewicht', 'Peso', 'Poids', 'Peso', 'Peso', 'Вес', '重量', '重量', '중량', 'الوزن');
r('Cost', 'Kosten', 'Coste', 'Coût', 'Costo', 'Custo', 'Стоимость', '成本', 'コスト', '비용', 'التكلفة');
r('Unit Price', 'Stückpreis', 'Precio unitario', 'Prix unitaire', 'Prezzo unitario', 'Preço unitário', 'Цена за единицу', '单价', '単価', '단가', 'سعر الوحدة');
r('Quantity', 'Menge', 'Cantidad', 'Quantité', 'Quantità', 'Quantidade', 'Количество', '数量', '数量', '수량', 'الكمية');
r('Total', 'Gesamt', 'Total', 'Total', 'Totale', 'Total', 'Итого', '总计', '合計', '합계', 'الإجمالي');
r('Save', 'Speichern', 'Guardar', 'Enregistrer', 'Salva', 'Salvar', 'Сохранить', '保存', '保存', '저장', 'حفظ');
r('Export', 'Exportieren', 'Exportar', 'Exporter', 'Esporta', 'Exportar', 'Экспорт', '导出', 'エクスポート', '내보내기', 'تصدير');
r('Generated by AluCalc OS', 'Erstellt von AluCalc OS', 'Generado por AluCalc OS', 'Généré par AluCalc OS', 'Generato da AluCalc OS', 'Gerado por AluCalc OS', 'Создано в AluCalc OS', '由 AluCalc OS 生成', 'AluCalc OSで生成', 'AluCalc OS에서 생성', 'تم إنشاؤه بواسطة AluCalc OS');
r('Design', 'Entwurf', 'Diseño', 'Conception', 'Progetto', 'Projeto', 'Конструкция', '设计', '設計', '설계', 'التصميم');
r('2D View', '2D-Ansicht', 'Vista 2D', 'Vue 2D', 'Vista 2D', 'Vista 2D', '2D вид', '2D 视图', '2D表示', '2D 보기', 'عرض ثنائي الأبعاد');
r('3D View', '3D-Ansicht', 'Vista 3D', 'Vue 3D', 'Vista 3D', 'Vista 3D', '3D вид', '3D 视图', '3D表示', '3D 보기', 'عرض ثلاثي الأبعاد');
r('Design Parameters', 'Entwurfsparameter', 'Parámetros de diseño', 'Paramètres de conception', 'Parametri di progetto', 'Parâmetros de projeto', 'Параметры конструкции', '设计参数', '設計パラメータ', '설계 매개변수', 'معلمات التصميم');
r('Analysis Results', 'Analyseergebnisse', 'Resultados del análisis', 'Résultats d’analyse', 'Risultati dell’analisi', 'Resultados da análise', 'Результаты анализа', '分析结果', '解析結果', '해석 결과', 'نتائج التحليل');
r('Production Notes', 'Fertigungshinweise', 'Notas de producción', 'Notes de production', 'Note di produzione', 'Notas de produção', 'Производственные заметки', '生产说明', '生産メモ', '생산 메모', 'ملاحظات الإنتاج');
r('Unit Weight', 'Einheitsgewicht', 'Peso unitario', 'Poids unitaire', 'Peso unitario', 'Peso unitário', 'Удельный вес', '单位重量', '単位重量', '단위 중량', 'الوزن الوحدوي');
r('Total Weight', 'Gesamtgewicht', 'Peso total', 'Poids total', 'Peso totale', 'Peso total', 'Общий вес', '总重量', '総重量', '총중량', 'الوزن الكلي');
r('Result', 'Ergebnis', 'Resultado', 'Résultat', 'Risultato', 'Resultado', 'Результат', '结果', '結果', '결과', 'النتيجة');
r('Hole', 'Bohrung', 'Agujero', 'Alésage', 'Foro', 'Furo', 'Отверстие', '孔', '穴', '구멍', 'الثقب');
r('Shaft', 'Welle', 'Eje', 'Arbre', 'Albero', 'Eixo', 'Вал', '轴', '軸', '축', 'العمود');
r('Min', 'Min', 'Mín', 'Min', 'Min', 'Mín', 'Мин', '最小', '最小', '최소', 'أدنى');
r('Max', 'Max', 'Máx', 'Max', 'Max', 'Máx', 'Макс', '最大', '最大', '최대', 'أقصى');
r('Nominal Diameter', 'Nenndurchmesser', 'Diámetro nominal', 'Diamètre nominal', 'Diametro nominale', 'Diâmetro nominal', 'Номинальный диаметр', '公称直径', '呼び径', '호칭 지름', 'القطر الاسمي');
r('Detailed Explanation', 'Detaillierte Erklärung', 'Explicación detallada', 'Explication détaillée', 'Spiegazione dettagliata', 'Explicação detalhada', 'Подробное пояснение', '详细说明', '詳細な解説', '상세 설명', 'شرح تفصيلي');
r('Tolerance Values', 'Toleranzwerte', 'Valores de tolerancia', 'Valeurs de tolérance', 'Valori di tolleranza', 'Valores de tolerância', 'Значения допусков', '公差值', '公差値', '공차 값', 'قيم التفاوت');
r('Mounting Calculations', 'Montageberechnungen', 'Cálculos de montaje', 'Calculs de montage', 'Calcoli di montaggio', 'Cálculos de montagem', 'Расчёты монтажа', '装配计算', '組付け計算', '장착 계산', 'حسابات التركيب');
r('Interface Pressure', 'Fugendruck', 'Presión de contacto', 'Pression d’interface', 'Pressione di interfaccia', 'Pressão de contato', 'Давление в стыке', '接触压力', '面圧', '접촉 압력', 'ضغط التلامس');
r('Push Force', 'Einpresskraft', 'Fuerza de montaje', 'Force d’emmanchement', 'Forza di piantaggio', 'Força de montagem', 'Усилие запрессовки', '压入力', '圧入力', '압입력', 'قوة الكبس');
r('Transmittable Torque', 'Übertragbares Moment', 'Par transmisible', 'Couple transmissible', 'Coppia trasmissibile', 'Torque transmissível', 'Передаваемый момент', '可传递扭矩', '伝達トルク', '전달 토크', 'عزم قابل للنقل');
r('Metric', 'Metrisch', 'Métrico', 'Métrique', 'Metrico', 'Métrico', 'Метрическая', '公制', 'メートル法', '미터법', 'متري');
r('Imperial', 'Zoll', 'Imperial', 'Impérial', 'Imperiale', 'Imperial', 'Дюймовая', '英制', 'ヤード・ポンド法', '인치법', 'إنجليزي');
r('From', 'Von', 'De', 'De', 'Da', 'De', 'Из', '从', 'から', '출발', 'من');
r('To', 'Nach', 'A', 'Vers', 'A', 'Para', 'В', '到', 'へ', '도착', 'إلى');
r('Language', 'Sprache', 'Idioma', 'Langue', 'Lingua', 'Idioma', 'Язык', '语言', '言語', '언어', 'اللغة');
r('Calculator Tool', 'Rechner-Tool', 'Herramienta de cálculo', 'Outil de calcul', 'Strumento di calcolo', 'Ferramenta de cálculo', 'Инструмент расчёта', '计算工具', '計算ツール', '계산 도구', 'أداة الحساب');
r('Calculation Formula', 'Berechnungsformel', 'Fórmula de cálculo', 'Formule de calcul', 'Formula di calcolo', 'Fórmula de cálculo', 'Расчётная формула', '计算公式', '計算式', '계산 공식', 'صيغة الحساب');
r('Ratio', 'Verhältnis', 'Relación', 'Rapport', 'Rapporto', 'Razão', 'Передаточное отношение', '速比', '比', '비', 'النسبة');
r('Stress', 'Spannung', 'Esfuerzo', 'Contrainte', 'Sforzo', 'Tensão', 'Напряжение', '应力', '応力', '응력', 'الإجهاد');
r('Beam', 'Balken', 'Viga', 'Poutre', 'Trave', 'Viga', 'Балка', '梁', '梁', '보', 'العارضة');
r('Cantilever', 'Kragträger', 'Voladizo', 'Porte-à-faux', 'Sbalzo', 'Ménsula', 'Консоль', '悬臂', '片持ち', '캔틸레버', 'كابولي');
r('Simple Supported', 'Einfach gelagert', 'Apoyo simple', 'Appui simple', 'Appoggio semplice', 'Apoio simples', 'Шарнирная опора', '简支', '単純支持', '단순 지지', 'ارتکاز بسيط');
r('Share Calculation', 'Berechnung teilen', 'Compartir cálculo', 'Partager le calcul', 'Condividi calcolo', 'Partilhar cálculo', 'Поделиться расчётом', '分享计算', '計算を共有', '계산 공유', 'مشاركة الحساب');
r('Copied!', 'Kopiert!', '¡Copiado!', 'Copié !', 'Copiato!', 'Copiado!', 'Скопировано!', '已复制！', 'コピーしました！', '복사됨!', 'تم النسخ!');
r('Load & Geometry', 'Last & Geometrie', 'Carga y geometría', 'Charge et géométrie', 'Carico e geometria', 'Carga e geometria', 'Нагрузка и геометрия', '载荷与几何', '荷重と形状', '하중 및 기하', 'الحمل والهندسة');
r('Beam Parameters', 'Balkenparameter', 'Parámetros de viga', 'Paramètres de poutre', 'Parametri trave', 'Parâmetros da viga', 'Параметры балки', '梁参数', '梁パラメータ', '보 매개변수', 'معلمات العارضة');
r('Calculated Stress', 'Berechnete Spannung', 'Esfuerzo calculado', 'Contrainte calculée', 'Sforzo calcolato', 'Tensão calculada', 'Расчётное напряжение', '计算应力', '計算応力', '계산 응력', 'الإجهاد المحسوب');
r('Max Deflection', 'Max. Durchbiegung', 'Deflexión máx.', 'Flèche max.', 'Deflessione max.', 'Deflexão máx.', 'Макс. прогиб', '最大挠度', '最大たわみ', '최대 처짐', 'أقصى انحراف');
r('Safety Factor', 'Sicherheitsfaktor', 'Factor de seguridad', 'Facteur de sécurité', 'Fattore di sicurezza', 'Fator de segurança', 'Коэффициент запаса', '安全系数', '安全率', '안전율', 'عامل الأمان');
r('Center Dist (awt)', 'Achsabstand (awt)', 'Distancia entre centros', 'Entraxe (awt)', 'Interasse (awt)', 'Distância entre centros', 'Межосевое расстояние', '中心距 (awt)', '中心距離 (awt)', '중심 거리 (awt)', 'المسافة بين المراكز');
r('Output Speed', 'Abtriebsdrehzahl', 'Velocidad de salida', 'Vitesse de sortie', 'Velocità in uscita', 'Velocidade de saída', 'Выходная скорость', '输出转速', '出力回転数', '출력 속도', 'سرعة الخروج');
r('Width', 'Breite', 'Anchura', 'Largeur', 'Larghezza', 'Largura', 'Ширина', '宽度', '幅', '폭', 'العرض');
r('Height', 'Höhe', 'Altura', 'Hauteur', 'Altezza', 'Altura', 'Высота', '高度', '高さ', '높이', 'الارتفاع');
r('Thickness', 'Dicke', 'Espesor', 'Épaisseur', 'Spessore', 'Espessura', 'Толщина', '厚度', '厚さ', '두께', 'السماكة');
r('Wall Thickness', 'Wandstärke', 'Espesor de pared', 'Épaisseur de paroi', 'Spessore parete', 'Espessura de parede', 'Толщина стенки', '壁厚', '肉厚', '벽 두께', 'سماكة الجدار');
r('Outer Diameter', 'Außendurchmesser', 'Diámetro exterior', 'Diamètre extérieur', 'Diametro esterno', 'Diâmetro externo', 'Наружный диаметр', '外径', '外径', '외경', 'القطر الخارجي');
r('Diameter', 'Durchmesser', 'Diámetro', 'Diamètre', 'Diametro', 'Diâmetro', 'Диаметр', '直径', '直径', '지름', 'القطر');
r('Length', 'Länge', 'Longitud', 'Longueur', 'Lunghezza', 'Comprimento', 'Длина', '长度', '長さ', '길이', 'الطول');
r('Box Profile', 'Kastenprofil', 'Perfil caja', 'Profilé caisson', 'Profilo scatolato', 'Perfil caixa', 'Коробчатый профиль', '箱型材', 'ボックス形材', '박스 프로파일', 'قطاع صندوقي');
r('Sheet / Plate', 'Blech / Platte', 'Chapa / Placa', 'Tôle / Plaque', 'Lamiera / Piastra', 'Chapa / Placa', 'Лист / Плита', '板材', '板材', '판재', 'صفيحة / لوح');
r('Round Tube', 'Rundrohr', 'Tubo redondo', 'Tube rond', 'Tubo tondo', 'Tubo redondo', 'Круглая труба', '圆管', '丸管', '원형 파이프', 'أنبوب دائري');
r('Solid Bar', 'Vollstab', 'Barra maciza', 'Barre pleine', 'Barra piena', 'Barra maciça', 'Сплошной пруток', '实心棒', '丸棒', '솔리드 바', 'قضيب مصمت');
r('Angle (L)', 'Winkel (L)', 'Ángulo (L)', 'Cornière (L)', 'Angolare (L)', 'Cantoneira (L)', 'Уголок (L)', '角钢 (L)', 'アングル (L)', '앵글 (L)', 'زاوية (L)');
r('Beam (I/H)', 'Träger (I/H)', 'Viga (I/H)', 'Poutre (I/H)', 'Trave (I/H)', 'Viga (I/H)', 'Балка (I/H)', '工字钢 (I/H)', 'ビーム (I/H)', '빔 (I/H)', 'عارضة (I/H)');
r('Channel (U)', 'U-Profil', 'Perfil U', 'Profilé U', 'Profilo U', 'Perfil U', 'Швеллер (U)', '槽钢 (U)', 'チャンネル (U)', '채널 (U)', 'قناة (U)');
r('T-Profile', 'T-Profil', 'Perfil T', 'Profilé T', 'Profilo T', 'Perfil T', 'Тавр (T)', 'T型钢', 'T形材', 'T 프로파일', 'قطاع T');
r('Hex Bar', 'Sechskantstab', 'Barra hexagonal', 'Barre hexagonale', 'Barra esagonale', 'Barra hexagonal', 'Шестигранник', '六角棒', '六角棒', '육각 바', 'قضيب سداسي');
r('Width (A)', 'Breite (A)', 'Anchura (A)', 'Largeur (A)', 'Larghezza (A)', 'Largura (A)', 'Ширина (A)', '宽度 (A)', '幅 (A)', '폭 (A)', 'العرض (A)');
r('Height (B)', 'Höhe (B)', 'Altura (B)', 'Hauteur (B)', 'Altezza (B)', 'Altura (B)', 'Высота (B)', '高度 (B)', '高さ (B)', '높이 (B)', 'الارتفاع (B)');
r('Thickness (t)', 'Dicke (t)', 'Espesor (t)', 'Épaisseur (t)', 'Spessore (t)', 'Espessura (t)', 'Толщина (t)', '厚度 (t)', '厚さ (t)', '두께 (t)', 'السماكة (t)');
r('Wall (t)', 'Wand (t)', 'Pared (t)', 'Paroi (t)', 'Parete (t)', 'Parede (t)', 'Стенка (t)', '壁厚 (t)', '肉厚 (t)', '벽 (t)', 'الجدار (t)');
r('Diameter (D)', 'Durchmesser (D)', 'Diámetro (D)', 'Diamètre (D)', 'Diametro (D)', 'Diâmetro (D)', 'Диаметр (D)', '直径 (D)', '直径 (D)', '지름 (D)', 'القطر (D)');
r('Web (tw)', 'Steg (tw)', 'Alma (tw)', 'Âme (tw)', 'Anima (tw)', 'Alma (tw)', 'Стенка (tw)', '腹板 (tw)', 'ウェブ (tw)', '웨브 (tw)', 'الجسد (tw)');
r('Flange (tf)', 'Flansch (tf)', 'Ala (tf)', 'Semelle (tf)', 'Flangia (tf)', 'Mesa (tf)', 'Полка (tf)', '翼缘 (tf)', 'フランジ (tf)', '플랜지 (tf)', 'الشفة (tf)');
r('Density (ρ)', 'Dichte (ρ)', 'Densidad (ρ)', 'Masse volumique (ρ)', 'Densità (ρ)', 'Densidade (ρ)', 'Плотность (ρ)', '密度 (ρ)', '密度 (ρ)', '밀도 (ρ)', 'الكثافة (ρ)');
r('Density is mass per unit volume. Different series of Aluminum have slightly different densities due to alloying elements.',
  'Dichte ist Masse pro Volumen. Aluminiumlegierungen haben je nach Legierungselementen leicht unterschiedliche Dichten.',
  'La densidad es masa por volumen. Las series de aluminio varían ligeramente por los elementos de aleación.',
  'La masse volumique est la masse par unité de volume. Les séries d’aluminium varient légèrement selon les éléments d’alliage.',
  'La densità è massa per volume. Le serie di alluminio variano leggermente a causa degli elementi di lega.',
  'A densidade é massa por volume. As séries de alumínio variam ligeiramente devido aos elementos de liga.',
  'Плотность — масса на единицу объёма. Разные серии алюминия имеют слегка разную плотность из‑за легирующих элементов.',
  '密度是单位体积的质量。不同铝合金因合金元素不同，密度略有差异。',
  '密度は単位体積あたりの質量です。アルミニウムの系列は合金元素により密度がわずかに異なります。',
  '밀도는 단위 부피당 질량입니다. 알루미늄 계열은 합금 원소에 따라 밀도가 약간 다릅니다.',
  'الكثافة هي الكتلة لوحدة الحجم. تختلف سلاسل الألمنيوم قليلاً بسبب عناصر السبيكة.');
r('1000 Series (Pure): ~2.70 g/cm³', 'Serie 1000 (rein): ~2,70 g/cm³', 'Serie 1000 (puro): ~2,70 g/cm³', 'Série 1000 (pur) : ~2,70 g/cm³', 'Serie 1000 (puro): ~2,70 g/cm³', 'Série 1000 (puro): ~2,70 g/cm³', 'Серия 1000 (чистый): ~2,70 г/см³', '1000系（纯铝）：~2.70 g/cm³', '1000系（純アルミ）：~2.70 g/cm³', '1000계 (순수): ~2.70 g/cm³', 'سلسلة 1000 (نقي): ~2.70 g/cm³');
r('6000 Series (Mg+Si): ~2.70 g/cm³', 'Serie 6000 (Mg+Si): ~2,70 g/cm³', 'Serie 6000 (Mg+Si): ~2,70 g/cm³', 'Série 6000 (Mg+Si) : ~2,70 g/cm³', 'Serie 6000 (Mg+Si): ~2,70 g/cm³', 'Série 6000 (Mg+Si): ~2,70 g/cm³', 'Серия 6000 (Mg+Si): ~2,70 г/см³', '6000系（Mg+Si）：~2.70 g/cm³', '6000系（Mg+Si）：~2.70 g/cm³', '6000계 (Mg+Si): ~2.70 g/cm³', 'سلسلة 6000 (Mg+Si): ~2.70 g/cm³');
r('7000 Series (Zn): ~2.81 g/cm³ (Heavier)', 'Serie 7000 (Zn): ~2,81 g/cm³ (schwerer)', 'Serie 7000 (Zn): ~2,81 g/cm³ (más pesada)', 'Série 7000 (Zn) : ~2,81 g/cm³ (plus dense)', 'Serie 7000 (Zn): ~2,81 g/cm³ (più pesante)', 'Série 7000 (Zn): ~2,81 g/cm³ (mais pesada)', 'Серия 7000 (Zn): ~2,81 г/см³ (тяжелее)', '7000系（Zn）：~2.81 g/cm³（更重）', '7000系（Zn）：~2.81 g/cm³（重い）', '7000계 (Zn): ~2.81 g/cm³ (더 무거움)', 'سلسلة 7000 (Zn): ~2.81 g/cm³ (أثقل)');
r('Mass = Volume × Density', 'Masse = Volumen × Dichte', 'Masa = Volumen × Densidad', 'Masse = Volume × Masse volumique', 'Massa = Volume × Densità', 'Massa = Volume × Densidade', 'Масса = Объём × Плотность', '质量 = 体积 × 密度', '質量 = 体積 × 密度', '질량 = 부피 × 밀도', 'الكتلة = الحجم × الكثافة');
r('For a plate: Length × Width × Thickness × ρ', 'Für eine Platte: Länge × Breite × Dicke × ρ', 'Para una placa: Longitud × Anchura × Espesor × ρ', 'Pour une plaque : Longueur × Largeur × Épaisseur × ρ', 'Per una piastra: Lunghezza × Larghezza × Spessore × ρ', 'Para uma chapa: Comprimento × Largura × Espessura × ρ', 'Для листа: Длина × Ширина × Толщина × ρ', '板材：长度 × 宽度 × 厚度 × ρ', '板材：長さ × 幅 × 厚さ × ρ', '판재: 길이 × 폭 × 두께 × ρ', 'للوحة: الطول × العرض × السماكة × ρ');
r('Calculations are based on theoretical density (~2.70 g/cm³). Actual weight may vary by ±5% based on production tolerances (ASTM B221). Use valid numerical inputs for best results.',
  'Berechnungen basieren auf theoretischer Dichte (~2,70 g/cm³). Das tatsächliche Gewicht kann um ±5 % (ASTM B221) abweichen. Verwenden Sie gültige Zahlenwerte.',
  'Los cálculos usan densidad teórica (~2,70 g/cm³). El peso real puede variar ±5 % (ASTM B221). Use entradas numéricas válidas.',
  'Les calculs utilisent une masse volumique théorique (~2,70 g/cm³). Le poids réel peut varier de ±5 % (ASTM B221). Saisissez des valeurs numériques valides.',
  'I calcoli usano densità teorica (~2,70 g/cm³). Il peso reale può variare di ±5 % (ASTM B221). Usare valori numerici validi.',
  'Os cálculos usam densidade teórica (~2,70 g/cm³). O peso real pode variar ±5 % (ASTM B221). Use entradas numéricas válidas.',
  'Расчёты основаны на теоретической плотности (~2,70 г/см³). Фактический вес может отличаться на ±5 % (ASTM B221). Используйте корректные числа.',
  '计算基于理论密度（~2.70 g/cm³）。实际重量可能因生产公差（ASTM B221）偏差 ±5%。请输入有效数值。',
  '計算は理論密度（~2.70 g/cm³）に基づきます。実重量は製造公差（ASTM B221）により±5%変動します。有効な数値を入力してください。',
  '계산은 이론 밀도(~2.70 g/cm³)를 사용합니다. 실제 중량은 생산 공차(ASTM B221)에 따라 ±5% 달라질 수 있습니다. 유효한 숫자를 입력하세요.',
  'الحسابات تعتمد كثافة نظرية (~2.70 g/cm³). قد يختلف الوزن الفعلي بنسبة ±5% وفق ASTM B221. استخدم قيماً رقمية صحيحة.');
r('Project List (BOM)', 'Projektliste (Stückliste)', 'Lista de proyecto (BOM)', 'Liste de projet (nomenclature)', 'Elenco progetto (BOM)', 'Lista do projeto (BOM)', 'Список проекта (спецификация)', '项目清单 (BOM)', 'プロジェクト一覧 (BOM)', '프로젝트 목록 (BOM)', 'قائمة المشروع (BOM)');
r('Add to List', 'Zur Liste hinzufügen', 'Añadir a la lista', 'Ajouter à la liste', 'Aggiungi all’elenco', 'Adicionar à lista', 'Добавить в список', '添加到清单', 'リストに追加', '목록에 추가', 'إضافة إلى القائمة');
r('Clear List', 'Liste leeren', 'Vaciar lista', 'Vider la liste', 'Svuota elenco', 'Limpar lista', 'Очистить список', '清空清单', 'リストをクリア', '목록 비우기', 'مسح القائمة');
r('List is empty.', 'Liste ist leer.', 'La lista está vacía.', 'La liste est vide.', 'L’elenco è vuoto.', 'A lista está vazia.', 'Список пуст.', '清单为空。', 'リストは空です。', '목록이 비어 있습니다.', 'القائمة فارغة.');
r('Grand Total Weight', 'Gesamtgewicht', 'Peso total general', 'Poids total général', 'Peso totale complessivo', 'Peso total geral', 'Итоговый вес', '总重量合计', '総合計重量', '총중량 합계', 'الوزن الإجمالي الكلي');
r('Total Project Cost', 'Gesamtkosten des Projekts', 'Coste total del proyecto', 'Coût total du projet', 'Costo totale del progetto', 'Custo total do projeto', 'Полная стоимость проекта', '项目总成本', 'プロジェクト総コスト', '프로젝트 총비용', 'التكلفة الإجمالية للمشروع');
r('#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#');
r('Material / Dim', 'Werkstoff / Abmessung', 'Material / Dim.', 'Matériau / Dim.', 'Materiale / Dim.', 'Material / Dim.', 'Материал / размер', '材料 / 尺寸', '材料 / 寸法', '재료 / 치수', 'مادة / بعد');
r('Qty', 'Stk', 'Cant.', 'Qté', 'Qtà', 'Qtd', 'Кол.', '数量', '数量', '수량', 'الكمية');
r('Unit W.', 'Einh.-Gew.', 'Peso ud.', 'Poids ud.', 'Peso un.', 'Peso un.', 'Уд. вес', '单位重', '単位重量', '단위중량', 'وزن الوحدة');
r('Total W.', 'Ges.-Gew.', 'Peso tot.', 'Poids tot.', 'Peso tot.', 'Peso tot.', 'Общ. вес', '总重', '総重量', '총중량', 'الوزن الكلي');
r('Action', 'Aktion', 'Acción', 'Action', 'Azione', 'Ação', 'Действие', '操作', '操作', '동작', 'إجراء');
r('Price per Unit (/kg)', 'Preis je Einheit (/kg)', 'Precio por unidad (/kg)', 'Prix unitaire (/kg)', 'Prezzo unitario (/kg)', 'Preço por unidade (/kg)', 'Цена за единицу (/кг)', '单价 (/kg)', '単価 (/kg)', '단가 (/kg)', 'السعر لكل وحدة (/كغ)');
r('Est. Cost', 'Gesch. Kosten', 'Coste est.', 'Coût est.', 'Costo stim.', 'Custo est.', 'Оц. стоимость', '估计成本', '概算コスト', '예상 비용', 'التكلفة التقديرية');
r('Engineering Analysis', 'Ingenieuranalyse', 'Análisis de ingeniería', 'Analyse d’ingénierie', 'Analisi ingegneristica', 'Análise de engenharia', 'Инженерный анализ', '工程分析', '工学解析', '공학 해석', 'التحليل الهندسي');
r('Surface Area (Paint)', 'Oberfläche (Lack)', 'Área superficial (pintura)', 'Surface (peinture)', 'Area superficiale (vernice)', 'Área superficial (tinta)', 'Площадь поверхности (окраска)', '表面积（涂装）', '表面積（塗装）', '표면적 (도장)', 'المساحة السطحية (طلاء)');
r('Mechanical Properties', 'Mechanische Eigenschaften', 'Propiedades mecánicas', 'Propriétés mécaniques', 'Proprietà meccaniche', 'Propriedades mecânicas', 'Механические свойства', '力学性能', '機械的性質', '기계적 성질', 'الخصائص الميكانيكية');
r('Yield Strength', 'Streckgrenze', 'Límite elástico', 'Limite d’élasticité', 'Snervamento', 'Limite de escoamento', 'Предел текучести', '屈服强度', '降伏強さ', '항복 강도', 'حد الخضوع');
r('Tensile Strength', 'Zugfestigkeit', 'Resistencia a tracción', 'Résistance à la traction', 'Resistenza a trazione', 'Resistência à tração', 'Предел прочности', '抗拉强度', '引張強さ', '인장 강도', 'مقاومة الشد');
r('Hardness', 'Härte', 'Dureza', 'Dureté', 'Durezza', 'Dureza', 'Твёрдость', '硬度', '硬さ', '경도', 'الصلادة');
r('Weldability', 'Schweißeignung', 'Soldabilidad', 'Soudabilité', 'Saldabilità', 'Soldabilidade', 'Свариваемость', '可焊性', '溶接性', '용접성', 'قابلية اللحام');
r('Section Properties', 'Querschnittswerte', 'Propiedades de sección', 'Caractéristiques de section', 'Proprietà di sezione', 'Propriedades da seção', 'Геометрия сечения', '截面特性', '断面特性', '단면 특성', 'خصائص المقطع');
r('Moment of Inertia', 'Trägheitsmoment', 'Momento de inercia', 'Moment d’inertie', 'Momento d’inerzia', 'Momento de inércia', 'Момент инерции', '惯性矩', '断面二次モーメント', '관성 모멘트', 'عزم القصور الذاتي');
r('Section Modulus', 'Widerstandsmoment', 'Módulo de sección', 'Module de section', 'Modulo di resistenza', 'Módulo de seção', 'Момент сопротивления', '截面模量', '断面係数', '단면 계수', 'معامل المقطع');
r('Radius of Gyration', 'Trägheitsradius', 'Radio de giro', 'Rayon de giration', 'Raggio di inerzia', 'Raio de giração', 'Радиус инерции', '回转半径', '回転半径', '회전 반경', 'نصف قطر الدوران');
r('Beam Deflection Sim', 'Balken-Durchbiegungssim.', 'Sim. deflexión de viga', 'Sim. flèche de poutre', 'Sim. deflessione trave', 'Sim. deflexão de viga', 'Симуляция прогиба балки', '梁挠度仿真', '梁たわみシミュレータ', '보 처짐 시뮬', 'محاكاة انحراف العارضة');
r('Open Simulator', 'Simulator öffnen', 'Abrir simulador', 'Ouvrir le simulateur', 'Apri simulatore', 'Abrir simulador', 'Открыть симулятор', '打开仿真器', 'シミュレータを開く', '시뮬레이터 열기', 'فتح المحاكي');
r('Close', 'Schließen', 'Cerrar', 'Fermer', 'Chiudi', 'Fechar', 'Закрыть', '关闭', '閉じる', '닫기', 'إغلاق');

export { ROWS, r };

export function getTable() {
  return Object.fromEntries(ROWS.map((row) => [row.en, row]));
}
