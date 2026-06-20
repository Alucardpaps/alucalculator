'use client';

import { useI18nStore } from '@/store/i18nStore';
import { getAcademyPage } from '@/locales/academyPageTranslations';

export function AcademyArticleNotFound() {
  const { language } = useI18nStore();
  const t = getAcademyPage(language);

  return (
    <div className="min-h-screen bg-transparent text-slate-200 flex items-center justify-center">
      {t.articleNotFound}
    </div>
  );
}
