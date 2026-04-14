// Simplified caching system wrapper logic to avoid redundant identical execution payloads.
export class CalculationCache {
    private static cache: Map<string, any> = new Map();
    
    // Limits the LRU conceptually. In production true LRU implementations are used.
    private static MAX_CACHE_SIZE = 1000; 

    static generateKey(calculatorId: string, payload: Record<string, number>): string {
        return `${calculatorId}_${JSON.stringify(payload)}`;
    }

    static get(key: string): any | undefined {
        return this.cache.get(key);
    }

    static set(key: string, result: any): void {
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            // Very primitive eviction: clear half the cache if it overflows
            const keys = Array.from(this.cache.keys());
            for (let i = 0; i < this.MAX_CACHE_SIZE / 2; i++) {
                this.cache.delete(keys[i]);
            }
        }
        this.cache.set(key, result);
    }
}
