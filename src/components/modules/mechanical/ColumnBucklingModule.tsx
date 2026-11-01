'use client';
/**
 * Column buckling — EN 1993-1-1 §6.3.1, AISC 360-16 E3, Euler, Tetmajer, Johnson.
 * Math lives in src/lib/structural/columnBuckling.ts (pure, tested in src/tests/column-buckling-engine.test.ts).
 */
import React, { useMemo, useState } from 'react';
import { AlignVerticalSpaceAround } from 'lucide-react';
import { SmartInputField, SafetyMarginBar } from '@/components/calculator-kit';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import {
  CURVE_ALPHA, K_DESIGN, K_THEORY, computeColumnBuckling,
  type BucklingCurve, type EndCondition, type SectionKind,
} from '@/lib/structural/columnBuckling';
import { BucklingChart, ColumnDiagram, SectionSketch } from './column/ColumnBucklingViz';

export type { BucklingCurve } from '@/lib/structural/columnBuckling';

type MaterialId = 'S235' | 'S275' | 'S355' | 'S460' | 'AL6061' | 'AL6082' | 'custom';
const MATERIALS: Record<Exclude<MaterialId, 'custom'>, { E: number; fy: number; steel: boolean; label: string }> = {
  S235: { E: 210000, fy: 235, steel: true, label: 'S235 (EN 10025-2)' },
  S275: { E: 210000, fy: 275, steel: true, label: 'S275 (EN 10025-2)' },
  S355: { E: 210000, fy: 355, steel: true, label: 'S355 (EN 10025-2)' },
  S460: { E: 210000, fy: 460, steel: true, label: 'S460 (EN 10025-3)' },
  AL6061: { E: 70000, fy: 240, steel: false, label: 'EN AW-6061-T6' },
  AL6082: { E: 70000, fy: 260, steel: false, label: 'EN AW-6082-T6' },
};

const ENDS: EndCondition[] = ['pinned-pinned', 'fixed-pinned', 'fixed-fixed', 'fixed-free'];

/** EN 1993-1-1 Table 6.2 (hollow sections) — solid bars are taken as curve c */
function suggestedCurve(kind: SectionKind, hotFinished: boolean, fy: number): BucklingCurve {
  if (kind === 'tube' || kind === 'rhs') return hotFinished ? (fy >= 460 ? 'a0' : 'a') : 'c';
  return 'c';
}

const field = 'w-full';
const lengthUnits = [
  { label: 'mm', symbol: 'mm', toSiRatio: 1 },
  { label: 'm', symbol: 'm', toSiRatio: 1000 },
];
const forceUnits = [
  { label: 'kN', symbol: 'kN', toSiRatio: 1000 },
  { label: 'N', symbol: 'N', toSiRatio: 1 },
];
const stressUnits = [
  { label: 'MPa', symbol: 'MPa', toSiRatio: 1 },
  { label: 'GPa', symbol: 'GPa', toSiRatio: 1000 },
];

const chip = (on: boolean) =>
  `px-2.5 py-1.5 rounded-[var(--radius-s)] border text-[11.5px] font-mono transition-colors cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)] ${
    on
      ? 'border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--ink)]'
      : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
  }`;

