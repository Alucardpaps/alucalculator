'use client';

export type CameraViewPreset = 'iso' | 'top' | 'bottom' | 'front' | 'back' | 'right' | 'left' | 'fit';

export type CameraAction =
  | CameraViewPreset
  | { type: 'focus'; partId?: string; part?: any }
  | { type: 'focus-face'; partId: string; face?: string };

export const CAD_CAMERA_ACTION_EVENT = 'cad-camera-action';

/**
 * Dispatches a camera event to the active 3D DesignViewport without tight coupling or Three.js bundling.
 */
export function triggerCameraView(action: CameraAction): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CAD_CAMERA_ACTION_EVENT, { detail: action }));
  }
}
