/**
 * Closed-contour section properties via the Shoelace formula and Green's theorem.
 *
 * All polygon inputs are in millimetres. Returned second moments are mm⁴,
 * section moduli mm³, radii of gyration mm. Callers that need cm⁴ / cm³
 * should divide Ix,Iy,J by 10⁴ and Wx,Wy by 10³.
 *
 * Sign convention: counter-clockwise vertices produce a positive area.
 * Holes may be supplied as clockwise polygons (negative area) or as a
 * separate hole list that is subtracted.
 */

export interface Point2 {
    x: number;
    y: number;
}

export interface PolygonSectionProperties {
    area: number;          // mm² (always ≥ 0)
    signedArea: number;    // mm² (CCW +, CW −)
    perimeter: number;     // mm
    cx: number;            // centroid x, mm
    cy: number;            // centroid y, mm
    Ix: number;            // mm⁴ about centroidal x-axis
    Iy: number;            // mm⁴ about centroidal y-axis
    Ixy: number;           // mm⁴ product of inertia, centroidal
    J: number;             // mm⁴ polar = Ix + Iy
    Wx: number;            // mm³ = Ix / y_max
    Wy: number;            // mm³ = Iy / x_max
    rx: number;            // mm = sqrt(Ix / A)
    ry: number;            // mm = sqrt(Iy / A)
    IxxOrigin: number;
    IyyOrigin: number;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
}

const EPS = 1e-12;

export function almostEqual(a: number, b: number, tol = 1e-6): boolean {
    return Math.abs(a - b) <= tol;
}

export function pointDist(a: Point2, b: Point2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/** Drop consecutive duplicates and the implicit closing vertex if it repeats the first. */
export function sanitizePolygon(raw: Point2[], closeTol = 1e-6): Point2[] {
    if (!raw || raw.length === 0) return [];
    const pts: Point2[] = [];
    for (const p of raw) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        const prev = pts[pts.length - 1];
        if (prev && pointDist(prev, p) <= closeTol) continue;
        pts.push({ x: p.x, y: p.y });
    }
    if (pts.length >= 2 && pointDist(pts[0], pts[pts.length - 1]) <= closeTol) {
        pts.pop();
    }
    return pts;
}

/**
 * Shoelace / surveyor's formula.
 * A = 1/2 Σ (x_i y_{i+1} − x_{i+1} y_i)
 */
export function shoelaceSignedArea(polygon: Point2[]): number {
    const pts = sanitizePolygon(polygon);
    const n = pts.length;
    if (n < 3) return 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        sum += a.x * b.y - b.x * a.y;
    }
    return 0.5 * sum;
}

export function shoelaceArea(polygon: Point2[]): number {
    return Math.abs(shoelaceSignedArea(polygon));
}

export function polygonPerimeter(polygon: Point2[]): number {
    const pts = sanitizePolygon(polygon);
    const n = pts.length;
    if (n < 2) return 0;
    let len = 0;
    for (let i = 0; i < n; i++) {
        len += pointDist(pts[i], pts[(i + 1) % n]);
    }
    return len;
}

export function ensureWinding(polygon: Point2[], ccw: boolean): Point2[] {
    const pts = sanitizePolygon(polygon);
    const signed = shoelaceSignedArea(pts);
    const isCcw = signed > 0;
    if (isCcw === ccw) return pts;
    return pts.slice().reverse();
}

/**
 * Green's theorem integrals for a single simple polygon (no holes).
 *
 *   A   = 1/2 ∮ (x dy − y dx)
 *   Sx  = 1/6 ∮ (y_i + y_{i+1}) (x_i y_{i+1} − x_{i+1} y_i)   → A * Cy
 *   Sy  = 1/6 ∮ (x_i + x_{i+1}) (x_i y_{i+1} − x_{i+1} y_i)   → A * Cx
 *   Ixx = 1/12 ∮ (y_i² + y_i y_{i+1} + y_{i+1}²) cross
 *   Iyy = 1/12 ∮ (x_i² + x_i x_{i+1} + x_{i+1}²) cross
 *   Ixy = 1/24 ∮ (x_i y_{i+1} + 2 x_i y_i + 2 x_{i+1} y_{i+1} + x_{i+1} y_i) cross
 */
