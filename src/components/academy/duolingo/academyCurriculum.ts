import { DUOLINGO_UNITS as RAW_UNITS } from './DuolingoCurriculumData';
import { enrichCurriculum } from './academyLessonPack';
import { hydrateTree } from '@/locales/hydrateLocalized';

export const DUOLINGO_UNITS = enrichCurriculum(RAW_UNITS);
hydrateTree(DUOLINGO_UNITS);
