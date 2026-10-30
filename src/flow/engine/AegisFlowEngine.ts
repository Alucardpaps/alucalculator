/**
 * ⚡ ALUCAD OS — AEGIS GENERATIVE FLOW & ENGINEERING COMPUTATION PIPELINE ENGINE
 * 
 * Bridges natural language requirements and engineering specifications directly
 * into deterministic computation graphs (Node-RED style ISO/DIN calculation pipelines).
 * Synthesizes node topologies, ports, and wires, executes the mathematical graph,
 * and provides a 1-click bridge to transfer computed dimensions directly into 2D/3D CAD.
 */

import type { FlowNode, FlowEdge } from '@/store/flowStore';
import { useFlowStore } from '@/store/flowStore';
import { NODE_REGISTRY } from '@/flow/nodes/Registry';
import { useCadStore } from '@/cad/store/cadStore';
import { useDesignStore, type DesignPart } from '@/design-studio/designStore';
import { triggerCameraView } from '@/design-studio/cadCameraDispatcher';
import {
  PROVIDERS,
  streamChat,
  type AIFileAttachment,
} from '@/lib/ai/providers';
import { getActiveConnection } from '@/lib/ai/aiSettingsStore';
import type { CadEntity } from '@/cad/kernel/types';

export interface CadBridgeSuggestion {
  name: string;
  kind: 'gear' | 'shaft' | 'beam' | 'bearing' | 'cylinder' | 'flange' | 'bracket';
  dimensions: Record<string, number>;
}

