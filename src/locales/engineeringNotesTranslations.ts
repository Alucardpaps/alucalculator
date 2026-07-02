import type { Language } from '@/store/i18nStore';

export type EngineeringNotesStrings = {
  title: string;
  placeholder: string;
  addNote: string;
  noNotes: string;
};

const EN: EngineeringNotesStrings = {
  "title": "Engineering Scratchpad",
  "placeholder": "Enter calculation or note... (e.g. L-axis offset 45.2mm)",
  "addNote": "Add Note",
  "noNotes": "No saved notes."
} as EngineeringNotesStrings;

const TR: EngineeringNotesStrings = {
  "title": "Mühendislik Karalama Defteri",
  "placeholder": "Hesap veya not girin... (Örn: L ekseni offseti 45.2mm)",
  "addNote": "Not Ekle",
  "noNotes": "Kayıtlı not bulunmuyor."
} as EngineeringNotesStrings;

const DE: EngineeringNotesStrings = {
  "title": "Ingenieur-Notizblock",
  "placeholder": "Berechnung oder Notiz eingeben...",
  "addNote": "Notiz hinzufügen",
  "noNotes": "Keine gespeicherten Notizen."
} as EngineeringNotesStrings;

const ES: EngineeringNotesStrings = {
  "title": "Bloc de Notas de Ingeniería",
  "placeholder": "Ingrese cálculo o nota...",
  "addNote": "Añadir Nota",
  "noNotes": "No hay notas guardadas."
} as EngineeringNotesStrings;

const FR: EngineeringNotesStrings = {
  "title": "Bloc-notes Ingénierie",
  "placeholder": "Entrez un calcul ou une note...",
  "addNote": "Ajouter Note",
  "noNotes": "Aucune note enregistrée."
} as EngineeringNotesStrings;

const IT: EngineeringNotesStrings = {
  "title": "Blocco Note Ingegneria",
  "placeholder": "Inserisci calcolo o nota...",
  "addNote": "Aggiungi Nota",
  "noNotes": "Nessuna nota salvata."
} as EngineeringNotesStrings;

const PT: EngineeringNotesStrings = {
  "title": "Bloco de Notas de Engenharia",
  "placeholder": "Digite cálculo ou nota...",
  "addNote": "Adicionar Nota",
  "noNotes": "Nenhuma nota salva."
} as EngineeringNotesStrings;

const RU: EngineeringNotesStrings = {
  "title": "Инженерный Блокнот",
  "placeholder": "Введите расчёт или заметку...",
  "addNote": "Добавить Заметку",
  "noNotes": "Нет сохранённых заметок."
} as EngineeringNotesStrings;

const JA: EngineeringNotesStrings = {
  "title": "エンジニアリングメモ",
  "placeholder": "計算またはメモを入力...",
  "addNote": "メモ追加",
  "noNotes": "保存されたメモはありません。"
} as EngineeringNotesStrings;

const ZH: EngineeringNotesStrings = {
  "title": "工程草稿本",
  "placeholder": "输入计算或备注...",
  "addNote": "添加备注",
  "noNotes": "没有已保存的备注。"
} as EngineeringNotesStrings;

const KO: EngineeringNotesStrings = {
  "title": "엔지니어링 스크래치패드",
  "placeholder": "계산 또는 메모 입력...",
  "addNote": "메모 추가",
  "noNotes": "저장된 메모가 없습니다."
} as EngineeringNotesStrings;

const AR: EngineeringNotesStrings = {
  "title": "مفكرة الهندسة",
  "placeholder": "أدخل حساباً أو ملاحظة...",
  "addNote": "إضافة ملاحظة",
  "noNotes": "لا توجد ملاحظات محفوظة."
} as EngineeringNotesStrings;

const BY_LOCALE: Record<Language, EngineeringNotesStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getEngineeringNotesStrings(locale: string): EngineeringNotesStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
