export type ShapeType = 'box' | 'sheet' | 'pipe' | 'bar' | 'ibeam' | 'channel' | 'angle' | 'tee' | 'rectangle';

export interface SectionProps {
    area: number;       // mm^2
    perimeter: number;  // mm
    Ix: number;         // cm^4 (mm^4 / 10000)
    Iy: number;         // cm^4
    J: number;          // cm^4 - Polar moment of inertia (for torsion)
    Wx: number;         // cm^3 (mm^3 / 1000)
    Wy: number;         // cm^3
    rx: number;         // cm (mm / 10)
    ry: number;         // cm
    // Raw mm values for direct use in stress calcs
    area_mm2: number;
    Ix_mm4: number;
    Iy_mm4: number;
    J_mm4: number;
    Wx_mm3: number;
    Wy_mm3: number;
}

export interface ShapeDimensions {
    width?: number;
    height?: number;
    thickness?: number;
    wallThickness?: number;
    diameter?: number;
    length?: number;
    flangeWidth?: number;   // I-beam, channel, tee
    flangeThickness?: number;
    webThickness?: number;
    legWidth?: number;      // angle
    legThickness?: number;
}

const emptyProps = (): SectionProps => ({
    area: 0, perimeter: 0, Ix: 0, Iy: 0, J: 0, Wx: 0, Wy: 0, rx: 0, ry: 0,
    area_mm2: 0, Ix_mm4: 0, Iy_mm4: 0, J_mm4: 0, Wx_mm3: 0, Wy_mm3: 0
});

