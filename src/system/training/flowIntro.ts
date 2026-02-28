/**
 * Flow Intro Tutorial — Step definitions
 */

import { TrainingTutorial } from './trainingStore';

export const flowIntroTutorial: TrainingTutorial = {
    id: 'flow-intro',
    name: 'Flow Engineering Introduction',
    steps: [
        {
            id: 'flow-canvas',
            targetSelector: '[data-training="flow-canvas"]',
            title: 'Flow Canvas',
            description: 'This is the node-based engineering workspace. Drag calculation nodes from the palette and connect them to build logic chains.',
            position: 'bottom',
        },
        {
            id: 'flow-palette',
            targetSelector: '[data-training="flow-palette"]',
            title: 'Node Palette',
            description: 'Browse available calculation modules here — from gear ratios to beam deflection. Drag any node onto the canvas.',
            position: 'right',
        },
        {
            id: 'flow-connections',
            targetSelector: '[data-training="flow-canvas"]',
            title: 'Connections',
            description: 'Connect output ports to input ports to pass values between calculations. The flow auto-executes when inputs change.',
            position: 'bottom',
        },
    ],
};
