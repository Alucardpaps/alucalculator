/**
 * CAD Intro Tutorial — Step definitions
 *
 * Explains: Feature Tree → Sketch → Constraints → Dimensions → Multibody
 */

import { TrainingTutorial } from './trainingStore';

export const cadIntroTutorial: TrainingTutorial = {
    id: 'cad-intro',
    name: 'CAD Environment Introduction',
    steps: [
        {
            id: 'cad-feature-tree',
            targetSelector: '[data-training="feature-tree"]',
            title: 'Feature Tree',
            description: 'This panel shows all sketches, bodies, constraints, and parameters in your project. Think of it as the blueprint hierarchy.',
            position: 'right',
        },
        {
            id: 'cad-draw-tools',
            targetSelector: '[data-training="draw-tools"]',
            title: 'Drawing Tools',
            description: 'Use Line, Polyline, Rectangle, and Circle to sketch geometry. Select a tool and click on the canvas to start.',
            position: 'right',
        },
        {
            id: 'cad-constraints',
            targetSelector: '[data-training="status-bar"]',
            title: 'Constraint Status',
            description: 'The status bar shows your sketch\'s constraint state. "Fully Constrained" (green) means every point is locked. "Under Constrained" (yellow) means geometry can still move.',
            position: 'top',
        },
        {
            id: 'cad-dimensions',
            targetSelector: '[data-training="dim-tools"]',
            title: 'Smart Dimensions',
            description: 'Add dimensions to control your geometry parametrically. Double-click a dimension to edit its value — the sketch updates in real-time.',
            position: 'right',
        },
        {
            id: 'cad-properties',
            targetSelector: '[data-training="properties-panel"]',
            title: 'Properties Panel',
            description: 'Select any entity and view its properties here. You can modify color, layer, and geometric values.',
            position: 'left',
        },
        {
            id: 'cad-command-line',
            targetSelector: '[data-training="command-line"]',
            title: 'Command Line',
            description: 'Type commands directly — just like AutoCAD. Try "L" for line, "C" for circle, or "REC" for rectangle.',
            position: 'top',
        },
    ],
};
