/**
 * AluCalc OS — Material Selector AI Service
 * 
 * Filters and ranks engineering materials from the knowledge base
 * based on user constraints (strength, weight, temperature, cost).
 */

interface MaterialCriteria {
    minYieldStrength?: number;   // MPa
    maxDensity?: number;         // kg/m³
    maxTemperature?: number;     // °C
    preferLowCost?: boolean;
    application?: string;        // e.g. "aerospace", "automotive", "structural"
}

interface MaterialCandidate {
    name: string;
    category: string;
    yieldStrength: number;
    density: number;
    maxServiceTemp: number;
    costIndex: number;           // 1-10 scale (1=cheap, 10=expensive)
    score: number;
    reasoning: string;
}

// Embedded material database (expandable via knowledge-base JSONs)
const MATERIAL_DB: Omit<MaterialCandidate, 'score' | 'reasoning'>[] = [
    // Steels
    { name: "AISI 1045 (Carbon Steel)", category: "steel", yieldStrength: 310, density: 7850, maxServiceTemp: 400, costIndex: 2 },
    { name: "AISI 4140 (Alloy Steel)", category: "steel", yieldStrength: 655, density: 7850, maxServiceTemp: 500, costIndex: 3 },
    { name: "AISI 304 (Stainless Steel)", category: "steel", yieldStrength: 215, density: 8000, maxServiceTemp: 870, costIndex: 5 },
    { name: "AISI 316L (Stainless Steel)", category: "steel", yieldStrength: 205, density: 8000, maxServiceTemp: 870, costIndex: 6 },
    { name: "Maraging Steel 300", category: "steel", yieldStrength: 2000, density: 8100, maxServiceTemp: 450, costIndex: 9 },
    // Aluminum
    { name: "Aluminum 6061-T6", category: "aluminum", yieldStrength: 276, density: 2700, maxServiceTemp: 150, costIndex: 3 },
    { name: "Aluminum 7075-T6", category: "aluminum", yieldStrength: 503, density: 2810, maxServiceTemp: 120, costIndex: 5 },
    { name: "Aluminum 2024-T3", category: "aluminum", yieldStrength: 345, density: 2780, maxServiceTemp: 150, costIndex: 4 },
    // Titanium
    { name: "Ti-6Al-4V (Grade 5)", category: "titanium", yieldStrength: 880, density: 4430, maxServiceTemp: 400, costIndex: 8 },
    { name: "Ti-CP Grade 2", category: "titanium", yieldStrength: 275, density: 4510, maxServiceTemp: 300, costIndex: 7 },
    // Copper
    { name: "C110 (Copper)", category: "copper", yieldStrength: 69, density: 8940, maxServiceTemp: 200, costIndex: 4 },
    { name: "CuBe2 (Beryllium Copper)", category: "copper", yieldStrength: 1100, density: 8250, maxServiceTemp: 300, costIndex: 9 },
    // Polymers
    { name: "Nylon 6/6", category: "polymer", yieldStrength: 70, density: 1140, maxServiceTemp: 120, costIndex: 2 },
    { name: "PEEK", category: "polymer", yieldStrength: 100, density: 1300, maxServiceTemp: 260, costIndex: 8 },
    // Composites
    { name: "Carbon Fiber (CFRP)", category: "composite", yieldStrength: 600, density: 1600, maxServiceTemp: 150, costIndex: 9 },
    { name: "Glass Fiber (GFRP)", category: "composite", yieldStrength: 200, density: 1900, maxServiceTemp: 130, costIndex: 4 },
    // Cast Iron
    { name: "Gray Cast Iron (GG-25)", category: "cast-iron", yieldStrength: 170, density: 7200, maxServiceTemp: 300, costIndex: 1 },
    { name: "Ductile Cast Iron (GGG-50)", category: "cast-iron", yieldStrength: 320, density: 7100, maxServiceTemp: 350, costIndex: 2 },
];

/**
 * Score and rank materials based on criteria.
 * Higher score = better match.
 */
export function selectMaterials(criteria: MaterialCriteria, topN: number = 5): MaterialCandidate[] {
    const candidates: MaterialCandidate[] = [];

    for (const mat of MATERIAL_DB) {
        let score = 0;
        const reasons: string[] = [];

        // Filter hard constraints
        if (criteria.minYieldStrength && mat.yieldStrength < criteria.minYieldStrength) continue;
        if (criteria.maxDensity && mat.density > criteria.maxDensity) continue;
        if (criteria.maxTemperature && mat.maxServiceTemp < criteria.maxTemperature) continue;

        // Score: Strength (normalized 0-40 pts)
        score += Math.min(40, (mat.yieldStrength / 2000) * 40);
        if (mat.yieldStrength > 500) reasons.push("High strength");

        // Score: Lightweight (normalized 0-30 pts, lower density = higher score)
        score += Math.max(0, 30 - (mat.density / 9000) * 30);
        if (mat.density < 3000) reasons.push("Lightweight");

        // Score: Temperature (normalized 0-15 pts)
        score += Math.min(15, (mat.maxServiceTemp / 900) * 15);
        if (mat.maxServiceTemp > 500) reasons.push("High temperature capability");

        // Score: Cost (normalized 0-15 pts, lower cost = higher score)
        if (criteria.preferLowCost) {
            score += Math.max(0, 15 - mat.costIndex * 1.5);
            if (mat.costIndex <= 3) reasons.push("Cost-effective");
        } else {
            score += 7; // Neutral cost weighting
        }

        candidates.push({
            ...mat,
            score: Math.round(score * 10) / 10,
            reasoning: reasons.length > 0 ? reasons.join(", ") : "General purpose match"
        });
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, topN);
}

/**
 * Natural language query parser (simplified).
 * Maps common phrases to MaterialCriteria.
 */
export function parseNaturalQuery(query: string): MaterialCriteria {
    const q = query.toLowerCase();
    const criteria: MaterialCriteria = {};

    if (q.includes("strong") || q.includes("high strength") || q.includes("dayanıklı")) {
        criteria.minYieldStrength = 300;
    }
    if (q.includes("light") || q.includes("hafif") || q.includes("lightweight")) {
        criteria.maxDensity = 5000;
    }
    if (q.includes("hot") || q.includes("high temp") || q.includes("sıcak") || q.includes("temperature")) {
        criteria.maxTemperature = 300;
    }
    if (q.includes("cheap") || q.includes("ucuz") || q.includes("low cost") || q.includes("budget")) {
        criteria.preferLowCost = true;
    }
    if (q.includes("aerospace") || q.includes("havacılık")) {
        criteria.minYieldStrength = 400;
        criteria.maxDensity = 5000;
    }
    if (q.includes("automotive") || q.includes("otomotiv")) {
        criteria.minYieldStrength = 250;
        criteria.preferLowCost = true;
    }

    return criteria;
}
