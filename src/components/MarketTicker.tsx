"use client";

import { useEffect, useState } from 'react';
import { MarketService, MarketData } from '@/logic/MarketService';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export const MarketTicker = ({ lang, dict }: { lang: string, dict: any }) => {
    const [data, setData] = useState<MarketData | null>(null);

    useEffect(() => {
        MarketService.getData(lang)
            .then(setData)
            .catch(err => {
                console.warn("Market ticker failed", err);
                // Fallback structure to keep UI visible
                setData({
                    aluminum: 0, copper: 0, zinc: 0, lead: 0, nickel: 0, brent: 0, naturalGas: 0,
                    currency: 'USD', symbol: '$', lastUpdated: Date.now(),
                    changeAl: 0, changeCu: 0, changeZn: 0, changePb: 0, changeNi: 0, changeBrent: 0, changeGas: 0,
                    rates: []
                } as MarketData);
            });
    }, [lang]);

    if (!data) return null;

    const TickerItem = ({ itemKey, label, value, change, prefix = '', suffix = '' }: { itemKey: string, label: string, value: number, change: number, prefix?: string, suffix?: string }) => {
        const url = MarketService.getSourceUrl(itemKey);

        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2 px-4 border-r border-slate-800/50 min-w-fit hover:bg-slate-800 transition-colors group cursor-pointer"
                title={`Source: ${new URL(url).hostname}`}
            >
                <span className="text-slate-400 font-bold text-xs uppercase group-hover:text-white transition-colors">{label}</span>
                <span className="text-white font-mono font-bold text-sm tracking-wide">{prefix}{value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}</span>
                <div className={`flex items-center text-xs font-bold ${change >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                    {change >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {Math.abs(change)}%
                </div>
            </a>
        );
    };

    return (
        <div className="w-full bg-slate-900 border-b border-slate-800 overflow-hidden relative h-10 flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>

            <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
                {/* Duplicate content for seamless loop */}
                {[1, 2].map((i) => (
                    <div key={i} className="flex">
                        <TickerItem itemKey="aluminum" label={dict?.market?.aluminum || 'Aluminum'} value={data.aluminum} change={data.changeAl} prefix={data.symbol} suffix="/ton" />
                        <TickerItem itemKey="copper" label={dict?.market?.copper || 'Copper'} value={data.copper} change={data.changeCu} prefix={data.symbol} suffix="/ton" />
                        <TickerItem itemKey="zinc" label="ZINC (LME)" value={data.zinc} change={data.changeZn} prefix={data.symbol} suffix="/ton" />
                        <TickerItem itemKey="nickel" label="NICKEL" value={data.nickel} change={data.changeNi} prefix={data.symbol} suffix="/ton" />
                        <TickerItem itemKey="lead" label="LEAD" value={data.lead} change={data.changePb} prefix={data.symbol} suffix="/ton" />
                        <TickerItem itemKey="brent" label="BRENT OIL" value={data.brent} change={data.changeBrent} prefix={data.symbol} suffix="/bbl" />
                        <TickerItem itemKey="naturalGas" label="NAT GAS" value={data.naturalGas} change={data.changeGas} suffix="/mmbtu" />

                        {/* Dynamic Exchange Rates */}
                        {data.rates && data.rates.map((rate, idx) => (
                            <TickerItem
                                key={idx}
                                itemKey={rate.pair === 'USD/TRY' ? 'usdTry' : 'eurUsd'} // simplified map for URL
                                label={rate.pair}
                                value={rate.value}
                                change={rate.change}
                                prefix={rate.prefix || ''}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
