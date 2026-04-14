/**
 * Enterprise-grade client utility to securely fetch structured JSON data.
 * This function now routes through our secure Next.js Backend-For-Frontend (BFF)
 * so that all public visitors can use the AI without exposing the API key directly in their browsers.
 */
export const generateStructuredJSON = async <T>(
    prompt: string,
    schemaDescription: string = "Return ONLY valid JSON. No markdown formatting."
): Promise<T | null> => {
    try {
        // Send request to our Secure Server Proxy
        const response = await fetch('/api/ai/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, schemaDescription })
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.code === 'NO_API_KEY') {
                console.warn("[Platform Kernel] API Key missing on server. Falling back to deterministic simulation algorithm.");
                return null; // Triggers graceful fallback in the stores automatically
            }
            console.error(`[Platform Kernel] Proxy responded with HTTP ${response.status}`, errorData);
            return null;
        }

        const data = await response.json();
        return data as T;
    } catch (error) {
        console.error("[Platform Kernel] Cognitive Services Request Error:", error);
        return null; // Fallback happens here too in case of a complete failure
    }
};
