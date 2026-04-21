export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import makerjs from 'makerjs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            profileType = 'flat',
            width = 200, height = 150, holeRadius = 25,
            webHeight = 100, flangeWidth = 50, webThickness = 5, flangeThickness = 5,
            kerfLoss = 0
        } = body;

        let model: makerjs.IModel = { models: {} };

        if (profileType === 'flat') {
            const rect = new makerjs.models.Rectangle(width, height);
            rect.origin = [-width / 2, -height / 2];
            model.models = { plateOutline: rect };

            if (holeRadius > 0) {
                model.paths = {
                    centerHole: new makerjs.paths.Circle([0, 0], holeRadius)
                };
            }
        } else {
            // For structural profiles, we draw a continuous contour using ConnectTheDots
            let points: [number, number][] = [];

            const wH = webHeight;
            const fW = flangeWidth;
            const wT = webThickness;
            const fT = flangeThickness;
            const cx = -fW / 2;
            const cy = -wH / 2;

            if (profileType === 'L-bracket') {
                points = [
                    [cx, cy],
                    [cx + fW, cy],
                    [cx + fW, cy + fT],
                    [cx + wT, cy + fT],
                    [cx + wT, cy + wH],
                    [cx, cy + wH]
                ];
            } else if (profileType === 'U-channel') {
                points = [
                    [cx, cy],
                    [cx + fW, cy],
                    [cx + fW, cy + wH],
                    [cx + fW - fT, cy + wH],
                    [cx + fW - fT, cy + wT],
                    [cx + fT, cy + wT],
                    [cx + fT, cy + wH],
                    [cx, cy + wH]
                ];
            } else if (profileType === 'I-beam') {
                points = [
                    [cx, cy],
                    [cx + fW, cy],
                    [cx + fW, cy + fT],
                    [cx + fW / 2 + wT / 2, cy + fT],
                    [cx + fW / 2 + wT / 2, cy + wH - fT],
                    [cx + fW, cy + wH - fT],
                    [cx + fW, cy + wH],
                    [cx, cy + wH],
                    [cx, cy + wH - fT],
                    [cx + fW / 2 - wT / 2, cy + wH - fT],
                    [cx + fW / 2 - wT / 2, cy + fT],
                    [cx, cy + fT]
                ];
            }

            model.models = {
                profileOutline: new makerjs.models.ConnectTheDots(true, points)
            };
        }

        // Apply Mod 3: Kerf Loss Compensation
        if (kerfLoss > 0) {
            model = makerjs.model.outline(model, kerfLoss / 2);
        }

        const dxfOutput = makerjs.exporter.toDXF(model);

        return new Response(dxfOutput, {
            status: 200,
            headers: {
                'Content-Type': 'application/dxf',
                'Content-Disposition': `attachment; filename="AluCalc_${profileType}.dxf"`
            }
        });

    } catch (error) {
        console.error('API /export-dxf Error:', error);
        return NextResponse.json({ error: 'Internal Server Error generating DXF' }, { status: 500 });
    }
}
