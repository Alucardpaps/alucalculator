import React from 'react';

type ProfileType = 1 | 2 | 3 | 4 | 5; // Box, Tube, Angle, Channel, Beam

interface ProfileVisualizationProps {
    type: ProfileType;
    width: number;
    height: number;
    thickness: number;
    webThickness?: number;
    className?: string;
}

export const ProfileVisualization: React.FC<ProfileVisualizationProps> = ({
    type,
    width,
    height,
    thickness,
    webThickness = thickness,
    className
}) => {
    // Canvas setup
    const padding = 20;
    const viewBoxWidth = Math.max(width, height) + padding * 2;
    const viewBoxHeight = Math.max(width, height) + padding * 2;
    const cx = viewBoxWidth / 2;
    const cy = viewBoxHeight / 2;

    // Scale factor to fit nice in view
    // Since viewbox adjusts to width/height, we draw 1:1 in local coords centered at cx, cy

    const drawProfile = () => {
        const w = width;
        const h = height;
        const t = thickness;
        const wt = webThickness;

        const x = cx - w / 2;
        const y = cy - h / 2;

        switch (type) {
            case 1: // Box (Rectangular Hollow)
                return (
                    <>
                        {/* Outer */}
                        <rect x={x} y={y} width={w} height={h} stroke="#00e5ff" strokeWidth="2" fill="rgba(0, 229, 255, 0.1)" />
                        {/* Inner */}
                        <rect x={x + t} y={y + t} width={Math.max(0, w - 2 * t)} height={Math.max(0, h - 2 * t)} stroke="#00e5ff" strokeWidth="1" fill="none" strokeDasharray="4 2" />
                    </>
                );
            case 2: // Tube (Round)
                const r = w / 2;
                return (
                    <>
                        {/* Outer */}
                        <circle cx={cx} cy={cy} r={r} stroke="#00e5ff" strokeWidth="2" fill="rgba(0, 229, 255, 0.1)" />
                        {/* Inner */}
                        <circle cx={cx} cy={cy} r={Math.max(0, r - t)} stroke="#00e5ff" strokeWidth="1" fill="none" strokeDasharray="4 2" />
                    </>
                );
            case 3: // Angle (L)
                // Draw path: (0,0) -> (w,0) -> (w,t) -> (t,t) -> (t,h) -> (0,h) -> close
                const pathL = `
                    M ${x} ${y + h}
                    L ${x + w} ${y + h}
                    L ${x + w} ${y + h - t}
                    L ${x + t} ${y + h - t}
                    L ${x + t} ${y}
                    L ${x} ${y}
                    Z
                `;
                return <path d={pathL} stroke="#00e5ff" strokeWidth="2" fill="rgba(0, 229, 255, 0.1)" />;

            case 4: // Channel (U)
                // U shape: usually legs down or up? Standard is legs right or left?
                // Let's draw legs UP like [ ]
                // M (0,h) -> (w,h) -> (w,0) -> (w-t, 0) -> (w-t, h-t) -> (t, h-t) -> (t, 0) -> (0,0) -> Z
                // Actually usually legs are on dimension H. Let's assume 'C' shape.
                // Back is H, Flanges are W.

                const pathU = `
                    M ${x} ${y}
                    L ${x + w} ${y}
                    L ${x + w} ${y + t}
                    L ${x + wt} ${y + t}
                    L ${x + wt} ${y + h - t}
                    L ${x + w} ${y + h - t}
                    L ${x + w} ${y + h}
                    L ${x} ${y + h}
                    Z
                `;
                return <path d={pathU} stroke="#00e5ff" strokeWidth="2" fill="rgba(0, 229, 255, 0.1)" />;

            case 5: // I-Beam / H-Beam
                // M (0,0) -> (w,0) -> (w,t) -> (x+wt/2 + t_web/2, t) ... complex
                // Simplified I centered
                // Top Flange
                const flangeW = w;
                const flangeH = t; // Flange thickness
                const webH = h - 2 * t;
                const webW = wt; // Web thickness

                // We can construct this with 3 rects for simplicity or one polygon
                // Let's do polygon
                // Top-Left corner start

                // Centered web X ranges from (w-wt)/2 to (w+wt)/2 relative to left
                const webX1 = (w - wt) / 2;
                const webX2 = (w + wt) / 2;

                const pathI = `
                    M ${x} ${y}
                    L ${x + w} ${y}
                    L ${x + w} ${y + t}
                    L ${x + webX2} ${y + t}
                    L ${x + webX2} ${y + h - t}
                    L ${x + w} ${y + h - t}
                    L ${x + w} ${y + h}
                    L ${x} ${y + h}
                    L ${x} ${y + h - t}
                    L ${x + webX1} ${y + h - t}
                    L ${x + webX1} ${y + t}
                    L ${x} ${y + t}
                    Z
                `;
                return <path d={pathI} stroke="#00e5ff" strokeWidth="2" fill="rgba(0, 229, 255, 0.1)" />;

            default:
                return null;
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                className="max-h-[200px]"
            >
                {/* Grid background hint */}
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e2833" strokeWidth="0.5" />
                </pattern>
                <rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill="url(#grid)" />

                {drawProfile()}

                {/* Dimensions */}
                <text x={cx} y={padding / 2} fill="#666" fontSize="10" textAnchor="middle">W: {width}</text>
                <text x={padding / 2} y={cy} fill="#666" fontSize="10" textAnchor="middle" transform={`rotate(-90 ${padding / 2} ${cy})`}>H: {height}</text>
            </svg>
            <div className="text-gray-400 text-xs mt-2 font-mono">
                {type === 1 && 'Box Profile'}
                {type === 2 && 'Tube Profile'}
                {type === 3 && 'L-Angle'}
                {type === 4 && 'U-Channel'}
                {type === 5 && 'I-Beam'}
            </div>
        </div>
    );
};
