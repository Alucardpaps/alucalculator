/**
 * ui/panels/PropertiesPanelAPI.ts
 * 
 * Provides a contract for modules to register property renderers.
 * When an entity or item is selected in a Workspace (e.g., CAD Canvas),
 * this API determines which React component should render its properties.
 */

import React from 'react';

export interface PropertyRenderer {
    entityType: string;
    component: React.ComponentType<{ entity: any, onChange: (updates: any) => void }>;
}

export class PropertiesPanelAPI {
    private static _renderers: Map<string, React.ComponentType<any>> = new Map();

    /**
     * Register a custom React component to render properties for a specific entity type
     * @param entityType 
     * @param component 
     */
    static registerRenderer(entityType: string, component: React.ComponentType<any>) {
        this._renderers.set(entityType, component);
    }

    /**
     * Retrieves the assigned renderer for a given entity, or returns undefined
     */
    static getRenderer(entityType: string): React.ComponentType<any> | undefined {
        return this._renderers.get(entityType);
    }
}
