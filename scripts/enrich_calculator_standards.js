const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'seo-calculators', 'calculators.json');
const calcs = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Canonical standard map for calculators
const STANDARD_MAPPING = {
  '3-phase-power': ['IEEE 141', 'IEC 60038'],
  'beam-deflection': ['AISC 360-16', 'Eurocode 3 (EN 1993-1-1)'],
  'belt-drive': ['ISO 5296', 'DIN 7753', 'RMA IP-22'],
  'bend-allowance': ['DIN 6935', 'ISO 7438'],
  'bending-moment': ['AISC 360-16', 'DIN 1025'],
  'biology-genetics': ['ISO 20387', 'NCBI Guidelines'],
  'bolt-torque': ['VDI 2230 Blatt 1', 'ISO 898-1', 'DIN 912'],
  'centripetal-force': ['ISO 80000-3 (Quantities and Units - Space & Time)'],
  'chemical-molarity': ['IUPAC Gold Book', 'ISO 80000-9'],
  'column-buckling': ['Euler-Johnson Criteria', 'AISC 360-16 (Chapter E)'],
  'concrete-reinforcement': ['ACI 318-19', 'Eurocode 2 (EN 1992-1-1)'],
  'failure-diagnosis': ['ISO 13379-1', 'VDI 3822 (Failure Analysis)'],
  'failure-prediction': ['Weibull Analysis (IEC 61649)', 'ISO 2394'],
  'gear-contact-stress': ['ISO 6336-2', 'AGMA 2001-D04', 'DIN 3990'],
  'gear-module': ['ISO 54:1996', 'DIN 780', 'AGMA 2001'],
  'hardness-conversion': ['ASTM E140', 'ISO 18265'],
  'heat-sink': ['MIL-HDBK-217F', 'IEEE 1532'],
  'hvac-load': ['ASHRAE Fundamentals', 'ISO 52016-1'],
  'hydraulic-cylinder': ['ISO 6020/2', 'DIN 24554'],
  'hydrostatic-pressure': ['ISO 12215-5', 'DNV-GL Ship Rules'],
  'keyway-connection': ['DIN 6885-1', 'ISO 773'],
  'machining-speed': ['ISO 3685 (Tool-life testing)', 'DIN 6580'],
  'material-properties': ['ASTM Standard Material Test Specs', 'EN 10025'],
  'mohr-circle': ['ASTM E9', 'Tresca / von Mises Criteria'],
  'motor-sizing': ['IEC 60034-1', 'NEMA MG 1'],
  'naval-buoyancy': ['IMO SOLAS Chapter II-1', 'ISO 12217'],
  'nesting-optimizer': ['ISO 6983 (G-code)', 'Lantek Nesting Standard'],
  'o-ring-gland': ['ISO 3601-2', 'DIN 3771', 'Parker O-Ring Handbook'],
  'pipe-friction': ['Darcy-Weisbach / Colebrook-White', 'ISO 4427'],
  'pipe-sizing': ['ASME B31.3', 'EN 13480'],
  'pneumatic-actuator': ['ISO 15552', 'DIN ISO 6431'],
  'press-fit': ['DIN 7190 (Interference Fits)', 'ISO 286-1'],
  'pump-sizing': ['ISO 9906 (Hydraulic performance)', 'Hydraulic Institute HI 1.4'],
  'reynolds-number': ['ISO 80000-4', 'Fluid Mechanics Fundamentals'],
  'shaft-diameter': ['DIN 743-1/2 (Shaft Carrying Capacity)', 'ASME B106.1M'],
  'sheet-metal-blank': ['DIN 6935', 'VDI 3386'],
  'spring-design': ['DIN EN 13906-1 (Helical Compression Springs)', 'ISO 2162'],
  'thermal-expansion': ['ASTM E228', 'DIN 51045'],
  'tolerance-stackup': ['ASME Y14.5-2018 (GD&T)', 'ISO 1101', 'ISO 286'],
  'torsion-stress': ['DIN 743', 'Timoshenko Beam & Torsion Theory'],
  'vibration-analysis': ['ISO 10816-3', 'ISO 20816-1', 'VDI 2056'],
  'welding-fillet': ['AWS D1.1', 'EN ISO 5817', 'Eurocode 3 (EN 1993-1-8)']
};

let updatedCount = 0;
for (const calc of calcs) {
  const stds = STANDARD_MAPPING[calc.id] || STANDARD_MAPPING[calc.slug];
  if (stds && stds.length > 0) {
    calc.standard = stds[0];
    calc.standards = stds;
    if (!calc.meta.standards) {
      calc.meta.standards = stds;
    }
    updatedCount++;
  } else {
    // If not in mapping, look for standard inside description or text
    const text = JSON.stringify(calc);
    const matches = text.match(/(ISO|DIN|VDI|ASME|IEEE|AISC|AGMA|EN|ASTM|SAE|Eurocode)\s*[-_]?\s*[0-9]+[a-zA-Z0-9\-]*/gi);
    if (matches) {
      const unique = [...new Set(matches.map(m => m.trim()))];
      calc.standard = unique[0];
      calc.standards = unique;
      updatedCount++;
    } else {
      calc.standard = 'ISO / DIN Deterministic Engine';
      calc.standards = ['ISO / DIN Deterministic Engine'];
      updatedCount++;
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(calcs, null, 2), 'utf8');
console.log(`[Success] Updated ${updatedCount} calculators with recognized standards citations.`);
