(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,139751,e=>{"use strict";var t=e.i(843476),a=e.i(676150);let i=({type:e,pitch:a=1.5,angle:i=60,height:r=200})=>{let l=(0,t.jsx)("pattern",{id:"hatchThread",width:"8",height:"8",patternUnits:"userSpaceOnUse",patternTransform:"rotate(45)",children:(0,t.jsx)("line",{x1:"0",y1:"0",x2:"0",y2:"8",stroke:"#334155",strokeWidth:"1"})}),d="",s=`${i}\xb0`,n=e?.includes("UN")||"M"===e?"M":e;if("M"===n)d=`
            M0,${r} 
            L0,50 
            L${37.5},${50+86.6025-12.5} 
            L${62.5},${50+86.6025-12.5} 
            L100,50 
            L${137.5},${50+86.6025-12.5}
            L${162.5},${50+86.6025-12.5}
            L200,50
            L250,${50+86.6025}
            L250,${r} 
            Z
        `;else if(["W","G"].includes(n))d=`
            M0,${r} 
            L0,50 
            Q25,${98} 50,${146} 
            Q75,${98} 100,50 
            Q125,${98} 150,${146} 
            L200,50 
            L200,${r} 
            Z
        `,s="55°";else if("Tr"===n)d=`
            M0,${r} 
            L0,50 
            L${15.85},${100} 
            L${52.45},${100} 
            L100,50 
            L${115.85},${100} 
            L${152.45},${100} 
            L200,50 
            L200,${r} 
            Z
        `,s="30°";else if("Rd"===n)d=`
            M0,${r} 
            L0,50 
            Q50,${140} 100,50 
            Q150,${140} 200,50 
            L200,${r} 
            Z
        `,s="30° (Rd)";else if("S"===n){let e=75*Math.tan(3*Math.PI/180),t=75*Math.tan(30*Math.PI/180);d=`
            M0,${r} 
            L0,50 
            L${e},${125} 
            L${100-t},${125} 
            L100,50 
            L${100+e},${125} 
            L${200-t},${125} 
            L200,50 
            L200,${r} 
            Z
        `,s="33° (S)"}else d=`M0,${r} L0,50 L50,100 L100,50 L150,100 L200,50 L200,${r} Z`,s="Custom";return(0,t.jsx)("div",{className:"w-full h-full flex flex-col items-center justify-center bg-[#0a0e14] overflow-hidden relative",children:(0,t.jsxs)("svg",{width:"100%",height:"100%",viewBox:`0 0 400 ${r}`,preserveAspectRatio:"xMidYMid meet",className:"max-h-[300px]",children:[(0,t.jsxs)("defs",{children:[l,(0,t.jsx)("marker",{id:"arrow",markerWidth:"10",markerHeight:"10",refX:"9",refY:"3",orient:"auto",markerUnits:"strokeWidth",children:(0,t.jsx)("path",{d:"M0,0 L0,6 L9,3 z",fill:"#334155"})})]}),(0,t.jsx)("path",{d:d,fill:"url(#hatchThread)",stroke:"#00e5ff",strokeWidth:"2",opacity:"0.9"}),(0,t.jsx)("line",{x1:"0",y1:50,x2:400,y2:50,stroke:"#94a3b8",strokeWidth:"1",strokeDasharray:"5,5",opacity:"0.5"}),(0,t.jsx)("line",{x1:0,y1:30,x2:0,y2:50,stroke:"#64748b",strokeWidth:"1"}),(0,t.jsx)("line",{x1:100,y1:30,x2:100,y2:50,stroke:"#64748b",strokeWidth:"1"}),(0,t.jsx)("line",{x1:0,y1:35,x2:100,y2:35,stroke:"#334155",strokeWidth:"1.5",markerStart:"url(#arrow)",markerEnd:"url(#arrow)"}),(0,t.jsxs)("text",{x:50,y:25,textAnchor:"middle",fill:"#94a3b8",fontSize:"14",fontWeight:"bold",fontFamily:"monospace",children:["P=",a,"mm"]}),(0,t.jsx)("text",{x:50,y:130,textAnchor:"middle",fill:"#ef4444",fontSize:"14",fontWeight:"bold",fontFamily:"monospace",children:s}),(0,t.jsxs)("text",{x:380,y:r-10,textAnchor:"end",fill:"#334155",fontSize:"10",fontFamily:"monospace",children:[e," PROFILE"]})]})})};e.s(["threadGeometrySchema",0,{id:"thread-geometry",metadata:{title:"Universal Thread Geometry",description:"Calculate dimensions for Metric, Unified, and other thread standards.",category:"mechanical",version:"1.0.0",author:"AluCalc OS",lastUpdated:"2026-02-12",tags:["thread","screw","fastener","iso","ansi"],verifiedStandards:["ISO 68-1","ASME B1.1"]},documentation:{assumptions:[{id:"standard-thread",text:"Assumes standard thread profiles (Basic Profile)",impact:"medium"}],standards:[{code:"ISO 68-1",title:"ISO general purpose screw threads — Basic profile"},{code:"ASME B1.1",title:"Unified Inch Screw Threads"}],formulaLatex:"d_2 = d - 0.6495 P"},inputs:[{key:"type",label:"Thread Standard",description:"Type of thread profile",unit:"-",defaultValue:"M",options:[{label:"Metric (ISO 68-1)",value:"M"},{label:"Unified (UNC/UNF)",value:"UN"},{label:"Whitworth (BSW)",value:"W"},{label:"Pipe (G/R - ISO 228)",value:"G"},{label:"Trapezoidal (Tr - ISO 2901)",value:"Tr"},{label:"Buttress (S)",value:"S"}],validation:{required:!0}},{key:"nominalDia",label:"Nominal Diameter (d)",description:"Basic major diameter",unit:"mm",defaultValue:10,validation:{required:!0,min:1,step:1}},{key:"pitch",label:"Pitch (P)",description:"Axial distance between threads (mm). Enter TPI for Inch if converted.",unit:"mm",defaultValue:1.5,validation:{required:!0,min:.1,step:.25}}],outputs:[{key:"majorDia",label:"Major Diameter (d)",unit:"mm",description:"Outer diameter of the thread",formulaLatex:"d = d_{nom}"},{key:"minorDia",label:"Minor Diameter (d1)",unit:"mm",description:"Root diameter of the thread",formulaLatex:"d_1 = d - 1.08 P"},{key:"pitchDia",label:"Pitch Diameter (d2)",unit:"mm",description:"Effective diameter",formulaLatex:"d_2 = d - 0.649 P"},{key:"threadHeight",label:"Thread Height (H1)",unit:"mm",description:"Depth of thread engagement",formulaLatex:"H_1 = 0.541 P"},{key:"tapDrill",label:"Tap Drill Size",unit:"mm",description:"Recommended drill bit diameter",formulaLatex:"\\text{Drill} \\approx d - P"}],calculationEngine:e=>{let t=String(e.type.value),i=Number(e.nominalDia.value),r=Number(e.pitch.value);isNaN(i)&&(i=10),isNaN(r)&&(r=1.5);let l=0,d=0,s=0,n=0;if("M"===t||"UN"===t)l=i-.64952*r,d=i-1.08253*r,s=.54127*r,n=i-r;else if("W"===t||"G"===t){let e=.640327*r;l=i-e,d=i-2*e,s=e,n=d}else"Tr"===t&&(s=.5*r,l=i-.5*r,d=i-r,n=i-r);return{outputs:{majorDia:(0,a.createValidatedValue)(i,"mm","derived"),minorDia:(0,a.createValidatedValue)(d,"mm","derived"),pitchDia:(0,a.createValidatedValue)(l,"mm","derived"),threadHeight:(0,a.createValidatedValue)(s,"mm","derived"),tapDrill:(0,a.createValidatedValue)(n,"mm","derived")},verified:!0,warnings:[],timestamp:Date.now()}},visualization:{type:"svg-parametric",render:(e,a)=>{let r=String(a.type||"M"),l=Number(a.pitch||1.5);return(0,t.jsx)(i,{type:r,pitch:l,height:250})}}}],139751)}]);