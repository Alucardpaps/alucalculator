import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MapPin, Globe, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Engineering Support — AluCalc OS',
  description: 'Get in touch with AluCalc OS engineering support, partnerships, and technical inquiries.',
  alternates: {
    canonical: 'https://www.alucalculator.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-[var(--ink)]">
      <div className="mb-12 border-b border-[var(--line)] pb-8">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--cyan)]">
          Support & Inquiries
        </span>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight mt-2 text-[var(--ink)]">
          Contact AluCalc OS
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--alu)] leading-relaxed">
          Reach out to our engineering team for technical support, solver validation feedback, or enterprise custom integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-6 space-y-4">
          <h2 className="text-lg font-mono font-bold text-[var(--ink)] flex items-center gap-2">
            <Mail className="text-[var(--cyan)]" size={18} />
            Direct Email Inquiries
          </h2>
          <p className="text-sm text-[var(--alu)]">
            For general inquiries, calculation verification, bug reports, or partnership opportunities:
          </p>
          <div>
            <a
              href="mailto:contact@alucalculator.com"
              className="text-base font-mono font-bold text-[var(--cyan)] hover:underline inline-block"
            >
              contact@alucalculator.com
            </a>
          </div>
          <p className="text-xs text-[var(--muted)]">Average response time: within 24 business hours.</p>
        </div>

        <div className="rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-6 space-y-4">
          <h2 className="text-lg font-mono font-bold text-[var(--ink)] flex items-center gap-2">
            <Phone className="text-[var(--cyan)]" size={18} />
            Telephone Assistance
          </h2>
          <p className="text-sm text-[var(--alu)]">
            Direct telephone line for commercial licensing and industrial plant support:
          </p>
          <div>
            <a
              href="tel:+905324910000"
              className="text-base font-mono font-bold text-[var(--cyan)] hover:underline inline-block"
            >
              +90 (532) 491-0000
            </a>
          </div>
          <p className="text-xs text-[var(--muted)]">Available Monday - Friday, 09:00 - 18:00 (UTC+3).</p>
        </div>
      </div>

      <div className="rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] p-6 space-y-4 mb-10">
        <h2 className="text-lg font-mono font-bold text-[var(--ink)] flex items-center gap-2">
          <MapPin className="text-[var(--cyan)]" size={18} />
          Organization & Headquarters
        </h2>
        <div className="text-sm text-[var(--alu)] leading-relaxed space-y-1">
          <p className="font-bold text-[var(--ink)]">AluCalc Engineering Technologies Inc.</p>
          <p>Industrial Technology Zone, Maslak</p>
          <p>Istanbul, Turkey</p>
          <p className="flex items-center gap-2 pt-2 text-xs font-mono text-[var(--alu)]">
            <Globe size={14} className="text-[var(--cyan)]" />
            <a href="https://www.alucalculator.com" className="hover:underline">www.alucalculator.com</a>
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--line)] flex flex-wrap gap-4 text-xs font-mono text-[var(--muted)]">
        <Link href="/about" className="hover:text-[var(--cyan)] transition-colors">About AluCalc OS</Link>
        <span>·</span>
        <Link href="/license" className="hover:text-[var(--cyan)] transition-colors">License Agreement</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-[var(--cyan)] transition-colors">Privacy & KVKK</Link>
        <span>·</span>
        <Link href="/llms.txt" className="hover:text-[var(--cyan)] transition-colors">Machine Knowledge (llms.txt)</Link>
      </div>
    </div>
  );
}
