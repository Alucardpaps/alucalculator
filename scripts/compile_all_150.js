const fs = require('fs');
const path = require('path');

const units1to3 = require('./units_1_to_3');
const units4to6 = require('./units_4_to_6');
const units7to10 = require('./units_7_to_10');

const allUnitsRaw = [...units1to3, ...units4to6, ...units7to10];

console.log(`Loaded total units: ${allUnitsRaw.length}`);

// Convert raw structure to typed structure matching DuolingoCurriculumData.ts
const transformedUnits = allUnitsRaw.map(u => {
  return {
    id: u.id,
    number: u.num,
    title: {
      tr: u.titleTr, en: u.titleEn,
      de: u.titleEn, es: u.titleEn, fr: u.titleEn, it: u.titleEn,
      pt: u.titleEn, ru: u.titleEn, zh: u.titleEn, ja: u.titleEn,
      ko: u.titleEn, ar: u.titleEn
    },
    description: {
      tr: u.descTr, en: u.descEn,
      de: u.descEn, es: u.descEn, fr: u.descEn, it: u.descEn,
      pt: u.descEn, ru: u.descEn, zh: u.descEn, ja: u.descEn,
      ko: u.descEn, ar: u.descEn
    },
    gradient: u.gradient,
    accentColor: u.accentColor,
    difficulty: u.difficulty,
    lessons: u.lessons.map(l => {
      // Build steps
      const steps = [];

      // Step 1: Concept
      steps.push({
        id: `step-${l.num}-c`,
        type: 'concept',
        conceptData: {
          title: { tr: l.tTr, en: l.tEn, de: l.tEn, es: l.tEn, fr: l.tEn, it: l.tEn, pt: l.tEn, ru: l.tEn, zh: l.tEn, ja: l.tEn, ko: l.tEn, ar: l.tEn },
          explanation: { tr: l.cTr, en: l.cEn, de: l.cEn, es: l.cEn, fr: l.cEn, it: l.cEn, pt: l.cEn, ru: l.cEn, zh: l.cEn, ja: l.cEn, ko: l.cEn, ar: l.cEn },
          formula: l.f,
          keyTakeaways: [
            { tr: `${l.std} standartlarına uygun analiz ve formülasyon.`, en: `Standard formulation compliant with ${l.std}.`, de: `Standard formulation compliant with ${l.std}.`, es: `Standard formulation compliant with ${l.std}.`, fr: `Standard formulation compliant with ${l.std}.`, it: `Standard formulation compliant with ${l.std}.`, pt: `Standard formulation compliant with ${l.std}.`, ru: `Standard formulation compliant with ${l.std}.`, zh: `Standard formulation compliant with ${l.std}.`, ja: `Standard formulation compliant with ${l.std}.`, ko: `Standard formulation compliant with ${l.std}.`, ar: `Standard formulation compliant with ${l.std}.` }
          ]
        }
      });

      // Step 2: Specific interactive question based on pType
      if (l.pType === 'drawing') {
        steps.push({
          id: `step-${l.num}-draw`,
          type: 'diagram_draw',
          diagramData: {
            prompt: { tr: l.dPromptTr, en: l.dPromptEn, de: l.dPromptEn, es: l.dPromptEn, fr: l.dPromptEn, it: l.dPromptEn, pt: l.dPromptEn, ru: l.dPromptEn, zh: l.dPromptEn, ja: l.dPromptEn, ko: l.dPromptEn, ar: l.dPromptEn },
            vectorOptions: l.vOpts.map(v => ({
              id: v.id,
              label: { tr: v.labelTr, en: v.labelEn, de: v.labelEn, es: v.labelEn, fr: v.labelEn, it: v.labelEn, pt: v.labelEn, ru: v.labelEn, zh: v.labelEn, ja: v.labelEn, ko: v.labelEn, ar: v.labelEn },
              direction: v.direction,
              isCorrect: v.isCorrect
            })),
            explanation: { tr: l.expTr, en: l.expEn, de: l.expEn, es: l.expEn, fr: l.expEn, it: l.expEn, pt: l.expEn, ru: l.expEn, zh: l.expEn, ja: l.expEn, ko: l.expEn, ar: l.expEn }
          }
        });
      } else if (l.pType === 'calculation') {
        steps.push({
          id: `step-${l.num}-calc`,
          type: 'calculation_input',
          calculationData: {
            prompt: { tr: l.calcPTr, en: l.calcPEn, de: l.calcPEn, es: l.calcPEn, fr: l.calcPEn, it: l.calcPEn, pt: l.calcPEn, ru: l.calcPEn, zh: l.calcPEn, ja: l.calcPEn, ko: l.calcPEn, ar: l.calcPEn },
            targetValue: l.tVal,
            tolerance: l.tol,
            unit: l.u,
            formulaHint: l.fHint,
            stepByStepSolution: { tr: l.calcExpTr, en: l.calcExpEn, de: l.calcExpEn, es: l.calcExpEn, fr: l.calcExpEn, it: l.calcExpEn, pt: l.calcExpEn, ru: l.calcExpEn, zh: l.calcExpEn, ja: l.calcExpEn, ko: l.calcExpEn, ar: l.calcExpEn }
          }
        });
      } else if (l.pType === 'visual') {
        steps.push({
          id: `step-${l.num}-vis`,
          type: 'visual_select',
          visualData: {
            prompt: { tr: l.visPTr, en: l.visPEn, de: l.visPEn, es: l.visPEn, fr: l.visPEn, it: l.visPEn, pt: l.visPEn, ru: l.visPEn, zh: l.visPEn, ja: l.visPEn, ko: l.visPEn, ar: l.visPEn },
            cards: l.visCards.map(c => ({
              id: c.id,
              title: { tr: c.titleTr, en: c.titleEn, de: c.titleEn, es: c.titleEn, fr: c.titleEn, it: c.titleEn, pt: c.titleEn, ru: c.titleEn, zh: c.titleEn, ja: c.titleEn, ko: c.titleEn, ar: c.titleEn },
              description: { tr: c.descTr, en: c.descEn, de: c.descEn, es: c.descEn, fr: c.descEn, it: c.descEn, pt: c.descEn, ru: c.descEn, zh: c.descEn, ja: c.descEn, ko: c.descEn, ar: c.descEn },
              diagramSvgType: c.diagramSvgType,
              isCorrect: c.isCorrect
            })),
            explanation: { tr: l.expTr, en: l.expEn, de: l.expEn, es: l.expEn, fr: l.expEn, it: l.expEn, pt: l.expEn, ru: l.expEn, zh: l.expEn, ja: l.expEn, ko: l.expEn, ar: l.expEn }
          }
        });
      } else {
        // Multiple choice / Boss
        steps.push({
          id: `step-${l.num}-q`,
          type: 'multiple_choice',
          questionData: {
            question: { tr: l.qTr, en: l.qEn, de: l.qEn, es: l.qEn, fr: l.qEn, it: l.qEn, pt: l.qEn, ru: l.qEn, zh: l.qEn, ja: l.qEn, ko: l.qEn, ar: l.qEn },
            options: l.oTr.map((trText, idx) => ({
              tr: trText, en: l.oEn[idx] || trText, de: l.oEn[idx] || trText, es: l.oEn[idx] || trText,
              fr: l.oEn[idx] || trText, it: l.oEn[idx] || trText, pt: l.oEn[idx] || trText, ru: l.oEn[idx] || trText,
              zh: l.oEn[idx] || trText, ja: l.oEn[idx] || trText, ko: l.oEn[idx] || trText, ar: l.oEn[idx] || trText
            })),
            correctIndex: l.cIdx,
            explanation: { tr: l.expTr, en: l.expEn, de: l.expEn, es: l.expEn, fr: l.expEn, it: l.expEn, pt: l.expEn, ru: l.expEn, zh: l.expEn, ja: l.expEn, ko: l.expEn, ar: l.expEn }
          }
        });
      }

      return {
        id: `sec-${l.num}`,
        number: l.num,
        slug: l.slug,
        title: { tr: l.tTr, en: l.tEn, de: l.tEn, es: l.tEn, fr: l.tEn, it: l.tEn, pt: l.tEn, ru: l.tEn, zh: l.tEn, ja: l.tEn, ko: l.tEn, ar: l.tEn },
        category: l.cat,
        standard: l.std,
        difficulty: l.diff,
        primaryType: l.pType,
        isBoss: !!l.isBoss,
        xpReward: l.isBoss ? 250 : 50,
        gemReward: l.isBoss ? 25 : 5,
        steps: steps
      };
    })
  };
});

