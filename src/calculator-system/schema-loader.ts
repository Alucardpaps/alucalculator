import * as fs from 'fs';
import * as path from 'path';
import { CalculatorRegistry } from './registry';

export class SchemaLoader {
  static loadSchemas(schemasDir: string): void {
    if (!fs.existsSync(schemasDir)) {
      throw new Error(`Schemas directory not found: ${schemasDir}`);
    }

    const files = this.scanDirectory(schemasDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const fileContent = fs.readFileSync(file, 'utf8');
          const schema = JSON.parse(fileContent);
          CalculatorRegistry.registerCalculator(schema);
        } catch (error: any) {
           console.error(`Failed to load schema from ${file}: ${error.message}`);
        }
      }
    }
  }

  private static scanDirectory(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(this.scanDirectory(filePath));
      } else {
        results.push(filePath);
      }
    }
    return results;
  }
}
