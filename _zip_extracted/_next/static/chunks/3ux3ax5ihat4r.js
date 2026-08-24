(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,534325,e=>{"use strict";var t=e.i(676150);let l={E60XX:{yield:330,tensile:415,allowable:124},E70XX:{yield:400,tensile:485,allowable:145},E80XX:{yield:460,tensile:550,allowable:165},E90XX:{yield:530,tensile:620,allowable:186},E100XX:{yield:600,tensile:690,allowable:207}};e.s(["default",0,{id:"welding-fillet",metadata:{title:"Fillet Weld Strength",description:"Calculate shear stress and safety factor for fillet welds.",category:"fabrication",version:"1.0.0",author:"AluCalc Engineering",lastUpdated:"2026-02-10",tags:["weld","fillet","stress","strength","AISC"],verifiedStandards:["AWS D1.1","AISC 360"]},inputs:[{key:"joint",label:"Joint Configuration",unit:"-",defaultValue:"single",options:[{label:"Single Fillet (Lap/Tee)",value:"single"},{label:"Double Fillet (Two sides)",value:"double"}],validation:{required:!0},description:"Number of weld lines resisting the load."},{key:"electrode",label:"Electrode Class",unit:"-",defaultValue:"E70XX",options:[{label:"E60XX (Yield 330 MPa)",value:"E60XX"},{label:"E70XX (Yield 400 MPa)",value:"E70XX"},{label:"E80XX (Yield 460 MPa)",value:"E80XX"},{label:"E90XX (Yield 530 MPa)",value:"E90XX"},{label:"E100XX (Yield 600 MPa)",value:"E100XX"}],validation:{required:!0},description:"Filler metal classification."},{key:"F",label:"Applied Load",unit:"N",defaultValue:1e4,validation:{min:1,max:1e7,required:!0},description:"Shear force acting on the joint."},{key:"L",label:"Weld Length",unit:"mm",defaultValue:100,validation:{min:10,max:1e4,required:!0},description:"Total length of the weld bead."},{key:"a",label:"Leg Size (z)",unit:"mm",defaultValue:6,validation:{min:1,max:50,required:!0,step:.5},description:"Leg length of the fillet weld (z)."}],outputs:[{key:"SF",label:"Safety Factor",unit:"-",precision:2,description:"Ratio of Allowable Stress / Actual Stress",formulaLatex:"SF = \\frac{\\tau_{allow}}{\\tau}",warningThreshold:{max:1,message:"FAILURE"}},{key:"tau",label:"Shear Stress",unit:"MPa",precision:1,formulaLatex:"\\tau = \\frac{F}{0.707 \\cdot z \\cdot L}",description:"Average shear stress on the effective throat."},{key:"weight",label:"Filler Weight",unit:"g",precision:0,formulaLatex:"W = V \\cdot \\rho \\cdot 1.1",description:"Estimated filler metal required (steel)."},{key:"a",label:"Throat (a)",unit:"mm",precision:2,formulaLatex:"a = z \\cdot 0.707",description:"Effective throat thickness."}],calculationEngine:function(e){let a=Date.now(),i=[],o={},r=e.F.value,s=e.L.value,d=e.a.value,n=e.electrode.value,f=e.joint.value;e.mode?.value;let u=(l[n]||l.E70XX).allowable,c=.707*d;o.a="a = z \\cdot 0.707";let h="double"===f?2:1,p=c*s*h;o.Aw="A_w = a \\cdot L \\cdot n";let g=r/p;o.tau="\\tau = \\frac{F}{A_w}";let m=u/g;o.SF="SF = \\frac{\\tau_{allow}}{\\tau}";let w=.5*d*d*s*h*.008635;return m<1?i.push({field:"SF",message:`Weld FAILED. Stress (${g.toFixed(1)} MPa) exceeds allowable (${u} MPa).`,severity:"critical"}):m<1.5&&i.push({field:"SF",message:`Low Safety Factor (${m.toFixed(2)}). Consider increasing leg size or length.`,severity:"warning"}),d<3&&i.push({field:"z",message:"Leg size < 3mm is difficult to weld consistently.",severity:"info"}),{outputs:{tau:(0,t.createValidatedValue)(g,"MPa","derived",{precision:1}),SF:(0,t.createValidatedValue)(m,"-","derived",{precision:2}),Aw:(0,t.createValidatedValue)(p,"mm","derived",{precision:1}),weight:(0,t.createValidatedValue)(w,"g","derived",{precision:0,assumptionNote:"Includes 10% waste"}),a:(0,t.createValidatedValue)(c,"mm","derived",{precision:2})},verified:m>=1,warnings:i,timestamp:a,formulaTrace:o}},visualization:{type:"svg-parametric",render:(e,t)=>{var l;let a,i,o,r=e.outputs||{},{svg:s}=(a=Math.max(20,Math.min(100,5*(l={jointType:String(t.joint?.value||"single"),legSize:Number(t.a?.value)||6,throatSize:Number(r.a?.value)||4.24,weldLength:Number(t.L?.value)||100,load:Number(t.F?.value)||1e4,stressRatio:(Number(r.tau?.value)||0)/145}).legSize)),i=1.5*a,o="#00e5ff",l.stressRatio>.8&&(o="#ffc107"),l.stressRatio>=1&&(o="#ef4444"),{svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
        <defs>
            <linearGradient id="metalPlateH" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
            </linearGradient>

            <linearGradient id="metalPlateV" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#64748b"/>
                <stop offset="100%" stop-color="#334155"/>
            </linearGradient>
            
            <radialGradient id="weldBead" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#94a3b8"/>
                <stop offset="100%" stop-color="#0f172a"/>
            </radialGradient>

            <linearGradient id="hazGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${o}" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="#0a0e14" stop-opacity="0"/>
            </linearGradient>

            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="4" dy="6" stdDeviation="5" flood-color="#000" flood-opacity="0.8"/>
            </filter>
            
            <filter id="glow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            <pattern id="weldRipple" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <path d="M 0 5 Q 5 0 10 5" fill="none" stroke="#1e293b" stroke-width="1.5" opacity="0.6"/>
            </pattern>

            <marker id="arrowForce" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
            </marker>
        </defs>

        <rect width="100%" height="100%" fill="#0a0e14" opacity="0"/>

        <g transform="translate(400, 300)">
            <!-- Back plate (for Double Fillet) -->
            ${"double"===l.jointType?`
                <g filter="url(#dropShadow)">
                    <rect x="-150" y="-${i}" width="150" height="${i}" fill="url(#metalPlateH)" stroke="#0f172a" stroke-width="2"/>
                    <!-- Left Weld HAZ -->
                    <path d="M 0 0 L -${1.8*a} 0 L 0 -${1.8*a} Z" fill="url(#hazGrad)"/>
                    <!-- Left Weld Bead -->
                    <path d="M 0 0 L -${a} 0 Q -${.7*a} -${.7*a} 0 -${a} Z" fill="url(#weldBead)" stroke="#0f172a" stroke-width="2"/>
                    <path d="M 0 0 L -${a} 0 Q -${.7*a} -${.7*a} 0 -${a} Z" fill="url(#weldRipple)"/>
                </g>
            `:""}

            <!-- Horizontal Plate -->
            <g filter="url(#dropShadow)">
                <rect x="0" y="0" width="200" height="${i}" fill="url(#metalPlateH)" stroke="#0f172a" stroke-width="2"/>
                <!-- Vertical Plate -->
                <rect x="-${i/2}" y="-200" width="${i}" height="${200+i}" fill="url(#metalPlateV)" stroke="#0f172a" stroke-width="2"/>
            </g>

            <!-- Right Weld HAZ -->
            <path d="M ${i/2} 0 L ${i/2+1.8*a} 0 L ${i/2} -${1.8*a} Z" fill="url(#hazGrad)" filter="url(#glow)"/>

            <!-- Right Weld Bead (Main) -->
            <g filter="url(#dropShadow)">
                <path d="M ${i/2} 0 L ${i/2+a} 0 Q ${i/2+.7*a} -${.7*a} ${i/2} -${a} Z" fill="url(#weldBead)" stroke="#0f172a" stroke-width="2"/>
                <path d="M ${i/2} 0 L ${i/2+a} 0 Q ${i/2+.7*a} -${.7*a} ${i/2} -${a} Z" fill="url(#weldRipple)"/>
            </g>
            
            <!-- Force Vectors -->
            <!-- Tension on horizontal plate -->
            <line x1="130" y1="${i/2}" x2="230" y2="${i/2}" stroke="#ef4444" stroke-width="5" marker-end="url(#arrowForce)"/>
            <text x="240" y="${i/2+5}" fill="#ef4444" font-family="sans-serif" font-weight="bold" font-size="16">F</text>
            
            <!-- Reaction on vertical plate -->
            <line x1="-${i/2}" y1="-100" x2="-100" y2="-100" stroke="#ef4444" stroke-width="5" marker-end="url(#arrowForce)"/>
            
            <!-- Dimension Lines for Leg (z) and Throat (a) -->
            <g font-family="sans-serif" font-size="14" fill="#94a3b8">
                <!-- Leg z (Horizontal) -->
                <line x1="${i/2}" y1="15" x2="${i/2+a}" y2="15" stroke="#94a3b8" stroke-width="2"/>
                <line x1="${i/2}" y1="10" x2="${i/2}" y2="20" stroke="#94a3b8" stroke-width="2"/>
                <line x1="${i/2+a}" y1="10" x2="${i/2+a}" y2="20" stroke="#94a3b8" stroke-width="2"/>
                <text x="${i/2+a/2}" y="35" text-anchor="middle">z = ${l.legSize} mm</text>
                
                <!-- Leg z (Vertical) -->
                <line x1="${i/2+a+15}" y1="0" x2="${i/2+a+15}" y2="-${a}" stroke="#94a3b8" stroke-width="2"/>
                <line x1="${i/2+a+10}" y1="0" x2="${i/2+a+20}" y2="0" stroke="#94a3b8" stroke-width="2"/>
                <line x1="${i/2+a+10}" y1="-${a}" x2="${i/2+a+20}" y2="-${a}" stroke="#94a3b8" stroke-width="2"/>
                <text x="${i/2+a+25}" y="-${a/2-5}">z = ${l.legSize} mm</text>
                
                <!-- Throat a -->
                <line x1="${i/2}" y1="0" x2="${i/2+.5*a}" y2="-${.5*a}" stroke="#00e5ff" stroke-width="2" stroke-dasharray="4,4"/>
                <text x="${i/2+.5*a+10}" y="-${.5*a-10}" fill="#00e5ff" font-weight="bold">a = ${l.throatSize.toFixed(2)} mm</text>
            </g>

        </g>
        
        <!-- Annotations top -->
        <g font-family="sans-serif" font-size="16">
            <text x="400" y="40" text-anchor="middle" fill="#94a3b8">
                Joint Type: <tspan fill="#fff" font-weight="bold">${l.jointType.toUpperCase()}</tspan> | 
                Weld Length: <tspan fill="#fff" font-weight="bold">${l.weldLength} mm</tspan> |
                Status: <tspan fill="${o}" font-weight="bold">${l.stressRatio>=1?"FAILED":"SAFE"}</tspan>
            </text>
        </g>

    </svg>`,viewBox:"0 0 800 500",width:800,height:500});return{$$typeof:Symbol.for("react.element"),type:"div",props:{className:"w-full h-full flex items-center justify-center p-4 bg-[#05080b]",dangerouslySetInnerHTML:{__html:s}},ref:null}}},documentation:{assumptions:[{id:"perfect-fillet",text:"Geometric 90° triangle assumed.",impact:"medium",source:"AISC"},{id:"shear-loading",text:"Load assumed parallel to weld axis (Shear).",impact:"high",source:"Mechanism"}],standards:[{code:"AWS D1.1",title:"Allowable Stress Design"}],formulaLatex:"\\tau = \\frac{P}{A_{eff}}"},tier:"free"}],534325)}]);