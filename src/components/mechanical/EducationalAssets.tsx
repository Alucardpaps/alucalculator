
import React from 'react';

export const UndercutDiagram = () => (
    <svg viewBox="0 0 200 120" className="w-full h-auto text-slate-300">
        <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L6,3 z" fill="currentColor" />
            </marker>
        </defs>

        {/* Bad Gear (Undercut) */}
        <g transform="translate(50, 60)">
            <text x="0" y="-45" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">NO SHIFT (x=0)</text>
            <path d="M-30,-20 L-10,-20 L-5,0 L-10,20 L-30,20" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" opacity="0.5" />
            {/* Undercut profile */}
            <path d="M-20,-40 Q-5,-10 15,-5 L20,0 L15,5 Q-5,10 -20,40" fill="none" stroke="#ef4444" strokeWidth="2" />
            <circle cx="0" cy="0" r="2" fill="#ef4444" />
            <text x="0" y="55" textAnchor="middle" fontSize="8" fill="#ef4444">WEAK ROOT</text>
        </g>

        {/* Good Gear (Corrected) */}
        <g transform="translate(150, 60)">
            <text x="0" y="-45" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">SHIFTED (x&gt;0)</text>
            {/* Strong profile */}
            <path d="M-15,-40 Q5,-10 25,-5 L30,0 L25,5 Q5,10 -15,40" fill="none" stroke="#10b981" strokeWidth="2" />
            <circle cx="0" cy="0" r="2" fill="#10b981" />
            <text x="0" y="55" textAnchor="middle" fontSize="8" fill="#10b981">STRONG ROOT</text>
        </g>

        {/* Arrow */}
        <path d="M80,0 L120,0" stroke="currentColor" strokeWidth="1" markerEnd="url(#arrow)" transform="translate(0, 60)" />
    </svg>
);

export const ServiceFactorDiagram = () => (
    <svg viewBox="0 0 200 100" className="w-full h-auto">
        {/* Grid */}
        <line x1="20" y1="80" x2="180" y2="80" stroke="#475569" strokeWidth="1" />
        <line x1="20" y1="80" x2="20" y2="10" stroke="#475569" strokeWidth="1" />

        {/* Labels */}
        <text x="100" y="95" textAnchor="middle" fontSize="8" fill="#94a3b8">OPERATING HOURS</text>
        <text x="10" y="45" textAnchor="middle" fontSize="8" fill="#94a3b8" transform="rotate(-90, 10, 45)">SERVICE FACTOR</text>

        {/* Curve */}
        <path d="M20,70 Q60,65 100,50 T180,20" fill="none" stroke="#f59e0b" strokeWidth="2" />

        {/* Points */}
        <circle cx="20" cy="70" r="3" fill="#10b981" /> <text x="25" y="70" fontSize="8" fill="#10b981">&lt;3h</text>
        <circle cx="100" cy="50" r="3" fill="#3b82f6" />
        <circle cx="180" cy="20" r="3" fill="#ef4444" /> <text x="170" y="15" fontSize="8" fill="#ef4444">&gt;10h</text>
    </svg>
);
