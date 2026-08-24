/**
 * AluCalculator — Cross-Module Event Bus
 * 
 * Lightweight pub/sub system for decoupled inter-module communication.
 * Consistent singleton pattern with KERNEL and ENGINE_REGISTRY.
 * 
 * Usage:
 *   EVENT_BUS.emit({ type: 'engine:executed', payload: result, sourceModule: 'mechanical' });
 *   EVENT_BUS.on('engine:executed', (event) => { ... });
 */

// ============================================
// TYPES
// ============================================

/**
 * System-wide event interface.
 * All cross-module communication uses this structure.
 */
export interface SystemEvent<T = unknown> {
    /** Event type identifier (e.g., 'engine:executed', 'module:opened') */
    type: string;
    /** Event payload (typed by consumer) */
    payload: T;
    /** Module that emitted this event */
    sourceModule: string;
    /** Unix timestamp of emission */
    timestamp: number;
}

/** Event handler function */
export type EventHandler<T = unknown> = (event: SystemEvent<T>) => void;

// ============================================
// WELL-KNOWN EVENT TYPES
// ============================================

/**
 * Canonical event types used throughout the system.
 * Using these constants prevents typos and enables autocomplete.
 */
export const EVENT_TYPES = {
    // Engine lifecycle
    ENGINE_REGISTERED: 'engine:registered',
    ENGINE_EXECUTED: 'engine:executed',
    ENGINE_ERROR: 'engine:error',

    // Module lifecycle
    MODULE_OPENED: 'module:opened',
    MODULE_CLOSED: 'module:closed',
    MODULE_FOCUSED: 'module:focused',

    // Data flow
    CALCULATION_COMPLETE: 'calculation:complete',
    MATERIAL_SELECTED: 'material:selected',
    UNIT_SYSTEM_CHANGED: 'unit:changed',

    // System
    KERNEL_BOOTED: 'kernel:booted',
    TELEMETRY_RECORDED: 'telemetry:recorded',
} as const;

// ============================================
// EVENT BUS IMPLEMENTATION
// ============================================

class EventBusImpl {
    private handlers = new Map<string, Set<EventHandler<unknown>>>();
    private _history: SystemEvent[] = [];
    private _maxHistory = 100;

    /**
     * Subscribe to an event type.
     */
    on<T = unknown>(type: string, handler: EventHandler<T>): void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)!.add(handler as EventHandler<unknown>);
    }

    /**
     * Unsubscribe from an event type.
     */
    off<T = unknown>(type: string, handler: EventHandler<T>): void {
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            typeHandlers.delete(handler as EventHandler<unknown>);
            if (typeHandlers.size === 0) {
                this.handlers.delete(type);
            }
        }
    }

    /**
     * Subscribe once — handler is automatically removed after first invocation.
     */
    once<T = unknown>(type: string, handler: EventHandler<T>): void {
        const wrappedHandler: EventHandler<T> = (event) => {
            this.off(type, wrappedHandler);
            handler(event);
        };
        this.on(type, wrappedHandler);
    }

    /**
     * Emit an event to all subscribers.
     */
    emit<T = unknown>(event: Omit<SystemEvent<T>, 'timestamp'>): void {
        const fullEvent: SystemEvent<T> = {
            ...event,
            timestamp: Date.now(),
        };

        // Record in history
        this._history.push(fullEvent as SystemEvent);
        if (this._history.length > this._maxHistory) {
            this._history.shift();
        }

        // Dispatch to handlers
        const typeHandlers = this.handlers.get(event.type);
        if (typeHandlers) {
            typeHandlers.forEach(handler => {
                try {
                    handler(fullEvent as SystemEvent<unknown>);
                } catch (err) {
                    console.error(`[EVENT_BUS] Handler error for '${event.type}':`, err);
                }
            });
        }

        // Also dispatch to wildcard handlers
        const wildcardHandlers = this.handlers.get('*');
        if (wildcardHandlers) {
            wildcardHandlers.forEach(handler => {
                try {
                    handler(fullEvent as SystemEvent<unknown>);
                } catch (err) {
                    console.error(`[EVENT_BUS] Wildcard handler error:`, err);
                }
            });
        }
    }

    /**
     * Get event history (most recent first).
     */
    getHistory(): readonly SystemEvent[] {
        return [...this._history].reverse();
    }

    /**
     * Get subscriber count for a given event type.
     */
    listenerCount(type: string): number {
        return this.handlers.get(type)?.size ?? 0;
    }

    /**
     * Remove all handlers for a given type (or all handlers if no type specified).
     */
    clear(type?: string): void {
        if (type) {
            this.handlers.delete(type);
        } else {
            this.handlers.clear();
        }
    }

    /**
     * Debug: dump bus state.
     */
    dump(): void {
        console.group('[EVENT_BUS] State');
        console.log('Active subscriptions:', this.handlers.size);
        this.handlers.forEach((handlers, type) => {
            console.log(`  ${type}: ${handlers.size} handler(s)`);
        });
        console.log('History length:', this._history.length);
        console.groupEnd();
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const EVENT_BUS = new EventBusImpl();
