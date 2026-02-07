/**
 * Dimension Renderer - SVG-based CAD dimension annotations
 * Renders linear, angular, and radius dimensions with proper CAD styling
 */

'use client';

import React from 'react';
import { Dimension, DimensionStyle, Point } from '@/store/CADCanvasStore';

// ============================================
// Types
// ============================================

interface DimensionRendererProps {
    dimensions: Dimension[];
    zoom: number;
}

interface LinearDimensionProps {
    dimension: Dimension;
    zoom: number;
}

// ============================================
// Utility Functions
// ============================================

const distance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const angle = (p1: Point, p2: Point): number => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

const polarPoint = (origin: Point, angle: number, distance: number): Point => {
    return {
        x: origin.x + Math.cos(angle) * distance,
        y: origin.y + Math.sin(angle) * distance
    };
};

const perpendicular = (angle: number): number => {
    return angle + Math.PI / 2;
};

// ============================================
// Arrow Head Component
// ============================================

const ArrowHead: React.FC<{
    position: Point;
    angle: number;
    size: number;
    color: string;
}> = ({ position, angle, size, color }) => {
    const p1 = polarPoint(position, angle + Math.PI + Math.PI / 6, size);
    const p2 = polarPoint(position, angle + Math.PI - Math.PI / 6, size);

    return (
        <polygon
            points={`${position.x},${position.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
            fill={color}
        />
    );
};

// ============================================
// Linear Dimension Component
// ============================================

const LinearDimension: React.FC<LinearDimensionProps> = ({ dimension, zoom }) => {
    const { startPoint, endPoint, offsetDistance, displayValue, tolerance, style } = dimension;

    // Calculate dimension line geometry
    const lineAngle = angle(startPoint, endPoint);
    const perpAngle = perpendicular(lineAngle);

    // Extension line endpoints
    const ext1Start = startPoint;
    const ext1End = polarPoint(startPoint, perpAngle, offsetDistance);
    const ext2Start = endPoint;
    const ext2End = polarPoint(endPoint, perpAngle, offsetDistance);

    // Dimension line endpoints (slightly inside extension lines)
    const dimStart = polarPoint(ext1End, lineAngle, style.extensionLineGap);
    const dimEnd = polarPoint(ext2End, lineAngle + Math.PI, style.extensionLineGap);

    // Extension line overshoot
    const ext1Overshoot = polarPoint(ext1End, perpAngle, style.extensionLineOvershoot);
    const ext2Overshoot = polarPoint(ext2End, perpAngle, style.extensionLineOvershoot);

    // Text position (center of dimension line)
    const textPosition = {
        x: (dimStart.x + dimEnd.x) / 2,
        y: (dimStart.y + dimEnd.y) / 2
    };

    // Text rotation (keep text readable)
    let textAngle = (lineAngle * 180) / Math.PI;
    if (textAngle > 90 || textAngle < -90) {
        textAngle += 180;
    }

    // Combine display value with tolerance
    const fullText = tolerance ? `${displayValue} ${tolerance}` : displayValue;

    // Adjust font size based on zoom
    const fontSize = style.textSize / zoom;

    return (
        <g className="cad-dimension linear-dimension">
            {/* Extension Lines */}
            <line
                x1={ext1Start.x}
                y1={ext1Start.y}
                x2={ext1Overshoot.x}
                y2={ext1Overshoot.y}
                stroke={style.lineColor}
                strokeWidth={1 / zoom}
                strokeDasharray={`${2 / zoom} ${2 / zoom}`}
            />
            <line
                x1={ext2Start.x}
                y1={ext2Start.y}
                x2={ext2Overshoot.x}
                y2={ext2Overshoot.y}
                stroke={style.lineColor}
                strokeWidth={1 / zoom}
                strokeDasharray={`${2 / zoom} ${2 / zoom}`}
            />

            {/* Dimension Line */}
            <line
                x1={dimStart.x}
                y1={dimStart.y}
                x2={dimEnd.x}
                y2={dimEnd.y}
                stroke={style.lineColor}
                strokeWidth={1.5 / zoom}
            />

            {/* Arrow Heads */}
            <ArrowHead
                position={dimStart}
                angle={lineAngle}
                size={style.arrowSize / zoom}
                color={style.lineColor}
            />
            <ArrowHead
                position={dimEnd}
                angle={lineAngle + Math.PI}
                size={style.arrowSize / zoom}
                color={style.lineColor}
            />

            {/* Dimension Text */}
            <g transform={`translate(${textPosition.x}, ${textPosition.y}) rotate(${textAngle})`}>
                {/* Text Background */}
                <rect
                    x={-fullText.length * fontSize * 0.3}
                    y={-fontSize * 0.7}
                    width={fullText.length * fontSize * 0.6}
                    height={fontSize * 1.2}
                    fill="rgba(30, 30, 30, 0.9)"
                    rx={2 / zoom}
                />
                {/* Text */}
                <text
                    x={0}
                    y={fontSize * 0.3}
                    textAnchor="middle"
                    fill={style.textColor}
                    fontSize={fontSize}
                    fontFamily="monospace"
                    fontWeight="bold"
                >
                    {fullText}
                </text>
            </g>
        </g>
    );
};

// ============================================
// Angular Dimension Component
// ============================================

const AngularDimension: React.FC<{ dimension: Dimension; zoom: number }> = ({ dimension, zoom }) => {
    const { startPoint, endPoint, displayValue, style } = dimension;

    // For angular dimensions, startPoint is the vertex, endPoint defines the arc
    const radius = distance(startPoint, endPoint) * 0.6;
    const arcAngle = angle(startPoint, endPoint);

    // Arc path
    const arcStart = polarPoint(startPoint, 0, radius);
    const arcEnd = polarPoint(startPoint, arcAngle, radius);

    const largeArc = Math.abs(arcAngle) > Math.PI ? 1 : 0;
    const sweep = arcAngle > 0 ? 1 : 0;

    const arcPath = `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${arcEnd.x} ${arcEnd.y}`;

    // Text position (middle of arc)
    const textPosition = polarPoint(startPoint, arcAngle / 2, radius + 15 / zoom);

    return (
        <g className="cad-dimension angular-dimension">
            {/* Arc */}
            <path
                d={arcPath}
                fill="none"
                stroke={style.lineColor}
                strokeWidth={1.5 / zoom}
            />

            {/* Reference lines */}
            <line
                x1={startPoint.x}
                y1={startPoint.y}
                x2={arcStart.x}
                y2={arcStart.y}
                stroke={style.lineColor}
                strokeWidth={1 / zoom}
                strokeDasharray={`${2 / zoom} ${2 / zoom}`}
            />
            <line
                x1={startPoint.x}
                y1={startPoint.y}
                x2={arcEnd.x}
                y2={arcEnd.y}
                stroke={style.lineColor}
                strokeWidth={1 / zoom}
                strokeDasharray={`${2 / zoom} ${2 / zoom}`}
            />

            {/* Angle Text */}
            <text
                x={textPosition.x}
                y={textPosition.y}
                textAnchor="middle"
                fill={style.textColor}
                fontSize={style.textSize / zoom}
                fontFamily="monospace"
                fontWeight="bold"
            >
                {displayValue}
            </text>
        </g>
    );
};

// ============================================
// Radius Dimension Component
// ============================================

const RadiusDimension: React.FC<{ dimension: Dimension; zoom: number }> = ({ dimension, zoom }) => {
    const { startPoint, endPoint, displayValue, style } = dimension;

    // startPoint is center, endPoint is on the circle
    const radius = distance(startPoint, endPoint);
    const lineAngle = angle(startPoint, endPoint);

    // Leader line from center to edge
    const leaderEnd = polarPoint(startPoint, lineAngle, radius + 20 / zoom);

    return (
        <g className="cad-dimension radius-dimension">
            {/* Radius Line */}
            <line
                x1={startPoint.x}
                y1={startPoint.y}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke={style.lineColor}
                strokeWidth={1.5 / zoom}
            />

            {/* Arrow at circle edge */}
            <ArrowHead
                position={endPoint}
                angle={lineAngle + Math.PI}
                size={style.arrowSize / zoom}
                color={style.lineColor}
            />

            {/* Center mark */}
            <circle
                cx={startPoint.x}
                cy={startPoint.y}
                r={3 / zoom}
                fill={style.lineColor}
            />

            {/* Radius Text */}
            <text
                x={leaderEnd.x}
                y={leaderEnd.y}
                textAnchor="start"
                fill={style.textColor}
                fontSize={style.textSize / zoom}
                fontFamily="monospace"
                fontWeight="bold"
            >
                R{displayValue}
            </text>
        </g>
    );
};

// ============================================
// Main Dimension Renderer
// ============================================

const DimensionRenderer: React.FC<DimensionRendererProps> = ({ dimensions, zoom }) => {
    return (
        <g className="cad-dimensions-layer">
            {dimensions.map(dim => {
                switch (dim.type) {
                    case 'linear':
                        return <LinearDimension key={dim.id} dimension={dim} zoom={zoom} />;
                    case 'angular':
                        return <AngularDimension key={dim.id} dimension={dim} zoom={zoom} />;
                    case 'radius':
                    case 'diameter':
                        return <RadiusDimension key={dim.id} dimension={dim} zoom={zoom} />;
                    default:
                        return null;
                }
            })}
        </g>
    );
};

export default DimensionRenderer;
