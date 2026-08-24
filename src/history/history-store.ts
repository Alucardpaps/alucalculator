import { openDB, IDBPDatabase } from 'idb';
import { CopilotIntent } from '../engine/copilot/copilot';
import { Step } from '../components/math-render/step-generator';

export interface CalculationResult {
  id: string; // unique timestamp or uuid
  timestamp: number;
  intent: CopilotIntent;
  steps: Step[];
  finalResult: string;
  isCached: boolean;
}

const DB_NAME = 'AluCalcOS_v4_History';
const STORE_NAME = 'history';

export class HistoryStore {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, 4, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  async saveCalculation(result: Omit<CalculationResult, 'isCached'>): Promise<void> {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, {
      ...result,
      isCached: true,
      timestamp: Date.now()
    });
  }

  async getHistory(limit: number = 50): Promise<CalculationResult[]> {
    const db = await this.dbPromise;
    const items = await db.getAll(STORE_NAME);
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async clearHistory(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }
}

export const historyStore = new HistoryStore();

