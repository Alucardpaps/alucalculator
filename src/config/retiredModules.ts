/**
 * Off-topic, toy, duplicate, or fake-AI solvers removed from the product nav.
 * Old URLs still resolve: [module] pages and _redirects send visitors to a real tool.
 */
export const RETIRED_MODULE_REDIRECTS: Record<string, string> = {
  'biology-genetics': '/periodic-table/',
  'cs-algorithms': '/calculator/',
  'chemistry-reactions': '/periodic-table/',
  'chemistry-solver': '/periodic-table/',
  'digital-logic': '/ohms-law/',
  'physics-solver': '/calculator/',
  'physics-kinematics': '/calculator/',
  'kinematics': '/calculator/',
  'wind-tunnel': '/fluid-dynamics/',
  'aerospace-dynamics': '/fluid-dynamics/',
  'aerospace': '/fluid-dynamics/',
  'failure-prediction': '/fatigue-analysis/',
  'failure-diagnosis': '/fatigue-analysis/',
  'material-selector-ai': '/materials-db/',
  'materials-explorer': '/materials-db/',
  'welding-fillet': '/welding/',
  'holographic-viewer': '/design-studio/',
  'matrix-screensaver': '/',
  'parametric-cad': '/design-studio/',
  'stem-codex': '/periodic-table/',
  'split-cad': '/cad-editor/',
};

/** Hidden from Lite hub even if they remain in the OS registry. */
export const HIDDEN_LITE_TYPES = new Set<string>([
  ...Object.keys(RETIRED_MODULE_REDIRECTS),
  'settings',
  'terminal',
  'browser',
  'media-player',
  'image-viewer',
  'pdf-viewer',
  'spreadsheet-viewer',
  'file-explorer',
  'project-manager',
  'project-vault',
  'paint',
  'ai-copilot',
  'engineering-notes',
  'manufacturing-sandbox',
  'manufacturing-readiness',
  'engineering-selection',
  'mfg-sandbox',
  'mfg-readiness',
  'fatigue-advanced',
  'simulation-fea',
  'gears-bearings',
]);
