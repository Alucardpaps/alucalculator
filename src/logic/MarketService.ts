
export interface MarketData {
    aluminum: number;
    copper: number;
    zinc: number;
    lead: number;
    nickel: number;
    brent: number;
    naturalGas: number;

    currency: string;
    symbol: string;
    lastUpdated: number;

    changeAl: number;
    changeCu: number;
    changeZn: number;
    changePb: number;
    changeNi: number;
    changeBrent: number;
    changeGas: number;

    rates: {
        pair: string;
        value: number;
        change: number;
        prefix?: string;
    }[];
}

const CACHE_KEY_PREFIX = 'alu_market_data_v5_';
const CACHE_TTL = 5 * 60 * 1000;

// Realistic Fallback Data (Oct 2024 Estimates)
// Realistic Fallback Data (2026 Estimates)
const MOCK_DATA = {
    prices: {
        aluminum: 2850.50, // USD/Ton (2026 est)
        copper: 10250.75,
        zinc: 3300.20,
        lead: 2350.00,
        nickel: 19800.00,
        brent: 85.50,
        naturalGas: 3.15
    },
    rates: {
        usdTry: 43.43,
        eurUsd: 1.12,
        usdCny: 7.05,
        usdJpy: 145.0,
        usdRub: 98.5
    },
    changes: {
        al: 1.2, cu: -0.5, zn: 0.8, pb: 0.1, ni: -1.5, brent: 2.1, gas: -0.8
    }
};

export const MarketService = {
    async getData(lang: string = 'en'): Promise<MarketData> {
        const cacheKey = `${CACHE_KEY_PREFIX}${lang}`;

        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached) as MarketData;
                if (Date.now() - data.lastUpdated < CACHE_TTL) return data;
            }
        }

        let rawData = MOCK_DATA; // Default to mock initially

        try {
            // Attempt Fetch
            const response = await fetch('/api/market');
            if (response.ok) {
                const json = await response.json();
                if (json.status === 'ok') {
                    rawData = json.data;
                }
            }
        } catch (e) {
            console.warn('Market API unreachable, using fallback data.');
        }

        // Process Data (Raw or Mock)
        const { prices, rates: serverRates, changes } = rawData;

        let targetCurrency = 'USD';
        let symbol = '$';
        let rateToUsd = 1;

        // Simple Currency Logic
        switch (lang) {
            case 'tr':
                targetCurrency = 'TRY';
                symbol = '₺';
                rateToUsd = serverRates.usdTry;
                break;
            case 'de': case 'fr': case 'it': case 'es': case 'pt':
                targetCurrency = 'EUR';
                symbol = '€';
                rateToUsd = 1 / serverRates.eurUsd;
                break;
            case 'zh': targetCurrency = 'CNY'; symbol = '¥'; rateToUsd = serverRates.usdCny; break;
            case 'ja': targetCurrency = 'JPY'; symbol = '¥'; rateToUsd = serverRates.usdJpy; break;
            case 'ru': targetCurrency = 'RUB'; symbol = '₽'; rateToUsd = serverRates.usdRub; break;
            default: targetCurrency = 'USD'; symbol = '$'; rateToUsd = 1; break;
        }

        const data: MarketData = {
            aluminum: prices.aluminum * rateToUsd,
            copper: prices.copper * rateToUsd,
            zinc: prices.zinc * rateToUsd,
            lead: prices.lead * rateToUsd,
            nickel: prices.nickel * rateToUsd,
            brent: prices.brent,
            naturalGas: prices.naturalGas,

            currency: targetCurrency,
            symbol: symbol,
            lastUpdated: Date.now(),

            changeAl: changes.al,
            changeCu: changes.cu,
            changeZn: changes.zn,
            changePb: changes.pb,
            changeNi: changes.ni,
            changeBrent: changes.brent,
            changeGas: changes.gas,

            rates: [
                { pair: 'USD/TRY', value: serverRates.usdTry, change: 0, prefix: '₺' },
                { pair: 'EUR/USD', value: serverRates.eurUsd, change: 0, prefix: '$' }
            ]
        };

        if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify(data));
        }

        return data;
    },

    getSourceUrl(key: string): string {
        switch (key) {
            case 'aluminum': return 'https://finance.yahoo.com/quote/ALI=F';
            case 'copper': return 'https://finance.yahoo.com/quote/HG=F';
            case 'brent': return 'https://finance.yahoo.com/quote/BZ=F';
            default: return 'https://finance.yahoo.com/commodities';
        }
    }
};
