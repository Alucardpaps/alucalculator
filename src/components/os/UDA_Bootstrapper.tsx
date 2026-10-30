'use client';

import { useEffect } from 'react';
import { ModuleRegistry } from '@/engine/module/ModuleRegistry';

// Manifests
import mfgManifest from '@/modules/mechanical/MfgReadiness/manifest.json';
import costManifest from '@/modules/finance/RealTimeCost/manifest.json';
import failManifest from '@/modules/mechanical/FailurePrediction/manifest.json';
import assemblyManifest from '@/modules/mechanical/DragAndBuild/manifest.json';
import aiManifest from '@/modules/software/AiCoPilot/manifest.json';
import shaftManifest from '@/modules/mechanical/ShaftDesign/manifest.json';
import cylinderManifest from '@/modules/mechanical/CylinderDesign/manifest.json';

// Components
import MfgReadinessModule from '@/modules/mechanical/MfgReadiness';
import RealTimeCostModule from '@/modules/finance/RealTimeCost';
import FailurePredictionModule from '@/modules/mechanical/FailurePrediction';
import DragAndBuildModule from '@/modules/mechanical/DragAndBuild';
import AiCoPilotModule from '@/modules/software/AiCoPilot';
import ShaftDesignModule from '@/modules/mechanical/ShaftDesign';
import CylinderDesignModule from '@/modules/mechanical/CylinderDesign';

export function UDA_Bootstrapper() {
    useEffect(() => {
        // Register all elite UDA phase modules
        ModuleRegistry.register(mfgManifest as any, MfgReadinessModule);
        ModuleRegistry.register(costManifest as any, RealTimeCostModule);
        ModuleRegistry.register(failManifest as any, FailurePredictionModule);
        ModuleRegistry.register(assemblyManifest as any, DragAndBuildModule);
        ModuleRegistry.register(aiManifest as any, AiCoPilotModule);
        ModuleRegistry.register(shaftManifest as any, ShaftDesignModule);
        ModuleRegistry.register(cylinderManifest as any, CylinderDesignModule);

        console.log("[UDA_Bootstrapper] Advanced Elite Modules registered successfully.");
    }, []);

    return null;
}
