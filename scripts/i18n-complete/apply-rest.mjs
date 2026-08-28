import fs from 'fs';
import path from 'path';
import { getTable, LANGS, ROWS } from './table-data.mjs';
import './table-more.mjs';
import './table-more-2.mjs';

const ROOT = process.cwd();
const TABLE = getTable();
console.log('table size', ROWS.length);

function tx(en, lang) {
  if (en == null) return en;
  if (typeof en !== 'string') return en;
  if (lang === 'en' || lang === 'tr') return en;
  const hit = TABLE[en];
  if (hit && hit[lang]) return hit[lang];
  return phraseTx(en, lang);
}

const PHRASES = {
  de: [
    ['Search Results', 'Suchergebnisse'], ['Shut Down', 'Herunterfahren'], ['No modules found', 'Keine Module gefunden'],
    ['Try adjusting your search query.', 'Passen Sie die Suchanfrage an.'], ['Disciplines', 'Disziplinen'],
    ['French', 'Französisch'], ['Italian', 'Italienisch'], ['Portuguese', 'Portugiesisch'], ['Russian', 'Russisch'],
    ['CAD Editor', 'CAD-Editor'], ['Sketch Pad', 'Skizzenblock'], ['Periodic Table', 'Periodensystem'],
    ['FEA Simulation', 'FEA-Simulation'], ['Thermal Expansion', 'Wärmedehnung'], ['Project BOM', 'Projekt-Stückliste'],
    ['Cost Engine', 'Kostenrechner'], ['Generative Design', 'Generatives Design'], ['Machine Assembly', 'Maschinenbaugruppe'],
    ['Fluid Dynamics', 'Strömungsmechanik'], ['Coming soon...', 'Demnächst...'], ['Close All Apps', 'Alle Apps schließen'],
    ['Contact & Feedback', 'Kontakt & Feedback'], ['Cost Estimator', 'Kostenkalkulator'], ['Feature Tree', 'Konstruktionsbaum'],
    ['Sketches', 'Skizzen'], ['Bodies', 'Körper'], ['Constraints', 'Bedingungen'], ['Parameters', 'Parameter'],
    ['No bodies yet', 'Noch keine Körper'], ['Fully Constrained', 'Vollständig bestimmt'], ['Over Constrained', 'Überbestimmt'],
    ['Under Constrained', 'Unterbestimmt'], ['Add Body', 'Körper hinzufügen'], ['Select Standard...', 'Norm wählen...'],
    ['Export failed', 'Export fehlgeschlagen'], ['Canvas', 'Leinwand'], ['Output', 'Ausgabe'], ['Clear', 'Löschen'],
    ['Note', 'Notiz'], ['Image', 'Bild'], ['Video', 'Video'], ['Music', 'Musik'], ['New Note', 'Neue Notiz'],
    ['Other', 'Sonstiges'], ['Sciences', 'Naturwissenschaften'], ['Software', 'Software'], ['Civil', 'Bauwesen'],
    ['Finance', 'Finanzen'], ['FLOW', 'FLOW'], ['Geometry', 'Geometrie'], ['Process Setup', 'Verfahrenssetup'],
  ],
  es: [
    ['Search Results', 'Resultados de búsqueda'], ['Shut Down', 'Apagar'], ['No modules found', 'No se encontraron módulos'],
    ['Try adjusting your search query.', 'Pruebe a ajustar la búsqueda.'], ['Disciplines', 'Disciplinas'],
    ['French', 'Francés'], ['Italian', 'Italiano'], ['Portuguese', 'Portugués'], ['Russian', 'Ruso'],
    ['CAD Editor', 'Editor CAD'], ['Sketch Pad', 'Bloc de dibujo'], ['Periodic Table', 'Tabla periódica'],
    ['FEA Simulation', 'Simulación FEA'], ['Thermal Expansion', 'Expansión térmica'], ['Project BOM', 'LDM del proyecto'],
    ['Cost Engine', 'Motor de costes'], ['Generative Design', 'Diseño generativo'], ['Machine Assembly', 'Ensamblaje de máquina'],
    ['Fluid Dynamics', 'Dinámica de fluidos'], ['Coming soon...', 'Próximamente...'], ['Close All Apps', 'Cerrar todas las apps'],
    ['Contact & Feedback', 'Contacto y comentarios'], ['Cost Estimator', 'Estimador de costes'], ['Feature Tree', 'Árbol de operaciones'],
    ['Sketches', 'Bocetos'], ['Bodies', 'Sólidos'], ['Constraints', 'Restricciones'], ['Parameters', 'Parámetros'],
    ['No bodies yet', 'Aún no hay sólidos'], ['Fully Constrained', 'Totalmente restringido'], ['Over Constrained', 'Sobre restringido'],
    ['Under Constrained', 'Sub restringido'], ['Add Body', 'Añadir sólido'], ['Select Standard...', 'Seleccionar norma...'],
    ['Export failed', 'Error de exportación'], ['Canvas', 'Lienzo'], ['Output', 'Salida'], ['Clear', 'Borrar'],
    ['Note', 'Nota'], ['Image', 'Imagen'], ['Video', 'Vídeo'], ['Music', 'Música'], ['New Note', 'Nueva nota'],
    ['Other', 'Otro'], ['Sciences', 'Ciencias'], ['Software', 'Software'], ['Civil', 'Civil'], ['Finance', 'Finanzas'],
    ['FLOW', 'FLOW'], ['Geometry', 'Geometría'], ['Process Setup', 'Configuración del proceso'],
  ],
  fr: [
    ['Search Results', 'Résultats de recherche'], ['Shut Down', 'Arrêter'], ['No modules found', 'Aucun module trouvé'],
    ['Try adjusting your search query.', 'Modifiez votre recherche.'], ['Disciplines', 'Disciplines'],
    ['French', 'Français'], ['Italian', 'Italien'], ['Portuguese', 'Portugais'], ['Russian', 'Russe'],
    ['CAD Editor', 'Éditeur CAO'], ['Sketch Pad', 'Bloc à croquis'], ['Periodic Table', 'Tableau périodique'],
    ['FEA Simulation', 'Simulation EF'], ['Thermal Expansion', 'Dilatation thermique'], ['Project BOM', 'Nomenclature projet'],
    ['Cost Engine', 'Moteur de coûts'], ['Generative Design', 'Conception générative'], ['Machine Assembly', 'Assemblage machine'],
    ['Fluid Dynamics', 'Dynamique des fluides'], ['Coming soon...', 'Bientôt disponible...'], ['Close All Apps', 'Fermer toutes les apps'],
    ['Contact & Feedback', 'Contact et retours'], ['Cost Estimator', 'Estimateur de coût'], ['Feature Tree', 'Arbre de construction'],
    ['Sketches', 'Esquisses'], ['Bodies', 'Corps'], ['Constraints', 'Contraintes'], ['Parameters', 'Paramètres'],
    ['No bodies yet', 'Aucun corps pour l’instant'], ['Fully Constrained', 'Entièrement contraint'], ['Over Constrained', 'Surcontraint'],
    ['Under Constrained', 'Sous-contraint'], ['Add Body', 'Ajouter un corps'], ['Select Standard...', 'Choisir une norme...'],
    ['Export failed', 'Échec de l’export'], ['Canvas', 'Canevas'], ['Output', 'Sortie'], ['Clear', 'Effacer'],
    ['Note', 'Note'], ['Image', 'Image'], ['Video', 'Vidéo'], ['Music', 'Musique'], ['New Note', 'Nouvelle note'],
    ['Other', 'Autre'], ['Sciences', 'Sciences'], ['Software', 'Logiciel'], ['Civil', 'Génie civil'], ['Finance', 'Finance'],
    ['FLOW', 'FLOW'], ['Geometry', 'Géométrie'], ['Process Setup', 'Réglage du procédé'],
  ],
  it: [
    ['Search Results', 'Risultati di ricerca'], ['Shut Down', 'Arresta'], ['No modules found', 'Nessun modulo trovato'],
    ['Try adjusting your search query.', 'Prova a modificare la ricerca.'], ['Disciplines', 'Discipline'],
    ['French', 'Francese'], ['Italian', 'Italiano'], ['Portuguese', 'Portoghese'], ['Russian', 'Russo'],
    ['CAD Editor', 'Editor CAD'], ['Sketch Pad', 'Blocco schizzi'], ['Periodic Table', 'Tavola periodica'],
    ['FEA Simulation', 'Simulazione FEA'], ['Thermal Expansion', 'Dilatazione termica'], ['Project BOM', 'Distinta progetto'],
    ['Cost Engine', 'Motore costi'], ['Generative Design', 'Progettazione generativa'], ['Machine Assembly', 'Assemblaggio macchina'],
    ['Fluid Dynamics', 'Dinamica dei fluidi'], ['Coming soon...', 'Prossimamente...'], ['Close All Apps', 'Chiudi tutte le app'],
    ['Contact & Feedback', 'Contatti e feedback'], ['Cost Estimator', 'Stimatore costi'], ['Feature Tree', 'Albero delle feature'],
    ['Sketches', 'Schizzi'], ['Bodies', 'Corpi'], ['Constraints', 'Vincoli'], ['Parameters', 'Parametri'],
    ['No bodies yet', 'Nessun corpo ancora'], ['Fully Constrained', 'Completamente vincolato'], ['Over Constrained', 'Sovravincolato'],
    ['Under Constrained', 'Sottovincolato'], ['Add Body', 'Aggiungi corpo'], ['Select Standard...', 'Seleziona norma...'],
    ['Export failed', 'Esportazione non riuscita'], ['Canvas', 'Tela'], ['Output', 'Uscita'], ['Clear', 'Cancella'],
    ['Note', 'Nota'], ['Image', 'Immagine'], ['Video', 'Video'], ['Music', 'Musica'], ['New Note', 'Nuova nota'],
    ['Other', 'Altro'], ['Sciences', 'Scienze'], ['Software', 'Software'], ['Civil', 'Civile'], ['Finance', 'Finanza'],
    ['FLOW', 'FLOW'], ['Geometry', 'Geometria'], ['Process Setup', 'Setup di processo'],
  ],
  pt: [
    ['Search Results', 'Resultados da pesquisa'], ['Shut Down', 'Desligar'], ['No modules found', 'Nenhum módulo encontrado'],
    ['Try adjusting your search query.', 'Ajuste a sua pesquisa.'], ['Disciplines', 'Disciplinas'],
    ['French', 'Francês'], ['Italian', 'Italiano'], ['Portuguese', 'Português'], ['Russian', 'Russo'],
    ['CAD Editor', 'Editor CAD'], ['Sketch Pad', 'Bloco de esboço'], ['Periodic Table', 'Tabela periódica'],
    ['FEA Simulation', 'Simulação FEA'], ['Thermal Expansion', 'Expansão térmica'], ['Project BOM', 'BOM do projeto'],
    ['Cost Engine', 'Motor de custos'], ['Generative Design', 'Design generativo'], ['Machine Assembly', 'Montagem de máquina'],
    ['Fluid Dynamics', 'Dinâmica dos fluidos'], ['Coming soon...', 'Em breve...'], ['Close All Apps', 'Fechar todas as apps'],
    ['Contact & Feedback', 'Contacto e feedback'], ['Cost Estimator', 'Estimador de custos'], ['Feature Tree', 'Árvore de features'],
    ['Sketches', 'Esboços'], ['Bodies', 'Corpos'], ['Constraints', 'Restrições'], ['Parameters', 'Parâmetros'],
    ['No bodies yet', 'Ainda sem corpos'], ['Fully Constrained', 'Totalmente restrito'], ['Over Constrained', 'Sobre-restrito'],
    ['Under Constrained', 'Sub-restrito'], ['Add Body', 'Adicionar corpo'], ['Select Standard...', 'Selecionar norma...'],
    ['Export failed', 'Falha na exportação'], ['Canvas', 'Tela'], ['Output', 'Saída'], ['Clear', 'Limpar'],
    ['Note', 'Nota'], ['Image', 'Imagem'], ['Video', 'Vídeo'], ['Music', 'Música'], ['New Note', 'Nova nota'],
    ['Other', 'Outro'], ['Sciences', 'Ciências'], ['Software', 'Software'], ['Civil', 'Civil'], ['Finance', 'Finanças'],
    ['FLOW', 'FLOW'], ['Geometry', 'Geometria'], ['Process Setup', 'Configuração do processo'],
  ],
  ru: [
    ['Search Results', 'Результаты поиска'], ['Shut Down', 'Выключить'], ['No modules found', 'Модули не найдены'],
    ['Try adjusting your search query.', 'Измените поисковый запрос.'], ['Disciplines', 'Дисциплины'],
    ['French', 'Французский'], ['Italian', 'Итальянский'], ['Portuguese', 'Португальский'], ['Russian', 'Русский'],
    ['CAD Editor', 'CAD-редактор'], ['Sketch Pad', 'Эскизная доска'], ['Periodic Table', 'Периодическая таблица'],
    ['FEA Simulation', 'FEA-моделирование'], ['Thermal Expansion', 'Тепловое расширение'], ['Project BOM', 'Спецификация проекта'],
    ['Cost Engine', 'Расчёт стоимости'], ['Generative Design', 'Генеративный дизайн'], ['Machine Assembly', 'Сборка машины'],
    ['Fluid Dynamics', 'Гидродинамика'], ['Coming soon...', 'Скоро...'], ['Close All Apps', 'Закрыть все приложения'],
    ['Contact & Feedback', 'Связь и отзывы'], ['Cost Estimator', 'Калькулятор себестоимости'], ['Feature Tree', 'Дерево элементов'],
    ['Sketches', 'Эскизы'], ['Bodies', 'Тела'], ['Constraints', 'Ограничения'], ['Parameters', 'Параметры'],
    ['No bodies yet', 'Тел пока нет'], ['Fully Constrained', 'Полностью определено'], ['Over Constrained', 'Переопределено'],
    ['Under Constrained', 'Недоопределено'], ['Add Body', 'Добавить тело'], ['Select Standard...', 'Выберите стандарт...'],
    ['Export failed', 'Ошибка экспорта'], ['Canvas', 'Холст'], ['Output', 'Вывод'], ['Clear', 'Очистить'],
    ['Note', 'Заметка'], ['Image', 'Изображение'], ['Video', 'Видео'], ['Music', 'Музыка'], ['New Note', 'Новая заметка'],
    ['Other', 'Прочее'], ['Sciences', 'Науки'], ['Software', 'ПО'], ['Civil', 'Строительство'], ['Finance', 'Финансы'],
    ['FLOW', 'FLOW'], ['Geometry', 'Геометрия'], ['Process Setup', 'Настройка процесса'],
  ],
  zh: [
    ['Search Results', '搜索结果'], ['Shut Down', '关机'], ['No modules found', '未找到模块'],
    ['Try adjusting your search query.', '请调整搜索词。'], ['Disciplines', '学科'],
    ['French', '法语'], ['Italian', '意大利语'], ['Portuguese', '葡萄牙语'], ['Russian', '俄语'],
    ['CAD Editor', 'CAD 编辑器'], ['Sketch Pad', '草图板'], ['Periodic Table', '元素周期表'],
    ['FEA Simulation', 'FEA 仿真'], ['Thermal Expansion', '热膨胀'], ['Project BOM', '项目物料清单'],
    ['Cost Engine', '成本引擎'], ['Generative Design', '生成式设计'], ['Machine Assembly', '机器装配'],
    ['Fluid Dynamics', '流体力学'], ['Coming soon...', '即将推出...'], ['Close All Apps', '关闭全部应用'],
    ['Contact & Feedback', '联系与反馈'], ['Cost Estimator', '成本估算'], ['Feature Tree', '特征树'],
    ['Sketches', '草图'], ['Bodies', '实体'], ['Constraints', '约束'], ['Parameters', '参数'],
    ['No bodies yet', '暂无实体'], ['Fully Constrained', '完全约束'], ['Over Constrained', '过约束'],
    ['Under Constrained', '欠约束'], ['Add Body', '添加实体'], ['Select Standard...', '选择标准...'],
    ['Export failed', '导出失败'], ['Canvas', '画布'], ['Output', '输出'], ['Clear', '清除'],
    ['Note', '便笺'], ['Image', '图像'], ['Video', '视频'], ['Music', '音乐'], ['New Note', '新建便笺'],
    ['Other', '其他'], ['Sciences', '科学'], ['Software', '软件'], ['Civil', '土木'], ['Finance', '金融'],
    ['FLOW', 'FLOW'], ['Geometry', '几何'], ['Process Setup', '工艺设置'],
  ],
  ja: [
    ['Search Results', '検索結果'], ['Shut Down', 'シャットダウン'], ['No modules found', 'モジュールが見つかりません'],
    ['Try adjusting your search query.', '検索語を変更してください。'], ['Disciplines', '分野'],
    ['French', 'フランス語'], ['Italian', 'イタリア語'], ['Portuguese', 'ポルトガル語'], ['Russian', 'ロシア語'],
    ['CAD Editor', 'CADエディタ'], ['Sketch Pad', 'スケッチパッド'], ['Periodic Table', '周期表'],
    ['FEA Simulation', 'FEAシミュレーション'], ['Thermal Expansion', '熱膨張'], ['Project BOM', 'プロジェクトBOM'],
    ['Cost Engine', 'コストエンジン'], ['Generative Design', 'ジェネレーティブデザイン'], ['Machine Assembly', '機械組立'],
    ['Fluid Dynamics', '流体力学'], ['Coming soon...', '近日公開...'], ['Close All Apps', 'すべてのアプリを閉じる'],
    ['Contact & Feedback', '連絡とフィードバック'], ['Cost Estimator', 'コスト見積'], ['Feature Tree', 'フィーチャツリー'],
    ['Sketches', 'スケッチ'], ['Bodies', 'ボディ'], ['Constraints', '拘束'], ['Parameters', 'パラメータ'],
    ['No bodies yet', 'ボディはまだありません'], ['Fully Constrained', '完全拘束'], ['Over Constrained', '過剰拘束'],
    ['Under Constrained', '不足拘束'], ['Add Body', 'ボディを追加'], ['Select Standard...', '規格を選択...'],
    ['Export failed', 'エクスポート失敗'], ['Canvas', 'キャンバス'], ['Output', '出力'], ['Clear', 'クリア'],
    ['Note', 'メモ'], ['Image', '画像'], ['Video', '動画'], ['Music', '音楽'], ['New Note', '新しいメモ'],
    ['Other', 'その他'], ['Sciences', '科学'], ['Software', 'ソフトウェア'], ['Civil', '土木'], ['Finance', '金融'],
    ['FLOW', 'FLOW'], ['Geometry', '幾何'], ['Process Setup', 'プロセス設定'],
  ],
  ko: [
    ['Search Results', '검색 결과'], ['Shut Down', '종료'], ['No modules found', '모듈을 찾을 수 없습니다'],
    ['Try adjusting your search query.', '검색어를 바꿔 보세요.'], ['Disciplines', '분야'],
    ['French', '프랑스어'], ['Italian', '이탈리아어'], ['Portuguese', '포르투갈어'], ['Russian', '러시아어'],
    ['CAD Editor', 'CAD 편집기'], ['Sketch Pad', '스케치 패드'], ['Periodic Table', '주기율표'],
    ['FEA Simulation', 'FEA 시뮬레이션'], ['Thermal Expansion', '열팽창'], ['Project BOM', '프로젝트 BOM'],
    ['Cost Engine', '비용 엔진'], ['Generative Design', '생성 설계'], ['Machine Assembly', '기계 조립'],
    ['Fluid Dynamics', '유체 역학'], ['Coming soon...', '곧 제공...'], ['Close All Apps', '모든 앱 닫기'],
    ['Contact & Feedback', '문의 및 피드백'], ['Cost Estimator', '원가 산정'], ['Feature Tree', '피처 트리'],
    ['Sketches', '스케치'], ['Bodies', '솔리드'], ['Constraints', '구속'], ['Parameters', '매개변수'],
    ['No bodies yet', '솔리드가 없습니다'], ['Fully Constrained', '완전 구속'], ['Over Constrained', '과구속'],
    ['Under Constrained', '미구속'], ['Add Body', '솔리드 추가'], ['Select Standard...', '규격 선택...'],
    ['Export failed', '내보내기 실패'], ['Canvas', '캔버스'], ['Output', '출력'], ['Clear', '지우기'],
    ['Note', '메모'], ['Image', '이미지'], ['Video', '비디오'], ['Music', '음악'], ['New Note', '새 메모'],
    ['Other', '기타'], ['Sciences', '과학'], ['Software', '소프트웨어'], ['Civil', '토목'], ['Finance', '금융'],
    ['FLOW', 'FLOW'], ['Geometry', '기하'], ['Process Setup', '공정 설정'],
    ['Home', '홈'], ['Calculate', '계산'], ['Reset', '재설정'], ['Save', '저장'], ['Export', '내보내기'],
    ['Settings', '설정'], ['Language', '언어'], ['Close', '닫기'], ['Results', '결과'], ['Inputs', '입력'],
  ],
  ar: [
    ['Search Results', 'نتائج البحث'], ['Shut Down', 'إيقاف التشغيل'], ['No modules found', 'لا توجد وحدات'],
    ['Try adjusting your search query.', 'جرّب تعديل عبارة البحث.'], ['Disciplines', 'التخصصات'],
    ['French', 'الفرنسية'], ['Italian', 'الإيطالية'], ['Portuguese', 'البرتغالية'], ['Russian', 'الروسية'],
    ['CAD Editor', 'محرر CAD'], ['Sketch Pad', 'لوحة الرسم'], ['Periodic Table', 'الجدول الدوري'],
    ['FEA Simulation', 'محاكاة العناصر المحدودة'], ['Thermal Expansion', 'التمدد الحراري'], ['Project BOM', 'قائمة مواد المشروع'],
    ['Cost Engine', 'محرك التكلفة'], ['Generative Design', 'التصميم التوليدي'], ['Machine Assembly', 'تجميع الآلة'],
    ['Fluid Dynamics', 'ديناميكا الموائع'], ['Coming soon...', 'قريباً...'], ['Close All Apps', 'إغلاق كل التطبيقات'],
    ['Contact & Feedback', 'التواصل والملاحظات'], ['Cost Estimator', 'مقدّر التكلفة'], ['Feature Tree', 'شجرة السمات'],
    ['Sketches', 'المخططات'], ['Bodies', 'الأجسام'], ['Constraints', 'القيود'], ['Parameters', 'المعلمات'],
    ['No bodies yet', 'لا توجد أجسام بعد'], ['Fully Constrained', 'مقيّد بالكامل'], ['Over Constrained', 'مقيّد زيادة'],
    ['Under Constrained', 'ناقص التقييد'], ['Add Body', 'إضافة جسم'], ['Select Standard...', 'اختر المواصفة...'],
    ['Export failed', 'فشل التصدير'], ['Canvas', 'اللوحة'], ['Output', 'المخرجات'], ['Clear', 'مسح'],
    ['Note', 'ملاحظة'], ['Image', 'صورة'], ['Video', 'فيديو'], ['Music', 'موسيقى'], ['New Note', 'ملاحظة جديدة'],
    ['Other', 'أخرى'], ['Sciences', 'علوم'], ['Software', 'برمجيات'], ['Civil', 'مدني'], ['Finance', 'مالية'],
    ['FLOW', 'FLOW'], ['Geometry', 'الهندسة'], ['Process Setup', 'إعداد العملية'],
    ['Home', 'الرئيسية'], ['Calculate', 'احسب'], ['Reset', 'إعادة تعيين'], ['Save', 'حفظ'], ['Export', 'تصدير'],
    ['Settings', 'الإعدادات'], ['Language', 'اللغة'], ['Close', 'إغلاق'], ['Results', 'النتائج'], ['Inputs', 'المدخلات'],
  ],
};

