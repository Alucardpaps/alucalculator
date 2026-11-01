/**
 * Rebuild Scheduler for Parametric Feature Graph
 *
 * Grounded in: 16ms frame budget & coalesced commits.
 * Debounces and schedules FeatureGraph rebuilds cleanly across render frames.
 */

import { FeatureGraph, RebuildResult } from './FeatureGraph';

export type RebuildCallback = (result: RebuildResult) => void;

export class RebuildScheduler {
  private graph: FeatureGraph;
  private pendingTimer: any = null;
  private isRebuilding: boolean = false;
  private listeners: Set<RebuildCallback> = new Set();
  private debounceMs: number;

  constructor(graph: FeatureGraph, debounceMs = 16) {
    this.graph = graph;
    this.debounceMs = debounceMs;
  }

  /**
   * Requests a scheduled rebuild. Coalesces repeated calls within debounce window.
   */
  public scheduleRebuild(): void {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
    }

    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = null;
      this.executeNow();
    }, this.debounceMs);
  }

  /**
   * Executes the rebuild synchronously immediately.
   */
  public executeNow(): RebuildResult {
    if (this.isRebuilding) {
      // Re-entrant protection
      return {
        success: false,
        rebuiltFeatures: [],
        parts: this.graph.getParts(),
        mates: this.graph.getMates(),
        dfmReport: this.graph.rebuild().dfmReport,
        durationMs: 0,
        error: 'Rebuild already in progress',
      };
    }

    this.isRebuilding = true;
    try {
      const result = this.graph.rebuild();
      for (const listener of this.listeners) {
        try {
          listener(result);
        } catch {
          // Prevent listener error from breaking scheduler
        }
      }
      return result;
    } finally {
      this.isRebuilding = false;
    }
  }

  public subscribe(cb: RebuildCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public dispose(): void {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    this.listeners.clear();
  }
}
