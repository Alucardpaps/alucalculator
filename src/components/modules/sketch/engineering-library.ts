
// @ts-ignore
import { LibraryItems } from "@excalidraw/excalidraw/types/types";

// Helper to create a basic element
const createBaseElement = (type: string, x: number, y: number, w: number, h: number, extra: any = {}) => ({
    type,
    x, y, width: w, height: h,
    angle: 0,
    strokeColor: "#000000",
    backgroundColor: "transparent",
    fillStyle: "hachure",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.random() * 100000,
    version: 1,
    versionNonce: 0,
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    ...extra
});

// 1. Logic Gate: AND
const AND_GATE = [
    createBaseElement("rectangle", 0, 0, 60, 60, { strokeWidth: 2 }), // Body
    createBaseElement("text", 15, 20, 30, 20, { text: "&", fontSize: 20, fontFamily: 1, textAlign: "center" }), // Label
    createBaseElement("line", -20, 20, 20, 0, { points: [[0, 0], [20, 0]] }), // Input A
    createBaseElement("line", -20, 40, 20, 0, { points: [[0, 0], [20, 0]] }), // Input B
    createBaseElement("line", 60, 30, 20, 0, { points: [[0, 0], [20, 0]] }), // Output
];

// 2. Electrical: Resistor (ZigZag)
const RESISTOR = [
    createBaseElement("line", 0, 0, 100, 20, {
        points: [[0, 10], [10, 10], [15, 0], [25, 20], [35, 0], [45, 20], [55, 0], [65, 20], [75, 10], [100, 10]],
        strokeWidth: 2
    })
];

// 3. Mechanical: Gear (Symbolic)
const GEAR = [
    createBaseElement("ellipse", 0, 0, 50, 50, { strokeWidth: 2, fillStyle: "solid", backgroundColor: "#e0e0e0" }),
    createBaseElement("ellipse", 15, 15, 20, 20, { strokeWidth: 1, backgroundColor: "#ffffff", fillStyle: "solid" }),
    createBaseElement("line", 25, -5, 0, 60, { points: [[0, 0], [0, 60]], strokeWidth: 4 }), // Vertical tooth
    createBaseElement("line", -5, 25, 60, 0, { points: [[0, 0], [60, 0]], strokeWidth: 4 }), // Horizontal tooth
];

// 4. Flowchart: Database
const DATABASE = [
    createBaseElement("ellipse", 0, 0, 60, 20, { strokeWidth: 2 }), // Top
    createBaseElement("line", 0, 10, 0, 50, { points: [[0, 0], [0, 50]], strokeWidth: 2 }), // Left
    createBaseElement("line", 60, 10, 0, 50, { points: [[0, 0], [0, 50]], strokeWidth: 2 }), // Right
    createBaseElement("ellipse", 0, 50, 60, 20, { strokeWidth: 2 }), // Bottom
];

// 5. Software: Server
const SERVER = [
    createBaseElement("rectangle", 0, 0, 60, 80, { strokeWidth: 2, roundness: { type: 3 } }),
    createBaseElement("line", 10, 20, 40, 0, { points: [[0, 0], [40, 0]] }),
    createBaseElement("line", 10, 40, 40, 0, { points: [[0, 0], [40, 0]] }),
    createBaseElement("ellipse", 45, 60, 5, 5, { backgroundColor: "#10b981", fillStyle: "solid" }) // Status light
];

// Helper to bundle into LibraryItem
const bundle = (elements: any[], id: string) => ({
    id,
    status: "published" as const,
    created: Date.now(),
    elements: elements as any // Type assertion for brevity
});

export const ENGINEERING_LIBRARY: any = [
    bundle(AND_GATE, "logic-and"),
    bundle(RESISTOR, "elec-resistor"),
    bundle(GEAR, "mech-gear"),
    bundle(DATABASE, "data-db"),
    bundle(SERVER, "soft-server")
];
