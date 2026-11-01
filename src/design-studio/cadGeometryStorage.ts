/**
 * IndexedDB Persistence for Imported CAD Geometries (STEP, STL, OBJ, IGES, Parasolid, DXF)
 * 
 * Solves the issue where refreshing the page causes imported models to revert into box geometry
 * due to localStorage's 5MB limit and JSON non-serializability of THREE.BufferGeometry.
 */

import * as THREE from 'three';

const DB_NAME = 'alucalc_cad_storage_v1';
const STORE_NAME = 'geometries';
const DB_VERSION = 1;

export interface SerializedCADGeometry {
  partId: string;
  positions: Float32Array;
  normals?: Float32Array;
  indices?: Uint32Array | Uint16Array;
  groups?: Array<{ start: number; count: number; materialIndex?: number }>;
  updatedAt: number;
}

// In-memory fallback map for non-browser or test environments (e.g. Node/vitest)
const memoryFallbackStore = new Map<string, SerializedCADGeometry>();

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'partId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
  });
}

/**
 * Serializes a THREE.BufferGeometry into raw typed arrays for binary storage.
 */
export function serializeGeometry(partId: string, geom: THREE.BufferGeometry): SerializedCADGeometry | null {
  const posAttr = geom.getAttribute('position');
  if (!posAttr || !posAttr.array || posAttr.count === 0) return null;

  // Copy typed array slices to prevent detached buffer issues
  const positions = new Float32Array(posAttr.array);
  const normAttr = geom.getAttribute('normal');
  const normals = normAttr && normAttr.array && normAttr.count > 0 ? new Float32Array(normAttr.array) : undefined;

  const indexAttr = geom.getIndex();
  let indices: Uint32Array | Uint16Array | undefined = undefined;
  if (indexAttr && indexAttr.array && indexAttr.count > 0) {
    indices = indexAttr.array instanceof Uint32Array
      ? new Uint32Array(indexAttr.array)
      : new Uint16Array(indexAttr.array);
  }

  const groups = geom.groups && geom.groups.length > 0
    ? geom.groups.map(g => ({ start: g.start, count: g.count, materialIndex: g.materialIndex }))
    : undefined;

  return {
    partId,
    positions,
    normals,
    indices,
    groups,
    updatedAt: Date.now(),
  };
}

/**
 * Reconstructs a full THREE.BufferGeometry from serialized typed arrays.
 */
export function reconstructGeometry(record: SerializedCADGeometry): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(record.positions, 3));

  if (record.normals && record.normals.length > 0) {
    geom.setAttribute('normal', new THREE.BufferAttribute(record.normals, 3));
  } else {
    geom.computeVertexNormals();
  }

  if (record.indices && record.indices.length > 0) {
    geom.setIndex(new THREE.BufferAttribute(record.indices, 1));
  }

  if (record.groups && record.groups.length > 0) {
    geom.groups = record.groups;
  }

  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

/**
 * Saves a part's CAD geometry to IndexedDB.
 */
export async function saveCADGeometry(partId: string, geom: THREE.BufferGeometry): Promise<void> {
  const serialized = serializeGeometry(partId, geom);
  if (!serialized) return;

  if (!isIndexedDBAvailable()) {
    memoryFallbackStore.set(partId, serialized);
    return;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(serialized);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('cadGeometryStorage: Failed to save to IndexedDB, using memory fallback:', err);
    memoryFallbackStore.set(partId, serialized);
  }
}

/**
 * Loads a part's CAD geometry from IndexedDB.
 */
export async function loadCADGeometry(partId: string): Promise<THREE.BufferGeometry | null> {
  if (!isIndexedDBAvailable()) {
    const rec = memoryFallbackStore.get(partId);
    return rec ? reconstructGeometry(rec) : null;
  }

  try {
    const db = await openDB();
    const record = await new Promise<SerializedCADGeometry | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(partId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (record) {
      return reconstructGeometry(record);
    }
  } catch (err) {
    console.warn(`cadGeometryStorage: Failed to load part ${partId} from IndexedDB:`, err);
  }

  const fallback = memoryFallbackStore.get(partId);
  return fallback ? reconstructGeometry(fallback) : null;
}

/**
 * Loads all stored CAD geometries from IndexedDB.
 */
export async function loadAllCADGeometries(): Promise<Map<string, THREE.BufferGeometry>> {
  const result = new Map<string, THREE.BufferGeometry>();

  if (!isIndexedDBAvailable()) {
    memoryFallbackStore.forEach((rec, id) => {
      result.set(id, reconstructGeometry(rec));
    });
    return result;
  }

  try {
    const db = await openDB();
    const records = await new Promise<SerializedCADGeometry[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const rec of records) {
      if (rec && rec.partId && rec.positions) {
        result.set(rec.partId, reconstructGeometry(rec));
      }
    }
  } catch (err) {
    console.warn('cadGeometryStorage: Failed to load all from IndexedDB, using memory fallback:', err);
    memoryFallbackStore.forEach((rec, id) => {
      result.set(id, reconstructGeometry(rec));
    });
  }

  return result;
}

/**
 * Deletes a CAD geometry from IndexedDB when a part is removed.
 */
export async function deleteCADGeometry(partId: string): Promise<void> {
  memoryFallbackStore.delete(partId);

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(partId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`cadGeometryStorage: Failed to delete ${partId} from IndexedDB:`, err);
  }
}

/**
 * Clears all stored CAD geometries from IndexedDB (e.g. on clearScene).
 */
export async function clearAllCADGeometries(): Promise<void> {
  memoryFallbackStore.clear();

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('cadGeometryStorage: Failed to clear IndexedDB:', err);
  }
}
