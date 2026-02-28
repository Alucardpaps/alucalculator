'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * ScientificCalculatorModule - Refined for Persistent Utility Mode
 */
export default function ScientificCalculatorModule() {
    const [display, setDisplay] = useState('0');
    const [memory, setMemory] = useState(0);
    const [lastOp, setLastOp] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [previousValue, setPreviousValue] = useState<number | null>(null);

    const inputDigit = useCallback((digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    }, [display, waitingForOperand]);

    const inputDot = useCallback(() => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    }, [display, waitingForOperand]);

    const clear = () => { setDisplay('0'); setLastOp(null); setPreviousValue(null); };
    const clearEntry = () => setDisplay('0');

    const toggleSign = () => setDisplay(String(-parseFloat(display)));

    const percent = () => setDisplay(String(parseFloat(display) / 100));

    const performOperation = useCallback((nextOp: string) => {
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(inputValue);
        } else if (lastOp) {
            const currentValue = previousValue;
            let result = currentValue;

            switch (lastOp) {
                case '+': result = currentValue + inputValue; break;
                case '-': result = currentValue - inputValue; break;
                case '×': result = currentValue * inputValue; break;
                case '÷': result = inputValue !== 0 ? currentValue / inputValue : 0; break;
                case 'yˣ': result = Math.pow(currentValue, inputValue); break;
            }

            setPreviousValue(result);
            setDisplay(String(result));
        }

        setWaitingForOperand(true);
        setLastOp(nextOp);
    }, [display, lastOp, previousValue]);

    const calculate = useCallback(() => {
        if (lastOp && previousValue !== null) {
            performOperation('=');
            setLastOp(null);
            setPreviousValue(null);
        }
    }, [lastOp, previousValue, performOperation]);

    const scientific = (fn: string) => {
        const val = parseFloat(display);
        let result = 0;
        switch (fn) {
            case 'sin': result = Math.sin(val * Math.PI / 180); break;
            case 'cos': result = Math.cos(val * Math.PI / 180); break;
            case 'tan': result = Math.tan(val * Math.PI / 180); break;
            case 'ln': result = Math.log(val); break;
            case 'log': result = Math.log10(val); break;
            case '√': result = Math.sqrt(val); break;
            case 'x²': result = val * val; break;
            case 'x³': result = val * val * val; break;
            case '1/x': result = 1 / val; break;
            case 'π': result = Math.PI; break;
            case 'e': result = Math.E; break;
            case '|x|': result = Math.abs(val); break;
            case 'n!': result = (function f(n: number): number { return n <= 1 ? 1 : n * f(n - 1); })(val); break;
        }
        setDisplay(String(result));
        setWaitingForOperand(true);
    };

    const Button = ({ label, onClick, span = 1, accent, secondary }: { label: string; onClick: () => void; span?: number; accent?: boolean; secondary?: boolean }) => (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`
                py-2.5 px-1 rounded-lg text-[10px] font-mono font-bold transition-all
                ${accent ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]' :
                    secondary ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' :
                        'bg-white/10 text-white hover:bg-white/20'}
            `}
            style={{
                gridColumn: span > 1 ? `span ${span}` : undefined,
            }}
        >
            {label}
        </motion.button>
    );

    return (
        <div className="flex flex-col gap-3 h-full select-none">
            {/* Display */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <div className="text-[9px] h-3 font-mono opacity-40 text-right">
                    {previousValue !== null && lastOp ? `${previousValue} ${lastOp}` : ''}
                </div>
                <div className="font-mono text-2xl font-black text-right tracking-tighter text-cyan-400 truncate drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                    {display}
                </div>
                {memory !== 0 && (
                    <div className="text-[8px] mt-1 text-orange-400 font-bold tracking-widest uppercase flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                        Memory: {memory}
                    </div>
                )}
            </div>

            {/* Scientific buttons */}
            <div className="grid grid-cols-5 gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <Button label="sin" onClick={() => scientific('sin')} secondary />
                <Button label="cos" onClick={() => scientific('cos')} secondary />
                <Button label="tan" onClick={() => scientific('tan')} secondary />
                <Button label="√" onClick={() => scientific('√')} secondary />
                <Button label="π" onClick={() => scientific('π')} secondary />

                <Button label="ln" onClick={() => scientific('ln')} secondary />
                <Button label="log" onClick={() => scientific('log')} secondary />
                <Button label="x²" onClick={() => scientific('x²')} secondary />
                <Button label="yˣ" onClick={() => performOperation('yˣ')} secondary />
                <Button label="%" onClick={percent} secondary />
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-1.5">
                <Button label="C" onClick={clear} secondary />
                <Button label="CE" onClick={clearEntry} secondary />
                <Button label="±" onClick={toggleSign} secondary />
                <Button label="÷" onClick={() => performOperation('÷')} accent />

                <Button label="7" onClick={() => inputDigit('7')} />
                <Button label="8" onClick={() => inputDigit('8')} />
                <Button label="9" onClick={() => inputDigit('9')} />
                <Button label="×" onClick={() => performOperation('×')} accent />

                <Button label="4" onClick={() => inputDigit('4')} />
                <Button label="5" onClick={() => inputDigit('5')} />
                <Button label="6" onClick={() => inputDigit('6')} />
                <Button label="-" onClick={() => performOperation('-')} accent />

                <Button label="1" onClick={() => inputDigit('1')} />
                <Button label="2" onClick={() => inputDigit('2')} />
                <Button label="3" onClick={() => inputDigit('3')} />
                <Button label="+" onClick={() => performOperation('+')} accent />

                <Button label="0" onClick={() => inputDigit('0')} span={2} />
                <Button label="." onClick={inputDot} />
                <Button label="=" onClick={calculate} accent />
            </div>
        </div>
    );
}
