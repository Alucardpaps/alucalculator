/**
 * Wires generated locale getters into components (removes inline LOCAL_DICTS).
 * Run: node scripts/wire-local-dicts-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const WIRES = [
  {
    file: 'src/components/calculators/PlanetaryCalculator.tsx',
    importLine: "import { getPlanetaryCalculatorStrings } from '@/locales/planetaryCalculatorTranslations';",
    getter: 'getPlanetaryCalculatorStrings',
  },
  {
    file: 'src/modules/science/PhysicsKinematics/index.tsx',
    importLine: "import { getPhysicsKinematicsStrings } from '@/locales/physicsKinematicsTranslations';",
    getter: 'getPhysicsKinematicsStrings',
  },
  {
    file: 'src/modules/automation/DigitalLogic/index.tsx',
    importLine: "import { getDigitalLogicStrings } from '@/locales/digitalLogicTranslations';",
    getter: 'getDigitalLogicStrings',
  },
  {
    file: 'src/modules/finance/RealTimeCost/index.tsx',
    importLine: "import { getRealTimeCostStrings } from '@/locales/realTimeCostTranslations';",
    getter: 'getRealTimeCostStrings',
  },
  {
    file: 'src/components/modules/mechanical/SimulationFEAModule.tsx',
    importLine: "import { getSimulationFeaStrings } from '@/locales/simulationFeaTranslations';",
    getter: 'getSimulationFeaStrings',
  },
  {
    file: 'src/components/modules/mechanical/MachiningDetailsModule.tsx',
    importLine: "import { getMachiningDetailsStrings } from '@/locales/machiningDetailsTranslations';",
    getter: 'getMachiningDetailsStrings',
  },
  {
    file: 'src/components/modules/mechanical/BearingsModule.tsx',
    importLine: "import { getBearingsModuleUiStrings } from '@/locales/bearingsModuleUiTranslations';",
    getter: 'getBearingsModuleUiStrings',
  },
  {
    file: 'src/components/modules/mechanical/FastenersModule.tsx',
    importLine: "import { getFastenersModuleUiStrings } from '@/locales/fastenersModuleUiTranslations';",
    getter: 'getFastenersModuleUiStrings',
  },
  {
    file: 'src/components/modules/mechanical/FastenerAssemblyModule.tsx',
    importLine: "import { getFastenerAssemblyStrings, formatIntegrityPassDesc } from '@/locales/fastenerAssemblyUiTranslations';",
    getter: 'getFastenerAssemblyStrings',
    removeImports: ["import { getFastenerAssemblyModuleStrings } from '@/locales/fastenerAssemblyModuleTranslations';"],
    replaceLines: [
      [/const fa = getFastenerAssemblyModuleStrings\(language\);\s*\n\s*const t = LOCAL_DICTS\[language\] \|\| LOCAL_DICTS\.en;/,
        'const t = getFastenerAssemblyStrings(language);'],
      [/fa\.(\w+)/g, 't.$1'],
    ],
  },
];

function removeLocalDictsBlock(src) {
  const marker = 'const LOCAL_DICTS';
  const start = src.indexOf(marker);
  if (start < 0) return src;
  const eq = src.indexOf('=', start);
  const open = src.indexOf('{', eq);
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  let tail = end;
  if (src[tail] === ';') tail++;
  while (src[tail] === '\n') tail++;
  return src.slice(0, start) + src.slice(tail);
}

for (const wire of WIRES) {
  const filePath = path.join(ROOT, wire.file);
  let src = fs.readFileSync(filePath, 'utf8');

  if (!src.includes(wire.importLine)) {
    const useClientMatch = src.match(/^(['"])use client\1;?\s*\n/);
    if (useClientMatch) {
      const directive = useClientMatch[0];
      src = directive + `${wire.importLine}\n` + src.slice(directive.length);
    } else {
      const storeImport = "import { useI18nStore } from '@/store/i18nStore';";
      if (src.includes(storeImport)) {
        src = src.replace(storeImport, `${storeImport}\n${wire.importLine}`);
      } else {
        src = `${wire.importLine}\n${src}`;
      }
    }
  }

  for (const rem of wire.removeImports ?? []) {
    src = src.replace(rem + '\n', '').replace(rem, '');
  }

  src = src.replace(
    /const t = LOCAL_DICTS\[language\] \|\| LOCAL_DICTS\.en;/g,
    `const t = ${wire.getter}(language);`,
  );

  for (const [re, rep] of wire.replaceLines ?? []) {
    src = src.replace(re, rep);
  }

  src = removeLocalDictsBlock(src);
  fs.writeFileSync(filePath, src, 'utf8');
  console.log('Wired', wire.file);
}
