import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src/data/seo-calculators');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const INTENTS = [
    { type: 'calculator', suffix: 'calculator' },
    { type: 'formula', suffix: 'formula' },
    { type: 'example', suffix: 'example' },
    { type: 'step-by-step', suffix: 'step by step' },
    { type: 'explained', suffix: 'explained' }
];

// ══════════════════════════════════════════════════════════════
// FULL 200+ BASE TOPIC KEYWORD MATRIX
// ══════════════════════════════════════════════════════════════

const DOMAIN_MAP: Record<string, string[]> = {
    // ⚙️ POWER TRANSMISSION (NEW - incl. Timing Belt)
    "power-transmission": [
        "timing belt design", "timing belt length", "timing belt tension", "timing belt pulley ratio",
        "v-belt length", "v-belt tension", "v-belt power", "v-belt selection",
        "roller chain drive", "chain sprocket", "chain tension", "chain length",
        "flat belt drive", "belt wrap angle", "belt slip", "belt power capacity",
    ],
    // ⚙️ BEARINGS
    "bearings": [
        "bearing life", "bearing load", "bearing selection", "bearing lubrication",
        "bearing clearance", "bearing fatigue", "bearing speed limit", "bearing friction",
        "bearing preload", "bearing temperature",
    ],
    // 🔧 SHAFTS
    "shafts": [
        "shaft diameter", "shaft stress", "shaft torsion", "shaft deflection",
        "shaft fatigue", "shaft design", "shaft critical speed", "shaft power transmission",
        "shaft shear stress", "shaft bending stress",
    ],
    // ⚙️ GEARS
    "gears": [
        "gear ratio", "gear module", "gear pitch", "gear design",
        "gear contact stress", "gear bending stress", "gear efficiency", "gear torque",
        "gear speed", "gear train",
    ],
    // 🔩 FASTENERS
    "fasteners": [
        "bolt torque", "bolt preload", "bolt stress", "bolt shear force",
        "bolt tension", "bolt fatigue", "bolt tightening", "bolt friction factor",
        "bolt clamp force", "bolt strength", "thread stripping area",
    ],
    // 🌀 SPRINGS & DYNAMICS
    "springs-dynamics": [
        "spring design", "spring constant", "spring force", "spring deflection",
        "spring energy", "vibration frequency", "natural frequency", "damping ratio",
        "resonance calculation", "harmonic motion",
    ],
    // 🧱 BEAMS
    "beams": [
        "beam deflection", "beam load", "beam stress", "bending moment",
        "shear force diagram", "cantilever beam", "simply supported beam",
        "beam reaction force", "beam stiffness", "beam section modulus",
    ],
    // 🏢 COLUMNS
    "columns": [
        "column buckling", "euler buckling", "johnson buckling", "column load capacity",
        "slenderness ratio", "column stress", "column stability",
        "compression member", "column failure", "structural column design",
    ],
    // 🌉 STRUCTURES
    "structures": [
        "truss analysis", "frame analysis", "structural load", "wind load",
        "dead load", "live load", "seismic load", "load combination",
        "structural safety factor", "structural design",
    ],
    // 💧 FLUID FLOW
    "fluid-flow": [
        "flow rate", "reynolds number", "laminar flow", "turbulent flow",
        "velocity calculation", "flow velocity", "continuity equation",
        "bernoulli equation", "pipe flow", "open channel flow",
    ],
    // 🔥 FLUID PRESSURE
    "fluid-pressure": [
        "pressure drop", "pipe pressure", "pressure loss", "pressure head",
        "fluid pressure", "static pressure", "dynamic pressure", "pressure gradient",
    ],
    // 🚰 PUMP & PIPE
    "pump-pipe": [
        "pump power", "pump efficiency", "pump head", "pump flow rate",
        "pipe friction", "pipe diameter", "water hammer", "venturi flow",
        "nozzle flow", "cavitation",
    ],
    // ⚡ ELECTRICAL POWER
    "electrical-power": [
        "power calculation", "3 phase power", "single phase power", "power factor",
        "apparent power", "reactive power", "real power", "power loss",
        "power efficiency", "electrical power",
    ],
    // ⚡ CIRCUITS
    "circuits": [
        "voltage drop", "current calculation", "resistance calculation", "ohm law",
        "circuit analysis", "series circuit", "parallel circuit",
        "impedance calculation", "capacitance calculation", "inductance calculation",
    ],
    // 🔋 ELECTRICAL SYSTEMS
    "electrical-systems": [
        "motor power", "motor current", "transformer calculation", "cable sizing",
        "wire gauge", "battery capacity", "inverter sizing", "solar panel sizing",
    ],
    // 🔥 THERMAL
    "thermal": [
        "heat transfer", "conduction heat transfer", "convection heat transfer",
        "radiation heat transfer", "thermal expansion", "heat flux", "heat loss",
        "heat exchanger", "lmtd calculation", "thermal conductivity",
        "thermal resistance", "heat capacity", "specific heat", "energy balance",
    ],
    // 🏭 MANUFACTURING
    "manufacturing": [
        "cnc speed", "cnc feed rate", "cutting speed", "machining time",
        "tool life", "drilling speed", "milling speed", "turning speed",
        "sheet metal bend allowance", "bend deduction", "welding heat input",
        "welding speed", "casting shrinkage", "tolerance calculation",
    ],
    // 🧪 MATERIALS
    "materials": [
        "stress strain", "young modulus", "shear modulus", "poisson ratio",
        "yield strength", "ultimate strength", "hardness calculation",
        "fatigue life", "creep calculation", "fracture mechanics",
    ],
    // 🔬 PHYSICS
    "physics": [
        "velocity calculation", "acceleration calculation", "force calculation",
        "kinetic energy", "potential energy", "momentum calculation",
        "projectile motion", "circular motion", "angular velocity", "work and energy",
    ],
};

