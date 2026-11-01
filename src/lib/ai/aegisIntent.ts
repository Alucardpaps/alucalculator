/**
 * AeGiS intent router — pure, deterministic (no I/O).
 *
 * Decides whether a chat message is a *generation* request that belongs to one of
 * the Text-to-CAD engines (3D solid, 2D drawing, Flow graph) or an ordinary
 * question for the chat engine. Both AeGiS surfaces (sidebar bubble and the main
 * panel) call this before anything else, so every entry point reaches the same
 * generators.
 *
 * Explicit commands always win:  /3d …, /2d …, /flow …   (also /3b, /2b, /akış)
 */

export type AegisCadTarget = '3d' | '2d' | 'flow';

export interface AegisCadIntent {
  target: AegisCadTarget;
  /** prompt forwarded to the generator (command prefix stripped) */
  prompt: string;
  /** how the target was chosen — shown to the user for transparency */
  reason: 'command' | 'keyword' | 'page';
}

/** Route that hosts each generator. */
export const AEGIS_CAD_ROUTES: Record<AegisCadTarget, string> = {
  '3d': '/design-studio/',
  '2d': '/cad-editor/',
  flow: '/flow/',
};

const norm = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

const COMMANDS: Array<[RegExp, AegisCadTarget]> = [
  [/^\/(3d|3b|solid|kati)\b\s*/i, '3d'],
  [/^\/(2d|2b|drawing|cizim|dxf)\b\s*/i, '2d'],
  [/^\/(flow|akis|graph)\b\s*/i, 'flow'],
];

/** verbs that mean "make something" (TR + EN, normalised) */
const MAKE_VERBS =
  /\b(ciz|cizer|cizin|cizebilir|tasarla|tasarlar|modelle|olustur|uret|yap(?:ar)?\s*(?:misin|misiniz)?|ciziver|generate|create|draw|design|model|sketch|build|make)\w*/;

const KW_FLOW =
  /\b(flow|akis|akisi|dugum|node|pipeline|hesap\s*hatti|hesaplama\s*zinciri|graph|graf)\w*/;
const KW_2D =
  /\b(2d|2b|teknik\s*res(?:i)?m|cizim|dxf|eskiz|kroki|sketch|drawing|kesit\s*gorunus|gorunus|plan)\w*/;
const KW_3D =
  /\b(3d|3b|kati\s*model|katı|solid|stl|step|stp|parca|montaj|govde|extrude)\w*/;
/** geometry nouns — a make-verb plus one of these is a CAD request */
const KW_GEOMETRY =
  /\b(plaka|flans|braket|mil|disli|kasnak|profil|kutu|kapak|burc|somun|civata|yatak|kizak|sase|kiris|boru|plate|flange|bracket|shaft|gear|pulley|housing|enclosure|bushing|bolt|nut|beam|tube|pipe|frame)\w*/;

function pageTarget(pathname: string): AegisCadTarget | null {
  const p = pathname.toLowerCase();
  if (p.startsWith('/design-studio') || p.startsWith('/parametric-cad')) return '3d';
  if (p.startsWith('/cad-editor') || p.startsWith('/sketch-pad') || p.startsWith('/split-cad')) return '2d';
  if (p.startsWith('/flow')) return 'flow';
  return null;
}

export function detectAegisCadIntent(text: string, pathname = '/'): AegisCadIntent | null {
  const raw = text.trim();
  if (!raw) return null;

  const nRaw = norm(raw); // same length as raw (1:1 letter mapping)
  for (const [re, target] of COMMANDS) {
    const m = nRaw.match(re);
    if (m) {
      const prompt = raw.slice(m[0].length).trim();
      return prompt ? { target, prompt, reason: 'command' } : null;
    }
  }

  const n = nRaw;
  // Questions about a topic ("how is … calculated?") are not generation requests.
  const isQuestion = /\?\s*$/.test(raw) && !MAKE_VERBS.test(n);
  if (isQuestion || !MAKE_VERBS.test(n)) return null;

  if (KW_FLOW.test(n)) return { target: 'flow', prompt: raw, reason: 'keyword' };
  if (KW_2D.test(n)) return { target: '2d', prompt: raw, reason: 'keyword' };
  if (KW_3D.test(n)) return { target: '3d', prompt: raw, reason: 'keyword' };

  if (KW_GEOMETRY.test(n)) {
    const page = pageTarget(pathname);
    return { target: page && page !== 'flow' ? page : '3d', prompt: raw, reason: page ? 'page' : 'keyword' };
  }
  return null;
}

export const AEGIS_CAD_LABELS: Record<AegisCadTarget, { tr: string; en: string }> = {
  '3d': { tr: '3D Text-to-CAD (katı model)', en: '3D Text-to-CAD (solid)' },
  '2d': { tr: '2D AI Teknik Resim', en: '2D AI Drafter' },
  flow: { tr: 'Flow AI Hesap Akışı', en: 'Flow AI calculation graph' },
};
