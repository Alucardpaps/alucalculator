import Matter from 'matter-js';
import { ContactPoint, PhysicsBody, PhysicsJoint, TelemetryData } from './types';

const { Engine, World, Bodies, Body, Constraint, Events } = Matter;

/** 100 CSS pixels = 1 metre. Gravity scale maps 9.81 m/s² → 981 px/s². */
export const PX_PER_METER = 100;
export const WATER_LINE_Y = 480;
export const FIXED_DT = 1 / 60;
export const GROUND_Y = 650;

export function computeTerrainY(
  x: number,
  slopeDeg: number,
  terrainType: 'flat' | 'wavy' | 'hills',
  amplitude: number = 28
): number {
  const baseY = GROUND_Y;
  const pivotX = 500;
  const slopeRad = (slopeDeg * Math.PI) / 180;
  const slopeOffset = (x - pivotX) * Math.tan(slopeRad);

  if (terrainType === 'flat') {
    return baseY + slopeOffset;
  }

  if (terrainType === 'wavy') {
    const w1 = Math.sin((x - pivotX) * 0.012) * amplitude;
    const w2 = Math.cos((x - pivotX) * 0.026) * (amplitude * 0.35);
    return baseY + slopeOffset - w1 - w2;
  }

  if (terrainType === 'hills') {
    const h1 = Math.sin((x - pivotX) * 0.007) * (amplitude * 1.8);
    const h2 = Math.sin((x - pivotX) * 0.018) * (amplitude * 0.6);
    return baseY + slopeOffset - h1 - h2;
  }

  return baseY + slopeOffset;
}

export function terrainNormalAt(
  x: number,
  slopeDeg: number,
  terrainType: 'flat' | 'wavy' | 'hills',
  amplitude: number = 28
): { nx: number; ny: number; tangentX: number; tangentY: number } {
  const y0 = computeTerrainY(x - 4, slopeDeg, terrainType, amplitude);
  const y1 = computeTerrainY(x + 4, slopeDeg, terrainType, amplitude);
  const tx = 8;
  const ty = y1 - y0;
  const len = Math.hypot(tx, ty) || 1;
  const tangentX = tx / len;
  const tangentY = ty / len;
  return { nx: -tangentY, ny: tangentX, tangentX, tangentY };
}

