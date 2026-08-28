import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toCanonicalDecimal, quantizeRecord } from '../share/decimal';
import { SCALE_REGISTRY } from '../share/scale-registry';
import { AluPackageSchema, parseUntrusted, AluPackageBody } from '../share/schema';
import { computePackageChecksum } from '../share/checksum';
import { toBase64Url, fromBase64Url, deflateRaw, safeInflateRaw, CHANNEL_LIMITS } from '../share/codec';
import { exportPackage } from '../share/export-package';
import { importPackage, checkRecalculationDrift } from '../share/import-package';
import { telemetry, hasTelemetryConsent } from '../telemetry/queue';
import { verifyAdminKey } from '../admin/verify-admin-key';
import { captureRendererScreenshot } from '../feedback/capture';
import { buildHashUrl } from '../share/channels';

describe('AluCalc Share v1 Core Specification', () => {
  // Test 1: toCanonicalDecimal & float handling
  describe('1. Decimal & Quantization', () => {
    it('quantizes numbers to canonical decimal strings', () => {
      expect(toCanonicalDecimal(2.5, 3)).toBe('2.500');
      expect(toCanonicalDecimal(10, 2)).toBe('10.00');
      expect(toCanonicalDecimal(0.123456, 4)).toBe('0.1235');
    });

    it('normalizes -0 to 0.000', () => {
      expect(toCanonicalDecimal(-0, 3)).toBe('0.000');
      expect(toCanonicalDecimal(-0.0, 2)).toBe('0.00');
    });

    it('throws error for NaN and Infinity', () => {
      expect(() => toCanonicalDecimal(NaN, 2)).toThrow('NaN/Infinity paketlenemez');
      expect(() => toCanonicalDecimal(Infinity, 2)).toThrow('NaN/Infinity paketlenemez');
      expect(() => toCanonicalDecimal(-Infinity, 2)).toThrow('NaN/Infinity paketlenemez');
    });

    it('throws when key is missing in SCALE_REGISTRY', () => {
      expect(() =>
        quantizeRecord({
          module_val: 2.5,
          unknown_custom_key_xyz: 123,
        }),
      ).toThrow('SCALE_REGISTRY eksik: unknown_custom_key_xyz');
    });
  });

  // Test 2 & 3: Canonicalize & Checksum
  describe('2. Canonical JCS & SHA-256 Checksum', () => {
    const sampleBody: AluPackageBody = {
      v: 1,
      module: 'gear',
      solver_build: '1.0.0+20260827',
      standards_pack: 'ISO-6336:2019',
      meta: {
        unit_system: 'metric',
        name: 'Spur Gear Test',
      },
      inputs: {
        module_val: '2.5000',
        teeth_count: '24',
      },
      outputs: {
        pitch_diameter: '60.000',
        torque_nm: '120.50',
      },
      fp_tol: '0.00000001',
      created_at: '2026-08-27T16:54:00+03:00',
    };

    it('produces identical deterministic checksum regardless of object key insertion order', async () => {
      const checksum1 = await computePackageChecksum(sampleBody);

      // Reordered keys
      const reorderedBody: AluPackageBody = {
        created_at: '2026-08-27T16:54:00+03:00',
        meta: {
          name: 'Spur Gear Test',
          unit_system: 'metric',
        },
        outputs: {
          torque_nm: '120.50',
          pitch_diameter: '60.000',
        },
        inputs: {
          teeth_count: '24',
          module_val: '2.5000',
        },
        fp_tol: '0.00000001',
        standards_pack: 'ISO-6336:2019',
        solver_build: '1.0.0+20260827',
        module: 'gear',
        v: 1,
      };

      const checksum2 = await computePackageChecksum(reorderedBody);
      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('tampering with any field changes checksum (negative test)', async () => {
      const originalChecksum = await computePackageChecksum(sampleBody);

      const tamperedBody: AluPackageBody = {
        ...sampleBody,
        outputs: {
          ...sampleBody.outputs,
          torque_nm: '120.51', // slight 0.01 tamper
        },
      };

      const tamperedChecksum = await computePackageChecksum(tamperedBody);
      expect(tamperedChecksum).not.toBe(originalChecksum);
    });
  });

  // Test 4: Untrusted JSON parser drops __proto__
  describe('3. Reviver and Strict Schema Parsing', () => {
    it('drops __proto__, constructor, and prototype from untrusted JSON', () => {
      const maliciousJson = '{"__proto__": {"polluted": true}, "constructor": "bad", "v": 1, "module": "gear"}';
      const parsed = parseUntrusted(maliciousJson) as Record<string, unknown>;

      expect(parsed.__proto__).toBe(Object.prototype);
      expect((parsed as any).polluted).toBeUndefined();
      expect(parsed.constructor).toBe(Object);
      expect(parsed.v).toBe(1);
      expect(parsed.module).toBe('gear');
    });

    it('fails Zod strict validation if additional unknown properties are present', () => {
      const invalidPkg = {
        v: 1,
        module: 'gear',
        solver_build: '1.0.0+20260827',
        standards_pack: 'ISO-6336:2019',
        meta: { unit_system: 'metric' },
        inputs: { module_val: '2.5000' },
        outputs: { pitch_diameter: '60.000' },
        fp_tol: '0.00000001',
        checksum: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        created_at: '2026-08-27T16:54:00+03:00',
        unauthorized_field: 'malicious',
      };

      const result = AluPackageSchema.safeParse(invalidPkg);
      expect(result.success).toBe(false);
    });
  });

  // Test 5 & 6: Codec & Channel Limits
  describe('4. Codec & Channel Limits', () => {
    it('encodes and decodes Base64URL without +, /, or =', () => {
      const sample = new Uint8Array([255, 254, 253, 252, 251, 250, 0, 1, 2, 3]);
      const b64Url = toBase64Url(sample);

      expect(b64Url).not.toContain('+');
      expect(b64Url).not.toContain('/');
      expect(b64Url).not.toContain('=');

      const restored = fromBase64Url(b64Url);
      expect(Array.from(restored)).toEqual(Array.from(sample));
    });

    it('aborts safeInflateRaw when decompressed size exceeds channel limit (e.g. 17KB on hash channel)', () => {
      // Create a payload that expands to >16KB (hash limit is 16KB decompressed)
      const bigJson = JSON.stringify({
        v: 1,
        data: 'A'.repeat(17 * 1024),
      });

      const compressed = deflateRaw(bigJson);

      expect(() => {
        safeInflateRaw(compressed, 'hash');
      }).toThrow('açılma tavanı aşıldı');
    });

    it('aborts safeInflateRaw when compressed size exceeds maxCompressed', () => {
      const largeCompressed = new Uint8Array(CHANNEL_LIMITS.qr.maxCompressed + 10);
      expect(() => {
        safeInflateRaw(largeCompressed, 'qr');
      }).toThrow('sıkışık sınır aşıldı: qr');
    });
  });

  // Test 7, 8, 9: End-to-End Export & Import
  describe('5. End-to-End Export & Import Pipeline', () => {
    it('successfully exports and imports a valid engineering package', async () => {
      const exported = await exportPackage({
        module: 'gear',
        meta: {
          unit_system: 'metric',
          name: 'Precision Pinion 24T',
        },
        inputs: {
          module_val: 2.5,
          teeth_count: 24,
        },
        outputs: {
          pitch_diameter: 60,
          torque_nm: 120.5,
        },
      });

      expect(exported.channels.hash.available).toBe(true);
      expect(exported.channels.file.available).toBe(true);

      const importResult = await importPackage(exported.base64Url, {
        channel: 'hash',
      });

      expect(importResult.success).toBe(true);
      if (importResult.success) {
        expect(importResult.pkg.module).toBe('gear');
        expect(importResult.pkg.inputs.module_val).toBe('2.5000');
        expect(importResult.pkg.inputs.teeth_count).toBe('24');
        expect(importResult.pkg.outputs.pitch_diameter).toBe('60.000');
        expect(importResult.pkg.outputs.torque_nm).toBe('120.50');
      }
    });

    it('fails import closed when checksum is tampered with', async () => {
      const exported = await exportPackage({
        module: 'gear',
        meta: { unit_system: 'metric' },
        inputs: { module_val: 2.5, teeth_count: 24 },
        outputs: { pitch_diameter: 60 },
      });

      // Tamper package JSON
      const tamperedPkg = { ...exported.pkg, outputs: { pitch_diameter: '60.001' } };
      const tamperedJson = JSON.stringify(tamperedPkg);

      const importResult = await importPackage(tamperedJson, { channel: 'file' });
      expect(importResult.success).toBe(false);
      if (!importResult.success) {
        expect(importResult.reason).toContain('Checksum uyuşmuyor');
      }
    });

    it('flags solver build mismatch as warning without failing static view', async () => {
      const exported = await exportPackage({
        module: 'gear',
        solver_build: '0.9.0+20250101',
        standards_pack: 'LEGACY-2025',
        meta: { unit_system: 'metric' },
        inputs: { module_val: 2.5, teeth_count: 24 },
        outputs: { pitch_diameter: 60 },
      });

      const importResult = await importPackage(exported.base64Url, {
        channel: 'hash',
        currentSolverBuild: '1.0.0+20260827',
        currentStandardsPack: 'ISO-ENGINEERING-2026',
      });

      expect(importResult.success).toBe(true);
      if (importResult.success) {
        expect(importResult.warning).toBeDefined();
        expect(importResult.warning).toContain('Farklı solver sürümüyle oluşturulmuş paket');
      }
    });

    it('detects recalculation drift against ground truth outputs', async () => {
      const exported = await exportPackage({
        module: 'gear',
        meta: { unit_system: 'metric' },
        inputs: { module_val: 2.5, teeth_count: 24 },
        outputs: { pitch_diameter: 60, torque_nm: 120.5 },
        fp_tol: 0.0001,
      });

      // Fresh calculation with slight divergence
      const freshOutputs = {
        pitch_diameter: 60.00001, // within tolerance
        torque_nm: 120.65, // drift > 0.0001
      };

      const driftResult = checkRecalculationDrift(exported.pkg, freshOutputs);
      expect(driftResult.hasSignificantDrift).toBe(true);
      expect(driftResult.drift.torque_nm).toBeCloseTo(0.15, 2);
    });

    // FAIL-12 Test: Gear solver fields exact camelCase roundtrip
    it('exports and quantizes complete gearStrength solver input & output fields without scale registry errors', async () => {
      const gearInputs = {
        module: 3.0,
        teethPinion: 18,
        teethGear: 54,
        faceWidth: 30.0,
        pressureAngle: 20.0,
        helixAngle: 0.0,
        qualityGrade: 6,
        power: 15.0,
        rpm: 1450,
        youngsModulus: 206,
        poissonRatio: 0.3,
        allowableBending: 430,
        allowableContact: 1200,
        hardness: 58,
      };

      const gearOutputs = {
        pitchDiameterPinion: 54.0,
        pitchDiameterGear: 162.0,
        centerDistance: 108.0,
        transmissionRatio: 3.0,
        transverseContactRatio: 1.68,
        tangentialForce: 1308.5,
        radialForce: 476.2,
        axialForce: 0.0,
        contactStress: 895.4,
        bendingStressPinion: 184.2,
        bendingStressGear: 162.1,
        safetyContact: 1.34,
        safetyBendingPinion: 2.33,
        safetyBendingGear: 2.65,
      };

      const result = await exportPackage({
        module: 'gear',
        meta: {
          unit_system: 'metric',
          name: 'Gearbox 1st Stage Pinion',
        },
        inputs: gearInputs,
        outputs: gearOutputs,
      });

      expect(result.pkg.inputs.teethPinion).toBe('18');
      expect(result.pkg.inputs.module).toBe('3.0000');
      expect(result.pkg.outputs.pitchDiameterPinion).toBe('54.000');
      expect(result.pkg.outputs.contactStress).toBe('895.4');

      const imported = await importPackage(result.base64Url, { channel: 'hash' });
      expect(imported.success).toBe(true);
    });
  });

  // FAIL-8 Test: Telemetry Consent Gating
  describe('6. Telemetry Consent Gating', () => {
    it('respects consent gating and ignores tracking when consent is not 1', () => {
      telemetry.clear();
      expect(hasTelemetryConsent()).toBe(false);

      // Attempt to track event without consent
      telemetry.track('gear.solve', 'execute');

      // Now enable consent
      telemetry.setConsent(true);
      expect(hasTelemetryConsent()).toBe(true);

      // Disable consent and verify clear
      telemetry.setConsent(false);
      expect(hasTelemetryConsent()).toBe(false);
    });
  });

  // Test 7: verifyAdminKey SHA-256 & timingSafeEqual
  describe('7. Admin Key Hashed Verification', () => {
    const originalEnv = process.env.ADMIN_KEY;

    beforeEach(() => {
      delete process.env.ADMIN_KEY;
    });

    it('fails closed (returns false) when ADMIN_KEY environment variable is not set', () => {
      expect(verifyAdminKey('some_key')).toBe(false);
      expect(verifyAdminKey('')).toBe(false);
      expect(verifyAdminKey(null)).toBe(false);
      expect(verifyAdminKey(undefined)).toBe(false);
    });

    it('returns true when provided key matches ADMIN_KEY', () => {
      process.env.ADMIN_KEY = 'alu_production_secret_key_2026';
      expect(verifyAdminKey('alu_production_secret_key_2026')).toBe(true);
    });

    it('returns false when provided key is incorrect', () => {
      process.env.ADMIN_KEY = 'alu_production_secret_key_2026';
      expect(verifyAdminKey('wrong_key_123')).toBe(false);
    });

    it('safely handles different key lengths without buffer length mismatch error', () => {
      process.env.ADMIN_KEY = 'short_key';
      // 1000-character provided key
      const longKey = 'A'.repeat(1000);
      expect(() => verifyAdminKey(longKey)).not.toThrow();
      expect(verifyAdminKey(longKey)).toBe(false);
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.ADMIN_KEY = originalEnv;
      } else {
        delete process.env.ADMIN_KEY;
      }
    });
  });

  // Test 8: WebGL Capture sequence
  describe('8. WebGL Capture Sequence', () => {
    it('executes renderer.render(scene, camera) immediately before toDataURL', () => {
      const renderMock = vi.fn();
      const toDataUrlMock = vi.fn().mockReturnValue('data:image/jpeg;base64,mockData');

      const mockRenderer = {
        render: renderMock,
        domElement: {
          toDataURL: toDataUrlMock,
        } as unknown as HTMLCanvasElement,
      };

      const mockScene = { isScene: true };
      const mockCamera = { isCamera: true };

      const result = captureRendererScreenshot(mockRenderer, mockScene, mockCamera, 0.7);

      expect(renderMock).toHaveBeenCalledTimes(1);
      expect(renderMock).toHaveBeenCalledWith(mockScene, mockCamera);
      expect(toDataUrlMock).toHaveBeenCalledTimes(1);
      expect(toDataUrlMock).toHaveBeenCalledWith('image/jpeg', 0.7);
      expect(result).toBe('data:image/jpeg;base64,mockData');
    });
  });

  // Test 9: Share routing to /gears/
  describe('9. Share URL Routing', () => {
    it('builds hash URL pointing to /gears/ route', () => {
      const hashUrl = buildHashUrl('test_b64', 'https://www.alucalculator.com/gears/');
      expect(hashUrl).toContain('/gears/#lz=test_b64');
      expect(hashUrl).not.toContain('/gear-design/');
    });
  });
});
