'use client';

import Link from 'next/link';
import { useI18nStore } from '@/store/i18nStore';
import { getAppPages } from '@/locales/appPagesTranslations';
import { densityErrorPct, plateMassKg, type AlloyDatasheet } from '@/data/alloyDatasheets';

export function CompareClient({ left, right }: { left: AlloyDatasheet; right: AlloyDatasheet }) {
  const language = useI18nStore((s) => s.language);
  const t = getAppPages(language).compare;

  const rows: { label: string; l: string; r: string }[] = [
    { label: t.density, l: `${left.density.toFixed(2)} g/cm³`, r: `${right.density.toFixed(2)} g/cm³` },
    {
      label: t.densityError,
      l: `${densityErrorPct(left.density).toFixed(1)}%`,
      r: `${densityErrorPct(right.density) >= 0 ? '+' : ''}${densityErrorPct(right.density).toFixed(1)}%`,
    },
    { label: t.yieldStrength, l: `${left.yieldMPa} MPa`, r: `${right.yieldMPa} MPa` },
    { label: t.tensile, l: `${left.tensileMPa} MPa`, r: `${right.tensileMPa} MPa` },
    { label: t.elongation, l: `${left.elongationPct}%`, r: `${right.elongationPct}%` },
    { label: t.modulus, l: `${left.modulusGPa} GPa`, r: `${right.modulusGPa} GPa` },
    { label: t.weldability, l: left.weldability, r: right.weldability },
    { label: t.machinability, l: left.machinability, r: right.machinability },
    { label: t.corrosion, l: left.corrosion, r: right.corrosion },
    { label: t.plate, l: `${plateMassKg(left.density).toFixed(2)} kg`, r: `${plateMassKg(right.density).toFixed(2)} kg` },
  ];

  return (
    <main className="work-shell max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <p className="work-kicker">{t.kicker}</p>
      <h1 className="work-title">{left.name} vs {right.name}</h1>

      <div className="grid md:grid-cols-2 gap-3 mb-8">
        {[left, right].map((a) => (
          <Link key={a.slug} href={`/materials/${a.slug}/`} className="work-card hover:border-white/20 transition-colors">
            <h2 className="text-base font-black text-white mb-1">{a.name}</h2>
            <p className="text-[11px] text-slate-500 mb-2">{a.family} · {a.standard}</p>
            <p className="text-[13px] text-slate-400 mb-3">{a.blurb}</p>
            <div className="flex gap-6 text-sm">
              <div><p className="hud-label">{t.density}</p><p className="font-bold text-white">{a.density.toFixed(2)} g/cm³</p></div>
              <div><p className="hud-label">{t.yield}</p><p className="font-bold text-white">{a.yieldMPa} MPa</p></div>
            </div>
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto work-card mb-8">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="py-2 pr-3" />
              <th className="py-2 px-2">{left.name}</th>
              <th className="py-2 px-2">{right.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-white/5">
                <td className="py-2 pr-3 text-slate-300">{row.label}</td>
                <td className="py-2 px-2 text-white">{row.l}</td>
                <td className="py-2 px-2 text-white">{row.r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/aluminum/?alloy=${left.slug}&shape=sheet`} className="work-btn-primary">{t.weight} · {left.slug}</Link>
        <Link href={`/aluminum/?alloy=${right.slug}&shape=sheet`} className="work-btn-primary">{t.weight} · {right.slug}</Link>
        <Link href={`/materials/${left.slug}/`} className="work-btn">{left.name} {t.datasheet}</Link>
        <Link href={`/materials/${right.slug}/`} className="work-btn">{right.name} {t.datasheet}</Link>
      </div>
    </main>
  );
}
