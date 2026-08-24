import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NeonIconProps {
    icon: LucideIcon;
    size?: number;
    color?: string; // Hex color for the glow
    strokeWidth?: number;
    animated?: boolean;
}

/**
 * 💡 NeonIcon
 * 
 * Recreates the exact avant-garde glowing wireframe/neon aesthetics.
 * Uses stacked SVG renderings with specific blur and drop-shadow
 * filters to achieve infinite resolution "GIF" style animations
 * without raster pixelation.
 */
export const NeonIcon: React.FC<NeonIconProps> = ({
    icon: Icon,
    size = 24,
    color = '#00e5ff',
    strokeWidth = 1.5,
    animated = true
}) => {
    return (
        <div
            className={`relative inline-flex items-center justify-center ${animated ? 'animate-neon-pulse' : ''}`}
            style={{ width: size, height: size }}
        >
            {/* Outer blurred ambient glow */}
            <Icon
                size={size}
                color={color}
                strokeWidth={strokeWidth}
                style={{
                    position: 'absolute',
                    filter: `blur(6px) drop-shadow(0 0 12px ${color})`,
                    opacity: 0.7,
                    zIndex: 1
                }}
            />

            {/* Middle sharper localized glow */}
            <Icon
                size={size}
                color={color}
                strokeWidth={strokeWidth}
                style={{
                    position: 'absolute',
                    filter: `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 2px ${color})`,
                    opacity: 0.9,
                    zIndex: 2
                }}
            />

            {/* Inner bright core (white-ish for the hot physical neon tube look) */}
            <Icon
                size={size}
                color="#e0ffff"
                strokeWidth={Math.max(0.5, strokeWidth - 0.5)}
                style={{
                    position: 'relative',
                    zIndex: 3,
                    filter: `drop-shadow(0 0 1px #ffffff)`
                }}
            />
        </div>
    );
};
