import { describe, it, expect } from 'vitest';
import { detectAegisCadIntent } from '@/lib/ai/aegisIntent';

describe('AeGiS intent router', () => {
  it('explicit commands win', () => {
    expect(detectAegisCadIntent('/3d NEMA 23 plaka 8mm')).toMatchObject({ target: '3d', prompt: 'NEMA 23 plaka 8mm', reason: 'command' });
    expect(detectAegisCadIntent('/2b DN50 flanş')).toMatchObject({ target: '2d', prompt: 'DN50 flanş' });
    expect(detectAegisCadIntent('/akış cıvata ön yük zinciri')).toMatchObject({ target: 'flow' });
    expect(detectAegisCadIntent('/3d   ')).toBeNull();
  });
  it('keywords pick the generator', () => {
    expect(detectAegisCadIntent('DN50 PN16 flanşın teknik resmini çiz')?.target).toBe('2d');
    expect(detectAegisCadIntent('M12 cıvata için hesap akışı oluştur')?.target).toBe('flow');
    expect(detectAegisCadIntent('80x80 L braket 3D modelle')?.target).toBe('3d');
    expect(detectAegisCadIntent('Draw a 2D sketch of a bracket')?.target).toBe('2d');
  });
  it('geometry + verb uses the current page, else 3D', () => {
    expect(detectAegisCadIntent('100x60 plaka tasarla', '/cad-editor/')?.target).toBe('2d');
    expect(detectAegisCadIntent('100x60 plaka tasarla', '/')?.target).toBe('3d');
  });
  it('plain questions stay in chat', () => {
    expect(detectAegisCadIntent('ISO 281 L10h rulman ömrü hesabı nasıl yapılır?')).toBeNull();
    expect(detectAegisCadIntent('6061-T6 akma dayanımı nedir?')).toBeNull();
    expect(detectAegisCadIntent('merhaba')).toBeNull();
  });
});
