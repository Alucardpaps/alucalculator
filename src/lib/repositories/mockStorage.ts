import fs from 'fs';
import path from 'path';

/**
 * MockStorage - File-based persistence fallback
 * Used when PostgreSQL is unavailable to ensure the user can still test features.
 */

const STORAGE_DIR = path.join(process.cwd(), 'data', 'mock_db');

if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export const mockStorage = {
    get<T>(entity: string): T[] {
        const filePath = path.join(STORAGE_DIR, `${entity}.json`);
        if (!fs.existsSync(filePath)) return [];
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
            return [];
        }
    },

    save<T>(entity: string, data: T[]): void {
        const filePath = path.join(STORAGE_DIR, `${entity}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    },

    upsert<T extends { id: any }>(entity: string, item: T): T {
        const data = this.get<T>(entity);
        const idx = data.findIndex(i => i.id === item.id);
        if (idx >= 0) {
            data[idx] = item;
        } else {
            data.push(item);
        }
        this.save(entity, data);
        return item;
    }
};
