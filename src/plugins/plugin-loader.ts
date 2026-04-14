import * as fs from 'fs';
import * as path from 'path';
import { CalculatorRegistry } from '../calculator-system/registry';

export class PluginLoader {
  /**
   * Scans a root plugins directory and loads any schemas found inside into the runtime Registry.
   * e.g. /plugins/beam-deflection/calculator.json
   */
  static loadPlugins(pluginsDir: string): void {
    if (!fs.existsSync(pluginsDir)) {
       // Plugin folder naturally might not exist initially, just return silently.
       return;
    }

    const pluginFolders = fs.readdirSync(pluginsDir);

    for (const folder of pluginFolders) {
        const fullPath = path.join(pluginsDir, folder);
        if (fs.statSync(fullPath).isDirectory()) {
            
            // Check for a definition calculator.json
            const schemaPath = path.join(fullPath, 'calculator.json');
            
            if (fs.existsSync(schemaPath)) {
                try {
                    const content = fs.readFileSync(schemaPath, 'utf8');
                    const schema = JSON.parse(content);
                    
                    // Tag this schema internally as a plugin module
                    schema.category = `plugin_${schema.category || 'misc'}`;
                    schema.isPlugin = true;
                    
                    CalculatorRegistry.registerCalculator(schema);
                    console.log(`[Plugin System] Loaded external calculator: ${schema.name} (${schema.id})`);
                } catch (e: any) {
                    console.error(`[Plugin System] Failed to load plugin schema from ${folder}: ${e.message}`);
                }
            }
            
            // Note: Loading visualizer components dynamically in NextJS/React is complex out-of-the-box
            // due to Webpack/Turbopack boundaries. True module federation would be needed, or pre-bundling.
            // For headless architectural scope, indexing the schema logic is priority #1.
        }
    }
  }
}
