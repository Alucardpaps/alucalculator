import * as fs from 'fs';
import * as path from 'path';

export interface MaterialData {
  id: string; // derived from filename
  name: string;
  density: number; // kg/m^3
  young_modulus: number; // Pa
  yield_strength: number; // Pa
  thermal_conductivity?: number; // W/(m*K)
  livePrice?: {
    value: number;
    currency: string;
    unit: string;
    lastUpdated: Date;
  };
}

export class MaterialService {
    private static materials: Map<string, MaterialData> = new Map();

    static async loadMaterials(materialsDir?: string): Promise<void> {
       const dir = materialsDir || path.resolve(process.cwd(), 'src/materials');
       if (!fs.existsSync(dir)) return;

       const files = fs.readdirSync(dir);
       for(const f of files) {
           if (f.endsWith('.json')) {
               const id = f.replace('.json', '');
               try {
                   const raw = fs.readFileSync(path.join(dir, f), 'utf8');
                   const dt = JSON.parse(raw) as MaterialData;
                   dt.id = id;
                   this.materials.set(dt.name.toLowerCase(), dt);
                   this.materials.set(id.toLowerCase(), dt);
               } catch(e) {
                   console.error(`Material Parsing error on ${f}`, e);
               }
           }
       }
    }

    static getMaterial(nameOrId: string): MaterialData | undefined {
        return this.materials.get(nameOrId.toLowerCase());
    }

    static listMaterials(): MaterialData[] {
        // Filter out double-counted duplicates between id vs name mappings uniquely
        const unique = Array.from(new Set(this.materials.values()));
        return unique;
    }

    static async updateMaterialPrice(id: string): Promise<void> {
        const material = this.getMaterial(id);
        if (material) {
            const { FinanceService } = await import('./finance-service');
            const liveData = await FinanceService.getLivePrice(id);
            material.livePrice = {
                value: liveData.price,
                currency: liveData.currency,
                unit: liveData.unit,
                lastUpdated: new Date()
            };
        }
    }
}