let totalLessonsCount = 0;
transformedUnits.forEach(u => totalLessonsCount += u.lessons.length);
console.log(`Transformed ${transformedUnits.length} units with a total of ${totalLessonsCount} lessons.`);

const i18nDictionary = {
  startLesson: {
    tr: 'DERSİ BAŞLAT', en: 'START LESSON', de: 'LEKTION STARTEN', es: 'INICIAR LECCIÓN',
    fr: 'COMMENCER LA LEÇON', it: 'INIZIA LEZIONE', pt: 'INICIAR LIÇÃO', ru: 'НАЧАТЬ УРОК',
    zh: '开始课程', ja: 'レッスンを開始', ko: '수업 시작', ar: 'ابدأ الدرس'
  },
  lessonCompleted: {
    tr: 'TAMAMLANDI', en: 'COMPLETED', de: 'ABGESCHLOSSEN', es: 'COMPLETADO',
    fr: 'TERMINÉ', it: 'COMPLETATO', pt: 'CONCLUÍDO', ru: 'ЗАВЕРШЕНО',
    zh: '已完成', ja: '完了', ko: '완료됨', ar: 'مكتمل'
  },
  continue: {
    tr: 'DEVAM ET', en: 'CONTINUE', de: 'WEITER', es: 'CONTINUAR',
    fr: 'CONTINUER', it: 'CONTINUA', pt: 'CONTINUAR', ru: 'ПРОДОЛЖИТЬ',
    zh: '继续', ja: '続ける', ko: '계속하기', ar: 'استمر'
  },
  check: {
    tr: 'KONTROL ET', en: 'CHECK', de: 'PRÜFEN', es: 'COMPROBAR',
    fr: 'VÉRIFIER', it: 'VERIFICA', pt: 'VERIFICAR', ru: 'ПРОВЕРИТЬ',
    zh: '检查', ja: '確認する', ko: '확인하기', ar: 'تحقق'
  },
  correct: {
    tr: 'Mükemmel! Doğru Cevap', en: 'Brilliant! Correct Answer', de: 'Ausgezeichnet! Richtig',
    es: '¡Excelente! Respuesta Correcta', fr: 'Brillant ! Bonne réponse', it: 'Eccellente! Risposta Corretta',
    pt: 'Brilhante! Resposta Correta', ru: 'Отлично! Правильный ответ', zh: '太棒了！回答正确',
    ja: '素晴らしい！正解です', ko: '훌륭합니다! 정답입니다', ar: 'رائع! إجابة صحيحة'
  },
  incorrect: {
    tr: 'Yanlış! Bir Can Kaybettin', en: 'Incorrect! You lost a heart', de: 'Falsch! Ein Herz verloren',
    es: '¡Incorrecto! Perdiste un corazón', fr: 'Incorrect ! Vous avez perdu un cœur', it: 'Errato! Hai perso un cuore',
    pt: 'Incorreto! Você perdeu um coração', ru: 'Неверно! Вы потеряли жизнь', zh: '错误！你失去了一颗心',
    ja: '不正解！ハートを1つ失いました', ko: '오답입니다! 하트를 잃었습니다', ar: 'غير صحيح! لقد فقدت قلباً'
  },
  calculationHint: {
    tr: 'Formül İpucu:', en: 'Formula Hint:', de: 'Formel-Hinweis:', es: 'Pista de fórmula:',
    fr: 'Indice de formule :', it: 'Suggerimento formula:', pt: 'Dica de fórmula:', ru: 'Подсказка к формуле:',
    zh: '公式提示：', ja: '公式のヒント：', ko: '공식 힌트:', ar: 'تلميح الصيغة:'
  },
  enterNumericValue: {
    tr: 'Sayısal değeri giriniz...', en: 'Enter numerical value...', de: 'Numerischen Wert eingeben...',
    es: 'Introduce el valor numérico...', fr: 'Entrez la valeur numérique...', it: 'Inserisci il valor numerico...',
    pt: 'Insira o valor numérico...', ru: 'Введите числовое значение...', zh: '输入数值...',
    ja: '数値を入力してください...', ko: '수치 값을 입력하세요...', ar: 'أدخل القيمة الرقمية...'
  },
  selectDirection: {
    tr: 'Doğru Vektör Yönünü Seçiniz:', en: 'Select the Correct Vector Direction:', de: 'Wählen Sie die korrekte Vektorrichtung:',
    es: 'Seleccione la dirección correcta del vector:', fr: 'Sélectionnez la bonne direction du vecteur :',
    it: 'Seleziona la direzione corretta del vettore:', pt: 'Selecione a direção correta do vetor:',
    ru: 'Выберите правильное направление вектора:', zh: '选择正确的向量方向：', ja: '正しいベクトルの方向を選択してください：',
    ko: '올바른 벡터 방향을 선택하세요:', ar: 'حدد اتجاه المتجه الصحيح:'
  },
  selectVisualCard: {
    tr: 'Doğru Şematik Diyagram Kartını Seçiniz:', en: 'Select the Correct Schematic Diagram Card:',
    de: 'Wählen Sie das korrekte schematische Diagramm:', es: 'Seleccione la tarjeta de diagrama esquemático correcta:',
    fr: 'Sélectionnez la bonne carte de schéma :', it: 'Seleziona la scheda del diagramma schematico corretta:',
    pt: 'Selecione o cartão de diagrama esquemático correto:', ru: 'Выберите правильную схематическую карточку:',
    zh: '选择正确的原理图卡片：', ja: '正しい回路図カードを選択してください：', ko: '올바른 도식 다이어그램 카드를 선택하세요:',
    ar: 'حدد بطاقة المخطط التخطيطي الصحيحة:'
  },
  unitOverview: {
    tr: 'ÜNİTE GENEL BAKIŞ', en: 'UNIT OVERVIEW', de: 'EINHEITSÜBERSICHT', es: 'RESUMEN DE LA UNIDAD',
    fr: "APERÇU DE L'UNITÉ", it: "PANORAMICA DELL'UNITÀ", pt: 'VISÃO GERAL DA UNIDADE',
    ru: 'ОБЗОР РАЗДЕЛА', zh: '单元概览', ja: 'ユニットの概要', ko: '유닛 개요', ar: 'نظرة عامة على الوحدة'
  },
  jumpToUnit: {
    tr: 'Üniteye Git', en: 'Jump to Unit', de: 'Zur Einheit springen', es: 'Ir a la unidad',
    fr: "Aller à l'unité", it: "Vai all'unità", pt: 'Ir para a unidade', ru: 'Перейти к разделу',
    zh: '跳转至单元', ja: 'ユニットへ移動', ko: '유닛으로 이동', ar: 'الانتقال إلى الوحدة'
  },
  unit: {
    tr: 'Ünite', en: 'Unit', de: 'Einheit', es: 'Unidad', fr: 'Unité', it: 'Unità', pt: 'Unidade',
    ru: 'Раздел', zh: '单元', ja: 'ユニット', ko: '유닛', ar: 'الوحدة'
  },
  prevUnit: {
    tr: 'Önceki Ünite', en: 'Previous Unit', de: 'Vorherige Einheit', es: 'Unidad Anterior',
    fr: 'Unité Précédente', it: 'Unità Precedente', pt: 'Unidade Anterior', ru: 'Предыдущий раздел',
    zh: '上一单元', ja: '前のユニット', ko: '이전 유닛', ar: 'الوحدة السابقة'
  },
  nextUnit: {
    tr: 'Sonraki Ünite', en: 'Next Unit', de: 'Nächste Einheit', es: 'Siguiente Unidad',
    fr: 'Unité Suivante', it: 'Unità Successiva', pt: 'Próxima Unidade', ru: 'Следующий раздел',
    zh: '下一单元', ja: '次のユニット', ko: '다음 유닛', ar: 'الوحدة التالية'
  }
};