/** Convert RPM to Matter.js angular displacement per engine step. */
export function rpmToStepOmega(rpm: number, dt: number): number {
  return ((rpm * 2 * Math.PI) / 60) * dt;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function gravityScaleFor(mode: 'earth' | 'moon' | 'zero'): number {
  if (mode === 'moon') return 0.000162;
  if (mode === 'zero') return 0;
  return 0.000981;
}

/**
 * Engineering 2D rigid-body world on Matter.js.
 *
 * Matter Verlet uses: position += (F/m) * dt_ms²
 * so gravity.scale = g_px / 1e6 ≈ 0.000981 for Earth at 100 px/m.
 */
export class PhysicsEngine {
  public engine: Matter.Engine;
  public world: Matter.World;
  public isPaused: boolean = false;
  public isMotorRunning: boolean = false;
  public groundSlopeDeg: number = 0;
  public terrainType: 'flat' | 'wavy' | 'hills' = 'flat';
  public waveAmplitude: number = 28;
  public groundY: number = GROUND_Y;
  public windX: number = 0;
  public timeScale: number = 1;
  public quality: 'fast' | 'accurate' = 'accurate';
  public lastContacts: ContactPoint[] = [];
  public lastTelemetry: TelemetryData;

  private matterBodies: Map<string, Matter.Body> = new Map();
  private matterJoints: Map<string, Matter.Constraint> = new Map();
  private groundBody: Matter.Body;
  private terrainBodies: Matter.Body[] = [];
  private leftWall: Matter.Body;
  private rightWall: Matter.Body;
  private impactQueue: Map<string, number> = new Map();
  private lastStepDt = FIXED_DT;

  constructor() {
    this.engine = Engine.create({
      gravity: { x: 0, y: 1, scale: gravityScaleFor('earth') },
      positionIterations: 12,
      velocityIterations: 10,
      constraintIterations: 6,
      enableSleeping: true,
    });

    this.world = this.engine.world;

    this.groundBody = Bodies.rectangle(500, this.groundY + 150, 8000, 300, {
      isStatic: true,
      friction: 0.95,
      restitution: 0.04,
      frictionStatic: 1.1,
      label: 'ground',
    });

    this.leftWall = Bodies.rectangle(-1500, 300, 100, 2000, {
      isStatic: true,
      friction: 0.25,
      restitution: 0.15,
      label: 'left-wall',
    });

    this.rightWall = Bodies.rectangle(3500, 300, 100, 2000, {
      isStatic: true,
      friction: 0.25,
      restitution: 0.15,
      label: 'right-wall',
    });

    World.add(this.world, [this.groundBody, this.leftWall, this.rightWall]);

    Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const relX = pair.bodyA.velocity.x - pair.bodyB.velocity.x;
        const relY = pair.bodyA.velocity.y - pair.bodyB.velocity.y;
        const rel = Math.hypot(relX, relY) / Math.max(this.lastStepDt, 1e-4);
        const reduced = (pair.bodyA.mass * pair.bodyB.mass) / Math.max(pair.bodyA.mass + pair.bodyB.mass, 1e-6);
        const impact = Math.min(420, rel * 0.08 * Math.sqrt(reduced));
        if (impact < 8) continue;
        this.queueImpact(pair.bodyA, impact);
        this.queueImpact(pair.bodyB, impact);
      }
    });

    this.lastTelemetry = this.emptyTelemetry(60);
  }

  private queueImpact(body: Matter.Body, impact: number) {
    const label = body.label || '';
    const dash = label.indexOf('-');
    if (dash < 0) return;
    const id = label.slice(dash + 1);
    if (!id || label.startsWith('terrain') || label === 'ground') return;
    this.impactQueue.set(id, Math.max(this.impactQueue.get(id) || 0, impact));
  }

  public setGravityMode(mode: 'earth' | 'moon' | 'zero') {
    this.engine.gravity.y = 1;
    this.engine.gravity.scale = gravityScaleFor(mode);
  }

  public setQuality(quality: 'fast' | 'accurate') {
    this.quality = quality;
    this.engine.positionIterations = quality === 'accurate' ? 12 : 6;
    this.engine.velocityIterations = quality === 'accurate' ? 10 : 4;
    this.engine.constraintIterations = quality === 'accurate' ? 6 : 2;
  }

  public reset() {
    World.clear(this.world, false);
    this.matterBodies.clear();
    this.matterJoints.clear();
    this.terrainBodies = [];
    this.impactQueue.clear();
    this.lastContacts = [];
    World.add(this.world, [this.leftWall, this.rightWall]);
    this.rebuildTerrain();
  }

  public setTerrain(type: 'flat' | 'wavy' | 'hills', amplitude: number = 28) {
    this.terrainType = type;
    this.waveAmplitude = amplitude;
    this.rebuildTerrain();
  }

  public setGroundSlope(degrees: number) {
    this.groundSlopeDeg = degrees;
    this.rebuildTerrain();
  }

  public rebuildTerrain() {
    if (this.terrainBodies.length > 0) {
      World.remove(this.world, this.terrainBodies);
      this.terrainBodies = [];
    }
    if (this.world.bodies.includes(this.groundBody)) {
      World.remove(this.world, this.groundBody);
    }

    if (this.terrainType === 'flat') {
      const rad = (this.groundSlopeDeg * Math.PI) / 180;
      const pivotX = 500;
      const pivotY = this.groundY;
      const sinA = Math.sin(rad);
      const cosA = Math.cos(rad);
      Body.setPosition(this.groundBody, { x: pivotX - 150 * sinA, y: pivotY + 150 * cosA });
      Body.setAngle(this.groundBody, rad);
      World.add(this.world, this.groundBody);
      return;
    }

    const minX = -1500;
    const maxX = 4200;
    const step = 40;
    const bodies: Matter.Body[] = [];
    let prevX = minX;
    let prevY = computeTerrainY(minX, this.groundSlopeDeg, this.terrainType, this.waveAmplitude);

    for (let x = minX + step; x <= maxX; x += step) {
      const y = computeTerrainY(x, this.groundSlopeDeg, this.terrainType, this.waveAmplitude);
      const midX = (prevX + x) / 2;
      const midY = (prevY + y) / 2;
      const dx = x - prevX;
      const dy = y - prevY;
      const segLen = Math.sqrt(dx * dx + dy * dy) + 6;
      const angle = Math.atan2(dy, dx);
      const thickness = 220;
      const normX = -Math.sin(angle);
      const normY = Math.cos(angle);

      bodies.push(
        Bodies.rectangle(midX + normX * (thickness / 2), midY + normY * (thickness / 2), segLen, thickness, {
          isStatic: true,
          angle,
          friction: 0.95,
          frictionStatic: 1.15,
          restitution: 0.04,
          label: 'terrain-segment',
        })
      );
      prevX = x;
      prevY = y;
    }

    this.terrainBodies = bodies;
    World.add(this.world, bodies);
  }

  public setBodyPosition(id: string, x: number, y: number) {
    const mb = this.matterBodies.get(id);
    if (mb) {
      Body.setPosition(mb, { x, y });
      Body.setVelocity(mb, { x: 0, y: 0 });
      Body.setAngularVelocity(mb, 0);
      if (mb.isSleeping) Body.set(mb, { isSleeping: false });
    }
  }

  public applyImpulse(id: string, ix: number, iy: number) {
    const mb = this.matterBodies.get(id);
    if (!mb || mb.isStatic) return;
    Body.applyForce(mb, mb.position, { x: ix, y: iy });
    if (mb.isSleeping) Body.set(mb, { isSleeping: false });
  }

  public update(
    bodies: PhysicsBody[],
    joints: PhysicsJoint[],
    dt: number,
    draggedBodyId: string | null = null,
    mousePos: { x: number; y: number } | null = null
  ): TelemetryData {
    if (this.isPaused || dt <= 0) {
      return this.computeTelemetry(bodies, joints, 60);
    }

    const clampedDt = Math.min(dt, 0.033);
    this.lastStepDt = clampedDt;
    const substeps = this.quality === 'accurate' ? 2 : 1;
    const stepDt = clampedDt / substeps;

    this.syncBodies(bodies);
    this.syncJoints(joints);

    for (let s = 0; s < substeps; s++) {
      this.applyMotorsAndGears(bodies, stepDt);
      this.applyWheelTraction(bodies, stepDt);
      this.applyBuoyancy(bodies, stepDt);
      this.applyServos(bodies, stepDt);
      this.applyWindAndDrag(bodies, stepDt);
      this.applyMouseDrag(draggedBodyId, mousePos);

      Engine.update(this.engine, stepDt * 1000);
    }

    this.harvestContacts();
    this.evaluateJoints(joints);
    this.writeBack(bodies, clampedDt);
    this.solveBeamStress(bodies, joints);

    const telemetry = this.computeTelemetry(bodies, joints, 1 / (clampedDt || FIXED_DT));
    this.lastTelemetry = telemetry;
    return telemetry;
  }

  private applyMouseDrag(draggedBodyId: string | null, mousePos: { x: number; y: number } | null) {
    if (!draggedBodyId || !mousePos) return;
    const mb = this.matterBodies.get(draggedBodyId);
    if (!mb) return;
    if (mb.isSleeping) Body.set(mb, { isSleeping: false });
    if (mb.isStatic) {
      Body.setPosition(mb, { x: mousePos.x, y: mousePos.y });
      return;
    }
    const dx = mousePos.x - mb.position.x;
    const dy = mousePos.y - mb.position.y;
    Body.setVelocity(mb, {
      x: clamp(dx * 0.35, -40, 40),
      y: clamp(dy * 0.35, -40, 40),
    });
  }

  private isGroundLabel(label: string): boolean {
    return label === 'ground' || label.startsWith('terrain') || label === 'left-wall' || label === 'right-wall';
  }

  private harvestContacts() {
    const contacts: ContactPoint[] = [];
    const pairs = this.engine.pairs.list;
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      if (!pair.isActive) continue;
      const col = pair.collision;
      if (!col) continue;
      const supports = col.supports;
      const n = col.normal;
      if (!n) continue;
      if (supports && supports.length) {
        for (const p of supports) {
          contacts.push({
            x: p.x,
            y: p.y,
            nx: n.x,
            ny: n.y,
            depth: col.depth || 0,
          });
        }
      } else {
        contacts.push({
          x: (pair.bodyA.position.x + pair.bodyB.position.x) / 2,
          y: (pair.bodyA.position.y + pair.bodyB.position.y) / 2,
          nx: n.x,
          ny: n.y,
          depth: col.depth || 0,
        });
      }
    }
    this.lastContacts = contacts;
  }

  private syncBodies(bodies: PhysicsBody[]) {
    const activeIds = new Set(bodies.map((b) => b.id));

    for (const [id, mb] of this.matterBodies.entries()) {
      if (!activeIds.has(id)) {
        World.remove(this.world, mb);
        this.matterBodies.delete(id);
      }
    }

    for (const b of bodies) {
      let mb = this.matterBodies.get(b.id);

      if (!mb) {
        const density = (b.material.density || 2.7) * 0.001;
        const collisionFilter = { group: b.collisionGroup || 0 };
        const frictionAir = b.type === 'boat' ? 0.04 : 0.012;

        if (b.type === 'wheel') {
          mb = Bodies.circle(b.x, b.y, b.radius || 24, {
            isStatic: b.isStatic,
            friction: b.friction ?? 1.15,
            frictionStatic: 1.2,
            restitution: b.restitution || 0.08,
            density,
            collisionFilter,
            frictionAir,
            label: `wheel-${b.id}`,
          });
        } else if (b.type === 'gear' || b.type === 'circle') {
          mb = Bodies.circle(b.x, b.y, b.radius || b.pitchRadius || 30, {
            isStatic: b.isStatic,
            friction: b.friction ?? 0.55,
            restitution: b.restitution || 0.08,
            density,
            collisionFilter,
            frictionAir,
            label: `gear-${b.id}`,
          });
        } else if (b.type === 'beam') {
          mb = Bodies.rectangle(b.x, b.y, b.length || 200, b.height || 16, {
            isStatic: b.isStatic,
            angle: b.angle || 0,
            friction: b.friction ?? 0.5,
            restitution: b.restitution || 0.04,
            density,
            collisionFilter,
            frictionAir,
            label: `beam-${b.id}`,
          });
        } else if (b.type === 'boat') {
          mb = Bodies.rectangle(b.x, b.y, b.width || 180, b.height || 45, {
            isStatic: b.isStatic,
            angle: b.angle || 0,
            friction: 0.35,
            restitution: 0.08,
            density: 0.00055,
            collisionFilter,
            frictionAir: 0.05,
            label: `boat-${b.id}`,
          });
        } else {
          mb = Bodies.rectangle(b.x, b.y, b.width || 60, b.height || 40, {
            isStatic: b.isStatic || b.type === 'anchor',
            angle: b.angle || 0,
            friction: b.friction ?? 0.6,
            restitution: b.restitution || 0.1,
            density,
            collisionFilter,
            frictionAir,
            label: `box-${b.id}`,
          });
        }

        if (b.mass && !mb.isStatic && Number.isFinite(b.mass) && b.mass > 0) {
          Body.setMass(mb, b.mass);
        }

        World.add(this.world, mb);
        this.matterBodies.set(b.id, mb);
      } else {
        const wantStatic = b.isStatic || b.type === 'anchor';
        if (mb.isStatic !== wantStatic) {
          Body.setStatic(mb, wantStatic);
        }
        if (!mb.isStatic && b.mass && Number.isFinite(b.mass) && Math.abs(mb.mass - b.mass) > 0.5) {
          Body.setMass(mb, b.mass);
        }
        if (typeof b.friction === 'number') {
          mb.friction = b.friction;
        }
      }
    }
  }

  private syncJoints(joints: PhysicsJoint[]) {
    const activeIds = new Set(joints.map((j) => j.id));

    for (const [id, c] of this.matterJoints.entries()) {
      if (!activeIds.has(id)) {
        World.remove(this.world, c);
        this.matterJoints.delete(id);
      }
    }

    for (const j of joints) {
      if (j.isBroken) {
        const existing = this.matterJoints.get(j.id);
        if (existing) {
          World.remove(this.world, existing);
          this.matterJoints.delete(j.id);
        }
        continue;
      }
      if (this.matterJoints.has(j.id)) continue;

      const mbA = this.matterBodies.get(j.bodyAId);
      const mbB = this.matterBodies.get(j.bodyBId);
      if (!mbA || !mbB) continue;

      const isPin = j.type === 'pin';
      const isWeld = j.type === 'weld';
      const isSpring = j.type === 'spring';

      const c = Constraint.create({
        bodyA: mbA,
        bodyB: mbB,
        pointA: {
          x: Number.isFinite(j.localAnchorA?.x) ? j.localAnchorA.x : 0,
          y: Number.isFinite(j.localAnchorA?.y) ? j.localAnchorA.y : 0,
        },
        pointB: {
          x: Number.isFinite(j.localAnchorB?.x) ? j.localAnchorB.x : 0,
          y: Number.isFinite(j.localAnchorB?.y) ? j.localAnchorB.y : 0,
        },
        length: isPin || isWeld ? 0 : Number.isFinite(j.length) ? j.length : 50,
        stiffness: isWeld ? 0.95 : isPin ? 0.92 : isSpring ? 0.08 : 0.4,
        damping: isWeld ? 0.12 : isSpring ? 0.04 : 0.06,
        label: `joint-${j.id}`,
      });

      World.add(this.world, c);
      this.matterJoints.set(j.id, c);
    }
  }

  private worldAnchor(body: Matter.Body, local: { x: number; y: number }) {
    const c = Math.cos(body.angle);
    const s = Math.sin(body.angle);
    return {
      x: body.position.x + c * local.x - s * local.y,
      y: body.position.y + s * local.x + c * local.y,
    };
  }

  private evaluateJoints(joints: PhysicsJoint[]) {
    for (const j of joints) {
      if (j.isBroken) continue;
      const c = this.matterJoints.get(j.id);
      const mbA = this.matterBodies.get(j.bodyAId);
      const mbB = this.matterBodies.get(j.bodyBId);
      if (!c || !mbA || !mbB) continue;

      const pA = this.worldAnchor(mbA, c.pointA);
      const pB = this.worldAnchor(mbB, c.pointB);
      const dist = Math.hypot(pB.x - pA.x, pB.y - pA.y);
      const rest = c.length || 0;
      const stretch = dist - rest;
      const k = (j.stiffness || (j.type === 'weld' ? 4000 : j.type === 'pin' ? 2500 : 800));
      const tension = Math.abs(stretch) * k;
      j.currentTension = tension;

      const maxT = j.maxTension ?? (j.type === 'cable' ? 50000 : j.type === 'weld' ? 120000 : 1e12);
      if ((j.type === 'cable' || j.type === 'weld') && tension > maxT) {
        j.isBroken = true;
        World.remove(this.world, c);
        this.matterJoints.delete(j.id);
      }
    }
  }

  private applyMotorsAndGears(bodies: PhysicsBody[], dt: number) {
    const gears = bodies.filter((b) => (b.type === 'gear' || b.type === 'wheel') && !b.isBroken);

    for (const b of gears) {
      if (!b.isMotor || !b.motorRpm) continue;
      const mb = this.matterBodies.get(b.id);
      if (!mb || mb.isStatic) continue;
      if (mb.isSleeping) Body.set(mb, { isSleeping: false });
      if (!this.isMotorRunning) continue;

      const target = rpmToStepOmega(b.motorRpm, dt);
      const torqueNm = b.motorTorque || 200;
      const blend = clamp(torqueNm / 700, 0.08, 0.42);
      Body.setAngularVelocity(mb, mb.angularVelocity + (target - mb.angularVelocity) * blend);
    }

    for (let i = 0; i < gears.length; i++) {
      for (let j = i + 1; j < gears.length; j++) {
        const g1 = gears[i];
        const g2 = gears[j];
        if (g1.type !== 'gear' || g2.type !== 'gear') continue;
        const mb1 = this.matterBodies.get(g1.id);
        const mb2 = this.matterBodies.get(g2.id);
        if (!mb1 || !mb2) continue;

        const r1 = g1.pitchRadius || 30;
        const r2 = g2.pitchRadius || 30;
        const dx = mb2.position.x - mb1.position.x;
        const dy = mb2.position.y - mb1.position.y;
        const dist = Math.hypot(dx, dy);
        const targetDist = r1 + r2;
        if (Math.abs(dist - targetDist) > 18) continue;

        const z1 = g1.teethCount || 20;
        const z2 = g2.teethCount || 20;
        const meshError = mb1.angularVelocity * z1 + mb2.angularVelocity * z2;
        const kMesh = 0.18;
        Body.setAngularVelocity(mb1, mb1.angularVelocity - kMesh * meshError / z1);
        Body.setAngularVelocity(mb2, mb2.angularVelocity - kMesh * meshError / z2);

        if (dist > 1) {
          const nx = dx / dist;
          const ny = dy / dist;
          const sep = (dist - targetDist) * 0.00004;
          Body.applyForce(mb1, mb1.position, { x: nx * sep * mb1.mass, y: ny * sep * mb1.mass });
          Body.applyForce(mb2, mb2.position, { x: -nx * sep * mb2.mass, y: -ny * sep * mb2.mass });
        }

        g1.meshedWith = [...new Set([...(g1.meshedWith || []), g2.id])];
        g2.meshedWith = [...new Set([...(g2.meshedWith || []), g1.id])];
      }
    }

    for (const b of bodies) {
      if (!b.axleConnectedBodyId) continue;
      const driven = this.matterBodies.get(b.id);
      const driver = this.matterBodies.get(b.axleConnectedBodyId);
      if (!driven || !driver) continue;
      Body.setAngularVelocity(driven, driven.angularVelocity + (driver.angularVelocity - driven.angularVelocity) * 0.55);
      Body.setAngularVelocity(driver, driver.angularVelocity + (driven.angularVelocity - driver.angularVelocity) * 0.12);
    }
  }

  private applyWheelTraction(bodies: PhysicsBody[], dt: number) {
    const byMatter = new Map<Matter.Body, PhysicsBody>();
    for (const b of bodies) {
      const mb = this.matterBodies.get(b.id);
      if (mb) byMatter.set(mb, b);
      b.grounded = false;
      b.slipSpeed = 0;
    }

    const pairs = this.engine.pairs.list;
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      if (!pair.isActive || !pair.collision) continue;

      const aIsGround = this.isGroundLabel(pair.bodyA.label || '');
      const bIsGround = this.isGroundLabel(pair.bodyB.label || '');
      if (aIsGround === bIsGround) continue;

      const wheelMatter = aIsGround ? pair.bodyB : pair.bodyA;
      const phys = byMatter.get(wheelMatter);
      if (!phys || phys.type !== 'wheel' || phys.isBroken || wheelMatter.isStatic) continue;

      const col = pair.collision;
      const n = col.normal;
      const groundIsA = aIsGround;
      const nx = groundIsA ? n.x : -n.x;
      const ny = groundIsA ? n.y : -n.y;
      const tx = -ny;
      const ty = nx;

      const r = phys.radius || wheelMatter.circleRadius || 24;
      const rx = -nx * r;
      const ry = -ny * r;
      const vRimX = wheelMatter.velocity.x + -wheelMatter.angularVelocity * ry;
      const vRimY = wheelMatter.velocity.y + wheelMatter.angularVelocity * rx;
      const slip = vRimX * tx + vRimY * ty;

      const gScale = Math.max(this.engine.gravity.scale * this.engine.gravity.y, 0.0002);
      const N = Math.max(wheelMatter.mass * gScale, 0.00002);
      const mu = phys.friction || 1.1;
      const Fmax = mu * N * 10;
      const F = clamp(-slip * 0.9, -Fmax, Fmax);

      const cx = wheelMatter.position.x + rx;
      const cy = wheelMatter.position.y + ry;
      Body.applyForce(wheelMatter, { x: cx, y: cy }, { x: tx * F, y: ty * F });

      const vTan = wheelMatter.velocity.x * tx + wheelMatter.velocity.y * ty;
      const rollingOmega = r > 1 ? -vTan / r : 0;
      Body.setAngularVelocity(
        wheelMatter,
        wheelMatter.angularVelocity + (rollingOmega - wheelMatter.angularVelocity) * clamp(mu * 0.22, 0.05, 0.35)
      );

      phys.grounded = true;
      phys.slipSpeed = Math.abs(slip) / Math.max(dt, 1e-4);
      if (wheelMatter.isSleeping) Body.set(wheelMatter, { isSleeping: false });
    }
  }

  private applyBuoyancy(bodies: PhysicsBody[], _dt: number) {
    const waterY = WATER_LINE_Y;
    const g = this.engine.gravity.y * this.engine.gravity.scale;

    for (const b of bodies) {
      if (b.isStatic || b.isBroken) continue;
      const mb = this.matterBodies.get(b.id);
      if (!mb) continue;

      const h = b.height || (b.radius !== undefined ? b.radius * 2 : 0) || (b.pitchRadius !== undefined ? b.pitchRadius * 2 : 0) || 40;
      const half = h / 2;
      const bottom = mb.position.y + half;
      if (bottom < waterY) {
        b.submergedRatio = 0;
        continue;
      }

      const submergedH = Math.min(h, bottom - waterY);
      const ratio = clamp(submergedH / h, 0, 1);
      b.submergedRatio = ratio;
      if (ratio <= 0) continue;

      const floatFactor = b.type === 'boat' ? 1.45 : b.type === 'wheel' ? 0.25 : 0.55;
      const lift = mb.mass * g * floatFactor * ratio;
      Body.applyForce(mb, { x: mb.position.x, y: mb.position.y + half * 0.35 }, { x: 0, y: -lift });

      const vx = mb.velocity.x;
      const vy = mb.velocity.y;
      const drag = 0.0018 * ratio * mb.mass;
      Body.applyForce(mb, mb.position, {
        x: -Math.sign(vx) * vx * vx * drag * 8,
        y: -Math.sign(vy) * vy * vy * drag * 14,
      });
      mb.torque -= mb.angularVelocity * 0.08 * ratio * mb.inertia;

      if (this.isMotorRunning && b.thrustPower) {
        const c = Math.cos(mb.angle);
        const s = Math.sin(mb.angle);
        const thrust = b.thrustPower * 0.00009 * (0.35 + 0.65 * ratio);
        Body.applyForce(mb, mb.position, { x: c * thrust, y: s * thrust });
      }

      if (mb.isSleeping) Body.set(mb, { isSleeping: false });
    }
  }

  private applyServos(bodies: PhysicsBody[], dt: number) {
    for (const b of bodies) {
      if (!b.isServo || b.servoTargetAngle === undefined) continue;
      const mb = this.matterBodies.get(b.id);
      if (!mb || mb.isStatic) continue;
      let diff = b.servoTargetAngle - mb.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const speed = b.servoSpeed || 4;
      const maxW = rpmToStepOmega((speed * 60) / (2 * Math.PI), dt) * 6;
      const targetW = clamp(diff * 0.2, -maxW, maxW);
      Body.setAngularVelocity(mb, mb.angularVelocity + (targetW - mb.angularVelocity) * 0.28);
      if (mb.isSleeping) Body.set(mb, { isSleeping: false });
    }
  }

  private applyWindAndDrag(bodies: PhysicsBody[], _dt: number) {
    if (Math.abs(this.windX) < 0.01) return;
    for (const b of bodies) {
      if (b.isStatic || b.isBroken) continue;
      const mb = this.matterBodies.get(b.id);
      if (!mb) continue;
      const area = (b.length || b.width || (b.radius || 20) * 2) * 0.01;
      Body.applyForce(mb, mb.position, { x: this.windX * 0.00004 * area * mb.mass, y: 0 });
    }
  }

  private writeBack(bodies: PhysicsBody[], dt: number) {
    const invDt = 1 / Math.max(dt, 1e-4);
    for (const b of bodies) {
      const mb = this.matterBodies.get(b.id);
      if (!mb) continue;
      if (Number.isFinite(mb.position.x) && Number.isFinite(mb.position.y)) {
        b.x = mb.position.x;
        b.y = mb.position.y;
      }
      if (Number.isFinite(mb.velocity.x) && Number.isFinite(mb.velocity.y)) {
        b.vx = mb.velocity.x * invDt;
        b.vy = mb.velocity.y * invDt;
      }
      if (Number.isFinite(mb.angle)) b.angle = mb.angle;
      if (Number.isFinite(mb.angularVelocity)) b.omega = mb.angularVelocity * invDt;

      const queued = this.impactQueue.get(b.id) || 0;
      b.impactStressMpa = (b.impactStressMpa || 0) * 0.86 + queued;
    }
    this.impactQueue.clear();
  }

  private solveBeamStress(bodies: PhysicsBody[], joints: PhysicsJoint[]) {
    const beams = bodies.filter((b) => b.type === 'beam' && !b.isBroken);

    for (const beam of beams) {
      const L = (beam.length || 100) / PX_PER_METER;
      const h = (beam.height || 16) / 1000;
      const t = (beam.beamThickness || 12) / 1000;
      const I = (t * Math.pow(h, 3)) / 12 || 1e-12;
      const E = (beam.material.youngsModulus || 70) * 1e9;

      let jointLoad = 0;
      for (const j of joints) {
        if (j.isBroken) continue;
        if (j.bodyAId === beam.id || j.bodyBId === beam.id) {
          jointLoad += (j.currentTension || 0) * 0.15;
        }
      }

      const g = this.engine.gravity.scale > 0 ? 9.81 * (this.engine.gravity.scale / 0.000981) : 0;
      const selfWeight = (beam.mass || 10) * g;
      const loadForce = selfWeight + jointLoad;
      const deltaMeters = (loadForce * Math.pow(L, 3)) / (48 * E * I);
      beam.currentDeflection = deltaMeters * 1000;

      const maxMoment = (loadForce * L) / 4;
      const bendingMpa = ((maxMoment * (h / 2)) / I) / 1e6;
      const impact = beam.impactStressMpa || 0;
      beam.stressMpa = Math.max(0, bendingMpa + impact * 0.35);

      const yieldMpa = beam.material.yieldStrength || 250;
      beam.safetyFactor = yieldMpa / Math.max(beam.stressMpa, 0.05);

      if (beam.safetyFactor < 0.75 && !beam.isStatic) {
        beam.isBroken = true;
        const mb = this.matterBodies.get(beam.id);
        if (mb) Body.setAngularVelocity(mb, (Math.random() - 0.5) * 0.08);
      }
    }
  }

  private emptyTelemetry(fps: number): TelemetryData {
    return {
      fps,
      bodyCount: 0,
      jointCount: 0,
      minSafetyFactor: 10,
      maxStressMpa: 0,
      totalKineticEnergy: 0,
      totalPotentialEnergy: 0,
      criticalBodyId: null,
      contactCount: 0,
      snappedJoints: 0,
      maxSlip: 0,
      motorPowerKw: 0,
      timeScale: this.timeScale,
    };
  }

  private computeTelemetry(bodies: PhysicsBody[], joints: PhysicsJoint[], fps: number): TelemetryData {
    let minFos = 99;
    let maxStress = 0;
    let totalKE = 0;
    let totalPE = 0;
    let critical: string | null = null;
    let maxSlip = 0;
    let motorPowerKw = 0;
    const g = this.engine.gravity.scale > 0 ? 9.81 * (this.engine.gravity.scale / 0.000981) : 0;

    for (const b of bodies) {
      if (b.safetyFactor !== undefined && b.safetyFactor < minFos) {
        minFos = b.safetyFactor;
        critical = b.id;
      }
      if (b.stressMpa !== undefined && b.stressMpa > maxStress) {
        maxStress = b.stressMpa;
        if (!critical) critical = b.id;
      }
      const v = Math.hypot(b.vx || 0, b.vy || 0) / PX_PER_METER;
      const omega = b.omega || 0;
      totalKE += 0.5 * (b.mass || 1) * v * v + 0.5 * (b.inertia || 1) * omega * omega * 0.002;
      const heightM = Math.max(0, (GROUND_Y - (b.y || 0)) / PX_PER_METER);
      totalPE += (b.mass || 1) * g * heightM;
      if ((b.slipSpeed || 0) > maxSlip) maxSlip = b.slipSpeed || 0;
      if (b.isMotor && this.isMotorRunning && b.motorRpm && b.motorTorque) {
        motorPowerKw += (b.motorTorque * 2 * Math.PI * b.motorRpm) / 60000;
      }
    }

    if (minFos > 90) minFos = 10;

    return {
      fps: Math.round(fps),
      bodyCount: bodies.length,
      jointCount: joints.filter((j) => !j.isBroken).length,
      minSafetyFactor: Math.max(0.05, Number(minFos.toFixed(2))),
      maxStressMpa: Math.round(maxStress),
      totalKineticEnergy: Math.round(totalKE),
      totalPotentialEnergy: Math.round(totalPE),
      criticalBodyId: critical,
      contactCount: this.lastContacts.length,
      snappedJoints: joints.filter((j) => j.isBroken).length,
      maxSlip: Math.round(maxSlip),
      motorPowerKw: Number(motorPowerKw.toFixed(2)),
      timeScale: this.timeScale,
    };
  }
}
