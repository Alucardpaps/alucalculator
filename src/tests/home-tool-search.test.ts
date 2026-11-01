import { describe, expect, it } from 'vitest';
import { foldText, searchTools } from '@/lib/search/toolSearch';

describe('home ask box — tool search', () => {
  it('folds Turkish characters and punctuation', () => {
    expect(foldText('Cıvata ÖN YÜKÜ / Şaft-Çapı')).toBe('civata on yuku   saft capi');
    expect(foldText('İç çap')).toBe('ic cap');
  });

  it('understands engineering shorthand', () => {
    expect(searchTools('M12')[0]?.route).toBe('/bolt-torque/');
    expect(searchTools('m12 cıvata torku')[0]?.route).toBe('/bolt-torque/');
    expect(searchTools('6205 rulman ömrü')[0]?.route).toBe('/bearings/');
    expect(searchTools('H7/g6')[0]?.route).toBe('/fits/');
  });

  it('finds tools by Turkish or English words', () => {
    expect(searchTools('kiriş sehimi').map((h) => h.route)).toContain('/beam-deflection/');
    expect(searchTools('weld').map((h) => h.route)).toContain('/welding/');
  });

  it('returns nothing for unrelated text or stop-words only', () => {
    expect(searchTools('kuantum dolanıklığı')).toEqual([]);
    expect(searchTools('ve için nasıl')).toEqual([]);
    expect(searchTools('   ')).toEqual([]);
  });

  it('returns at most five routes, all with a trailing slash', () => {
    const hits = searchTools('steel shaft gear bolt bearing');
    expect(hits.length).toBeLessThanOrEqual(5);
    for (const h of hits) expect(h.route.endsWith('/')).toBe(true);
  });
});