export interface GeneratedFlowPipeline {
  title: string;
  description: {
    tr: string;
    en: string;
  };
  standards: string[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  aiSynthesized?: boolean;
  providerLabel?: string;
  cadBridge: {
    type: '2D' | '3D' | 'BOTH';
    summaryTr: string;
    summaryEn: string;
    suggestedParts: CadBridgeSuggestion[];
  };
}

export const MASTER_FLOW_AI_TRAINING_PROMPT = `You are AeGiS Engineering Flow Architect inside AluCAD OS (alucalculator.com).
Your mission is to translate engineering requirements, calculation requests, or machine design problems into a deterministic, fully wired Node computation graph (Flow Engine conforming to ISO, DIN, VDI, and EN standards).

FLOW GRAPH ARCHITECTURE:
- Nodes represent deterministic engineering equations (Tier 1 Normative, Tier 2 Scientific).
- Ports are semantically typed (power_kw, rpm, torque_nm, module_mm, teeth, stress_mpa, force_n, length_mm).
- Edges connect a source node's output port to a target node's input port.

CANONICAL NODE CATALOG (schemaId):
1. INPUT CONSTANTS:
   - "input-constant-power" (outputs: "value" [kW])
   - "input-constant-rpm" (outputs: "value" [rpm])
   - "input-constant-torque" (outputs: "value" [N·m])
   - "input-constant-force" (outputs: "value" [N])
   - "input-constant-pressure" (outputs: "value" [bar or MPa])
   - "input-constant-length" (outputs: "value" [mm])
   - "input-constant-module" (outputs: "value" [mm])
   - "input-constant-teeth" (outputs: "value" [integer count])
   - "input-constant-angle" (outputs: "value" [degrees])
   - "input-constant-ratio" (outputs: "value")
   - "mech-material" (inputs: materialName, outputs: "Sy", "E", "density")

2. MECHANICAL & POWER TRANSMISSION:
   - "mech-power-torque": inputs ("power_kw", "rpm") -> outputs ("torque_nm", "rad_s")
   - "mech-gear-spur" (DIN 3960 / ISO 6336): inputs ("module_mm", "pinion_teeth", "gear_teeth", "pressure_angle_deg", "torque_nm", "rpm") -> outputs ("output_torque_nm", "output_rpm", "ratio", "Ft", "Fr", "Fa", "d_pitch_pinion", "d_pitch_gear", "geometry", "report_payload")
   - "mech-gear-helical": inputs ("module_mm", "pinion_teeth", "gear_teeth", "pressure_angle_deg", "helix_angle_deg", "torque_nm") -> outputs ("output_torque_nm", "Ft", "Fr", "Fa")
   - "mech-torsion" (DIN 743 Shaft Torsion): inputs ("torque", "d", "L") -> outputs ("stress", "angle_deg")
   - "mech-bearing-life" (ISO 281): inputs ("Fr", "Fa", "rpm", "C", "C0", "type") -> outputs ("P", "L10h", "geometry", "report_payload")
   - "mech-bolt-stress" (VDI 2230): inputs ("diameter", "pitch", "grade", "torque") -> outputs ("stress_mpa", "preload_n")
   - "mech-hydraulic-cylinder": inputs ("pressure_bar", "bore_d", "rod_d") -> outputs ("push_force_n", "pull_force_n")
   - "mech-pressure-vessel-code" (ASME VIII / EN 13445): inputs ("P", "R", "E") -> outputs ("thickness_mm", "hoop_stress_mpa", "geometry")

3. BEAMS & STRUCTURAL PROFILES:
   - "beam-deflection": inputs ("L", "F", "E", "I") -> outputs ("deflection_mm", "bending_stress_mpa")
   - "geom-i-beam" (EN 10034): inputs ("h", "b", "tw", "tf", "r") -> outputs ("area", "ix", "iy", "wx", "wy", "perimeter", "svg")
   - "geom-rhs" (EN 10219): inputs ("h", "b", "t", "r") -> outputs ("area", "ix", "iy", "wx", "wy")
   - "geom-chs": inputs ("d", "t") -> outputs ("area", "ix", "iy", "wx")

4. VALIDATION & EXPORTERS:
   - "val-safety-factor": inputs ("stress_mpa", "yield_strength_mpa") -> outputs ("safety_factor", "validation_report")
   - "export-dxf": inputs ("geometry", "validation_report") -> outputs ("dxf_content")
   - "export-pdf-report": inputs ("title", "standard", "report_payload", "validation_report", "dxf_file")

CANVAS LAYOUT RULES:
- Column 1 (Inputs): X = 60. Y starts at 60 and increments by 130 for each input.
- Column 2 (Core Calculation): X = 420 to 760.
- Column 3 (Downstream/Sizing): X = 1140.
- Column 4 (Exporters/Reports): X = 1540.

OUTPUT JSON FORMAT:
Return ONLY valid JSON matching this schema:
{
  "title": "Pipeline Title (e.g. '11 kW Motor-Redüktör ve Mil-Rulman Boyutlandırma Akışı')",
  "description": {
    "tr": "Akışın Türkçe mühendislik açıklaması, hesap adımları ve standartları.",
    "en": "English engineering description of the calculation pipeline."
  },
  "standards": ["DIN 3960", "DIN 743", "ISO 281", "VDI 2230"],
  "nodes": [
    {
      "id": "node-id",
      "type": "engineering",
      "position": { "x": 60, "y": 60 },
      "data": {
        "type": "engineering",
        "schemaId": "input-constant-power",
        "nodeVersion": "1.0.0",
        "value": 11
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "source-node-id",
      "sourceHandle": "output_port_id",
      "target": "target-node-id",
      "targetHandle": "input_port_id",
      "animated": true,
      "style": { "stroke": "#00e5ff", "strokeWidth": 2 }
    }
  ],
  "cadBridge": {
    "type": "BOTH",
    "summaryTr": "Hesaplanan dişli takımı (modül 3, z=18/54) ve çıkış mili (Ø40x250mm) 2B teknik resim ve 3B katı modele dönüştürülebilir.",
    "summaryEn": "Calculated gear pair (m=3, z=18/54) and output shaft (Ø40x250mm) can be transferred to 2D drafting and 3D CAD.",
    "suggestedParts": [
      {
        "name": "Pinyon Dişli",
        "kind": "gear",
        "dimensions": { "module": 3, "teeth": 18, "face_width": 35 }
      },
      {
        "name": "Çıkış Mili",
        "kind": "shaft",
        "dimensions": { "diameter": 40, "length": 250 }
      }
    ]
  }
}

Return ONLY valid JSON.`;

/**
 * Deterministic local fallback pipeline generator when no AI API key is configured.
 */
export function generateFlowPipelineFromPrompt(prompt: string): GeneratedFlowPipeline {
  const lower = prompt.toLowerCase();

  // 1. Powertrain (Motor - Reducer - Shaft - Bearing)
  if (lower.includes('motor') || lower.includes('redüktör') || lower.includes('gear') || lower.includes('dişli') || lower.includes('tork')) {
    const isHeavy = lower.includes('15') || lower.includes('22') || lower.includes('ağır');
    const powerKw = isHeavy ? 15 : lower.includes('11') ? 11 : 7.5;
    const rpm = 1450;
    const mod = isHeavy ? 4 : 3;

    return {
      title: `${powerKw} kW Endüstriyel Güç Aktarım & Boyutlandırma Akışı`,
      description: {
        tr: `DIN 3960 ve ISO 281 standartlarına göre ${powerKw} kW motor gücünden torka, pinyon/çark dişli geometrisine, DIN 743 mil gerilmesine ve ISO 281 rulman ömrüne tam bağlı hesap hattı.`,
        en: `Complete calculation pipeline connecting ${powerKw} kW motor to DIN 3960 gear sizing, DIN 743 shaft torsion, and ISO 281 bearing life.`,
      },
      standards: ['DIN 3960', 'ISO 6336', 'DIN 743', 'ISO 281', 'VDI 2230'],
      nodes: [
        { id: 'p-in-kw', type: 'engineering', position: { x: 40, y: 60 }, data: { type: 'engineering', schemaId: 'input-constant-power', value: powerKw, nodeVersion: '1.0.0' } as any },
        { id: 'p-in-rpm', type: 'engineering', position: { x: 40, y: 190 }, data: { type: 'engineering', schemaId: 'input-constant-rpm', value: rpm, nodeVersion: '1.0.0' } as any },
        { id: 'p-in-mod', type: 'engineering', position: { x: 40, y: 320 }, data: { type: 'engineering', schemaId: 'input-constant-module', value: mod, nodeVersion: '1.0.0' } as any },
        { id: 'p-in-z1', type: 'engineering', position: { x: 40, y: 450 }, data: { type: 'engineering', schemaId: 'input-constant-teeth', value: 18, nodeVersion: '1.0.0' } as any },
        { id: 'p-in-z2', type: 'engineering', position: { x: 40, y: 580 }, data: { type: 'engineering', schemaId: 'input-constant-teeth', value: 54, nodeVersion: '1.0.0' } as any },
        { id: 'p-in-mat', type: 'engineering', position: { x: 40, y: 710 }, data: { type: 'engineering', schemaId: 'mech-material', materialName: 'AISI 1045 (Carbon)', nodeVersion: '1.0.0' } as any },
        { id: 'p-core-pt', type: 'engineering', position: { x: 400, y: 100 }, data: { type: 'engineering', schemaId: 'mech-power-torque', nodeVersion: '1.0.0' } as any },
        { id: 'p-core-gear', type: 'engineering', position: { x: 760, y: 220 }, data: { type: 'engineering', schemaId: 'mech-gear-spur', face_width_mm: mod * 10, nodeVersion: '1.0.0' } as any },
        { id: 'p-core-shaft', type: 'engineering', position: { x: 1160, y: 80 }, data: { type: 'engineering', schemaId: 'mech-torsion', d: mod * 12, L: 250, nodeVersion: '1.0.0' } as any },
        { id: 'p-core-brg', type: 'engineering', position: { x: 1160, y: 300 }, data: { type: 'engineering', schemaId: 'mech-bearing-life', C: 42000, C0: 25000, nodeVersion: '1.0.0' } as any },
        { id: 'p-val-sf', type: 'engineering', position: { x: 1540, y: 80 }, data: { type: 'engineering', schemaId: 'val-safety-factor', nodeVersion: '1.0.0' } as any },
        { id: 'p-exp-dxf', type: 'engineering', position: { x: 1540, y: 280 }, data: { type: 'engineering', schemaId: 'export-dxf', nodeVersion: '1.0.0' } as any },
      ],
      edges: [
        { id: 'e-kw', source: 'p-in-kw', sourceHandle: 'value', target: 'p-core-pt', targetHandle: 'power_kw', animated: true, style: { stroke: '#00e5ff', strokeWidth: 2 } },
        { id: 'e-rpm', source: 'p-in-rpm', sourceHandle: 'value', target: 'p-core-pt', targetHandle: 'rpm', animated: true, style: { stroke: '#00e5ff', strokeWidth: 2 } },
        { id: 'e-t-gear', source: 'p-core-pt', sourceHandle: 'torque_nm', target: 'p-core-gear', targetHandle: 'torque_nm', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
        { id: 'e-rpm-gear', source: 'p-in-rpm', sourceHandle: 'value', target: 'p-core-gear', targetHandle: 'rpm', animated: true, style: { stroke: '#00e5ff', strokeWidth: 2 } },
        { id: 'e-m-gear', source: 'p-in-mod', sourceHandle: 'value', target: 'p-core-gear', targetHandle: 'module_mm', animated: true, style: { stroke: '#00e5ff', strokeWidth: 2 } },
        { id: 'e-z1-gear', source: 'p-in-z1', sourceHandle: 'value', target: 'p-core-gear', targetHandle: 'pinion_teeth', animated: true, style: { stroke: '#00e5ff', strokeWidth: 2 } },
        { id: 'e-z2-gear', source: 'p-in-z2', sourceHandle: 'value', target: 'p-core-gear', targetHandle: 'gear_teeth', animated: true, style: { stroke: '#00e5ff', strokeWidth: 2 } },
        { id: 'e-tout-shaft', source: 'p-core-gear', sourceHandle: 'output_torque_nm', target: 'p-core-shaft', targetHandle: 'torque', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
        { id: 'e-ft-brg', source: 'p-core-gear', sourceHandle: 'Ft', target: 'p-core-brg', targetHandle: 'Fr', animated: true, style: { stroke: '#38bdf8', strokeWidth: 2 } },
        { id: 'e-fa-brg', source: 'p-core-gear', sourceHandle: 'Fa', target: 'p-core-brg', targetHandle: 'Fa', animated: true, style: { stroke: '#38bdf8', strokeWidth: 2 } },
        { id: 'e-nout-brg', source: 'p-core-gear', sourceHandle: 'output_rpm', target: 'p-core-brg', targetHandle: 'rpm', animated: true, style: { stroke: '#38bdf8', strokeWidth: 2 } },
        { id: 'e-tau-sf', source: 'p-core-shaft', sourceHandle: 'stress', target: 'p-val-sf', targetHandle: 'stress_mpa', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
        { id: 'e-sy-sf', source: 'p-in-mat', sourceHandle: 'Sy', target: 'p-val-sf', targetHandle: 'yield_strength_mpa', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
        { id: 'e-dxf-g', source: 'p-core-gear', sourceHandle: 'geometry', target: 'p-exp-dxf', targetHandle: 'geometry', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
      ],
      cadBridge: {
        type: 'BOTH',
        summaryTr: `Hesaplanan Pinyon Dişli (m=${mod}, z=18, d=${mod * 18}mm) ve Tahrik Mili (Ø${mod * 12}x250mm) CAD sistemine aktarılabilir.`,
        summaryEn: `Pinion Gear (m=${mod}, z=18, PCD=${mod * 18}mm) and Drive Shaft (Ø${mod * 12}x250mm) can be transferred to CAD.`,
        suggestedParts: [
          {
            name: 'Pinyon Dişli',
            kind: 'gear',
            dimensions: { module: mod, teeth: 18, face_width: mod * 10, pitch_diameter: mod * 18 },
          },
          {
            name: 'Transmisyon Çıkış Mili',
            kind: 'shaft',
            dimensions: { diameter: mod * 12, length: 250 },
          },
        ],
      },
    };
  }

  // 2. Beam Deflection & Profile Sizing
  return {
    title: 'Yapısal Kiriş Profili & Sehim Analiz Akışı',
    description: {
      tr: 'EN 10034 standart I-Kiriş profil kesit özellikleri ve yük altındaki maksimum sehim/eğilme gerilmesi hesap hattı.',
      en: 'EN 10034 standard I-beam section properties and maximum deflection / bending stress calculation pipeline.',
    },
    standards: ['EN 10034', 'DIN 1025', 'Eurocode 3'],
    nodes: [
      { id: 'bm-l', type: 'engineering', position: { x: 50, y: 80 }, data: { type: 'engineering', schemaId: 'input-constant-length', value: 4000, nodeVersion: '1.0.0' } as any },
      { id: 'bm-f', type: 'engineering', position: { x: 50, y: 220 }, data: { type: 'engineering', schemaId: 'input-constant-force', value: 15000, nodeVersion: '1.0.0' } as any },
      { id: 'bm-prof', type: 'engineering', position: { x: 420, y: 120 }, data: { type: 'engineering', schemaId: 'geom-i-beam', h: 200, b: 100, tw: 5.6, tf: 8.5, r: 12, nodeVersion: '1.0.0' } as any },
      { id: 'bm-def', type: 'engineering', position: { x: 820, y: 120 }, data: { type: 'engineering', schemaId: 'beam-deflection', nodeVersion: '1.0.0' } as any },
      { id: 'bm-sf', type: 'engineering', position: { x: 1200, y: 120 }, data: { type: 'engineering', schemaId: 'val-safety-factor', yield_strength_mpa: 275, nodeVersion: '1.0.0' } as any },
    ],
    edges: [
      { id: 'e-l-def', source: 'bm-l', sourceHandle: 'value', target: 'bm-def', targetHandle: 'L', animated: true, style: { stroke: '#00e5ff', strokeWidth: 2 } },
      { id: 'e-f-def', source: 'bm-f', sourceHandle: 'value', target: 'bm-def', targetHandle: 'F', animated: true, style: { stroke: '#38bdf8', strokeWidth: 2 } },
      { id: 'e-ix-def', source: 'bm-prof', sourceHandle: 'ix', target: 'bm-def', targetHandle: 'I', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
      { id: 'e-stress-sf', source: 'bm-def', sourceHandle: 'bending_stress_mpa', target: 'bm-sf', targetHandle: 'stress_mpa', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
    ],
    cadBridge: {
      type: 'BOTH',
      summaryTr: 'IPE 200 Kiriş Profili (200x100mm, boy 4000mm) 2B kesit çizimi ve 3B kiriş modeli olarak CAD alanına aktarılabilir.',
      summaryEn: 'IPE 200 Structural Beam (200x100mm, 4000mm length) can be transferred to 2D CAD and 3D Studio.',
      suggestedParts: [
        {
          name: 'IPE 200 Taşıyıcı Kiriş',
          kind: 'beam',
          dimensions: { height: 200, width: 100, tw: 5.6, tf: 8.5, length: 4000 },
        },
      ],
    },
  };
}

/**
 * Calls the user's active AI provider to synthesize a complete Flow computation graph.
 */
export async function generateFlowPipelineWithAI(
  prompt: string,
  attachments: AIFileAttachment[] = [],
  signal?: AbortSignal,
  onDelta?: (chunk: string) => void
): Promise<GeneratedFlowPipeline> {
  const conn = getActiveConnection();
  const providerMeta = PROVIDERS[conn.provider];

  if (!conn.apiKey && conn.provider !== 'puter') {
    return {
      ...generateFlowPipelineFromPrompt(prompt),
      aiSynthesized: false,
    };
  }

  const attachmentSummary =
    attachments.length > 0
      ? `\n\n[ATTACHMENTS: ${attachments.map((a) => `${a.name} (${a.mimeType})`).join(', ')}]`
      : '';

  const userMessageContent =
    (prompt.trim() ||
      'Mühendislik hesap hattı ve boyutlandırma akış grafiği oluştur.') +
    attachmentSummary;

  const rawText = await streamChat({
    provider: conn.provider,
    model: conn.model,
    apiKey: conn.apiKey,
    baseUrl: conn.baseUrl,
    temperature: 0.15,
    maxTokens: 4000,
    signal,
    onDelta,
    messages: [
      { role: 'system', content: MASTER_FLOW_AI_TRAINING_PROMPT },
      { role: 'user', content: userMessageContent, attachments: attachments.length > 0 ? attachments : undefined },
    ],
  });

  const jsonMatch =
    rawText.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ||
    rawText.match(/(\{[\s\S]*\})/)?.[1] ||
    rawText;

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch.trim());
  } catch {
    return {
      ...generateFlowPipelineFromPrompt(prompt),
      aiSynthesized: true,
      providerLabel: `${providerMeta.name} (${conn.model})`,
    };
  }

  const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  const rawEdges = Array.isArray(parsed.edges) ? parsed.edges : [];

  const nodes: FlowNode[] = rawNodes.map((n: any, idx: number) => {
    return {
      id: String(n.id || `node-${Date.now().toString(36)}-${idx}`),
      type: 'engineering',
      position: n.position || { x: 100 + (idx % 3) * 350, y: 100 + Math.floor(idx / 3) * 160 },
      data: {
        type: 'engineering',
        schemaId: String(n.data?.schemaId || n.schemaId || 'input-constant-power'),
        nodeVersion: '1.0.0',
        ...(n.data || {}),
      } as any,
    };
  });

  const edges: FlowEdge[] = rawEdges.map((e: any, idx: number) => {
    return {
      id: String(e.id || `edge-${Date.now().toString(36)}-${idx}`),
      source: String(e.source),
      sourceHandle: String(e.sourceHandle || 'value'),
      target: String(e.target),
      targetHandle: String(e.targetHandle || 'input'),
      animated: true,
      style: e.style || { stroke: '#00e5ff', strokeWidth: 2 },
    };
  });

  return {
    title: String(parsed.title || `AI Mühendislik Akışı (${nodes.length} Düğüm)`),
    description: {
      tr: String(parsed.description?.tr || `${nodes.length} düğümlü hesaplama akışı oluşturuldu.`),
      en: String(parsed.description?.en || `Engineered calculation pipeline synthesized with ${nodes.length} nodes.`),
    },
    standards: Array.isArray(parsed.standards) && parsed.standards.length > 0 ? parsed.standards.map(String) : ['ISO/DIN Mühendislik Standartları'],
    nodes: nodes.length > 0 ? nodes : generateFlowPipelineFromPrompt(prompt).nodes,
    edges: edges.length > 0 ? edges : generateFlowPipelineFromPrompt(prompt).edges,
    aiSynthesized: true,
    providerLabel: `${providerMeta.name} · ${conn.model}`,
    cadBridge: parsed.cadBridge || {
      type: 'BOTH',
      summaryTr: 'Hesaplanan parametreler 2B/3B CAD ortamına aktarılabilir.',
      summaryEn: 'Calculated parameters can be bridged to 2D/3D CAD.',
      suggestedParts: [
        {
          name: 'Hesaplanan Makine Elemanı',
          kind: 'shaft',
          dimensions: { diameter: 40, length: 200 },
        },
      ],
    },
  };
}

/**
 * Loads the synthesized pipeline into useFlowStore and triggers graph execution.
 */
export function loadFlowPipelineIntoStore(pipeline: GeneratedFlowPipeline) {
  const store = useFlowStore.getState();
  store.loadFlow(pipeline.nodes, pipeline.edges);
  setTimeout(() => {
    store.executeGraph();
  }, 100);
}

/**
 * Bridges the computed engineering outputs from a Flow pipeline directly into 2D CAD or 3D Studio!
 */
export function transferFlowPipelineToCad(pipeline: GeneratedFlowPipeline, target: '2D' | '3D'): { success: boolean; message: string } {
  const suggestions = pipeline.cadBridge.suggestedParts;
  if (!suggestions || suggestions.length === 0) {
    return { success: false, message: 'Aktarılacak geometrik bileşen bulunamadı.' };
  }

  if (target === '2D') {
    // Generate 2D CAD entities
    const entities: CadEntity[] = [];
    const timestamp = Date.now().toString(36);

    suggestions.forEach((part, idx) => {
      const offsetX = idx * 300;

      if (part.kind === 'gear') {
        const m = Number(part.dimensions.module || 3);
        const z = Number(part.dimensions.teeth || 20);
        const d_pitch = m * z;
        const d_tip = d_pitch + 2 * m;
        const d_root = d_pitch - 2.5 * m;
        const d_bore = Math.max(15, Math.round(d_pitch * 0.35));

        // Tip circle
        entities.push({
          id: `ai-fl-gear-tip-${timestamp}-${idx}`,
          layerId: '0',
          color: '#00e5ff',
          geometry: { type: 'CIRCLE', center: { x: offsetX, y: 0 }, radius: d_tip / 2 } as any,
          isVisible: true,
          isSelected: false,
        });
        // Pitch circle (Dashed / yellow)
        entities.push({
          id: `ai-fl-gear-pitch-${timestamp}-${idx}`,
          layerId: '0',
          color: '#f59e0b',
          geometry: { type: 'CIRCLE', center: { x: offsetX, y: 0 }, radius: d_pitch / 2 } as any,
          isVisible: true,
          isSelected: false,
        });
        // Root circle
        entities.push({
          id: `ai-fl-gear-root-${timestamp}-${idx}`,
          layerId: '0',
          color: '#00e5ff',
          geometry: { type: 'CIRCLE', center: { x: offsetX, y: 0 }, radius: d_root / 2 } as any,
          isVisible: true,
          isSelected: false,
        });
        // Shaft bore
        entities.push({
          id: `ai-fl-gear-bore-${timestamp}-${idx}`,
          layerId: '0',
          color: '#00e5ff',
          geometry: { type: 'CIRCLE', center: { x: offsetX, y: 0 }, radius: d_bore / 2 } as any,
          isVisible: true,
          isSelected: false,
        });
        // Centerlines (Red)
        entities.push({
          id: `ai-fl-cl-x-${timestamp}-${idx}`,
          layerId: 'CENTER',
          color: '#ef4444',
          geometry: { type: 'LINE', start: { x: offsetX - d_tip / 2 - 15, y: 0 }, end: { x: offsetX + d_tip / 2 + 15, y: 0 } } as any,
          isVisible: true,
          isSelected: false,
        });
        entities.push({
          id: `ai-fl-cl-y-${timestamp}-${idx}`,
          layerId: 'CENTER',
          color: '#ef4444',
          geometry: { type: 'LINE', start: { x: offsetX, y: -d_tip / 2 - 15 }, end: { x: offsetX, y: d_tip / 2 + 15 } } as any,
          isVisible: true,
          isSelected: false,
        });
        // Pitch diameter dimension
        entities.push({
          id: `ai-fl-dim-${timestamp}-${idx}`,
          layerId: 'DIMENSIONS',
          color: '#f59e0b',
          geometry: {
            type: 'DIMENSION',
            start: { x: offsetX - d_pitch / 2, y: 0 },
            end: { x: offsetX + d_pitch / 2, y: 0 },
            textPoint: { x: offsetX, y: 20 },
            value: d_pitch,
            text: `PCD Ø${d_pitch.toFixed(1)} (m=${m}, z=${z})`,
          } as any,
          isVisible: true,
          isSelected: false,
        });
      } else if (part.kind === 'beam') {
        const h = Number(part.dimensions.height || 200);
        const b = Number(part.dimensions.width || 100);
        const tw = Number(part.dimensions.tw || 5.6);
        const tf = Number(part.dimensions.tf || 8.5);

        // Outer polyline profile of I-Beam
        const vertices = [
          { x: offsetX - b / 2, y: -h / 2 },
          { x: offsetX + b / 2, y: -h / 2 },
          { x: offsetX + b / 2, y: -h / 2 + tf },
          { x: offsetX + tw / 2, y: -h / 2 + tf },
          { x: offsetX + tw / 2, y: h / 2 - tf },
          { x: offsetX + b / 2, y: h / 2 - tf },
          { x: offsetX + b / 2, y: h / 2 },
          { x: offsetX - b / 2, y: h / 2 },
          { x: offsetX - b / 2, y: h / 2 - tf },
          { x: offsetX - tw / 2, y: h / 2 - tf },
          { x: offsetX - tw / 2, y: -h / 2 + tf },
          { x: offsetX - b / 2, y: -h / 2 + tf },
        ];

        entities.push({
          id: `ai-fl-beam-${timestamp}-${idx}`,
          layerId: '0',
          color: '#00e5ff',
          geometry: { type: 'POLYLINE', vertices, closed: true } as any,
          isVisible: true,
          isSelected: false,
        });

        // Dimensions
        entities.push({
          id: `ai-fl-bdim-h-${timestamp}-${idx}`,
          layerId: 'DIMENSIONS',
          color: '#f59e0b',
          geometry: {
            type: 'DIMENSION',
            start: { x: offsetX - b / 2 - 25, y: -h / 2 },
            end: { x: offsetX - b / 2 - 25, y: h / 2 },
            textPoint: { x: offsetX - b / 2 - 40, y: 0 },
            value: h,
            text: `h = ${h}mm`,
          } as any,
          isVisible: true,
          isSelected: false,
        });
        entities.push({
          id: `ai-fl-bdim-b-${timestamp}-${idx}`,
          layerId: 'DIMENSIONS',
          color: '#f59e0b',
          geometry: {
            type: 'DIMENSION',
            start: { x: offsetX - b / 2, y: h / 2 + 20 },
            end: { x: offsetX + b / 2, y: h / 2 + 20 },
            textPoint: { x: offsetX, y: h / 2 + 35 },
            value: b,
            text: `b = ${b}mm`,
          } as any,
          isVisible: true,
          isSelected: false,
        });
      } else {
        // Shaft / Cylinder 2D elevation
        const d = Number(part.dimensions.diameter || 40);
        const L = Number(part.dimensions.length || 200);

        entities.push({
          id: `ai-fl-shaft-${timestamp}-${idx}`,
          layerId: '0',
          color: '#00e5ff',
          geometry: {
            type: 'RECTANGLE',
            center: { x: offsetX + L / 2, y: 0 },
            width: L,
            height: d,
          } as any,
          isVisible: true,
          isSelected: false,
        });
        // Centerline
        entities.push({
          id: `ai-fl-shaft-cl-${timestamp}-${idx}`,
          layerId: 'CENTER',
          color: '#ef4444',
          geometry: {
            type: 'LINE',
            start: { x: offsetX - 15, y: 0 },
            end: { x: offsetX + L + 15, y: 0 },
          } as any,
          isVisible: true,
          isSelected: false,
        });
        // Dimensions
        entities.push({
          id: `ai-fl-sdim-l-${timestamp}-${idx}`,
          layerId: 'DIMENSIONS',
          color: '#f59e0b',
          geometry: {
            type: 'DIMENSION',
            start: { x: offsetX, y: d / 2 + 15 },
            end: { x: offsetX + L, y: d / 2 + 15 },
            textPoint: { x: offsetX + L / 2, y: d / 2 + 30 },
            value: L,
            text: `L = ${L}mm`,
          } as any,
          isVisible: true,
          isSelected: false,
        });
      }
    });

    const cadStore = useCadStore.getState();
    cadStore.addEntities(entities);
    setTimeout(() => {
      cadStore.zoomExtents();
    }, 120);

    return {
      success: true,
      message: `✓ ${entities.length} adet 2B CAD varlığı AluCAD çizim alanına aktarıldı ve ekrana sığdırıldı.`,
    };
  } else {
    // Generate 3D CAD parts in designStore
    const parts: DesignPart[] = [];
    const timestamp = Date.now().toString(36);

    suggestions.forEach((part, idx) => {
      const offsetX = idx * 250;

      if (part.kind === 'gear') {
        const m = Number(part.dimensions.module || 3);
        const z = Number(part.dimensions.teeth || 20);
        const d_pitch = m * z;
        const b = Number(part.dimensions.face_width || 35);

        parts.push({
          id: `flow-3d-gear-${timestamp}-${idx}`,
          name: `${part.name} (m=${m}, z=${z})`,
          kind: 'cylinder',
          params: { diameter: d_pitch, length: b },
          position: { x: offsetX, y: b / 2, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#38bdf8',
          visible: true,
          locked: false,
          parentId: null,
        });
      } else if (part.kind === 'beam') {
        const h = Number(part.dimensions.height || 200);
        const b = Number(part.dimensions.width || 100);
        const L = Number(part.dimensions.length || 1000);

        parts.push({
          id: `flow-3d-beam-${timestamp}-${idx}`,
          name: `${part.name} (IPE ${h})`,
          kind: 'box',
          params: { width: b, height: h, depth: L, length: L },
          position: { x: offsetX, y: h / 2, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#64748b',
          visible: true,
          locked: false,
          parentId: null,
        });
      } else {
        const d = Number(part.dimensions.diameter || 40);
        const L = Number(part.dimensions.length || 200);

        parts.push({
          id: `flow-3d-shaft-${timestamp}-${idx}`,
          name: `${part.name} (Ø${d}x${L}mm)`,
          kind: 'cylinder',
          params: { diameter: d, length: L },
          position: { x: offsetX, y: d / 2, z: 0 },
          rotation: { x: 0, y: 0, z: 90 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#94a3b8',
          visible: true,
          locked: false,
          parentId: null,
        });
      }
    });

    useDesignStore.setState((s) => ({
      parts: [...s.parts, ...parts],
      selectedId: parts[0]?.id || null,
    }));
    triggerCameraView('iso');

    return {
      success: true,
      message: `✓ ${parts.length} adet 3D parametrik parça 3D CAD Studio'ya aktarıldı.`,
    };
  }
}
