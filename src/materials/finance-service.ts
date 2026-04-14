/**
 * FinanceService - AluCalc OS v4
 * Handles fetching of real-time material prices from external APIs.
 */
export class FinanceService {
  private static MOCK_PRICES: Record<string, number> = {
    'aluminum': 2450.50, // USD/ton
    'steel': 840.25,      // USD/ton
    'wood': 550.00,       // USD/m^3
    'concrete': 125.00,   // USD/m^3
    'glass': 45.00        // USD/m^2
  };

  /**
   * Fetches the current market price for a material.
   * Currently uses mock data with a hook for external API integration (Polygon/EODHD).
   */
  static async getLivePrice(materialId: string): Promise<{ price: number; currency: string; unit: string }> {
    const id = materialId.toLowerCase();
    
    // External API Integration point
    // const response = await fetch(`https://api.polygon.io/v2/last/trade/COMM:${id}...`);
    
    let price = this.MOCK_PRICES[id] || 0;
    
    // Simulate slight market fluctuation
    if (price > 0) {
        price += (Math.random() - 0.5) * (price * 0.01);
    }

    let unit = 'USD/ton';
    if (id === 'wood' || id === 'concrete') unit = 'USD/m^3';
    if (id === 'glass') unit = 'USD/m^2';

    return {
      price: parseFloat(price.toFixed(2)),
      currency: 'USD',
      unit
    };
  }
}
