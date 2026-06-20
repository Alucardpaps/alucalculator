import fs from 'fs';
import path from 'path';

const dir = 'src/locales/academyLessonI18n/locales';
const langs = ['tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

for (const l of langs) {
  const constName = `${l.toUpperCase()}_BUNDLE`;
  const content = `import type { AcademyLessonLocaleBundle } from '../types';

export const ${constName}: AcademyLessonLocaleBundle = { lessons: {}, seoGuides: {}, walkthroughs: {}, quizzes: {} } as AcademyLessonLocaleBundle;
`;
  fs.writeFileSync(path.join(dir, `${l}.ts`), content, 'utf8');
}
console.log('stubs ok');