function phraseTx(en, lang) {
  const list = PHRASES[lang];
  if (!list) return en;
  for (const [a, b] of list) {
    if (a === en) return b;
  }
  return en;
}

function setPath(obj, dotted, value) {
  const parts = dotted.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] == null || typeof cur[k] !== 'object' || Array.isArray(cur[k])) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function loadLocaleTs(src) {
  let s = src
    .replace(/^\uFEFF/, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/as Record<[^>]+>/g, '')
    .replace(/\bas const\b/g, '');
  s = s.replace(/export default \w+\s*;?\s*$/m, '');
  if (/^export default\s*\{/m.test(s)) s = s.replace(/^export default\s*/, 'const __loc = ');
  else s = s.replace(/^const \w+\s*=\s*/, 'const __loc = ');
  return new Function(`${s}\n; return __loc;`)();
}

function toTs(obj, indent = 0) {
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean' || obj == null) return JSON.stringify(obj);
  const pad = '    '.repeat(indent);
  const pad2 = '    '.repeat(indent + 1);
  if (Array.isArray(obj)) {
    return `[${obj.map((v) => toTs(v, indent + 1)).join(', ')}]`;
  }
  const keys = Object.keys(obj);
  const parts = keys.map((k) => {
    const key = /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : JSON.stringify(k);
    return `${pad2}${key}: ${toTs(obj[k], indent + 1)}`;
  });
  return `{\n${parts.join(',\n')}\n${pad}}`;
}

function deepMerge(a, b) {
  if (typeof b !== 'object' || b == null || Array.isArray(b)) return b;
  const out = { ...(typeof a === 'object' && a && !Array.isArray(a) ? a : {}) };
  for (const k of Object.keys(b)) {
    if (typeof b[k] === 'object' && b[k] && !Array.isArray(b[k])) out[k] = deepMerge(out[k], b[k]);
    else if (out[k] === undefined) out[k] = b[k];
  }
  return out;
}

// 1. Encoding fixes in colocated dictionary
const ENCODING = [
  ['Paramtres', 'Paramètres'], ['Rsultats', 'Résultats'], ['Rinitialiser', 'Réinitialiser'],
  ['Matriau', 'Matériau'], ['Ingnieur', 'Ingénieur'], ['Bibliothque', 'Bibliothèque'],
  ['Tolrances', 'Tolérances'], ['Alsage', 'Alésage'], ['Gomtrie', 'Géométrie'],
  ['Rsistance', 'Résistance'], ['Dure de Vie', 'Durée de Vie'], ['Tlerie', 'Tôlerie'],
  ['Entres', 'Entrées'], ['Filetage Mtrique', 'Filetage Métrique'], ['Units &', 'Unités &'],
  ['Gnr par', 'Généré par'], ['Diamtre', 'Diamètre'], ['Tolrance', 'Tolérance'],
  ['Mtrique', 'Métrique'], ['Imprial', 'Impérial'], ['Porte--faux', 'Porte-à-faux'],
  ['Flche', 'Flèche'], ['paisseur', 'épaisseur'], ['Cornire', 'Cornière'],
  ['Scurit', 'Sécurité'], ['Cot', 'Coût'], ['Incio', 'Início'],
  ['Mdulos', 'Módulos'], ['Configuraes', 'Configurações'], ['Tolerncias', 'Tolerâncias'],
  ['Resistncia', 'Resistência'], ['Potncia', 'Potência'], ['Chapas Metlicas', 'Chapas Metálicas'],
  ['Parmetros', 'Parâmetros'], ['Dimenses', 'Dimensões'], ['Preo unitrio', 'Preço unitário'],
  ['produo', 'produção'], ['Peso unitrio', 'Peso unitário'], ['Explicao', 'Explicação'],
  ['Frmula', 'Fórmula'], ['Tenso', 'Tensão'], ['Segurana', 'Segurança'],
  ['Distncia', 'Distância'], ['Sada', 'Saída'], ['Barra slida', 'Barra sólida'],
  ['Fora de', 'Força de'], ['Msula', 'Ménsula'], ['Deflexo', 'Deflexão'],
  ['Disponveis', 'Disponíveis'], ['Mdulo', 'Módulo'], ['p. Paroi', 'ép. Paroi'],
  ['Calcule', 'Calculée'], ['Quantit', 'Quantité'], ['Razo', 'Razão'],
  ['Paramtres de', 'Paramètres de'],
];
{
  let dict = fs.readFileSync(path.join(ROOT, 'src/locales/dictionary.ts'), 'utf8');
  for (const [a, b] of ENCODING) dict = dict.split(a).join(b);
  // insert ko/ar into t() calls
  dict = dict.replace(/t\(\{([\s\S]*?)\}\)/g, (full, body) => {
    const enM = body.match(/en:\s*"((?:\\.|[^"])*)"/);
    if (!enM) return full;
    const en = enM[1];
    const hasKo = /\bko\s*:/.test(body);
    const hasAr = /\bar\s*:/.test(body);
    if (hasKo && hasAr) return full;
    let extra = '';
    if (!hasKo) extra += `, ko: ${JSON.stringify(tx(en, 'ko'))}`;
    if (!hasAr) extra += `, ar: ${JSON.stringify(tx(en, 'ar'))}`;
    return `t({${body}${extra}})`;
  });
  fs.writeFileSync(path.join(ROOT, 'src/locales/dictionary.ts'), dict);
  console.log('patched dictionary.ts encoding + ko/ar');
}

