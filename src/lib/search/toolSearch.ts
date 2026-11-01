/**
 * Quick tool search for the home ask box.
 *
 * Matches a free-text query against the canonical tool inventory: Turkish-insensitive
 * folding (ı/i, ş/s, …), a few stop-words, and engineering shorthand that people type
 * instead of the tool's name ("M12" → bolt, "6205" → bearing, "H7" → fits).
 */

import { CANONICAL_TOOLS } from '@/data/canonicalInventory';

/** lower-case, Turkish-insensitive, punctuation → spaces */
export function foldText(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9.\s]/g, ' ');
}

const STOPWORDS = new Set([
  've', 'ile', 'icin', 'bir', 'nedir', 'nasil', 'kac', 'hesap', 'hesabi', 'hesapla', 'hesaplama',
  'the', 'and', 'for', 'of', 'to', 'in', 'what', 'how', 'calc', 'calculate', 'calculator', 'calculation',
]);

export interface ToolHit {
  route: string;
  titleEn: string;
  titleTr: string;
  standard?: string;
  score: number;
}

const INDEX = CANONICAL_TOOLS.map((t) => ({
  route: t.route.endsWith('/') ? t.route : `${t.route}/`,
  titleEn: t.titleEn,
  titleTr: t.titleTr,
  standard: t.standards?.[0],
  title: foldText(`${t.titleEn} ${t.titleTr}`),
  hay: foldText(`${t.titleEn} ${t.titleTr} ${(t.standards ?? []).join(' ')} ${(t.keywords ?? []).join(' ')} ${t.id}`),
}));

/** engineering shorthand → the word the inventory uses */
function expand(token: string): string[] {
  if (/^m\d{1,2}$/.test(token)) return [token, 'bolt']; // M12
  if (/^6[0-4]\d\d$/.test(token)) return [token, 'bearing']; // 6205
  if (/^[a-z]{1,2}\d{1,2}$/.test(token)) return [token, 'fits']; // H7, g6
  return [token];
}

/** best matching tools (at most `limit`), strongest first; [] when nothing matches */
export function searchTools(query: string, limit = 5): ToolHit[] {
  const tokens = foldText(query)
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .flatMap(expand);
  if (!tokens.length) return [];
  const hits: ToolHit[] = [];
  for (const t of INDEX) {
    let score = 0;
    for (const tok of tokens) {
      if (t.title.includes(tok)) score += 3;
      else if (t.hay.includes(tok)) score += 1;
    }
    if (score > 0) hits.push({ route: t.route, titleEn: t.titleEn, titleTr: t.titleTr, standard: t.standard, score });
  }
  return hits.sort((a, b) => b.score - a.score || a.titleEn.length - b.titleEn.length).slice(0, limit);
}
