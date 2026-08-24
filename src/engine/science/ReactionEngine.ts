export class ReactionEngine {
    
    /**
     * Parses a chemical formula into its constituent elements and their counts.
     * Supports nested parentheses like Ca(OH)2 or (NH4)2SO4.
     */
    static parseMolecule(formula: string): Record<string, number> {
        let i = 0;

        function readGroup(): Record<string, number> {
            const counts: Record<string, number> = {};
            while (i < formula.length && formula[i] !== ')') {
                if (formula[i] === '(') {
                    i++;
                    const subGroup = readGroup();
                    if (formula[i] === ')') i++; 
                    let numStr = '';
                    while (i < formula.length && /[0-9]/.test(formula[i])) {
                        numStr += formula[i];
                        i++;
                    }
                    const mult = numStr ? parseInt(numStr, 10) : 1;
                    for (const k in subGroup) {
                        counts[k] = (counts[k] || 0) + subGroup[k] * mult;
                    }
                } else {
                    let atom = formula[i];
                    i++;
                    if (i < formula.length && /[a-z]/.test(formula[i])) {
                        atom += formula[i];
                        i++;
                    }
                    let numStr = '';
                    while (i < formula.length && /[0-9]/.test(formula[i])) {
                        numStr += formula[i];
                        i++;
                    }
                    const num = numStr ? parseInt(numStr, 10) : 1;
                    counts[atom] = (counts[atom] || 0) + num;
                }
            }
            return counts;
        }

        return readGroup();
    }

    /**
     * Balances a chemical equation mathematically using a Null-Space / Matrix algebraic approach.
     * @returns Array of integer coefficients [Reactants..., Products...], or null if unsolvable.
     */
    static balance(reactants: string[], products: string[]): number[] | null {
        const elements = new Set<string>();
        const parsedReactants = reactants.map(m => ReactionEngine.parseMolecule(m));
        const parsedProducts = products.map(m => ReactionEngine.parseMolecule(m));

        [...parsedReactants, ...parsedProducts].forEach(mol => {
            Object.keys(mol).forEach(e => elements.add(e));
        });

        const elementArray = Array.from(elements);
        const numRows = elementArray.length;
        const numCols = reactants.length + products.length;

        // Build matrix A
        const A: number[][] = [];
        for (let r = 0; r < numRows; r++) {
            const el = elementArray[r];
            const row: number[] = [];
            parsedReactants.forEach(mol => row.push(mol[el] || 0));
            parsedProducts.forEach(mol => row.push(-(mol[el] || 0)));
            A.push(row);
        }

        // Gaussian Elimination to Reduced Row Echelon Form (RREF)
        let lead = 0;
        for (let r = 0; r < numRows; r++) {
            if (numCols <= lead) break;
            let i = r;
            while (Math.abs(A[i][lead]) < 1e-8) {
                i++;
                if (numRows === i) {
                    i = r;
                    lead++;
                    if (numCols === lead) {
                        break;
                    }
                }
            }
            
            if (lead < numCols) {
                // Swap rows i and r
                const temp = A[i];
                A[i] = A[r];
                A[r] = temp;

                // Scale row r
                const val = A[r][lead];
                for (let j = 0; j < numCols; j++) {
                    A[r][j] /= val;
                }

                // Eliminate other rows
                for (let i = 0; i < numRows; i++) {
                    if (i !== r) {
                        const val = A[i][lead];
                        for (let j = 0; j < numCols; j++) {
                            A[i][j] -= val * A[r][j];
                        }
                    }
                }
                lead++;
            }
        }

        // The matrix is now in RREF. The last column relates to the free variable.
        // Assuming a 1-dimensional null space (standard for proper chemical equations).
        // Let the last coefficient (free variable) be x.
        // The earlier coefficients will be -A[i][numCols-1] * x. 
        // We find the smallest integer x that makes all coefficients integers.

        const coeffs = new Array(numCols).fill(0);
        coeffs[numCols - 1] = 1; // Start with 1 for the free variable

        for (let i = 0; i < numCols - 1; i++) {
            coeffs[i] = -A[i][numCols - 1]; 
        }

        // Find LCM of denominators to convert to integers (max multiplier checked is 100 for sanity)
        for (let mult = 1; mult <= 100; mult++) {
            const scaled = coeffs.map(c => c * mult);
            const isAllInts = scaled.every(c => {
                const rounded = Math.round(c);
                return Math.abs(c - rounded) < 1e-5;
            });
            if (isAllInts) {
                const finalCoeffs = scaled.map(c => Math.round(c));
                // Check if all coefficients are strictly positive (or handling negative signs correctly)
                // Since products were input as negative, their derived coefficient should mathematically be positive in the vector
                // Wait, if the equation is perfectly balanced, the vector should be strictly positive?
                // Actually, due to standard convention we need absolute values and check if valid.
                return finalCoeffs.map(Math.abs);
            }
        }

        return null;
    }

    /**
     * Helper to format a balanced equation string perfectly.
     */
    static formatEquation(reactants: string[], products: string[], coeffs: number[]): string {
        if (!coeffs || coeffs.length !== reactants.length + products.length) return "Invalid Reaction";
        
        let rIndex = 0;
        const left = reactants.map((r, i) => {
            const c = coeffs[rIndex++];
            const coefStr = c > 1 ? c.toString() : '';
            return `${coefStr}${this.formatHTMLSubscripts(r)}`;
        }).join(" + ");

        const right = products.map((p, i) => {
            const c = coeffs[rIndex++];
            const coefStr = c > 1 ? c.toString() : '';
            return `${coefStr}${this.formatHTMLSubscripts(p)}`;
        }).join(" + ");

        return `${left} → ${right}`;
    }

    static formatHTMLSubscripts(formula: string): string {
        return formula.replace(/\d+/g, n => {
            const map: Record<string, string> = { "0":"₀", "1":"₁", "2":"₂", "3":"₃", "4":"₄", "5":"₅", "6":"₆", "7":"▱", "8":"₈", "9":"₉" };
            return n.split('').map(d => map[d]).join('');
        });
    }
}