const fileContent = `/**
 * DuolingoCurriculumData.ts
 * 
 * High-rigor 150-Section Engineering Curriculum across 10 Master Units
 * Featuring 5 Interactive Modalities:
 * 1. calculation_input (🧮 Numerical Formula & Step-by-Step Solver)
 * 2. diagram_draw (✏️ FBD Vector & Reaction Direction Placement)
 * 3. visual_select (🖼️ Technical Diagram & Stress Field Selector)
 * 4. multiple_choice (⚡ Multi-choice test)
 * 5. boss (👑 Boss Battle Exam)
 * 
 * 12-Language Support: tr, en, de, es, fr, it, pt, ru, zh, ja, ko, ar
 */

export type SupportedLanguage = 'tr' | 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar';

export interface LocalizedString {
  tr: string;
  en: string;
  de: string;
  es: string;
  fr: string;
  it: string;
  pt: string;
  ru: string;
  zh: string;
  ja: string;
  ko: string;
  ar: string;
}

export type LessonPrimaryType = 'quiz' | 'calculation' | 'drawing' | 'visual' | 'boss' | 'concept';
export type LessonStepType = 'concept' | 'multiple_choice' | 'calculation_input' | 'diagram_draw' | 'visual_select' | 'match_pairs';

export interface DiagramVectorOption {
  id: string;
  label: LocalizedString;
  direction: 'up' | 'down' | 'left' | 'right' | 'cw' | 'ccw';
  isCorrect: boolean;
}

export interface VisualCard {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  diagramSvgType: 'stress_notch' | 'i_beam_stress' | 'roetscher_cone' | 'pitting_crack' | 'rect_beam_stress';
  isCorrect: boolean;
}

export interface LessonStep {
  id: string;
  type: LessonStepType;
  conceptData?: {
    title: LocalizedString;
    explanation: LocalizedString;
    formula?: string;
    keyTakeaways: LocalizedString[];
  };
  questionData?: {
    question: LocalizedString;
    options: LocalizedString[];
    correctIndex: number;
    explanation: LocalizedString;
  };
  calculationData?: {
    prompt: LocalizedString;
    targetValue: number;
    tolerance: number;
    unit: string;
    formulaHint?: string;
    stepByStepSolution: LocalizedString;
  };
  diagramData?: {
    prompt: LocalizedString;
    vectorOptions: DiagramVectorOption[];
    explanation: LocalizedString;
  };
  visualData?: {
    prompt: LocalizedString;
    cards: VisualCard[];
    explanation: LocalizedString;
  };
}

export interface CurriculumLesson {
  id: string;
  number: number;
  slug: string;
  title: LocalizedString;
  category: string;
  standard?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  primaryType: LessonPrimaryType;
  isBoss?: boolean;
  xpReward: number;
  gemReward: number;
  steps: LessonStep[];
}

export interface CurriculumUnit {
  id: string;
  number: number;
  title: LocalizedString;
  description: LocalizedString;
  gradient: string;
  accentColor: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  lessons: CurriculumLesson[];
}

export const DUOLINGO_UNITS: CurriculumUnit[] = ${JSON.stringify(transformedUnits, null, 2)};

export const DUOLINGO_I18N = ${JSON.stringify(i18nDictionary, null, 2)};
`;

const targetFile = path.join(__dirname, '../src/components/academy/duolingo/DuolingoCurriculumData.ts');
fs.writeFileSync(targetFile, fileContent, 'utf8');
console.log(`Successfully generated ${targetFile} with ${totalLessonsCount} lessons across ${transformedUnits.length} units!`);
