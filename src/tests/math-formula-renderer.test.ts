import { describe, it, expect } from 'vitest';
import katex from 'katex';

describe('KaTeX Mathematical Formula Rendering', () => {
  it('renders Unit 1 SI conversion formula into beautiful math HTML', () => {
    const rawFormula = '1 \\text{ MPa} = 1 \\frac{\\text{N}}{\\text{mm}^2} = 10^6 \\text{ Pa}';
    const html = katex.renderToString(rawFormula, { displayMode: true, throwOnError: false });
    expect(html).toContain('katex');
    expect(html).toContain('frac');
    expect(html).toContain('MPa');
    expect(html).toContain('mm');
  });

  it('renders beam bending stress formula sigma = M * y / I', () => {
    const raw = '\\sigma_{max} = \\frac{M \\cdot y}{I_x}';
    const html = katex.renderToString(raw, { displayMode: true, throwOnError: false });
    expect(html).toContain('katex');
    expect(html).toContain('sigma');
  });

  it('renders Euler column buckling formula F_crit = pi^2 * E * I / L^2', () => {
    const raw = 'F_{crit} = \\frac{\\pi^2 \\cdot E \\cdot I}{L_k^2}';
    const html = katex.renderToString(raw, { displayMode: true, throwOnError: false });
    expect(html).toContain('katex');
    expect(html).toContain('pi');
  });
});
