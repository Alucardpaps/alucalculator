/**
 * Drafting Intro Tutorial — Step definitions
 */

import { TrainingTutorial } from './trainingStore';

export const draftingIntroTutorial: TrainingTutorial = {
    id: 'drafting-intro',
    name: 'Drafting & Notes Introduction',
    steps: [
        {
            id: 'drafting-canvas',
            targetSelector: '[data-training="desk-canvas"]',
            title: 'The Desk',
            description: 'This is your freeform whiteboard — powered by Excalidraw. Sketch ideas, write notes, or communicate concepts. This is NOT parametric CAD.',
            position: 'bottom',
        },
        {
            id: 'drafting-tools',
            targetSelector: '[data-training="desk-canvas"]',
            title: 'Shapes & Text',
            description: 'Use rectangles, arrows, and text to annotate your ideas. Everything here is for communication — no engineering math is applied.',
            position: 'bottom',
        },
    ],
};
