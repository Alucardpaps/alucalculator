/**
 * AluCAD OS — Global Application Constants & Single Source of Truth
 * 
 * CANONICAL REGISTRY INTEGRATION:
 * - APP_VERSION: Web application semantic version
 * - APP_APK_VERSION: Android & Wear OS APK release version
 * - APP_MODULE_COUNT: Bound to canonical solverCount from calculatorRegistry.ts (Single Source of Truth)
 * - APP_FIELD_TOOL_COUNT: Bound to canonical fieldToolCount from calculatorRegistry.ts
 * - APP_ACADEMY_UNIT_COUNT: Bound to canonical academyUnitCount from calculatorRegistry.ts
 */

import pkg from '../../package.json';
import {
  solverCount,
  fieldToolCount,
  academyUnitCount,
} from '@/lib/registry/calculatorRegistry';

export const APP_VERSION = pkg.version;
export const APP_MAJOR_MINOR = pkg.version.split('.').slice(0, 2).join('.');
export const APP_APK_VERSION = APP_MAJOR_MINOR;
export const APP_RELEASE_NAME = `AluCAD OS v${APP_MAJOR_MINOR}`;
export const APP_MODULE_COUNT = solverCount;
export const APP_FIELD_TOOL_COUNT = fieldToolCount;
export const APP_ACADEMY_UNIT_COUNT = academyUnitCount;
export const APP_KERNEL_SOLVER_COUNT = 58; // Internal kernel reference, do not use in marketing

export {
  CANONICAL_TOOL_COUNT,
  CANONICAL_FIELD_TOOL_COUNT,
  CANONICAL_ACADEMY_UNIT_COUNT,
} from '@/data/canonicalInventory';
