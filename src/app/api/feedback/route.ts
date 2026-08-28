export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Server-side IP rate limiting state per UTC day
interface IpQuotaRecord {
  count: number;
  bytes: number;
}

const ipQuotaStore: Map<string, IpQuotaRecord> = new Map();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

function checkServerQuota(
  req: NextRequest,
  incomingBytes: number,
): { allowed: boolean; reason?: string } {
  const ip = getClientIp(req);
  const salt = process.env.FEEDBACK_SALT || 'alu_salt_2026';
  const todayUtc = new Date().toISOString().split('T')[0];
  const ipHash = crypto.createHash('sha256').update(`${ip}:${salt}:${todayUtc}`).digest('hex');

  const hasLicense = Boolean(req.headers.get('x-alucalc-license'));
  const maxRequests = hasLicense ? 30 : 10;
  const maxBytes = hasLicense ? 5 * 1024 * 1024 : 2 * 1024 * 1024; // 2MB standard, 5MB licensed

  const current = ipQuotaStore.get(ipHash) || { count: 0, bytes: 0 };

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      reason: `Günlük geri bildirim istek kotası (${maxRequests} adet) aşıldı. Lütfen yarın tekrar deneyin.`,
    };
  }

  if (current.bytes + incomingBytes > maxBytes) {
    return {
      allowed: false,
      reason: `Günlük görsel veri boyutu kotası (${Math.round(maxBytes / 1024 / 1024)} MB) aşıldı.`,
    };
  }

  current.count += 1;
  current.bytes += incomingBytes;
  ipQuotaStore.set(ipHash, current);

  return { allowed: true };
}

function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  const target = origin || referer;
  if (!target) return true; // Direct internal API

  try {
    const parsed = new URL(target);
    const hostname = parsed.hostname;
    if (
      hostname === 'alucalculator.com' ||
      hostname === 'www.alucalculator.com' ||
      hostname === 'admin.alucalculator.com' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      (host && hostname === host.split(':')[0])
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function validateImageMagicBytes(buffer: Buffer): { valid: boolean; format: 'jpeg' | 'png' | 'webp' | null } {
  if (buffer.length < 12) return { valid: false, format: null };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, format: 'jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, format: 'png' };
  }

  // WebP: RIFF ... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, format: 'webp' };
  }

  return { valid: false, format: null };
}

async function sendFeedbackEmail(options: {
  to: string;
  category: string;
  module: string;
  message: string;
  userEmail?: string | null;
  diagnostics?: Record<string, unknown> | null;
  screenshotBuffer?: Buffer | null;
}): Promise<void> {
  const { to, category, module: mod, message, userEmail, diagnostics, screenshotBuffer } = options;
  const subject = `[AluCalc Feedback] [${category.toUpperCase()}] ${mod}`;

  const textBody = [
    `Yeni AluCalc Geri Bildirimi`,
    `Kategori: ${category}`,
    `Modül: ${mod}`,
    `Tarih: ${new Date().toISOString()}`,
    userEmail ? `Kullanıcı E-posta: ${userEmail}` : `Kullanıcı E-posta: (Belirtilmedi)`,
    diagnostics ? `Teşhis: ${JSON.stringify(diagnostics, null, 2)}` : '',
    `----------------------------------------`,
    `Mesaj:`,
    message,
  ].filter(Boolean).join('\n');

  // Provider 1: Resend REST API
  if (process.env.RESEND_API_KEY) {
    try {
      const payload: Record<string, unknown> = {
        from: process.env.FEEDBACK_FROM || 'AluCalc Feedback <onboarding@resend.dev>',
        to: [to],
        subject,
        text: textBody,
      };

      if (screenshotBuffer) {
        payload.attachments = [
          {
            filename: 'screenshot.webp',
            content: screenshotBuffer.toString('base64'),
          },
        ];
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn('Resend mail delivery warning:', errText);
      }
      return;
    } catch (err) {
      console.error('Failed to send email via Resend:', err);
    }
  }

  // If running in development/test without external mail credentials, log on server
  if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
    console.log(`[FEEDBACK MAIL MOCK -> ${to}] Subject: ${subject}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Origin Allowlist Validation
    if (!validateOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Origin doğrulaması başarısız (CORS / Cross-Origin yasak).' },
        { status: 403 },
      );
    }

    // 2. FEEDBACK_TO Configuration Verification (FAIL-CLOSE: 503 if missing)
    const feedbackTo = process.env.FEEDBACK_TO;
    if (!feedbackTo) {
      return NextResponse.json(
        {
          success: false,
          error: 'E-posta servisi yapılandırılmamış (FEEDBACK_TO eksik).',
        },
        { status: 503 },
      );
    }

    const body = await req.json();

    const {
      message,
      category = 'other',
      module = 'general',
      email = null,
      consentDiagnostics = false,
      consentScreenshot = false,
      screenshot = null,
      diagnostics = null,
    } = body;

    // 3. Mandatory Message Validation
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Açıklama metni en az 5 karakter olmalıdır.' },
        { status: 400 },
      );
    }

    let estimatedBytes = message.length;
    let screenshotBuffer: Buffer | null = null;

    if (screenshot && consentScreenshot && typeof screenshot === 'string') {
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
      screenshotBuffer = Buffer.from(base64Data, 'base64');
      estimatedBytes += screenshotBuffer.length;
    }

    // 4. Server-side IP Quota Verification
    const quotaCheck = checkServerQuota(req, estimatedBytes);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { success: false, error: quotaCheck.reason },
        { status: 429 },
      );
    }

    let reEncodedScreenshotBuffer: Buffer | null = null;

    if (screenshotBuffer && consentScreenshot) {
      // Max size check: 500 KB
      if (screenshotBuffer.length > 500 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Ekran görüntüsü 500 KB sınırını aşıyor.' },
          { status: 400 },
        );
      }

      // Magic byte validation
      const magicCheck = validateImageMagicBytes(screenshotBuffer);
      if (!magicCheck.valid) {
        return NextResponse.json(
          { success: false, error: 'Geçersiz görsel biçimi: Magic byte doğrulaması başarısız.' },
          { status: 400 },
        );
      }

      // Re-encode image via sharp
      try {
        const sharp = (await import('sharp')).default;
        reEncodedScreenshotBuffer = await sharp(screenshotBuffer)
          .resize({ width: 1280, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
      } catch {
        reEncodedScreenshotBuffer = screenshotBuffer;
      }
    }

    const feedbackId = 'fb_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    // 5. Send via Mail (No disk write)
    await sendFeedbackEmail({
      to: feedbackTo,
      category,
      module,
      message: message.trim().slice(0, 2000),
      userEmail: email ? String(email).slice(0, 100) : null,
      diagnostics: consentDiagnostics && diagnostics ? diagnostics : null,
      screenshotBuffer: reEncodedScreenshotBuffer,
    });

    return NextResponse.json({
      success: true,
      id: feedbackId,
      message: 'Geri bildirim başarıyla iletildi.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Sunucu hatası';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