export function greenIntegrals(polygon: Point2[]): {
    signedArea: number;
    sx: number;
    sy: number;
    ixx: number;
    iyy: number;
    ixy: number;
    perimeter: number;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
} {
    const pts = sanitizePolygon(polygon);
    const n = pts.length;
    const empty = { signedArea: 0, sx: 0, sy: 0, ixx: 0, iyy: 0, ixy: 0, perimeter: 0, xmin: 0, xmax: 0, ymin: 0, ymax: 0 };
    if (n < 3) return empty;

    let twiceA = 0;
    let sx6 = 0;
    let sy6 = 0;
    let ixx12 = 0;
    let iyy12 = 0;
    let ixy24 = 0;
    let perimeter = 0;
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;

    for (let i = 0; i < n; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        const cross = a.x * b.y - b.x * a.y;
        twiceA += cross;
        sy6 += (a.x + b.x) * cross;
        sx6 += (a.y + b.y) * cross;
        ixx12 += (a.y * a.y + a.y * b.y + b.y * b.y) * cross;
        iyy12 += (a.x * a.x + a.x * b.x + b.x * b.x) * cross;
        ixy24 += (a.x * b.y + 2 * a.x * a.y + 2 * b.x * b.y + b.x * a.y) * cross;
        perimeter += pointDist(a, b);
        if (a.x < xmin) xmin = a.x;
        if (a.x > xmax) xmax = a.x;
        if (a.y < ymin) ymin = a.y;
        if (a.y > ymax) ymax = a.y;
    }

    return {
        signedArea: 0.5 * twiceA,
        sx: sx6 / 6,
        sy: sy6 / 6,
        ixx: ixx12 / 12,
        iyy: iyy12 / 12,
        ixy: ixy24 / 24,
        perimeter,
        xmin,
        xmax,
        ymin,
        ymax,
    };
}

export function emptySectionProperties(): PolygonSectionProperties {
    return {
        area: 0, signedArea: 0, perimeter: 0, cx: 0, cy: 0,
        Ix: 0, Iy: 0, Ixy: 0, J: 0, Wx: 0, Wy: 0, rx: 0, ry: 0,
        IxxOrigin: 0, IyyOrigin: 0,
        xmin: 0, xmax: 0, ymin: 0, ymax: 0,
    };
}

/**
 * Section properties of a region defined by one outer contour and optional holes.
 * Outer is forced CCW; holes are forced CW so Green's theorem subtracts them.
 */
export function computeSectionProperties(
    outer: Point2[],
    holes: Point2[][] = []
): PolygonSectionProperties {
    const outerCcw = ensureWinding(outer, true);
    const outerI = greenIntegrals(outerCcw);
    if (Math.abs(outerI.signedArea) < EPS) return emptySectionProperties();

    let signedArea = outerI.signedArea;
    let sx = outerI.sx;
    let sy = outerI.sy;
    let ixx = outerI.ixx;
    let iyy = outerI.iyy;
    let ixy = outerI.ixy;
    let perimeter = outerI.perimeter;
    let xmin = outerI.xmin, xmax = outerI.xmax, ymin = outerI.ymin, ymax = outerI.ymax;

    for (const hole of holes) {
        const holeCw = ensureWinding(hole, false);
        const h = greenIntegrals(holeCw);
        signedArea += h.signedArea;
        sx += h.sx;
        sy += h.sy;
        ixx += h.ixx;
        iyy += h.iyy;
        ixy += h.ixy;
        perimeter += h.perimeter;
    }

    const area = Math.abs(signedArea);
    if (area < EPS) return emptySectionProperties();

    const cx = sy / signedArea;
    const cy = sx / signedArea;

    // Parallel-axis shift from origin to centroid
    const Ix = ixx - area * cy * cy;
    const Iy = iyy - area * cx * cx;
    const Ixy = ixy - area * cx * cy;

    const yMax = Math.max(Math.abs(ymax - cy), Math.abs(ymin - cy), EPS);
    const xMax = Math.max(Math.abs(xmax - cx), Math.abs(xmin - cx), EPS);

    return {
        area,
        signedArea,
        perimeter,
        cx,
        cy,
        Ix: Math.abs(Ix),
        Iy: Math.abs(Iy),
        Ixy,
        J: Math.abs(Ix) + Math.abs(Iy),
        Wx: Math.abs(Ix) / yMax,
        Wy: Math.abs(Iy) / xMax,
        rx: Math.sqrt(Math.max(0, Math.abs(Ix) / area)),
        ry: Math.sqrt(Math.max(0, Math.abs(Iy) / area)),
        IxxOrigin: ixx,
        IyyOrigin: iyy,
        xmin,
        xmax,
        ymin,
        ymax,
    };
}

