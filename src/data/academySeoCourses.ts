import calculatorsData from '@/data/seo-calculators/calculators.json';
import { SEOCalculatorData } from '@/components/os/SEOPage';
import { CALCULATOR_HUB_MODULES } from '@/data/calculatorHubData';
import { ACADEMY_CALCULATOR_ROUTES } from '@/data/academyCalculatorRoutes';
import type { AcademyCourse, AcademyDepartment } from '@/locales/academyPageTranslations';
import { localizeCourseTitle } from '@/locales/academyLessonI18n';
import type { Language } from '@/store/i18nStore';

/** SEO guide slugs already covered by a full academy lesson + calculator route. */
const SEO_SLUGS_COVERED_BY_LESSONS = new Set(
  Object.values(ACADEMY_CALCULATOR_ROUTES)
    .map((route) => {
      const match = route.href.match(/\/calculators\/(.+)$/);
      return match?.[1] ?? null;
    })
    .filter((slug): slug is string => Boolean(slug)),
);

const CATEGORY_TO_DEPARTMENT: Record<string, AcademyDepartment['id']> = {
  mechanical: 'Design',
  structural: 'Structural',
  structures: 'Structural',
  civil: 'Structural',
  aerospace: 'Structural',
  fluid: 'Structural',
  fluids: 'Structural',
  manufacturing: 'Manufacturing',
  electrical: 'Design',
  science: 'Physics',
  thermal: 'Physics',
  fasteners: 'Design',
};

const CATEGORY_REF: Record<string, string> = {
  mechanical: 'Mechanical Engineering Handbook',
  structural: 'AISC / Roark Reference',
  structures: 'AISC / Roark Reference',
  civil: 'ACI / Civil Structures',
  aerospace: 'Aerospace Design Guide',
  fluid: 'Fluid Mechanics Reference',
  fluids: 'Fluid Mechanics Reference',
  manufacturing: 'ISO Manufacturing Standards',
  electrical: 'IEEE Electrical Reference',
  science: 'Applied Science Handbook',
  thermal: 'Heat Transfer Reference',
  fasteners: 'VDI / ISO Fastener Standards',
};

function cleanSeoTitle(title: string): string {
  return title
    .replace(/\s*&\s*Engineering Guide\s*-\s*AluCalc\s*$/i, '')
    .replace(/\s*Calculator\s*$/i, '')
    .trim();
}

function yearForCategory(category: string | undefined): number {
  switch (category?.toLowerCase()) {
    case 'science':
    case 'electrical':
      return 1;
    case 'manufacturing':
    case 'fasteners':
      return 3;
    case 'structural':
    case 'structures':
    case 'civil':
    case 'aerospace':
    case 'fluid':
    case 'fluids':
      return 2;
    default:
      return 2;
  }
}

function getKnowledgeBaseCalculators(): SEOCalculatorData[] {
  const workspacePaths = new Set(CALCULATOR_HUB_MODULES.map((m) => m.path));

  return (calculatorsData as unknown as SEOCalculatorData[])
    .filter((c) => c.category !== ('utilities' as string))
    .filter((c) => {
      const workspaceLink =
        (c as { cta?: { link?: string }; link?: string }).cta?.link
        ?? (c as { link?: string }).link;
      if (workspaceLink && workspacePaths.has(workspaceLink)) return false;
      if (SEO_SLUGS_COVERED_BY_LESSONS.has(c.slug)) return false;
      return true;
    });
}

export function seoCalculatorToCourse(calc: SEOCalculatorData): AcademyCourse {
  const category = calc.category?.toLowerCase() ?? 'mechanical';
  return {
    slug: calc.slug,
    title: cleanSeoTitle(calc.title ?? calc.slug),
    year: yearForCategory(category),
    ref: CATEGORY_REF[category] ?? 'AluCalc Engineering Guide',
    kind: 'guide',
    category,
  };
}

export function getSeoGuideCourses(): AcademyCourse[] {
  return getKnowledgeBaseCalculators().map(seoCalculatorToCourse);
}

export function mergeSeoGuidesIntoDepartments(
  departments: AcademyDepartment[],
  locale: Language = 'en',
): AcademyDepartment[] {
  const existingSlugs = new Set(departments.flatMap((d) => d.courses.map((c) => c.slug)));
  const additions = new Map<string, AcademyCourse[]>();

  for (const course of getSeoGuideCourses()) {
    if (existingSlugs.has(course.slug)) continue;
    const deptId = CATEGORY_TO_DEPARTMENT[course.category ?? ''] ?? 'Physics';
    const list = additions.get(deptId) ?? [];
    list.push({
      ...course,
      title: localizeCourseTitle(course.slug, course.title, locale),
    });
    additions.set(deptId, list);
  }

  return departments.map((dept) => {
    const extra = additions.get(dept.id) ?? [];
    if (extra.length === 0) return dept;
    return {
      ...dept,
      courses: [...dept.courses, ...extra.sort((a, b) => a.title.localeCompare(b.title))],
    };
  });
}

export function getSeoGuideCount(): number {
  return getSeoGuideCourses().length;
}
