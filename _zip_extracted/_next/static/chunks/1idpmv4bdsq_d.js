(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,367017,e=>{"use strict";var a=e.i(843476),t=e.i(676150);let i={id:"bearings",metadata:{title:"Bearings (SKF/ISO)",description:"Static & dynamic load ratings for deep groove ball bearings (L10h life).",category:"mechanical",version:"1.0.0",author:"AluCalc OS",lastUpdated:"2026-02-12",tags:["bearings","skf","life","l10","l10h","machine elements"],verifiedStandards:["ISO 281:2007","SKF General Catalogue"]},documentation:{assumptions:[{id:"a1",text:"Constant speed and constant load.",impact:"high"},{id:"a2",text:"Reliability of 90% (L10 life).",impact:"high"},{id:"a3",text:"Deep groove ball bearings (exponent p = 3).",impact:"medium"}],standards:[{code:"ISO 281",title:"Rolling bearings — Dynamic load ratings and rating life"}],formulaLatex:"L_{10} = \\left( \\frac{C}{P} \\right)^p \\quad , \\quad L_{10h} = \\frac{10^6}{60 n} L_{10}"},inputs:[{key:"Fr",label:"Radial Load (Fr)",unit:"N",defaultValue:3e3,description:"Applied radial load",validation:{required:!0,min:0}},{key:"Fa",label:"Axial Load (Fa)",unit:"N",defaultValue:500,description:"Applied axial (thrust) load",validation:{required:!0,min:0}},{key:"rpm",label:"Speed (n)",unit:"RPM",defaultValue:1500,description:"Rotational speed of the bearing",validation:{required:!0,min:10}},{key:"C",label:"Dynamic Load Rating (C)",unit:"N",defaultValue:14e3,description:"Basic dynamic load rating (C) from bearing catalogue",validation:{required:!0,min:100}},{key:"C0",label:"Static Load Rating (C0)",unit:"N",defaultValue:7800,description:"Basic static load rating (C0) from bearing catalogue",validation:{required:!0,min:100}},{key:"bearingType",label:"Bearing Type",unit:"-",defaultValue:0,description:"0: Ball Bearing (p=3), 1: Roller Bearing (p=10/3)",validation:{required:!0,min:0,max:1}}],outputs:[{key:"Pe",label:"Equivalent Load (P)",unit:"N",description:"Equivalent dynamic bearing load",precision:1,formulaLatex:"P = X \\cdot F_r + Y \\cdot F_a"},{key:"L10",label:"L10 Life",unit:"Mrevs",description:"Basic rating life in millions of revolutions",precision:2,formulaLatex:"L_{10} = (C/P)^p"},{key:"L10h",label:"L10h Life",unit:"hours",description:"Basic rating life in operating hours",precision:0,formulaLatex:"L_{10h} = \\frac{10^6}{60 n} L_{10}"}],calculationEngine:e=>{let a=Number(e.Fr.value),i=Number(e.Fa.value),r=Number(e.rpm.value),l=Number(e.C.value),o=Number(e.C0.value),n=Number(e.bearingType.value),d=a,s=i/o,f=1,u=0,c=.22;if(0===n){let e=[{f:.014,e:.19,Y:2.3},{f:.028,e:.22,Y:1.99},{f:.056,e:.26,Y:1.71},{f:.084,e:.28,Y:1.55},{f:.11,e:.3,Y:1.45},{f:.17,e:.34,Y:1.31},{f:.28,e:.38,Y:1.15},{f:.42,e:.42,Y:1.04},{f:.56,e:.44,Y:1}],t=e[0],r=e[e.length-1];for(let a=0;a<e.length-1;a++)if(s>=e[a].f&&s<=e[a+1].f){t=e[a],r=e[a+1];break}if(s<=e[0].f)c=e[0].e,u=e[0].Y;else if(s>=e[e.length-1].f)c=e[e.length-1].e,u=e[e.length-1].Y;else{let e=(s-t.f)/(r.f-t.f);c=t.e+e*(r.e-t.e),u=t.Y+e*(r.Y-t.Y)}i/a>c?f=.56:(f=1,u=0)}else i/a>(c=.3)?(f=.4,u=1.5):(f=1,u=0);(d=f*a+u*i)<a&&(d=a);let p=0;d>0&&(p=Math.pow(l/d,0===n?3:10/3));let g=1e6/(60*r)*p,m=[];return d>l&&m.push({field:"Pe",message:"Equivalent load exceeds Dynamic Load Rating (P > C). Bearing will fail rapidly.",severity:"critical"}),g<1e3&&m.push({field:"L10h",message:"Computed life is very low (< 1000 hours). Consider a larger bearing.",severity:"warning"}),{outputs:{Pe:(0,t.createValidatedValue)(d,"N","derived"),L10:(0,t.createValidatedValue)(p,"Mrevs","derived"),L10h:(0,t.createValidatedValue)(g,"hours","derived")},verified:!0,warnings:m,timestamp:Date.now()}},visualization:{type:"svg-parametric",render:(e,t)=>{let i=e.outputs||{},{svg:r,viewBox:l}=function(e){let a="ball"===e.bearingType?12:16,t=e.rpm>0?Math.max(.5,60/e.rpm):0,i=t>0?`<animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="${t}s" repeatCount="indefinite"/>`:"",r=Math.max(e.loadRadial,e.loadAxial,1),l=e.loadRadial/r*80,o=e.loadAxial/r*80,n=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
        <defs>
            <linearGradient id="metalOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#94a3b8"/>
                <stop offset="50%" stop-color="#334155"/>
                <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>

            <linearGradient id="metalInner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="50%" stop-color="#1e293b"/>
                <stop offset="100%" stop-color="#64748b"/>
            </linearGradient>
            
            <radialGradient id="ballGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#f8fafc"/>
                <stop offset="40%" stop-color="#94a3b8"/>
                <stop offset="100%" stop-color="#1e293b"/>
            </radialGradient>

            <linearGradient id="rollerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#e2e8f0"/>
                <stop offset="40%" stop-color="#64748b"/>
                <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>

            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.7"/>
            </filter>

            <marker id="arrowFr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0,0 8,4 0,8" fill="#00e5ff" />
            </marker>
            <marker id="arrowFa" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0,0 8,4 0,8" fill="#f43f5e" />
            </marker>
        </defs>

        <rect width="100%" height="100%" fill="#0a0e14" opacity="0"/>

        <!-- Outer Ring -->
        <g filter="url(#dropShadow)">
            <circle cx="300" cy="300" r="220" fill="url(#metalOuter)"/>
            <circle cx="300" cy="300" r="200" fill="#0f172a"/>
            <circle cx="300" cy="300" r="200" fill="none" stroke="#1e293b" stroke-width="2"/>
        </g>

        <!-- Rolling Elements (Animated) -->
        <g>
            ${i}
            <!-- Cage background -->
            <circle cx="300" cy="300" r="160" fill="none" stroke="#334155" stroke-width="4"/>
    `;for(let t=0;t<a;t++){let i=360*t/a*(Math.PI/180),r=300+160*Math.cos(i),l=300+160*Math.sin(i);if("ball"===e.bearingType)n+=`<circle cx="${r}" cy="${l}" r="35" fill="url(#ballGrad)" filter="url(#dropShadow)"/>`;else{let e=360*t/a;n+=`<g transform="translate(${r}, ${l}) rotate(${e})">
                        <rect x="-${26.25}" y="-35" width="52.5" height="${70}" rx="4" fill="url(#rollerGrad)" filter="url(#dropShadow)"/>
                    </g>`}}return{svg:n+=`
        </g>

        <!-- Inner Ring -->
        <g filter="url(#dropShadow)">
            <circle cx="300" cy="300" r="120" fill="url(#metalInner)"/>
            <circle cx="300" cy="300" r="90" fill="#0a0e14" stroke="#1e293b" stroke-width="4"/>
            <!-- Shaft Hole -->
            <circle cx="300" cy="300" r="85" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="8,4"/>
        </g>

        <!-- Load Vectors (Static) -->
        <!-- Fr (Radial) -->
        ${e.loadRadial>0?`
            <line x1="300" y1="${190}" x2="300" y2="${190+l+20}" stroke="#00e5ff" stroke-width="6" marker-end="url(#arrowFr)"/>
            <text x="${315}" y="${180+l/2+30}" fill="#00e5ff" font-family="sans-serif" font-weight="bold" font-size="16">Fr</text>
        `:""}
        
        <!-- Fa (Axial - represented coming out or pushing inner ring) -->
        ${e.loadAxial>0?`
            <g transform="translate(${400}, 300)">
                <line x1="40" y1="0" x2="${40-o-10}" y2="0" stroke="#f43f5e" stroke-width="6" marker-end="url(#arrowFa)"/>
                <text x="${40-o/2}" y="-15" fill="#f43f5e" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">Fa</text>
            </g>
        `:""}

        <!-- Center Crosshair -->
        <path d="M ${285} 300 L ${315} 300 M 300 ${285} L 300 ${315}" stroke="#475569" stroke-width="1"/>
        
        <!-- Annotations -->
        <text x="300" y="580" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="16">
            RPM: <tspan fill="#fff" font-weight="bold">${e.rpm}</tspan> | 
            Equivalent Load (P): <tspan fill="#f59e0b" font-weight="bold">${Math.round(e.equivalentLoad)} N</tspan>
        </text>

    </svg>`,viewBox:"0 0 600 600",width:600,height:600}}({bearingType:1===Number(t.bearingType?.value)?"roller":"ball",rpm:Number(t.rpm?.value)||0,loadRadial:Number(t.Fr?.value)||0,loadAxial:Number(t.Fa?.value)||0,lifeHours:Number(i.L10h?.value)||0,equivalentLoad:Number(i.Pe?.value)||0});return(0,a.jsx)("div",{className:"w-full h-full flex items-center justify-center p-4 bg-[#05080b]",dangerouslySetInnerHTML:{__html:r}})}},tier:"pro"};e.s(["bearingsSchema",0,i,"default",0,i],367017)}]);