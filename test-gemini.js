async function test() {
    const prompt = `You are "AluCalc Intelligence Copilot", an expert engineering, manufacturing, and CAD AI assistant.
User Query: "bana w20 dirseğin ölçülerini ver"
Response Language: Turkish

Your task is to analyze the intent and provide a direct, factual response.

RULES:
1. CALCULATION/CHAT: If the user asks an engineering question (e.g., standard part dimensions, material properties, formulas), you MUST provide the ACTUAL numbers, formulas, and exact data directly in the 'content'. DO NOT roleplay that you are "scanning databases" or "checking metadata". DO NOT use generic boilerplate like "Hemen anladım, tarama yapıyorum". Act as a real assistant and give the direct technical answer using your internal knowledge. Use markdown formatting.
2. NAVIGATION: If the user explicitly asks to open, launch, or navigate to a module or app, set 'target_module' to the corresponding string from the list below, and set 'content' to a brief confirmation message.
3. If it's a general greeting, respond professionally as an engineering AI.`;

    const schemaDescription = `{ "type": "NAVIGATION" | "CALCULATION" | "CHAT" | "UNKNOWN", "content": "string", "target_module": "string (from valid list) or 'none'" }`;

    const response = await fetch('http://localhost:3000/api/ai/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, schemaDescription })
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Body:", text);
}

test();
