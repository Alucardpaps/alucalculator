export interface KinematicsConfig {
    v0: number; // Initial Velocity (m/s)
    angle: number; // Launch Angle (degrees)
    g: number; // Gravity (m/s^2)
    k: number; // Air resistance coefficient (k/m)
    y0: number; // Initial height
}

export interface TrajectoryPoint {
    t: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

export interface KinematicsResult {
    path: TrajectoryPoint[];
    maxHeight: number;
    range: number;
    timeOfFlight: number;
    finalVelocity: number;
}

export class KinematicsEngine {
    /**
     * Computes projectile motion trajectory.
     * Uses numerical integration (Euler method) to support air resistance.
     */
    static computeTrajectory(config: KinematicsConfig): KinematicsResult {
        const { v0, angle, g, k, y0 } = config;
        
        // Convert angle to radians
        const theta = (angle * Math.PI) / 180;
        
        let t = 0;
        let x = 0;
        let y = y0;
        let vx = v0 * Math.cos(theta);
        let vy = v0 * Math.sin(theta);
        
        const path: TrajectoryPoint[] = [];
        path.push({ t, x, y, vx, vy });
        
        const dt = 0.01; // 10ms step
        let maxHeight = y0;
        
        // Safety circuit breaker preventing infinite loops
        let iterations = 0;
        const MAX_ITERATIONS = 50000; 

        while (y >= 0 && iterations < MAX_ITERATIONS) {
            // Calculate accelerations
            // F_drag = -k * v * |v| for quadratic drag, but we use linear -k * v for simplicity if unit is k/m
            // Actually, let's use quadratic drag (realistic): a = -k * v * |v|
            // Or purely linear: a = -k * v
            const vMag = Math.sqrt(vx * vx + vy * vy);
            
            // Using standard linear drag for stability and easier demonstration
            const ax = -k * vx;
            const ay = -g - k * vy;
            
            // Euler step
            vx += ax * dt;
            vy += ay * dt;
            x += vx * dt;
            y += vy * dt;
            t += dt;
            
            if (y > maxHeight) maxHeight = y;
            
            // Store point for rendering (downsample to avoid massive rendering load)
            if (iterations % 10 === 0) {
                path.push({ t, x, y, vx, vy });
            }
            
            iterations++;
        }
        
        // Ensure final impact point is exactly at y=0 (linear interpolation)
        if (y < 0 && iterations > 0 && path.length > 1) {
            const prev = path[path.length - 1];
            // Interpolate perfectly to y=0
            if (prev.y !== 0) {
                 const fraction = prev.y / (prev.y - y);
                 const finalX = prev.x + (x - prev.x) * fraction;
                 const finalT = prev.t + dt * fraction;
                 const finalVx = prev.vx + (vx - prev.vx) * fraction;
                 const finalVy = prev.vy + (vy - prev.vy) * fraction;
                 path.push({ t: finalT, x: finalX, y: 0, vx: finalVx, vy: finalVy });
                 
                 x = finalX;
                 t = finalT;
                 vx = finalVx;
                 vy = finalVy;
            }
        }

        const finalVelocity = Math.sqrt(vx * vx + vy * vy);

        return {
            path,
            maxHeight,
            range: x,
            timeOfFlight: t,
            finalVelocity
        };
    }
}