function Panel({ title, children, right, style }: { title: string; children: React.ReactNode; right?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section className="min-w-0 rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-2)]" style={style}>
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
        <h2 className="text-[12px] font-semibold text-[var(--alu)]">{title}</h2>
        {right}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

export default function ColumnBucklingModule() {
  const precision = useGlobalPrecision();
  const { language } = useI18nStore();
  const tr = (en: string, trk: string) => t12(language, en, trk);

  const [L, setL] = useState(3000);
  const [end, setEnd] = useState<EndCondition>('pinned-pinned');
  const [kMode, setKMode] = useState<'theory' | 'design'>('theory');
  const [N, setN] = useState(40000);
  const [mat, setMat] = useState<MaterialId>('S235');
  const [E, setE] = useState(210000);
  const [fy, setFy] = useState(235);
  const [gammaM1, setGammaM1] = useState(1.0);
  const [kind, setKind] = useState<SectionKind>('tube');
  const [hot, setHot] = useState(true);
  const [d, setD] = useState(60);
  const [t, setT] = useState(4);
  const [b, setB] = useState(60);
  const [h, setH] = useState(60);
  const [curveOverride, setCurveOverride] = useState<BucklingCurve | null>(null);

  const steel = mat === 'custom' ? E >= 190000 : MATERIALS[mat].steel;
  const autoCurve = suggestedCurve(kind, hot, fy);
  const curve = curveOverride ?? autoCurve;

  const pickMaterial = (id: MaterialId) => {
    setMat(id);
    if (id !== 'custom') { setE(MATERIALS[id].E); setFy(MATERIALS[id].fy); }
  };

  const section = useMemo(
    () => (kind === 'round' ? { kind, d } : kind === 'tube' ? { kind, d, t } : kind === 'rect' ? { kind, b, h } : { kind, b, h, t }),
    [kind, d, t, b, h],
  );

  const r = useMemo(
    () => computeColumnBuckling({ L, end, kMode, E, fy, curve, gammaM1, section, N, steel }),
    [L, end, kMode, E, fy, curve, gammaM1, section, N, steel],
  );

  const f = (v: number, dp = precision) => formatEngineeringValue(v, dp, true);
  const kN = (v: number) => f(v / 1000);
  const verdictOk = r.ec3Util <= 1;

  const endLabel = (e: EndCondition) =>
    e === 'pinned-pinned' ? tr('Pinned – pinned', 'Mafsallı – mafsallı')
    : e === 'fixed-pinned' ? tr('Fixed – pinned', 'Ankastre – mafsallı')
    : e === 'fixed-fixed' ? tr('Fixed – fixed', 'Ankastre – ankastre')
    : tr('Fixed – free', 'Ankastre – serbest');
  const kindLabel = (k: SectionKind) =>
    k === 'round' ? tr('Solid round', 'Dolu yuvarlak') : k === 'tube' ? tr('Tube (CHS)', 'Boru (CHS)')
    : k === 'rect' ? tr('Solid flat', 'Dolu lama') : tr('Box (RHS)', 'Kutu profil (RHS)');
  const regimeLabel =
    r.regime === 'squash' ? tr('Squash (stocky, λ ≤ 20)', 'Ezilme (kısa, λ ≤ 20)')
    : r.regime === 'inelastic' ? tr('Inelastic buckling', 'Elastik olmayan burkulma')
    : tr('Elastic (Euler) buckling', 'Elastik (Euler) burkulma');

  const sectionWarn =
    (kind === 'tube' && t * 2 >= d) || (kind === 'rhs' && (t * 2 >= b || t * 2 >= h)) || !r.section.valid;
  const classWarn = (kind === 'tube' && d / Math.max(t, 1e-9) > 90 * (235 / fy)) // EN 1993-1-1 Table 5.2: class 3 limit d/t ≤ 90ε²
    || (kind === 'rhs' && (Math.max(b, h) - 3 * t) / Math.max(t, 1e-9) > 42 * Math.sqrt(235 / fy));

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg-0)] text-[var(--ink)]">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 p-3 sm:p-5 xl:flex-row">
        {/* ── inputs ── */}
        <aside className="flex w-full shrink-0 flex-col gap-3 xl:w-[380px]">
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-m)] border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--cyan)]">
              <AlignVerticalSpaceAround size={18} />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold">{tr('Column buckling', 'Kolon burkulma')}</h1>
              <p className="font-mono text-[10.5px] text-[var(--alu-dim)]">EN 1993-1-1 §6.3.1 · AISC 360-16 E3 · Euler</p>
            </div>
          </div>

          <Panel title={tr('Supports & load', 'Mesnetler ve yük')}>
            <div className="grid grid-cols-2 gap-1.5">
              {ENDS.map((e) => (
                <button key={e} type="button" className={chip(end === e)} onClick={() => setEnd(e)} aria-pressed={end === e}>
                  <span className="block text-left">{endLabel(e)}</span>
                  <span className="block text-left text-[10.5px] text-[var(--muted)]">K = {(kMode === 'design' ? K_DESIGN : K_THEORY)[e]}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <span className="text-[var(--alu-dim)]">K:</span>
              <button type="button" className={chip(kMode === 'theory')} onClick={() => setKMode('theory')}>{tr('theoretical', 'teorik')}</button>
              <button type="button" className={chip(kMode === 'design')} onClick={() => setKMode('design')} title="AISC 360-16 Commentary Table C-A-7.1">
                {tr('recommended (AISC)', 'önerilen (AISC)')}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <SmartInputField id="cb-L" label={tr('Length L', 'Boy L')} valueSi={L} onChangeSi={(v) => setL(Math.max(1, v))} units={lengthUnits} className={field} />
              <SmartInputField id="cb-N" label={tr('Axial load N_Ed', 'Eksenel yük N_Ed')} valueSi={N} onChangeSi={(v) => setN(Math.max(0, v))} units={forceUnits} className={field} />
            </div>
          </Panel>

          <Panel title={tr('Material', 'Malzeme')}>
            <select
              value={mat}
              onChange={(e) => pickMaterial(e.target.value as MaterialId)}
              className="w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-3)] px-2.5 py-2 font-mono text-[12px] text-[var(--ink)] focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]"
            >
              {(Object.keys(MATERIALS) as (keyof typeof MATERIALS)[]).map((id) => (
                <option key={id} value={id}>{MATERIALS[id].label}</option>
              ))}
              <option value="custom">{tr('Custom', 'Özel')}</option>
            </select>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SmartInputField id="cb-E" label="E" valueSi={E} onChangeSi={(v) => { setMat('custom'); setE(Math.max(1000, v)); }} units={stressUnits} defaultUnitSymbol="GPa" className={field} />
              <SmartInputField id="cb-fy" label="fy" valueSi={fy} onChangeSi={(v) => { setMat('custom'); setFy(Math.max(10, v)); }} units={stressUnits} className={field} />
            </div>
            {!steel && (
              <p className="mt-2 rounded-[var(--radius-s)] border border-[var(--warn)] bg-[var(--warn-soft)] px-2 py-1.5 text-[11px] text-[var(--ink)]">
                {tr(
                  'Aluminium: EN 1993-1-1 curves are shown for comparison only — the code check for aluminium is EN 1999-1-1 §6.3.1 (class A/B curves). Tetmajer is not used.',
                  'Alüminyum: EN 1993-1-1 eğrileri yalnızca karşılaştırma içindir — alüminyumun normatif kontrolü EN 1999-1-1 §6.3.1’dir (A/B eğrileri). Tetmajer kullanılmaz.',
                )}
              </p>
            )}
          </Panel>

          <Panel title={tr('Cross-section', 'Kesit')}>
            <div className="grid grid-cols-2 gap-1.5">
              {(['tube', 'rhs', 'round', 'rect'] as SectionKind[]).map((k) => (
                <button key={k} type="button" className={chip(kind === k)} onClick={() => setKind(k)} aria-pressed={kind === k}>{kindLabel(k)}</button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(kind === 'round' || kind === 'tube') && (
                <SmartInputField id="cb-d" label={kind === 'tube' ? tr('Outer Ø D', 'Dış Ø D') : tr('Diameter d', 'Çap d')} valueSi={d} onChangeSi={(v) => setD(Math.max(1, v))} units={lengthUnits} className={field} />
              )}
              {(kind === 'rect' || kind === 'rhs') && (
                <>
                  <SmartInputField id="cb-b" label={tr('Width b', 'Genişlik b')} valueSi={b} onChangeSi={(v) => setB(Math.max(1, v))} units={lengthUnits} className={field} />
                  <SmartInputField id="cb-h" label={tr('Height h', 'Yükseklik h')} valueSi={h} onChangeSi={(v) => setH(Math.max(1, v))} units={lengthUnits} className={field} />
                </>
              )}
              {(kind === 'tube' || kind === 'rhs') && (
                <SmartInputField id="cb-t" label={tr('Wall t', 'Et kalınlığı t')} valueSi={t} onChangeSi={(v) => setT(Math.max(0.1, v))} units={lengthUnits} className={field} />
              )}
            </div>
            {(kind === 'tube' || kind === 'rhs') && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                <button type="button" className={chip(hot)} onClick={() => setHot(true)}>{tr('hot-finished', 'sıcak şekillendirilmiş')}</button>
                <button type="button" className={chip(!hot)} onClick={() => setHot(false)}>{tr('cold-formed', 'soğuk şekillendirilmiş')}</button>
              </div>
            )}
            {sectionWarn && <p className="mt-2 text-[11px] text-[var(--bad)]">{tr('Wall thickness is not valid for this section.', 'Et kalınlığı bu kesit için geçersiz.')}</p>}
            {!sectionWarn && classWarn && (
              <p className="mt-2 text-[11px] text-[var(--warn)]">
                {tr('Slender wall (class 4, EN 1993-1-1 Table 5.2) — local buckling reduces A_eff; this check uses the gross area.',
                  'Narin et (sınıf 4, EN 1993-1-1 Tablo 5.2) — yerel burkulma A_eff’i düşürür; bu kontrol brüt alanı kullanır.')}
              </p>
            )}
          </Panel>

          <Panel
            title={tr('EN 1993-1-1 buckling curve', 'EN 1993-1-1 burkulma eğrisi')}
            right={<span className="font-mono text-[11px] text-[var(--alu-dim)]">α = {CURVE_ALPHA[curve]}</span>}
          >
            <div className="grid grid-cols-5 gap-1">
              {(['a0', 'a', 'b', 'c', 'd'] as BucklingCurve[]).map((c) => (
                <button key={c} type="button" className={chip(curve === c)} onClick={() => setCurveOverride(c === autoCurve ? null : c)} aria-pressed={curve === c}>
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[var(--alu-dim)]">
              {curveOverride
                ? tr(`Manual choice — Table 6.2 suggests curve ${autoCurve}.`, `Elle seçildi — Tablo 6.2 önerisi: eğri ${autoCurve}.`)
                : kind === 'tube' || kind === 'rhs'
                ? tr(`Table 6.2: ${hot ? 'hot-finished' : 'cold-formed'} hollow section → curve ${autoCurve}.`, `Tablo 6.2: ${hot ? 'sıcak' : 'soğuk'} şekillendirilmiş kapalı profil → eğri ${autoCurve}.`)
                : tr('Solid bar: curve c (not listed in Table 6.2; common practice).', 'Dolu çubuk: eğri c (Tablo 6.2’de yok; yaygın uygulama).')}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SmartInputField id="cb-g" label="γM1" valueSi={gammaM1} onChangeSi={(v) => setGammaM1(Math.min(2, Math.max(0.8, v)))} units={[{ label: '–', symbol: '', toSiRatio: 1, decimals: 2 }]} className={field} />
              <p className="self-end pb-2 font-mono text-[10.5px] text-[var(--muted)]">{tr('EN: 1.00 (NA may differ)', 'EN: 1.00 (MEK farklı olabilir)')}</p>
            </div>
          </Panel>
        </aside>

        {/* ── results ── */}
        <main className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              { k: 'Nb,Rd (EC3)', v: `${kN(r.NbRd)} kN`, s: `χ ${r.chi.toFixed(3)} · λ̄ ${r.lambdaBar.toFixed(3)}`, c: verdictOk ? 'var(--ok)' : 'var(--bad)' },
              { k: 'φc·Pn (AISC)', v: `${kN(r.phiPnAISC)} kN`, s: `Fcr ${f(r.FcrAISC, 1)} MPa`, c: r.aiscUtil <= 1 ? 'var(--ok)' : 'var(--bad)' },
              { k: 'Ncr (Euler)', v: `${kN(r.Ncr)} kN`, s: `σcr ${f(r.sigmaCr, 1)} MPa`, c: 'var(--ink)' },
              { k: tr('Safety vs. Nk', 'Nk’ya göre emniyet'), v: Number.isFinite(r.fos) ? r.fos.toFixed(2) : '∞', s: regimeLabel, c: r.fos >= 1.5 ? 'var(--ink)' : 'var(--warn)' },
            ].map((x) => (
              <div key={x.k} className="rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-2)] px-3 py-2.5">
                <div className="font-mono text-[10.5px] text-[var(--alu-dim)]">{x.k}</div>
                <div className="font-mono text-[20px] font-semibold tabular-nums" style={{ color: x.c }}>{x.v}</div>
                <div className="font-mono text-[10.5px] text-[var(--muted)]">{x.s}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-2 lg:grid-cols-2">
            <SafetyMarginBar
              metric={{ id: 'ec3', name: tr('Flexural buckling', 'Eğilmeli burkulma'), symbol: 'N_Ed / N_b,Rd', demand: N / 1000, capacity: r.NbRd / 1000, unit: 'kN', utilization: r.ec3Util, standardCitation: 'EN 1993-1-1 (6.46)', isCritical: !verdictOk }}
              demandLabel="N_Ed: " capacityLabel="N_b,Rd: "
            />
            <SafetyMarginBar
              metric={{ id: 'aisc', name: 'AISC 360-16 E3 (LRFD)', symbol: 'Pu / φc·Pn', demand: N / 1000, capacity: r.phiPnAISC / 1000, unit: 'kN', utilization: r.aiscUtil, standardCitation: 'AISC 360-16 E3', isCritical: r.aiscUtil > 1 }}
              demandLabel="Pu: " capacityLabel="φc·Pn: "
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Panel title={tr('Column & first buckling mode', 'Kolon ve 1. burkulma modu')} style={{ flex: '1 1 340px' }}>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="w-full max-w-[320px]" style={{ flex: "1.6 1 240px" }}>
                <ColumnDiagram
                  end={end} L={L} K={r.K} Le={r.Le} loadKN={N / 1000}
                  labels={{
                    mode: tr('mode shape', 'mod şekli'),
                    inflection: tr('inflection', 'dönüm nok.'),
                    free: tr('free', 'serbest'),
                    pinned: tr('pinned', 'mafsal'),
                    fixed: tr('fixed', 'ankastre'),
                    guided: tr('guided', 'kılavuzlu'),
                  }}
                />
                </div>
                <div className="w-full max-w-[200px]" style={{ flex: '1 1 140px' }}>
                  <SectionSketch s={section} axisLabel={tr('weak axis', 'zayıf eksen')} />
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 font-mono text-[11px]">
                    <dt className="text-[var(--alu-dim)]">A</dt><dd className="text-right tabular-nums">{f(r.section.A, 1)} mm²</dd>
                    <dt className="text-[var(--alu-dim)]">I<sub>min</sub></dt><dd className="text-right tabular-nums">{f(r.section.I / 1e4, 2)} cm⁴</dd>
                    <dt className="text-[var(--alu-dim)]">i</dt><dd className="text-right tabular-nums">{f(r.section.i, 2)} mm</dd>
                    <dt className="text-[var(--alu-dim)]">λ</dt><dd className="text-right tabular-nums">{f(r.lambda, 1)}</dd>
                    <dt className="text-[var(--alu-dim)]">λ₁</dt><dd className="text-right tabular-nums">{f(r.lambda1, 1)}</dd>
                  </dl>
                </div>
              </div>
            </Panel>

            <Panel title={tr('Buckling curves σ–λ', 'Burkulma eğrileri σ–λ')} style={{ flex: '1.6 1 440px' }}>
              <BucklingChart
                E={E} fy={fy} gammaM1={gammaM1} curve={curve} lambda={r.lambda} sigmaN={r.sigmaN} steel={steel}
                tetLine={steel ? (fy <= 275 ? { a: 310, b: 1.14, lambdaP: 104 } : { a: 335, b: 0.62, lambdaP: 89 }) : null}
                labels={{
                  euler: 'Euler π²E/λ²',
                  ec3: tr('EC3 χ·fy/γM1, curve', 'EC3 χ·fy/γM1, eğri'),
                  aisc: 'AISC E3 Fcr',
                  tetmajer: 'Tetmajer',
                  johnson: 'Johnson',
                  applied: 'σ = N/A',
                  x: tr('slenderness λ = Le / i', 'narinlik λ = Le / i'),
                  y: 'σ (MPa)',
                }}
              />
            </Panel>
          </div>

          <Panel title={tr('Method comparison', 'Yöntem karşılaştırması')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] font-mono text-[12px]">
                <thead>
                  <tr className="text-left text-[10.5px] text-[var(--alu-dim)]">
                    <th className="py-1 pr-3 font-normal">{tr('Method', 'Yöntem')}</th>
                    <th className="py-1 pr-3 text-right font-normal">σ (MPa)</th>
                    <th className="py-1 pr-3 text-right font-normal">N (kN)</th>
                    <th className="py-1 pr-3 text-right font-normal">N_Ed / N</th>
                    <th className="py-1 font-normal">{tr('Note', 'Not')}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[
                    { m: `EN 1993-1-1 (${tr('curve', 'eğri')} ${curve})`, s: r.NbRd_sigma, n: r.NbRd, note: tr('design resistance, γM1 incl.', 'tasarım dayanımı, γM1 dahil') },
                    { m: 'AISC 360-16 φc·Pn', s: 0.9 * r.FcrAISC, n: r.phiPnAISC, note: 'φc = 0.90' },
                    { m: 'Euler Ncr', s: r.sigmaCr, n: r.Ncr, note: tr('elastic, perfect column', 'elastik, kusursuz kolon') },
                    ...(r.tetmajer ? [{ m: 'Tetmajer', s: r.tetmajer.sigma, n: r.tetmajer.N, note: r.tetmajer.valid ? `20 ≤ λ ≤ ${r.tetmajer.lambdaP}` : tr(`out of range (λ > ${r.tetmajer.lambdaP}) — use Euler`, `aralık dışı (λ > ${r.tetmajer.lambdaP}) — Euler geçerli`) }] : []),
                    { m: 'Johnson', s: r.johnson.sigma ?? NaN, n: r.johnson.N ?? NaN, note: r.johnson.sigma !== null ? `λ ≤ Cc = ${r.johnson.Cc.toFixed(1)}` : tr(`λ > Cc = ${r.johnson.Cc.toFixed(1)} — Euler governs`, `λ > Cc = ${r.johnson.Cc.toFixed(1)} — Euler geçerli`) },
                    { m: tr('Squash A·fy', 'Ezilme A·fy'), s: fy, n: r.Npl, note: tr('upper bound', 'üst sınır') },
                  ].map((row) => {
                    const u = row.n > 0 ? N / row.n : NaN;
                    return (
                      <tr key={row.m} className="border-t border-[var(--line)]">
                        <td className="py-1.5 pr-3 text-[var(--ink)]">{row.m}</td>
                        <td className="py-1.5 pr-3 text-right">{Number.isFinite(row.s) ? f(row.s, 1) : '–'}</td>
                        <td className="py-1.5 pr-3 text-right">{Number.isFinite(row.n) ? kN(row.n) : '–'}</td>
                        <td className="py-1.5 pr-3 text-right" style={{ color: !Number.isFinite(u) ? undefined : u <= 1 ? 'var(--ok)' : 'var(--bad)' }}>
                          {Number.isFinite(u) ? `${(u * 100).toFixed(1)}%` : '–'}
                        </td>
                        <td className="py-1.5 text-[11px] text-[var(--alu-dim)]">{row.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              {tr(
                'Flexural buckling about the weak axis only. Torsional / flexural-torsional buckling (open sections), local buckling (class 4) and second-order effects from eccentric loads are not included.',
                'Yalnızca zayıf eksen etrafında eğilmeli burkulma. Burulmalı / eğilmeli-burulmalı burkulma (açık profiller), yerel burkulma (sınıf 4) ve eksantrik yükten gelen ikinci mertebe etkiler dahil değildir.',
              )}
            </p>
          </Panel>
        </main>
      </div>
    </div>
  );
}
