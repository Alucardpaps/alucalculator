/**
 * Bounded Execution Timeline
 * Production-safe event tracking with memory limits and privacy levels.
 */

export interface TimelineEvent {
    event: string;
    timestamp: number;
    durationSinceStart: number;
}

export type TelemetryMode = 'full' | 'summary' | 'disabled';

export class ExecutionTimeline {
    private events: TimelineEvent[] = [];
    private startTime: number;
    private readonly MAX_CAPACITY = 50; // Memory Safety

    constructor() {
        this.startTime = performance.now();
        this.add('TIMELINE_START');
    }

    /**
     * Adds an event to the timeline if capacity allows.
     */
    public add(event: string) {
        if (this.events.length >= this.MAX_CAPACITY) return;

        const now = performance.now();
        this.events.push({
            event,
            timestamp: Date.now(),
            durationSinceStart: parseFloat((now - this.startTime).toFixed(3))
        });
    }

    /**
     * Formats the timeline for client delivery based on visibility mode.
     */
    public toClient(mode: TelemetryMode = 'summary') {
        if (mode === 'disabled') return null;

        if (mode === 'summary') {
            // Return only the start, end, and total duration
            const first = this.events[0];
            const last = this.events[this.events.length - 1];
            return {
                status: last.event,
                totalDurationMs: last.durationSinceStart,
                steps: this.events.length
            };
        }

        // Full fidelity for debug/internal
        return this.events;
    }

    public toJSON() {
        return this.events;
    }
}
