# 🔩 ALUCALCULATOR — UNIFIED ENGINEERING EVOLUTION PLAN
## Kernel → CAD → Manufacturing → System Intelligence

---

## 🧠 PHASE 0 — ENGINEERING KERNEL ✅ (KİLİTLİ)

> Tamamlandı ve değiştirilemez.

| Bileşen | Dosya | Durum |
|---------|-------|-------|
| Deterministic math core | `involute.ts` | ✅ |
| True involute (DIN 3960) | `involute.ts` | ✅ |
| CNC-grade DXF export | `dxf.exporter.ts` | ✅ |
| Validation-before-export | `dxf.exporter.ts` | ✅ |
| Undercut + profile shift | `involute.ts` | ✅ |

📌 **Kural:** UI kararları matematik veya export kurallarını ETKİLEYEMEZ.

---

## 🧱 PHASE 1 — MANUFACTURING GEOMETRY ✅

### 1.1 DXF (2D – CNC/Laser/Waterjet) ✅
- `dxf.exporter.ts` — Math → Polyline (mesh yok)
- Layers: `PART_CONTOUR`, `PITCH_CIRCLE`, `REFERENCE`
- Validation fail → export blocked

### 1.2 STEP (3D – CAD/CAM) ✅
- `step.writer.ts` — ISO-10303-21 AP214 writer
- `step.geometry.ts` — Gear profile → 3D solid extrusion
- Extrude tabanlı

---

## 🔗 PHASE 2 — ENGINEERING GRAPH ✅

- `graph.engine.ts` — DAG execution, topological sort
- `node.definitions.ts` — Gear, Shaft, Bearing nodes
- Failure propagation implemented

```
[Gear] → torque → [Shaft] → load → [Bearing]
```

---

## 🖥️ PHASE 3 — UI AS CLIENT ✅ (Mevcut)

- UI kalıcı konsol (osStore.ts, flowStore.ts)
- Parametre gönderir, sonuç render eder
- TrustPanel.tsx ile doğrulama gösterimi

---

## 📦 PHASE 4 — PROJECT INTEROP 🔄

- [x] DXF export
- [x] STEP export  
- [ ] PDF engineering report (mevcut, geliştirilebilir)
- [ ] Tam CAD pipeline test (Fusion, SolidWorks)

---

## 🧪 PHASE 5 — TRUST & VERIFICATION ✅

- `kernel.tests.ts` — DIN/ISO test vectors
- Involute function tests
- Geometry tests
- Undercut detection tests
- Mesh analysis tests

---

## 📊 CURRENT STATUS

| Phase | Durum | Dosyalar |
|-------|-------|----------|
| Phase 0 | ✅ Kilitli | `involute.ts` |
| Phase 1.1 (DXF) | ✅ | `dxf.exporter.ts` |
| Phase 1.2 (STEP) | ✅ | `step.writer.ts`, `step.geometry.ts` |
| Phase 2 (Graph) | ✅ | `graph.engine.ts`, `node.definitions.ts` |
| Phase 3 (UI) | ✅ | TrustPanel, osStore, flowStore |
| Phase 4 (Interop) | 🔄 | DXF/STEP done, PDF in progress |
| Phase 5 (Trust) | ✅ | `kernel.tests.ts` |

---

## 📁 ENGINE FILE STRUCTURE (VERİFİED)

```
src/engines/
 ├─ math/
 │   ├─ involute.ts         ✅ (15KB)
 │   ├─ gear.geometry.ts    ✅ (14KB)
 │   ├─ primitives.ts       ✅ (9KB)
 │   └─ index.ts            ✅
 ├─ export/
 │   ├─ dxf.exporter.ts     ✅ (11KB)
 │   ├─ step.writer.ts      ✅ (9KB)
 │   ├─ step.geometry.ts    ✅ (10KB)
 │   └─ index.ts            ✅
 ├─ graph/
 │   ├─ graph.engine.ts     ✅ (12KB)
 │   ├─ node.definitions.ts ✅ (11KB)
 │   └─ index.ts            ✅
 └─ tests/
     └─ kernel.tests.ts     ✅ (14KB)
```

---

*Bu doküman artık "yapılacaklar listesi" değil, çekirdeğin evrim planıdır.*
*Son güncelleme: 2026-02-09*
