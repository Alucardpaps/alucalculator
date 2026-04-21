const fs = require('fs');
let file = fs.readFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', 'utf8');

const splitMarker = 'function ImbusSVG({ data }: { data: any }) {';
const parts = file.split(splitMarker);

if (parts.length !== 2) {
    console.error('Could not find split marker');
    process.exit(1);
}

const newBottomHalf = `function ImbusSVG({ data }: { data: any }) {
    const maxDim = Math.max(data.D, data.T * 1.5);
    const scale = 100 / maxDim;
    const D = data.D * scale;
    const d = data.d * scale;
    const T = data.T * scale;

    return (
        <svg viewBox="-120 -120 240 240" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>

            <TitleBlock title={\`DIN 912 Counterbore \${data.size}\`} />

            <line x1="0" y1="-90" x2="0" y2="70" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            
            <path d={\`M -90 -60 L -\${D/2} -60 L -\${D/2} \${-40 + T} L -\${d/2} \${-40 + T} L -\${d/2} 60 L -90 60 Z\`} fill="url(#hatch)" stroke="#06b6d4" strokeWidth="1" />
            <path d={\`M 90 -60 L \${D/2} -60 L \${D/2} \${-40 + T} L \${d/2} \${-40 + T} L \${d/2} 60 L 90 60 Z\`} fill="url(#hatch)" stroke="#06b6d4" strokeWidth="1" />

            <path d={\`M -\${D/2} -60 L -\${D/2} \${-40 + T} L -\${d/2} \${-40 + T} L -\${d/2} 60\`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
            <path d={\`M \${D/2} -60 L \${D/2} \${-40 + T} L \${d/2} \${-40 + T} L \${d/2} 60\`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            <SurfaceFinish x={-D/2} y={-20} val="Rz 16" rot={-90} />
            <SurfaceFinish x={0} y={-40 + T} val="Rz 25" rot={0} />

            <GDTBox x={-70} y={65} type="concentricity" tol="0.1" datum="A" />
            <path d="M -50 65 L -50 45 L -15 45" fill="none" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" />
            <g transform={\`translate(\${d/2 + 25}, 40)\`} stroke="#94a3b8" fill="none" strokeWidth="1">
                <rect x="0" y="0" width="12" height="12" />
                <text x="6" y="8" fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1" stroke="none" textAnchor="middle">A</text>
            </g>
            <line x1={d/2} y1="46" x2={d/2+25} y2="46" stroke="#94a3b8" strokeWidth="1" />

            <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                <line x1={-D/2} y1="-65" x2={-D/2} y2="-85" stroke="#94a3b8" strokeWidth="1" />
                <line x1={D/2} y1="-65" x2={D/2} y2="-85" stroke="#94a3b8" strokeWidth="1" />
                <line x1={-D/2} y1="-80" x2={D/2} y2="-80" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="0" y="-83" textAnchor="middle">Ø{data.D}</text>

                <line x1={-d/2} y1="65" x2={-d/2} y2="85" stroke="#94a3b8" strokeWidth="1" />
                <line x1={d/2} y1="65" x2={d/2} y2="85" stroke="#94a3b8" strokeWidth="1" />
                <line x1={-d/2} y1="80" x2={d/2} y2="80" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="0" y="77" textAnchor="middle">Ø{data.d}</text>

                <line x1={D/2 + 2} y1="-60" x2={D/2 + 35} y2="-60" stroke="#94a3b8" strokeWidth="1" />
                <line x1={D/2 + 2} y1={-40 + T} x2={D/2 + 35} y2={-40 + T} stroke="#94a3b8" strokeWidth="1" />
                <line x1={D/2 + 25} y1="-60" x2={D/2 + 25} y2={-40 + T} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={D/2 + 29} y={-60 + T/2 + 3} textAnchor="start">T={data.T}</text>

                <text x={-D/2 - 10} y={-60 + T/2} textAnchor="end" opacity="0.7">Head k={data.k}</text>
            </g>
        </svg>
    );
}

function KeywaySVG({ d, data }: { d: number, data: any }) {
    const scale = 100 / d; // Perfect fit for viewBox
    const rad = (d/2) * scale;
    const b = data.b * scale;
    const t1 = data.t1 * scale;
    const t2 = data.t2 * scale;
    const keywayBottom = -Math.sqrt(rad*rad - (b/2)*(b/2));
    
    return (
        <svg viewBox="-120 -120 240 240" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>

            <TitleBlock title="DIN 6885 Parallel Key" />

            <circle cx="0" cy="0" r={rad} fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" />
            <line x1="-90" y1="0" x2="90" y2="0" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            <line x1="0" y1="-90" x2="0" y2="90" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />

            <path d={\`
                M \${-rad} 0 
                A \${rad} \${rad} 0 1 0 \${rad} 0 
                A \${rad} \${rad} 0 0 0 \${b/2} \${keywayBottom}
                L \${b/2} \${-rad + t1}
                L \${-b/2} \${-rad + t1}
                L \${-b/2} \${keywayBottom}
                A \${rad} \${rad} 0 0 0 \${-rad} 0
            \`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            <path d={\`
                M \${-b/2} \${keywayBottom}
                L \${-b/2} \${-rad - t2}
                L \${b/2} \${-rad - t2}
                L \${b/2} \${keywayBottom}
            \`} fill="none" stroke="#f97316" strokeDasharray="3,3" strokeWidth="2" />

            <GDTBox x={45} y={-rad+t1+25} type="parallelism" tol="0.05" datum="B" />
            <path d={\`M 60 \${-rad+t1+25} L 60 \${-rad+t1} L \${b/2} \${-rad+t1}\`} fill="none" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" />

            <g transform={\`translate(\${-rad - 40}, 0)\`} stroke="#94a3b8" fill="none" strokeWidth="1">
                <rect x="0" y="0" width="12" height="12" />
                <text x="6" y="8" fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1" stroke="none" textAnchor="middle">B</text>
            </g>
            <line x1={-rad} y1="6" x2={-rad-28} y2="6" stroke="#94a3b8" strokeWidth="1" />

            <SurfaceFinish x={0} y={-rad+t1} val="Ra 1.6" rot={0} />

            <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                <line x1={0} y1={rad} x2={45} y2={rad+25} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" />
                <text x="48" y={rad+28} textAnchor="start">Ø{d} k6</text>

                {/* Width b UPWARDS */}
                <line x1={-b/2} y1={-rad + t1} x2={-b/2} y2={-rad - 45} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={b/2} y1={-rad + t1} x2={b/2} y2={-rad - 45} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={-b/2} y1={-rad - 35} x2={b/2} y2={-rad - 35} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="0" y={-rad - 40} textAnchor="middle">b={data.b} P9</text>

                {/* Depth t1 */}
                <line x1={-rad-30} y1={-rad + t1} x2={-b/2} y2={-rad + t1} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={-rad-30} y1={-rad} x2={0} y2={-rad} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={-rad-20} y1={-rad} x2={-rad-20} y2={-rad + t1} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={-rad-25} y={-rad + t1/2 + 3} textAnchor="end">t1={data.t1}</text>

                {/* Depth t2 */}
                <line x1={rad+30} y1={-rad - t2} x2={b/2} y2={-rad - t2} stroke="#f97316" strokeWidth="0.8" />
                <line x1={rad+30} y1={-rad} x2={0} y2={-rad} stroke="#f97316" strokeWidth="0.8" />
                <line x1={rad+20} y1={-rad - t2} x2={rad+20} y2={-rad} stroke="#f97316" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={rad+25} y={-rad - t2/2 + 3} textAnchor="start" fill="#f97316">Hub t2={data.t2}</text>
            </g>
        </svg>
    );
}

function CirclipSVG({ type, data }: { type: string, data: any }) {
    const scale = 100 / data.d; // Always scale main dia to 100!
    const r1 = (data.d/2) * scale;
    const r2 = (data.d2/2) * scale;
    // Scale m and n significantly so they are visible even for large diameters
    // We'll enforce a minimum visual width for the groove so it doesn't disappear
    const m_visual = Math.max(data.m * scale, 5); 
    const n_visual = m_visual * 2; 

    return (
        <svg viewBox="-120 -120 240 240" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <pattern id="hatch2" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>

            <TitleBlock title={\`DIN 47\${type==='shaft'?'1':'2'} Circlip Groove\`} />

            <line x1="-100" y1="0" x2="100" y2="0" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            
            {type === 'shaft' ? (
                <g>
                    <rect x="-80" y={-r1} width={80-m_visual/2} height={r1*2} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="1" />
                    <rect x={m_visual/2} y={-r1} width={n_visual} height={r1*2} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="1" />
                    <rect x={m_visual/2+n_visual} y={-r1} width="20" height={r1*2} fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3,3" />
                    
                    <rect x={-m_visual/2} y={-r2} width={m_visual} height={r2*2} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="1" />
                    
                    <path d={\`M -80 -\${r1} L -\${m_visual/2} -\${r1} L -\${m_visual/2} -\${r2} L \${m_visual/2} -\${r2} L \${m_visual/2} -\${r1} L \${m_visual/2+n_visual} -\${r1}\`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                    <path d={\`M -80 \${r1} L -\${m_visual/2} \${r1} L -\${m_visual/2} \${r2} L \${m_visual/2} \${r2} L \${m_visual/2} \${r1} L \${m_visual/2+n_visual} \${r1}\`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

                    <SurfaceFinish x={0} y={-r2} val="Rz 10" rot={0} />
                    <SurfaceFinish x={m_visual/2} y={-r1+(r1-r2)/2} val="Rz 16" rot={90} />

                    <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                        <line x1={-m_visual/2} y1={-r1-30} x2={-m_visual/2} y2={-r1} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1={m_visual/2} y1={-r1-30} x2={m_visual/2} y2={-r1} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1={-m_visual/2} y1={-r1-25} x2={m_visual/2} y2={-r1-25} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x="0" y={-r1-28} textAnchor="middle">m={data.m}</text>

                        <line x1={m_visual/2} y1={-r1-15} x2={m_visual/2+n_visual} y2={-r1-15} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x={m_visual/2+n_visual/2} y={-r1-18} textAnchor="middle">n min</text>

                        <line x1="30" y1={-r2} x2="70" y2={-r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1="30" y1={r2} x2="70" y2={r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1="60" y1={-r2} x2="60" y2={r2} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x="65" y="3" textAnchor="start">Ø{data.d2.toFixed(2)}</text>
                    </g>
                </g>
            ) : (
                <g>
                    <path d={\`M -80 -90 L 80 -90 L 80 -\${r1} L \${m_visual/2} -\${r1} L \${m_visual/2} -\${r2} L -\${m_visual/2} -\${r2} L -\${m_visual/2} -\${r1} L -80 -\${r1} Z\`} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="2" />
                    <path d={\`M -80 90 L 80 90 L 80 \${r1} L \${m_visual/2} \${r1} L \${m_visual/2} \${r2} L -\${m_visual/2} \${r2} L -\${m_visual/2} \${r1} L -80 \${r1} Z\`} fill="url(#hatch2)" stroke="#06b6d4" strokeWidth="2" />

                    <SurfaceFinish x={0} y={-r2} val="Rz 10" rot={180} />

                    <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                        <line x1={-m_visual/2} y1={-r2-30} x2={-m_visual/2} y2={-r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1={m_visual/2} y1={-r2-30} x2={m_visual/2} y2={-r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1={-m_visual/2} y1={-r2-25} x2={m_visual/2} y2={-r2-25} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x="0" y={-r2-28} textAnchor="middle">m={data.m}</text>

                        <line x1="30" y1={-r2} x2="70" y2={-r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1="30" y1={r2} x2="70" y2={r2} stroke="#94a3b8" strokeWidth="0.8" />
                        <line x1="60" y1={-r2} x2="60" y2={r2} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x="65" y="3" textAnchor="start">Ø{data.d2.toFixed(2)}</text>
                    </g>
                </g>
            )}
        </svg>
    );
}

function CenterDrillSVG({ data }: { data: any }) {
    const scale = 120 / data.d2; // Perfect scaling
    const d1 = data.d1 * scale;
    const d2 = data.d2 * scale;
    const t = data.t * scale;
    const pilotL = t * 0.4; 
    const tipL = d1 * 0.3; 

    return (
        <svg viewBox="-120 -120 240 240" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <pattern id="hatch3" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>

            <TitleBlock title="DIN 332 Center Drill Form A" />

            <line x1="0" y1="-100" x2="0" y2="90" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            
            <path d={\`
                M -100 -80 L 100 -80 L 100 80 L -100 80 Z
                M -\${d2/2} -80
                L -\${d2/2} -\${t}
                L -\${d1/2} -\${pilotL}
                L -\${d1/2} \${tipL}
                L 0 \${tipL + d1/2}
                L \${d1/2} \${tipL}
                L \${d1/2} -\${pilotL}
                L \${d2/2} -\${t}
                L \${d2/2} -80 Z
            \`} fill="url(#hatch3)" fillRule="evenodd" stroke="none" />

            <path d={\`
                M -\${d2/2} -80
                L -\${d2/2} -\${t}
                L -\${d1/2} -\${pilotL}
                L -\${d1/2} \${tipL}
                L 0 \${tipL + d1/2}
                L \${d1/2} \${tipL}
                L \${d1/2} -\${pilotL}
                L \${d2/2} -\${t}
                L \${d2/2} -80
            \`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            <SurfaceFinish x={-d1/2 - (d2/2-d1/2)/2} y={-pilotL - (t-pilotL)/2} val="Rz 6.3" rot={-60} />

            <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                <path d={\`M -\${d2/2} -\${t+12} A 30 30 0 0 0 \${d2/2} -\${t+12}\`} fill="none" stroke="#94a3b8" strokeWidth="1" />
                <text x="0" y={-t-15} textAnchor="middle">60°</text>
                
                <text x="0" y={tipL + d1/2 + 15} textAnchor="middle">120°</text>

                <line x1={-d2/2} y1="-95" x2={d2/2} y2="-95" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <line x1={-d2/2} y1="-95" x2={-d2/2} y2="-80" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d2/2} y1="-95" x2={d2/2} y2="-80" stroke="#94a3b8" strokeWidth="0.8" />
                <text x="0" y="-99" textAnchor="middle">Ø{data.d2}</text>

                <line x1={-d1/2} y1="0" x2={d1/2} y2="0" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={d1/2 + 10} y="3" textAnchor="start">Ø{data.d1}</text>

                <line x1={d2/2 + 2} y1="-80" x2={d2/2 + 35} y2="-80" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d2/2 + 2} y1={-t} x2={d2/2 + 35} y2={-t} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={d2/2 + 25} y1="-80" x2={d2/2 + 25} y2={-t} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x={d2/2 + 30} y={-t/2 + 3} textAnchor="start">t={data.t}</text>
            </g>
        </svg>
    );
}

function UndercutSVG({ data }: { data: any }) {
    const maxDim = Math.max(Number(data.width), Number(data.depth) * 2);
    const scale = 100 / maxDim;
    const w = Number(data.width) * scale;
    const r = Number(data.radius) * scale;
    const d = Number(data.depth) * scale;

    return (
        <svg viewBox="-120 -100 240 200" className="w-full max-w-4xl max-h-[600px] drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <defs>
                <pattern id="hatch4" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
            </defs>

            <TitleBlock title="DIN 76 Thread Runout" />

            <line x1="-100" y1="50" x2="100" y2="50" stroke="#06b6d4" strokeDasharray="8,4,2,4" strokeWidth="1" />
            
            <path d="M -90 0 L -90 10 M -80 0 L -80 10 M -70 0 L -70 10 M -60 0 L -60 10" stroke="#06b6d4" strokeWidth="1" />
            
            <path d={\`
                M -100 0
                L -\${w/2} 0
                L -\${w/2 - r} \${d - r}
                Q -\${w/2 - 2*r} \${d} 0 \${d}
                Q \${w/2 - 2*r} \${d} \${w/2 - r} \${d - r}
                L \${w/2} 0
                L 100 0
                L 100 -70
                L -100 -70 Z
            \`} fill="url(#hatch4)" stroke="none" />

            <path d={\`
                M -100 0
                L -\${w/2} 0
                L -\${w/2 - r} \${d - r}
                Q -\${w/2 - 2*r} \${d} 0 \${d}
                Q \${w/2 - 2*r} \${d} \${w/2 - r} \${d - r}
                L \${w/2} 0
                L 100 0
            \`} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

            <SurfaceFinish x={0} y={d} val="Rz 10" rot={0} />

            <g fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#cbd5e1">
                <line x1={-w/2} y1="-5" x2={-w/2} y2="-45" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={w/2} y1="-5" x2={w/2} y2="-45" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1={-w/2} y1="-40" x2={w/2} y2="-40" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="0" y="-45" textAnchor="middle">g = {data.width}</text>

                <line x1="40" y1="0" x2="70" y2="0" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="40" y1={d} x2="70" y2={d} stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="55" y1="0" x2="55" y2={d} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                <text x="60" y={d/2 + 3} textAnchor="start">dg = d - {Number(data.depth)*2}</text>

                <line x1="0" y1={d} x2={25} y2={d+25} stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" />
                <text x="28" y={d+28} textAnchor="start">R = {data.radius}</text>

                <text x={-w/2 - 20} y={d/2} textAnchor="end">30°</text>
            </g>
        </svg>
    );
}
`;

fs.writeFileSync('src/components/modules/mechanical/MachiningDetailsModule.tsx', parts[0] + newBottomHalf);
