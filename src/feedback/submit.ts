import { recordScreenshotQuotaUsage } from './capture';

export interface FeedbackSubmission {
  message: string;
  category: 'bug' | 'feature' | 'calculation' | 'other';
  module?: string;
  email?: string;
  consentDiagnostics: boolean;
  consentScreenshot: boolean;
  screenshot?: {
    dataUrl: string;
    byteLength: number;
  };
}

export interface FeedbackResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
}

export async function submitFeedback(
  data: FeedbackSubmission,
): Promise<FeedbackResponse> {
  if (!data.message || data.message.trim().length < 5) {
    return {
      success: false,
      error: 'Lütfen en az 5 karakterlik açıklama metni girin.',
    };
  }

  if (data.screenshot && !data.consentScreenshot) {
    return {
      success: false,
      error: 'Ekran görüntüsü göndermek için açık rıza onayını işaretlemelisiniz.',
    };
  }

  try {
    const payload = {
      message: data.message.trim(),
      category: data.category,
      module: data.module || 'general',
      email: data.email?.trim() || null,
      consentDiagnostics: data.consentDiagnostics,
      consentScreenshot: data.consentScreenshot,
      screenshot: data.consentScreenshot && data.screenshot ? data.screenshot.dataUrl : null,
      diagnostics: data.consentDiagnostics
        ? {
            pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            screen:
              typeof window !== 'undefined'
                ? `${window.innerWidth}x${window.innerHeight}`
                : 'unknown',
            timestamp: new Date().toISOString(),
          }
        : null,
    };

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    let result: any = null;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = null;
    }

    if (res.ok && result?.success) {
      if (data.screenshot?.byteLength) {
        recordScreenshotQuotaUsage(data.screenshot.byteLength);
      }
      return {
        success: true,
        id: result.id,
        message: 'Geri bildiriminiz başarıyla iletildi. Teşekkür ederiz!',
      };
    }

    if (result?.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Fallback if server returned non-JSON HTML (404/503/405)
    if (!res.ok) {
      if (res.status === 503) {
        return {
          success: false,
          error: 'E-posta servisi yapılandırılmamış (FEEDBACK_TO eksik).',
        };
      }
      return {
        success: false,
        error: `Sunucu yanıt vermedi (${res.status}). Lütfen mesajınızı doğrudan destek@alucalculator.com adresine e-posta ile iletin.`,
      };
    }

    return {
      success: false,
      error: 'Geri bildirim gönderilemedi. Lütfen doğrudan e-posta gönderin.',
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Bağlantı hatası oluştu.',
    };
  }
}