export function calculateSectionProperties(
    shape: ShapeType,
    d: ShapeDimensions
): SectionProps {
    const res = emptyProps();

    try {
        if (shape === 'box') {
            const B = d.width || 0;
            const H = d.height || 0;
            const t = d.wallThickness || 0;

            if (B <= 2 * t || H <= 2 * t) return res;

            const b = B - 2 * t;
            const h = H - 2 * t;

            res.area_mm2 = (B * H) - (b * h);
            res.perimeter = 2 * (B + H) + 2 * (b + h);

            res.Ix_mm4 = (B * Math.pow(H, 3) - b * Math.pow(h, 3)) / 12;
            res.Iy_mm4 = (H * Math.pow(B, 3) - h * Math.pow(b, 3)) / 12;
            res.J_mm4 = res.Ix_mm4 + res.Iy_mm4; // Approx for thin-walled

            res.Wx_mm3 = res.Ix_mm4 / (H / 2);
            res.Wy_mm3 = res.Iy_mm4 / (B / 2);
        }
        else if (shape === 'pipe') {
            const D = d.diameter || 0;
            const t = d.wallThickness || 0;

            if (D <= 2 * t) return res;

            const di = D - 2 * t;

            res.area_mm2 = (Math.PI / 4) * (Math.pow(D, 2) - Math.pow(di, 2));
            res.perimeter = (Math.PI * D) + (Math.PI * di);

            res.Ix_mm4 = (Math.PI / 64) * (Math.pow(D, 4) - Math.pow(di, 4));
            res.Iy_mm4 = res.Ix_mm4;
            res.J_mm4 = (Math.PI / 32) * (Math.pow(D, 4) - Math.pow(di, 4)); // Polar

            res.Wx_mm3 = res.Ix_mm4 / (D / 2);
            res.Wy_mm3 = res.Wx_mm3;
        }
        else if (shape === 'bar') {
            const D = d.diameter || 0;

            res.area_mm2 = (Math.PI / 4) * Math.pow(D, 2);
            res.perimeter = Math.PI * D;

            res.Ix_mm4 = (Math.PI * Math.pow(D, 4)) / 64;
            res.Iy_mm4 = res.Ix_mm4;
            res.J_mm4 = (Math.PI * Math.pow(D, 4)) / 32; // Polar for solid circular

            res.Wx_mm3 = res.Ix_mm4 / (D / 2);
            res.Wy_mm3 = res.Wx_mm3;
        }
        else if (shape === 'sheet' || shape === 'rectangle') {
            const B = d.width || 0;
            const t = d.thickness || d.height || 0;

            res.area_mm2 = B * t;
            res.perimeter = 2 * (B + t);

            res.Ix_mm4 = (B * Math.pow(t, 3)) / 12;
            res.Iy_mm4 = (t * Math.pow(B, 3)) / 12;
            // Torsion for rectangle: approx J = k * a * b^3 (a > b)
            const a = Math.max(B, t);
            const b = Math.min(B, t);
            const k = 1 / 3 - 0.21 * (b / a) * (1 - Math.pow(b / a, 4) / 12);
            res.J_mm4 = k * a * Math.pow(b, 3);

            res.Wx_mm3 = res.Ix_mm4 / (t / 2);
            res.Wy_mm3 = res.Iy_mm4 / (B / 2);
        }
        else if (shape === 'ibeam') {
            // I-Beam: H = height, B = flange width, tf = flange thickness, tw = web thickness
            const H = d.height || 100;
            const B = d.flangeWidth || d.width || 50;
            const tf = d.flangeThickness || 8;
            const tw = d.webThickness || 5;

            const hw = H - 2 * tf; // Web height

            // Area = 2 flanges + web
            res.area_mm2 = 2 * (B * tf) + (hw * tw);
            res.perimeter = 2 * B + 2 * H + 2 * hw + 2 * (B - tw);

            // Ix about horizontal axis (strong axis)
            res.Ix_mm4 = (B * Math.pow(H, 3) - (B - tw) * Math.pow(hw, 3)) / 12;
            // Iy about vertical axis (weak axis)
            res.Iy_mm4 = (2 * tf * Math.pow(B, 3) + hw * Math.pow(tw, 3)) / 12;
            res.J_mm4 = (2 * B * Math.pow(tf, 3) + hw * Math.pow(tw, 3)) / 3;

            res.Wx_mm3 = res.Ix_mm4 / (H / 2);
            res.Wy_mm3 = res.Iy_mm4 / (B / 2);
        }
        else if (shape === 'channel') {
            // C-Channel: H = height, B = flange width, tf = flange thickness, tw = web thickness
            const H = d.height || 100;
            const B = d.flangeWidth || d.width || 50;
            const tf = d.flangeThickness || 8;
            const tw = d.webThickness || 6;

            const hw = H - 2 * tf;

            res.area_mm2 = 2 * (B * tf) + (hw * tw);
            res.perimeter = 2 * B + H + hw + 2 * (B - tw);

            res.Ix_mm4 = (B * Math.pow(H, 3) - (B - tw) * Math.pow(hw, 3)) / 12;
            res.Iy_mm4 = (2 * tf * Math.pow(B, 3) + hw * Math.pow(tw, 3)) / 12;
            res.J_mm4 = (2 * B * Math.pow(tf, 3) + hw * Math.pow(tw, 3)) / 3;

            res.Wx_mm3 = res.Ix_mm4 / (H / 2);
            res.Wy_mm3 = res.Iy_mm4 / (B); // edge at y = B
        }
        else if (shape === 'angle') {
            // L-Angle: L = leg width, t = thickness (equal angle)
            const L = d.legWidth || d.width || 50;
            const t = d.legThickness || d.thickness || 5;

            res.area_mm2 = 2 * L * t - t * t; // Two legs minus corner overlap
            res.perimeter = 4 * L;

            // For equal angle about centroidal axes:
            res.Ix_mm4 = (t * Math.pow(L, 3) + L * Math.pow(t, 3)) / 12 - res.area_mm2 * Math.pow((L - t / 2) / 2, 2);
            res.Iy_mm4 = res.Ix_mm4; // Equal angle
            res.J_mm4 = (2 * L * Math.pow(t, 3)) / 3;

            res.Wx_mm3 = res.Ix_mm4 / (L * 0.707);
            res.Wy_mm3 = res.Wy_mm3;
        }
        else if (shape === 'tee') {
            // T-Section: H = stem height, B = flange width, tf = flange thickness, tw = stem thickness
            const H = d.height || 80;
            const B = d.flangeWidth || d.width || 60;
            const tf = d.flangeThickness || 8;
            const tw = d.webThickness || d.thickness || 6;

            const hs = H - tf; // Stem height

            res.area_mm2 = B * tf + hs * tw;

            // Centroid from bottom
            const yBar = ((B * tf) * (H - tf / 2) + (hs * tw) * (hs / 2)) / res.area_mm2;

            res.Ix_mm4 = (B * Math.pow(tf, 3)) / 12 + (B * tf) * Math.pow(H - tf / 2 - yBar, 2)
                + (tw * Math.pow(hs, 3)) / 12 + (tw * hs) * Math.pow(hs / 2 - yBar, 2);
            res.Iy_mm4 = (tf * Math.pow(B, 3) + hs * Math.pow(tw, 3)) / 12;
            res.J_mm4 = (B * Math.pow(tf, 3) + hs * Math.pow(tw, 3)) / 3;

            res.Wx_mm3 = res.Ix_mm4 / Math.max(yBar, H - yBar);
            res.Wy_mm3 = res.Iy_mm4 / (B / 2);
        }

        // Convert to standard units (cm)
        res.area = res.area_mm2;
        res.Ix = res.Ix_mm4 / 10000;
        res.Iy = res.Iy_mm4 / 10000;
        res.J = res.J_mm4 / 10000;
        res.Wx = res.Wx_mm3 / 1000;
        res.Wy = res.Wy_mm3 / 1000;
        res.rx = res.area_mm2 > 0 ? Math.sqrt(res.Ix_mm4 / res.area_mm2) / 10 : 0;
        res.ry = res.area_mm2 > 0 ? Math.sqrt(res.Iy_mm4 / res.area_mm2) / 10 : 0;

        return res;

    } catch (e) {
        console.error("Math Error", e);
        return emptyProps();
    }
}

// Shape icons/labels for UI
export const SHAPE_INFO: Record<ShapeType, { icon: string; name: string; nameTr: string }> = {
    box: { icon: '▢', name: 'Hollow Box', nameTr: 'Kutu Profil' },
    pipe: { icon: '◯', name: 'Pipe/Tube', nameTr: 'Boru' },
    bar: { icon: '●', name: 'Solid Round', nameTr: 'Masif Çubuk' },
    sheet: { icon: '▬', name: 'Flat Sheet', nameTr: 'Levha' },
    rectangle: { icon: '▮', name: 'Solid Rectangle', nameTr: 'Masif Dikdörtgen' },
    ibeam: { icon: 'Ⅰ', name: 'I-Beam', nameTr: 'I Profil' },
    channel: { icon: 'C', name: 'C-Channel', nameTr: 'C Profil' },
    angle: { icon: 'L', name: 'L-Angle', nameTr: 'Köşebent' },
    tee: { icon: 'T', name: 'T-Section', nameTr: 'T Profil' },
};
