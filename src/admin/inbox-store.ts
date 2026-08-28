export interface FeatureCounter {
  feature: string;
  totalCalls: number;
  lastCalledAt: string;
}

class TelemetryCounterStore {
  private featureCounts: Record<string, FeatureCounter> = {};

  public incrementFeature(feature: string): void {
    const existing = this.featureCounts[feature];
    if (existing) {
      existing.totalCalls += 1;
      existing.lastCalledAt = new Date().toISOString();
    } else {
      this.featureCounts[feature] = {
        feature,
        totalCalls: 1,
        lastCalledAt: new Date().toISOString(),
      };
    }
  }

  public getFeatureCounters(): FeatureCounter[] {
    return Object.values(this.featureCounts);
  }

  public clear(): void {
    this.featureCounts = {};
  }
}

export const adminInboxStore = new TelemetryCounterStore();
