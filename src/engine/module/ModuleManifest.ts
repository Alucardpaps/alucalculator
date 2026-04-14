export interface ModuleManifest {
    id: string;
    version: string;
    type: string;
    category: 'mechanical' | 'civil' | 'electrical' | 'science' | 'finance' | 'software' | 'other';
    title: string;
    description: string;
    icon: string;
    defaultSize: { width: number, height: number };
    capabilities: string[];
    permissions: string[];
    engineVersionRequired: string;
    author: string;
}
