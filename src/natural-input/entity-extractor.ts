export class EntityExtractor {
  /**
   * Extracts numbers dynamically from input strings. matches numeric constraints backwards into expected keys sequentially.
   */
  static extract(text: string, expectedInputs: Array<{ key: string; type: string; unit?: string }>): Record<string, number> {
    const payload: Record<string, number> = {};
    const normalizedText = text.toLowerCase();
    
    // Extract all numbers from text using regex (supports decimals and negatives)
    const matches = normalizedText.match(/-?\d+(\.\d+)?/g);
    
    if (!matches) {
       return payload;
    }
    
    const extractedNumbers = matches.map(m => parseFloat(m));
    
    // Deterministic mapping: Just map numbers to the inputs in the order they appear in the text
    // against the order they are required in the schema for now.
    // E.g. gear ratio 20 (...) 60 (...) 150 -> N1=20, N2=60, T1=150
    for (let i = 0; i < Math.min(extractedNumbers.length, expectedInputs.length); i++) {
        payload[expectedInputs[i].key] = extractedNumbers[i];
    }
    
    return payload;
  }
}
