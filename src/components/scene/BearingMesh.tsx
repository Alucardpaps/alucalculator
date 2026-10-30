'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface BearingMeshProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  innerDia?: number;
  outerDia?: number;
  width?: number;
  bearingType?: string;
  needleType?: string;
  bearingFamily?: string;
  bearingCode?: string;
  isSelected: boolean;
  isSnappable: boolean;
  isGhost?: boolean;
  onPointerDown?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export const BearingMesh = ({
  id,
  position,
  rotation,
  innerDia = 20,
  outerDia = 47,
  width = 14,
  bearingType,
  needleType,
  bearingFamily,
  bearingCode,
  isSelected,
  isSnappable,
  isGhost = false,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: BearingMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Convert dimensions to world units (1 unit = 200mm)
  const d = innerDia / 200;
  const D = outerDia / 200;
  const B = width / 200;

  const glowRef = useRef(0);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetGlow = isSelected ? 1.0 : hovered ? 0.6 : isSnappable ? 0.4 : 0;
    glowRef.current = THREE.MathUtils.lerp(glowRef.current, targetGlow, delta * 8);
  });

  // Resolve bearing family
  const resolvedFamily = useMemo(() => {
    let t = (bearingType || '').toLowerCase();
    if (t === 'roller') t = 'cylindrical-roller';
    if (t === 'ball') t = 'deep-groove-ball';
    if (!t) {
      const codeUpper = (bearingCode || bearingFamily || '').toUpperCase();
      if (codeUpper.startsWith('30') || codeUpper.startsWith('32') || codeUpper.includes('TAPER')) return 'tapered-roller';
      if (codeUpper.startsWith('NU') || codeUpper.startsWith('NJ') || codeUpper.includes('CYLINDRICAL')) return 'cylindrical-roller';
      if (codeUpper.startsWith('HK') || codeUpper.startsWith('NA') || codeUpper.includes('NEEDLE')) return 'needle-roller';
      if (codeUpper.startsWith('222') || codeUpper.startsWith('223') || codeUpper.includes('SPHERICAL')) return 'spherical-roller';
      if (codeUpper.startsWith('511') || codeUpper.startsWith('512') || codeUpper.includes('THRUST')) return 'thrust-ball';
      if (codeUpper.startsWith('72') || codeUpper.startsWith('73') || codeUpper.includes('ANGULAR')) return 'angular-contact-ball';
      if (codeUpper.startsWith('12') || codeUpper.startsWith('22') || codeUpper.includes('SELF-ALIGNING')) return 'self-aligning-ball';
      return 'deep-groove-ball';
    }
    return t;
  }, [bearingType, bearingFamily, bearingCode]);

  interface ElementInfo {
    x: number;
    y: number;
    z: number;
    rotX: number;
    rotY: number;
    rotZ: number;
    geomKey: 'element1' | 'element2';
  }

  const {
    outerRingGeom,
    innerRingGeom,
    cageGeom,
    elementGeom1,
    elementGeom2,
    elementsInfo,
    outerEdges,
    innerEdges,
    hasInnerRing,
  } = useMemo(() => {
    const rBore = d / 2;
    const rOuter = D / 2;
    const radialGap = Math.max(0.001, rOuter - rBore);
    const rCage = (rBore + rOuter) / 2;

    const extrudeSettings = {
      depth: B,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.001,
      bevelThickness: 0.001,
      curveSegments: 36,
    };

    let oGeom: THREE.BufferGeometry;
    let iGeom: THREE.BufferGeometry;
    let cGeom: THREE.BufferGeometry | null = null;
    let el1: THREE.BufferGeometry;
    let el2: THREE.BufferGeometry | null = null;
    const elements: ElementInfo[] = [];
    let showInner = true;

    // ─── 1. THRUST BEARINGS (Eksenel Rulmanlar) ───
    if (resolvedFamily === 'thrust-ball' || resolvedFamily === 'thrust-roller') {
      const washerThick = B * 0.35;
      const washerExtrude = {
        depth: washerThick,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.0005,
        bevelThickness: 0.0005,
        curveSegments: 36,
      };

      // Housing washer (top, +Z)
      const topShape = new THREE.Shape();
      topShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const topHole = new THREE.Path();
      topHole.absarc(0, 0, rBore + radialGap * 0.12, 0, Math.PI * 2, true);
      topShape.holes.push(topHole);
      oGeom = new THREE.ExtrudeGeometry(topShape, washerExtrude);
      oGeom.translate(0, 0, B / 2 - washerThick / 2);

      // Shaft washer (bottom, -Z)
      const botShape = new THREE.Shape();
      botShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const botHole = new THREE.Path();
      botHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
      botShape.holes.push(botHole);
      iGeom = new THREE.ExtrudeGeometry(botShape, washerExtrude);
      iGeom.translate(0, 0, -B / 2 + washerThick / 2);

      // Rolling elements in XY center plane
      const ballR = Math.min(washerThick * 0.6, radialGap * 0.32);
      el1 = new THREE.SphereGeometry(ballR, 16, 16);
      cGeom = new THREE.TorusGeometry(rCage, ballR * 0.25, 8, 36);

      const nElements = 14;
      for (let j = 0; j < nElements; j++) {
        const a = (j * Math.PI * 2) / nElements;
        elements.push({
          x: Math.cos(a) * rCage,
          y: Math.sin(a) * rCage,
          z: 0,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          geomKey: 'element1',
        });
      }
    }
    // ─── 2. NEEDLE ROLLER (İğneli Makaralı) ───
    else if (resolvedFamily === 'needle-roller') {
      const isHK = needleType === 'drawn-cup' || (!needleType && (bearingCode?.startsWith('HK') || d <= 0.12));
      showInner = !isHK;

      const cupWall = isHK ? radialGap * 0.15 : radialGap * 0.25;
      const rOuterMin = rOuter - cupWall;
      const rInnerMax = rBore + radialGap * 0.25;

      // Thin drawn-cup or solid outer ring
      const outerShape = new THREE.Shape();
      outerShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const outerHole = new THREE.Path();
      outerHole.absarc(0, 0, rOuterMin, 0, Math.PI * 2, true);
      outerShape.holes.push(outerHole);
      oGeom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      oGeom.center();

      if (showInner) {
        const innerShape = new THREE.Shape();
        innerShape.absarc(0, 0, rInnerMax, 0, Math.PI * 2, false);
        const innerHole = new THREE.Path();
        innerHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
        innerShape.holes.push(innerHole);
        iGeom = new THREE.ExtrudeGeometry(innerShape, extrudeSettings);
        iGeom.center();
      } else {
        iGeom = new THREE.BufferGeometry();
      }

      const needleR = isHK ? radialGap * 0.35 : radialGap * 0.22;
      const needleLen = B * 0.82;
      el1 = new THREE.CylinderGeometry(needleR * 0.45, needleR * 0.45, needleLen, 12);
      cGeom = new THREE.TorusGeometry(rCage, needleR * 0.2, 8, 36);

      const nNeedles = 24;
      for (let j = 0; j < nNeedles; j++) {
        const a = (j * Math.PI * 2) / nNeedles;
        elements.push({
          x: Math.cos(a) * rCage,
          y: Math.sin(a) * rCage,
          z: 0,
          rotX: Math.PI / 2, // aligned with bearing axis Z
          rotY: 0,
          rotZ: 0,
          geomKey: 'element1',
        });
      }
    }
    // ─── 3. CYLINDRICAL ROLLER (Silindirik Makaralı NU/NJ) ───
    else if (resolvedFamily === 'cylindrical-roller') {
      const rInnerMax = rBore + radialGap * 0.28;
      const rOuterMin = rOuter - radialGap * 0.28;

      const outerShape = new THREE.Shape();
      outerShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const outerHole = new THREE.Path();
      outerHole.absarc(0, 0, rOuterMin, 0, Math.PI * 2, true);
      outerShape.holes.push(outerHole);
      oGeom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      oGeom.center();

      // NU series: smooth cylindrical raceway
      const innerShape = new THREE.Shape();
      innerShape.absarc(0, 0, rInnerMax, 0, Math.PI * 2, false);
      const innerHole = new THREE.Path();
      innerHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
      innerShape.holes.push(innerHole);
      iGeom = new THREE.ExtrudeGeometry(innerShape, extrudeSettings);
      iGeom.center();

      const rollerR = radialGap * 0.26;
      const rollerLen = B * 0.68;
      el1 = new THREE.CylinderGeometry(rollerR, rollerR, rollerLen, 16);
      cGeom = new THREE.TorusGeometry(rCage, rollerR * 0.25, 8, 36);

      const nRollers = 13;
      for (let j = 0; j < nRollers; j++) {
        const a = (j * Math.PI * 2) / nRollers;
        elements.push({
          x: Math.cos(a) * rCage,
          y: Math.sin(a) * rCage,
          z: 0,
          rotX: Math.PI / 2, // Cylinder axis parallel to bearing axis Z
          rotY: 0,
          rotZ: 0,
          geomKey: 'element1',
        });
      }
    }
    // ─── 4. TAPERED ROLLER (Konik Makaralı) ───
    else if (resolvedFamily === 'tapered-roller') {
      const rInnerMax = rBore + radialGap * 0.30;
      const rOuterMin = rOuter - radialGap * 0.30;

      const outerShape = new THREE.Shape();
      outerShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const outerHole = new THREE.Path();
      outerHole.absarc(0, 0, rOuterMin, 0, Math.PI * 2, true);
      outerShape.holes.push(outerHole);
      oGeom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      oGeom.center();

      const innerShape = new THREE.Shape();
      innerShape.absarc(0, 0, rInnerMax, 0, Math.PI * 2, false);
      const innerHole = new THREE.Path();
      innerHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
      innerShape.holes.push(innerHole);
      iGeom = new THREE.ExtrudeGeometry(innerShape, extrudeSettings);
      iGeom.center();

      const rTop = radialGap * 0.22;
      const rBot = radialGap * 0.30;
      const rollerLen = B * 0.68;
      el1 = new THREE.CylinderGeometry(rTop, rBot, rollerLen, 16);
      cGeom = new THREE.TorusGeometry(rCage, rTop * 0.3, 8, 36);

      const nRollers = 14;
      const coneAngle = 0.25; // ~14 deg
      for (let j = 0; j < nRollers; j++) {
        const a = (j * Math.PI * 2) / nRollers;
        elements.push({
          x: Math.cos(a) * rCage,
          y: Math.sin(a) * rCage,
          z: 0,
          rotX: Math.PI / 2 + Math.cos(a) * coneAngle,
          rotY: Math.sin(a) * coneAngle,
          rotZ: a,
          geomKey: 'element1',
        });
      }
    }
    // ─── 5. SPHERICAL ROLLER (Oynak Makaralı 22200 - Çift Sıra Fıçı) ───
    else if (resolvedFamily === 'spherical-roller') {
      const rInnerMax = rBore + radialGap * 0.28;
      const rOuterMin = rOuter - radialGap * 0.28;

      const outerShape = new THREE.Shape();
      outerShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const outerHole = new THREE.Path();
      outerHole.absarc(0, 0, rOuterMin, 0, Math.PI * 2, true);
      outerShape.holes.push(outerHole);
      oGeom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      oGeom.center();

      const innerShape = new THREE.Shape();
      innerShape.absarc(0, 0, rInnerMax, 0, Math.PI * 2, false);
      const innerHole = new THREE.Path();
      innerHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
      innerShape.holes.push(innerHole);
      iGeom = new THREE.ExtrudeGeometry(innerShape, extrudeSettings);
      iGeom.center();

      const rollerR = radialGap * 0.24;
      const rollerLen = B * 0.44;
      // Barrel rollers
      el1 = new THREE.CylinderGeometry(rollerR * 0.88, rollerR, rollerLen, 14);
      el2 = new THREE.CylinderGeometry(rollerR, rollerR * 0.88, rollerLen, 14);
      cGeom = new THREE.TorusGeometry(rCage, rollerR * 0.2, 8, 36);

      const nRollers = 11;
      const tilt = 0.18; // ~10 deg tilt
      for (let j = 0; j < nRollers; j++) {
        const a = (j * Math.PI * 2) / nRollers;
        // Row 1 (+Z)
        elements.push({
          x: Math.cos(a) * rCage,
          y: Math.sin(a) * rCage,
          z: B * 0.22,
          rotX: Math.PI / 2 + Math.cos(a) * tilt,
          rotY: Math.sin(a) * tilt,
          rotZ: a,
          geomKey: 'element1',
        });
        // Row 2 (-Z, staggered)
        const a2 = a + Math.PI / nRollers;
        elements.push({
          x: Math.cos(a2) * rCage,
          y: Math.sin(a2) * rCage,
          z: -B * 0.22,
          rotX: Math.PI / 2 - Math.cos(a2) * tilt,
          rotY: -Math.sin(a2) * tilt,
          rotZ: a2,
          geomKey: 'element2',
        });
      }
    }
    // ─── 6. SELF-ALIGNING BALL (Oynak Bilyalı 1200 - Çift Sıra Bilya) ───
    else if (resolvedFamily === 'self-aligning-ball') {
      const rInnerMax = rBore + radialGap * 0.25;
      const rOuterMin = rOuter - radialGap * 0.25;

      const outerShape = new THREE.Shape();
      outerShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const outerHole = new THREE.Path();
      outerHole.absarc(0, 0, rOuterMin, 0, Math.PI * 2, true);
      outerShape.holes.push(outerHole);
      oGeom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      oGeom.center();

      const innerShape = new THREE.Shape();
      innerShape.absarc(0, 0, rInnerMax, 0, Math.PI * 2, false);
      const innerHole = new THREE.Path();
      innerHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
      innerShape.holes.push(innerHole);
      iGeom = new THREE.ExtrudeGeometry(innerShape, extrudeSettings);
      iGeom.center();

      const ballR = radialGap * 0.24;
      el1 = new THREE.SphereGeometry(ballR, 14, 14);
      cGeom = new THREE.TorusGeometry(rCage, ballR * 0.25, 8, 36);

      const nBalls = 10;
      for (let j = 0; j < nBalls; j++) {
        const a = (j * Math.PI * 2) / nBalls;
        // Row 1 (+Z)
        elements.push({
          x: Math.cos(a) * rCage,
          y: Math.sin(a) * rCage,
          z: B * 0.20,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          geomKey: 'element1',
        });
        // Row 2 (-Z, staggered)
        const a2 = a + Math.PI / nBalls;
        elements.push({
          x: Math.cos(a2) * rCage,
          y: Math.sin(a2) * rCage,
          z: -B * 0.20,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          geomKey: 'element1',
        });
      }
    }
    // ─── 7. ANGULAR CONTACT BALL (Açısal Temaslı Bilyalı 7200) ───
    else if (resolvedFamily === 'angular-contact-ball') {
      const rInnerMax = rBore + radialGap * 0.25;
      const rOuterMin = rOuter - radialGap * 0.25;

      const outerShape = new THREE.Shape();
      outerShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const outerHole = new THREE.Path();
      outerHole.absarc(0, 0, rOuterMin, 0, Math.PI * 2, true);
      outerShape.holes.push(outerHole);
      oGeom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      oGeom.center();

      const innerShape = new THREE.Shape();
      innerShape.absarc(0, 0, rInnerMax, 0, Math.PI * 2, false);
      const innerHole = new THREE.Path();
      innerHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
      innerShape.holes.push(innerHole);
      iGeom = new THREE.ExtrudeGeometry(innerShape, extrudeSettings);
      iGeom.center();

      const ballR = radialGap * 0.32;
      el1 = new THREE.SphereGeometry(ballR, 16, 16);
      cGeom = new THREE.TorusGeometry(rCage, ballR * 0.25, 8, 36);

      const nBalls = 10;
      for (let j = 0; j < nBalls; j++) {
        const a = (j * Math.PI * 2) / nBalls;
        elements.push({
          x: Math.cos(a) * rCage,
          y: Math.sin(a) * rCage,
          z: 0,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          geomKey: 'element1',
        });
      }
    }
    // ─── 8. DEEP GROOVE BALL (Sabit Bilyalı 6000 - Default) ───
    else {
      const rInnerMax = rBore + radialGap * 0.25;
      const rOuterMin = rOuter - radialGap * 0.25;

      const outerShape = new THREE.Shape();
      outerShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
      const outerHole = new THREE.Path();
      outerHole.absarc(0, 0, rOuterMin, 0, Math.PI * 2, true);
      outerShape.holes.push(outerHole);
      oGeom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      oGeom.center();

      const innerShape = new THREE.Shape();
      innerShape.absarc(0, 0, rInnerMax, 0, Math.PI * 2, false);
      const innerHole = new THREE.Path();
      innerHole.absarc(0, 0, rBore, 0, Math.PI * 2, true);
      innerShape.holes.push(innerHole);
      iGeom = new THREE.ExtrudeGeometry(innerShape, extrudeSettings);
      iGeom.center();

      const ballR = radialGap * 0.32;
      el1 = new THREE.SphereGeometry(ballR, 16, 16);
      cGeom = new THREE.TorusGeometry(rCage, ballR * 0.25, 8, 36);

      const nBalls = 9;
      for (let j = 0; j < nBalls; j++) {
        const a = (j * Math.PI * 2) / nBalls;
        elements.push({
          x: Math.cos(a) * rCage,
          y: Math.sin(a) * rCage,
          z: 0,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          geomKey: 'element1',
        });
      }
    }

    const oEdges = new THREE.EdgesGeometry(oGeom);
    const iEdges = showInner ? new THREE.EdgesGeometry(iGeom) : new THREE.EdgesGeometry(new THREE.BufferGeometry());

    return {
      outerRingGeom: oGeom,
      innerRingGeom: iGeom,
      cageGeom: cGeom,
      elementGeom1: el1,
      elementGeom2: el2,
      elementsInfo: elements,
      outerEdges: oEdges,
      innerEdges: iEdges,
      hasInnerRing: showInner,
    };
  }, [d, D, B, resolvedFamily, needleType, bearingCode]);

  useEffect(() => {
    return () => {
      outerRingGeom.dispose();
      innerRingGeom.dispose();
      cageGeom?.dispose();
      elementGeom1.dispose();
      elementGeom2?.dispose();
      outerEdges.dispose();
      innerEdges.dispose();
    };
  }, [outerRingGeom, innerRingGeom, cageGeom, elementGeom1, elementGeom2, outerEdges, innerEdges]);

  const color = useMemo(() => {
    if (isGhost) return '#00e5ff';
    if (isSelected) return '#00e5ff';
    if (isSnappable) return '#34d399';
    return '#94a3b8'; // Polished steel look
  }, [isGhost, isSelected, isSnappable]);

  const opacity = isGhost ? 0.35 : 1;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.(e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onPointerOver?.(e);
      }}
      onPointerOut={(e) => {
        setHovered(false);
        onPointerOut?.(e);
      }}
      userData={{ componentId: id, type: 'bearing', bearingFamily: resolvedFamily }}
    >
      {/* Outer Ring */}
      <mesh geometry={outerRingGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          metalness={0.95}
          roughness={0.1}
          transparent={isGhost}
          opacity={opacity}
          emissive={color}
          emissiveIntensity={glowRef.current * 0.15}
        />
      </mesh>

      {/* Inner Ring (if present) */}
      {hasInnerRing && (
        <mesh geometry={innerRingGeom} castShadow receiveShadow>
          <meshStandardMaterial
            color={color}
            metalness={0.95}
            roughness={0.1}
            transparent={isGhost}
            opacity={opacity}
            emissive={color}
            emissiveIntensity={glowRef.current * 0.15}
          />
        </mesh>
      )}

      {/* Rolling Elements (Balls, Needles, Cylindrical/Tapered/Barrel Rollers) */}
      {!isGhost && elementsInfo.map((elem, index) => {
        const geom = elem.geomKey === 'element2' && elementGeom2 ? elementGeom2 : elementGeom1;
        return (
          <mesh
            key={index}
            geometry={geom}
            position={[elem.x, elem.y, elem.z]}
            rotation={[elem.rotX, elem.rotY, elem.rotZ]}
            castShadow
          >
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.98}
              roughness={0.06}
            />
          </mesh>
        );
      })}

      {/* Cage (Brass or steel retainer ring) */}
      {!isGhost && cageGeom && (
        <mesh geometry={cageGeom} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#b45309" // Brass color
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      )}

      {/* Selection outlines */}
      {(isSelected || hovered) && !isGhost && (
        <>
          <lineSegments geometry={outerEdges}>
            <lineBasicMaterial color="#00e5ff" linewidth={1} transparent opacity={0.6} />
          </lineSegments>
          {hasInnerRing && (
            <lineSegments geometry={innerEdges}>
              <lineBasicMaterial color="#00e5ff" linewidth={1} transparent opacity={0.6} />
            </lineSegments>
          )}
        </>
      )}
    </group>
  );
};