/** Exact circle (avoids tessellation error). Hole circles subtract. */
export function circleSectionProperties(cx: number, cy: number, radius: number, asHole = false): PolygonSectionProperties {
    const r = Math.abs(radius);
    const sign = asHole ? -1 : 1;
    const area = sign * Math.PI * r * r;
    const absA = Math.abs(area);
    const I = sign * (Math.PI * r * r * r * r) / 4;
    const yMax = r;
    const xMax = r;
    return {
        area: absA,
        signedArea: area,
        perimeter: 2 * Math.PI * r,
        cx,
        cy,
        Ix: Math.abs(I),
        Iy: Math.abs(I),
        Ixy: 0,
        J: 2 * Math.abs(I),
        Wx: Math.abs(I) / Math.max(yMax, EPS),
        Wy: Math.abs(I) / Math.max(xMax, EPS),
        rx: r / 2,
        ry: r / 2,
        IxxOrigin: I + absA * cy * cy,
        IyyOrigin: I + absA * cx * cx,
        xmin: cx - r,
        xmax: cx + r,
        ymin: cy - r,
        ymax: cy + r,
    };
}

export function sampleCircle(cx: number, cy: number, radius: number, segments = 64, clockwise = false): Point2[] {
    const pts: Point2[] = [];
    const n = Math.max(8, segments);
    const dir = clockwise ? -1 : 1;
    for (let i = 0; i < n; i++) {
        const a = dir * (i / n) * Math.PI * 2;
        pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
    }
    return pts;
}

export function sampleArc(
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    segments = 24,
    ccw = true
): Point2[] {
    let sweep = endAngle - startAngle;
    if (ccw) {
        while (sweep <= 0) sweep += Math.PI * 2;
        while (sweep > Math.PI * 2) sweep -= Math.PI * 2;
    } else {
        while (sweep >= 0) sweep -= Math.PI * 2;
        while (sweep < -Math.PI * 2) sweep += Math.PI * 2;
    }
    const n = Math.max(2, Math.ceil(segments * (Math.abs(sweep) / (Math.PI * 2))));
    const pts: Point2[] = [];
    for (let i = 0; i <= n; i++) {
        const a = startAngle + (sweep * i) / n;
        pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
    }
    return pts;
}

/**
 * Convert an LWPOLYLINE bulge (tan of 1/4 included angle) into sampled points
 * from `from` to `to`, excluding `from` itself.
 */
export function bulgeToPoints(from: Point2, to: Point2, bulge: number, minSeg = 8): Point2[] {
    if (!Number.isFinite(bulge) || Math.abs(bulge) < 1e-8) {
        return [to];
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const chord = Math.sqrt(dx * dx + dy * dy);
    if (chord < EPS) return [to];

    const included = 4 * Math.atan(bulge);
    const sagitta = (bulge * chord) / 2;
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const nx = -dy / chord;
    const ny = dx / chord;
    const radius = ((chord / 2) ** 2 + sagitta ** 2) / (2 * Math.abs(sagitta));
    const sign = bulge >= 0 ? 1 : -1;
    const offset = radius - Math.abs(sagitta);
    const cx = mx + nx * offset * sign;
    const cy = my + ny * offset * sign;

    const a0 = Math.atan2(from.y - cy, from.x - cx);
    let a1 = Math.atan2(to.y - cy, to.x - cx);
    if (bulge > 0) {
        while (a1 <= a0) a1 += Math.PI * 2;
    } else {
        while (a1 >= a0) a1 -= Math.PI * 2;
    }
    const r = Math.hypot(from.x - cx, from.y - cy);
    const segs = Math.max(minSeg, Math.ceil(Math.abs(included) / (Math.PI / 16)));
    const pts = sampleArc(cx, cy, r, a0, a1, segs, bulge > 0);
    return pts.slice(1);
}

export function formatSectionPrompt(p: PolygonSectionProperties): string {
    const a = p.area.toFixed(2);
    const ix = (p.Ix / 1e4).toFixed(4);
    const iy = (p.Iy / 1e4).toFixed(4);
    const wx = (p.Wx / 1e3).toFixed(3);
    return `A=${a} mm²  Ix=${ix} cm⁴  Iy=${iy} cm⁴  Wx=${wx} cm³  C=(${p.cx.toFixed(2)}, ${p.cy.toFixed(2)})`;
}