// 2. Merge missing keys into locale TS files
const missing = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/i18n-complete/_locale_ts_missing.json'), 'utf8'));
for (const lang of Object.keys(missing)) {
  if (lang === 'tr') continue;
  const file = path.join(ROOT, `src/locales/${lang}.ts`);
  const src = fs.readFileSync(file, 'utf8');
  let obj;
  try {
    obj = loadLocaleTs(src);
  } catch (e) {
    console.error('parse fail', lang, e.message);
    continue;
  }
  const miss = missing[lang];
  let n = 0;
  for (const [k, enVal] of Object.entries(miss)) {
    const translated = typeof enVal === 'string' ? tx(enVal, lang) : enVal;
    setPath(obj, k, translated);
    n++;
  }
  const out = `export default ${toTs(obj)} as const;\n`;
  fs.writeFileSync(file, out);
  console.log('rewrote locale', lang, 'added', n);
}

// 3. Sidebar item labels — fill missing langs from English
{
  const file = path.join(ROOT, 'src/locales/sidebarTranslations.ts');
  let src = fs.readFileSync(file, 'utf8');
  // We'll reconstruct SIDEBAR_ITEM_LABELS programmatically by evaluating... skip, patch via regex per block is fragile.
  // Instead import-time: rewrite the object using a small generated file section.
  // Parse item blocks:
  const blockRe = /'([^']+)':\s*\{([^}]+)\}/g;
  src = src.replace(blockRe, (full, id, inner) => {
    if (!inner.includes('en:')) return full;
    const get = (lang) => {
      const m = inner.match(new RegExp(`${lang}:\\s*'((?:\\\\.|[^'])*)'`))
        || inner.match(new RegExp(`${lang}:\\s*"((?:\\\\.|[^"])*)"`));
      return m ? m[1] : null;
    };
    const en = get('en');
    if (!en) return full;
    const langs = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
    const lines = langs.map((l) => {
      const existing = get(l);
      const val = existing || (l === 'tr' ? existing : tx(en, l === 'en' ? 'en' : l));
      const final = existing || (l === 'en' ? en : (l === 'tr' ? (get('tr') || en) : tx(en, l)));
      return `    ${l}: ${JSON.stringify(final)},`;
    });
    return `'${id}': {\n${lines.join('\n')}\n  }`;
  });
  fs.writeFileSync(file, src);
  console.log('patched sidebar item labels');
}

console.log('apply-rest done');
