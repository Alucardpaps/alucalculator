import { DUOLINGO_UNITS as RAW_UNITS } from './DuolingoCurriculumData';
import { enrichCurriculum } from './academyLessonPack';

export const DUOLINGO_UNITS = enrichCurriculum(RAW_UNITS);
