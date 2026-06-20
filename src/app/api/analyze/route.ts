import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { calculatorId, inputs, result } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'sk-ant-...') {
      return NextResponse.json({ error: 'Please set a valid ANTHROPIC_API_KEY in your .env.local file.' }, { status: 400 });
    }

    const systemPrompt = `Sen kıdemli bir makine/yapı mühendisisin. 
Kullanıcının girdiği mühendislik hesabını analiz edeceksin.
Yanıtını şu 5 bölümde ver:
## PARAMETRE DOĞRULAMA
## HESAP KONTROLÜ  
## MÜHENDİSLİK DEĞERLENDİRMESİ
## KRİTİK UYARILAR
## ÖNERİLER
Türkçe veya İngilizce — kullanıcının diline göre cevap ver.`;

    const userMessage = `Hesaplayıcı ID: ${calculatorId}
Girdiler: ${JSON.stringify(inputs, null, 2)}
Hesaplanan Sonuç: ${result}

Lütfen bu hesabı yukarıdaki 5 bölüme göre detaylıca analiz et ve raporla.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: response.status });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleanedLine = line.trim();
              if (!cleanedLine) continue;

              if (cleanedLine.startsWith('data:')) {
                const dataStr = cleanedLine.substring(5).trim();
                if (dataStr === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
                    controller.enqueue(encoder.encode(parsed.delta.text));
                  }
                } catch (e) {
                  // Skip parsing line if not fully formed json
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error: any) {
    console.error("AI Analysis API route error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