function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
}

function getRelatedTopics(topic: string, domain: string[]): string[] {
    const siblings = domain.filter(t => t !== topic).slice(0, 4);
    return siblings.map(s => slugify(`${s} calculator`));
}

function generatePage(topic: string, intent: typeof INTENTS[0], domainTopics: string[]) {
    const keyword = `${topic} ${intent.suffix}`;
    const slug = slugify(keyword);
    const titleCase = (s: string) => s.replace(/\b\w/g, l => l.toUpperCase());

    return {
        id: slug,
        title: `${titleCase(keyword)} - AluCalc Engineering`,
        slug,
        keyword,
        intent: intent.type,
        meta: {
            title: `${titleCase(keyword)} | Free Engineering Tool | AluCalc`,
            description: `Professional ${keyword} tool. Real formulas, worked examples, and step-by-step engineering explanations.`
        },
        seo: {
            h1: titleCase(keyword),
            intro: `Comprehensive engineering guide for ${keyword}. Use this resource to determine specifications, validate designs, and review standards.`,
            formula: `(Placeholder formula for ${topic})`,
            variables: { "var1": "Input parameter 1", "var2": "Input parameter 2" },
            step_by_step: `1. Identify inputs for ${topic}.\n2. Apply the governing equation.\n3. Validate against engineering standards.`,
            practical: `${titleCase(topic)} is critical in real-world engineering for system reliability and safety.`,
            example: `Example: For a typical ${topic} scenario, substituting standard values yields a result within acceptable limits.`
        },
        related: [
            ...getRelatedTopics(topic, domainTopics),
            slugify(`${topic} formula`),
            slugify(`${topic} example`),
        ].filter(r => r !== slug).slice(0, 5),
        cta: { label: "Open in AluCalc OS", link: `/os?module=calculator` }
    };
}

function main() {
    let count = 0;
    console.log(`🚀 AluCalc Programmatic SEO Engine v2 — FULL SCALE`);

    for (const [domain, topics] of Object.entries(DOMAIN_MAP)) {
        console.log(`\n📂 Domain: ${domain} (${topics.length} topics × ${INTENTS.length} intents)`);
        for (const topic of topics) {
            for (const intent of INTENTS) {
                const page = generatePage(topic, intent, topics);
                fs.writeFileSync(path.join(DATA_DIR, `${page.slug}.json`), JSON.stringify(page, null, 2));
                count++;
            }
        }
    }

    console.log(`\n🎉 Generated ${count} SEO pages across ${Object.keys(DOMAIN_MAP).length} domains.`);
    console.log(`📁 Output: ${DATA_DIR}`);
}

main();
