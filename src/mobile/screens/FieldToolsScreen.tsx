'use client';

import { FieldToolsTab } from '@/components/os/mobile/FieldToolsTab';
import { getFieldToolsStrings } from '@/locales/fieldToolsTranslations';
import type { MobileStrings } from '@/locales/mobileTranslations';
import type { Language } from '@/store/i18nStore';

type Props = {
  m: MobileStrings;
  language: Language;
  triggerToast: (msg: string) => void;
};

export function FieldToolsScreen({ m, language, triggerToast }: Props) {
  const ft = getFieldToolsStrings(language);
  return (
    <div className="w-full h-full overflow-y-auto pb-10">
      <FieldToolsTab t={m} ft={ft} language={language} triggerToast={triggerToast} />
    </div>
  );
}
