import { MachiningMillingNode, MachiningGrindingNode, GoldenRatioNode } from '../nodes/Mechanical/EngineeringNodes';

console.log('🧪 STAGE 1: Testing Machining Milling Node');
const millingInputs = { Vc: 150, D: 10, Z: 4, fz: 0.05, ae: 5, ap: 10 };
console.log('Inputs:', millingInputs);
const millingResults = MachiningMillingNode.compute(millingInputs);
console.log('Outputs:', millingResults);
console.log('----------------------------------------');

console.log('🧪 STAGE 2: Testing Machining Grinding Node');
const grindingInputs = { D: 250, N: 2800 };
console.log('Inputs:', grindingInputs);
const grindingResults = MachiningGrindingNode.compute(grindingInputs);
console.log('Outputs:', grindingResults);
console.log('----------------------------------------');

console.log('🧪 STAGE 3: Testing Golden Ratio Node');
const goldenInputs = { base: 100 };
console.log('Inputs:', goldenInputs);
const goldenResults = GoldenRatioNode.compute(goldenInputs);
console.log('Outputs:', goldenResults);
console.log('----------------------------------------');

console.log('🎉 All new Calculators executed successfully!');
