/**
 * AluCalculator V2 — Trust Panel Component
 * 
 * THE VERIFICATION & TRANSPARENCY LAYER
 * 
 * Every calculation result displays:
 * - Timestamp
 * - LaTeX-rendered formula
 * - Applied assumptions
 * - Referenced standards (DIN/ISO/EN)
 * - Verification status badge
 */

'use client';

import React from 'react';
import type { CalculationResult } from '@/types/engineering';
import type { CalculatorSchemaV2 } from '@/types/calculator-schema-v2';

interface TrustPanelProps {
    result: CalculationResult;
    schema: CalculatorSchemaV2;
}

export function TrustPanel({ result, schema }: TrustPanelProps) {
    const { verified, warnings, timestamp, formulaTrace } = result;

    return (
        <div className="trust-panel">
            {/* Verification Badge */}
            <div className="trust-header">
                <VerificationBadge verified={verified} />
                <Timestamp time={timestamp} />
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="trust-warnings">
                    {warnings.map((w, i) => (
                        <Warning key={i} warning={w} />
                    ))}
                </div>
            )}

            {/* Formula Trace */}
            {formulaTrace && Object.keys(formulaTrace).length > 0 && (
                <div className="trust-formulas">
                    <h4>Applied Formulas</h4>
                    <div className="formula-grid">
                        {Object.entries(formulaTrace).map(([key, latex]) => (
                            <FormulaLine key={key} name={key} latex={latex} />
                        ))}
                    </div>
                </div>
            )}

            {/* Standards */}
            <div className="trust-standards">
                <h4>Referenced Standards</h4>
                <ul>
                    {schema.documentation.standards.map((std, i) => (
                        <li key={i}>
                            <strong>{std.code}</strong>
                            {std.section && <span className="section"> §{std.section}</span>}
                            <span className="title"> — {std.title}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Assumptions */}
            <div className="trust-assumptions">
                <h4>Assumptions</h4>
                <ul>
                    {schema.documentation.assumptions.map((a) => (
                        <li key={a.id} className={`impact-${a.impact}`}>
                            <span className="assumption-text">{a.text}</span>
                            {a.source && <span className="source"> [{a.source}]</span>}
                        </li>
                    ))}
                </ul>
            </div>

            <style jsx>{`
        .trust-panel {
          background: var(--surface-2, #1a1a2e);
          border: 1px solid var(--border, #2a2a4a);
          border-radius: 8px;
          padding: 16px;
          font-size: 13px;
          margin-top: 16px;
        }
        
        .trust-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border, #2a2a4a);
        }
        
        .trust-warnings {
          margin-bottom: 12px;
        }
        
        .trust-formulas,
        .trust-standards,
        .trust-assumptions {
          margin-bottom: 12px;
        }
        
        h4 {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted, #888);
          margin: 0 0 8px 0;
        }
        
        .formula-grid {
          display: grid;
          gap: 4px;
        }
        
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        li {
          padding: 4px 0;
          font-size: 12px;
          color: var(--text-secondary, #aaa);
        }
        
        .section {
          color: var(--accent, #00e5ff);
          font-family: monospace;
        }
        
        .source {
          color: var(--text-muted, #666);
          font-size: 11px;
        }
        
        .impact-high {
          border-left: 2px solid var(--warning, #ff6b35);
          padding-left: 8px;
        }
        
        .impact-medium {
          border-left: 2px solid var(--info, #ffeb3b);
          padding-left: 8px;
        }
        
        .impact-low {
          border-left: 2px solid var(--success, #4caf50);
          padding-left: 8px;
        }
      `}</style>
        </div>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function VerificationBadge({ verified }: { verified: boolean }) {
    return (
        <div className={`verification-badge ${verified ? 'verified' : 'unverified'}`}>
            <span className="icon">{verified ? '✓' : '⚠'}</span>
            <span className="text">{verified ? 'VERIFIED' : 'UNVERIFIED'}</span>

            <style jsx>{`
        .verification-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .verified {
          background: rgba(76, 175, 80, 0.15);
          color: #4caf50;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }
        
        .unverified {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
          border: 1px solid rgba(255, 107, 53, 0.3);
        }
        
        .icon {
          font-size: 12px;
        }
      `}</style>
        </div>
    );
}

function Timestamp({ time }: { time: number }) {
    const date = new Date(time);
    const formatted = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <div className="timestamp">
            <span className="label">Calculated:</span>
            <span className="time">{formatted}</span>

            <style jsx>{`
        .timestamp {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted, #666);
        }
        
        .time {
          font-family: monospace;
        }
      `}</style>
        </div>
    );
}

function Warning({ warning }: { warning: { field: string; message: string; severity: string } }) {
    const severityColors = {
        info: { bg: 'rgba(33, 150, 243, 0.1)', border: '#2196f3', text: '#64b5f6' },
        warning: { bg: 'rgba(255, 235, 59, 0.1)', border: '#ffeb3b', text: '#fff176' },
        critical: { bg: 'rgba(244, 67, 54, 0.1)', border: '#f44336', text: '#ef5350' },
    };

    const colors = severityColors[warning.severity as keyof typeof severityColors] || severityColors.warning;

    return (
        <div className="warning" style={{
            background: colors.bg,
            borderLeft: `3px solid ${colors.border}`,
            color: colors.text,
        }}>
            <strong>[{warning.field}]</strong> {warning.message}

            <style jsx>{`
        .warning {
          padding: 8px 12px;
          margin-bottom: 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        strong {
          font-family: monospace;
          margin-right: 4px;
        }
      `}</style>
        </div>
    );
}

function FormulaLine({ name, latex }: { name: string; latex: string }) {
    // In production, this would use KaTeX or MathJax
    // For now, display the LaTeX source
    return (
        <div className="formula-line">
            <span className="name">{name}:</span>
            <code className="latex">{latex}</code>

            <style jsx>{`
        .formula-line {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          background: var(--surface-1, #0f0f1a);
          border-radius: 4px;
        }
        
        .name {
          font-weight: 600;
          color: var(--accent, #00e5ff);
          min-width: 80px;
        }
        
        .latex {
          font-family: 'Fira Code', monospace;
          font-size: 11px;
          color: var(--text-secondary, #aaa);
        }
      `}</style>
        </div>
    );
}

export default TrustPanel;
