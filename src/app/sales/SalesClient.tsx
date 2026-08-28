'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useI18nStore } from '@/store/i18nStore';
import { getAppPages } from '@/locales/appPagesTranslations';

export function SalesClient() {
  const language = useI18nStore((s) => s.language);
  const t = getAppPages(language).sales;
  const segments = [t.seg0, t.seg1, t.seg2, t.seg3];
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState(segments[0]);
  const [seats, setSeats] = useState('10');
  const [message, setMessage] = useState('');

  const mailto = useMemo(() => {
    const body = [
      `Name: ${name}`,
      `Company: ${company}`,
      `Email: ${email}`,
      `Segment: ${segment}`,
      `Seats: ${seats}`,
      '',
      message,
    ].join('\n');
    return `mailto:sales@alucalculator.com?subject=${encodeURIComponent('AluCalc Team / Enterprise')}&body=${encodeURIComponent(body)}`;
  }, [name, company, email, segment, seats, message]);

  return (
    <main className="work-shell max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <p className="work-kicker">{t.kicker}</p>
      <h1 className="work-title">{t.title}</h1>
      <p className="work-lead">{t.lead}</p>

      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <div className="work-card">
          <p className="hud-label">{t.team}</p>
          <p className="text-sm font-bold text-white">{t.teamPrice}</p>
        </div>
        <div className="work-card">
          <p className="hud-label">{t.enterprise}</p>
          <p className="text-sm font-bold text-white">{t.enterpriseQuote}</p>
        </div>
        <div className="work-card">
          <p className="hud-label">{t.response}</p>
          <p className="text-sm font-bold text-white">{t.responseTime}</p>
        </div>
      </div>

      <form
        className="work-card space-y-3 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = mailto;
        }}
      >
        <label className="block">
          <span className="hud-label">{t.fullName}</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <label className="block">
          <span className="hud-label">{t.company}</span>
          <input required value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <label className="block">
          <span className="hud-label">{t.email}</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <label className="block">
          <span className="hud-label">{t.segment}</span>
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white">
            {segments.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="hud-label">{t.seats}</span>
          <input value={seats} onChange={(e) => setSeats(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <label className="block">
          <span className="hud-label">{t.message}</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <button type="submit" className="work-btn-primary">{t.send}</button>
      </form>

      <div className="flex flex-wrap gap-2">
        <a href="mailto:sales@alucalculator.com" className="work-btn">sales@alucalculator.com</a>
        <Link href="/pricing/" className="work-btn">{t.pricing}</Link>
        <Link href="/developers/" className="work-btn">{t.api}</Link>
        <Link href="/license/" className="work-btn">{t.license}</Link>
      </div>
    </main>
  );
}
