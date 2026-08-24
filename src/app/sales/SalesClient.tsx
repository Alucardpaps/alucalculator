'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const SEGMENTS = [
  'Machine shop / fabricator',
  'Design office / engineering firm',
  'OEM / industrial manufacturer',
  'University / training',
];

export function SalesClient() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState(SEGMENTS[0]);
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
      <p className="work-kicker">Sales</p>
      <h1 className="work-title">Contact Sales — Enterprise & Team</h1>
      <p className="work-lead">
        Talk to AluCalc sales for Team, Enterprise, bulk licenses, OEM white-label, university packs, and manufacturing API access.
      </p>

      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <div className="work-card">
          <p className="hud-label">Team</p>
          <p className="text-sm font-bold text-white">$49/mo · 10 seats</p>
        </div>
        <div className="work-card">
          <p className="hud-label">Enterprise</p>
          <p className="text-sm font-bold text-white">Custom quote · SSO · SLA</p>
        </div>
        <div className="work-card">
          <p className="hud-label">Response</p>
          <p className="text-sm font-bold text-white">1–2 business days</p>
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
          <span className="hud-label">Full name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <label className="block">
          <span className="hud-label">Company</span>
          <input required value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <label className="block">
          <span className="hud-label">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <label className="block">
          <span className="hud-label">Segment</span>
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white">
            {SEGMENTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="hud-label">Estimated seats</span>
          <input value={seats} onChange={(e) => setSeats(e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <label className="block">
          <span className="hud-label">Message</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white" />
        </label>
        <button type="submit" className="work-btn-primary">Send via email</button>
      </form>

      <div className="flex flex-wrap gap-2">
        <a href="mailto:sales@alucalculator.com" className="work-btn">sales@alucalculator.com</a>
        <Link href="/pricing/" className="work-btn">Pricing</Link>
        <Link href="/developers/" className="work-btn">API</Link>
        <Link href="/license/" className="work-btn">License</Link>
      </div>
    </main>
  );
}
