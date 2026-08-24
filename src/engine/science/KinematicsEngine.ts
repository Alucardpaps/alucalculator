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
        
        // Track previous step values to interpolate safely at the end
        let prevX = x;
        let prevY = y;
        let prevT = t;
        let prevVx = vx;
        let prevVy = vy;

        // Safety circuit breaker preventing infinite loops
        let iterations = 0;
        const MAX_ITERATIONS = 50000; 

        while (y >= 0 && iterations < MAX_ITERATIONS) {
            prevX = x;
            prevY = y;
            prevT = t;
            prevVx = vx;
            prevVy = vy;

            // Calculate accelerations
            const vMag = Math.sqrt(vx * vx + vy * vy);
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
        if (y < 0 && iterations > 0) {
            const dy = prevY - y;
            if (dy > 0) {
                 const fraction = prevY / dy;
                 const finalX = prevX + (x - prevX) * fraction;
                 const finalT = prevT + dt * fraction;
                 const finalVx = prevVx + (vx - prevVx) * fraction;
                 const finalVy = prevVy + (vy - prevVy) * fraction;
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
