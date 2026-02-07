'use client';

import { useState, useCallback } from 'react';

/**
 * ScientificCalculatorModule - Full scientific calculator
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

    // Scientific functions
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
            case 'n!': result = factorial(val); break;
        }
        setDisplay(String(result));
        setWaitingForOperand(true);
    };

    const factorial = (n: number): number => {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    };

    // Memory functions
    const memoryStore = () => setMemory(parseFloat(display));
    const memoryRecall = () => { setDisplay(String(memory)); setWaitingForOperand(true); };
    const memoryAdd = () => setMemory(memory + parseFloat(display));
    const memoryClear = () => setMemory(0);

    const Button = ({ label, onClick, span = 1, accent, secondary }: { label: string; onClick: () => void; span?: number; accent?: boolean; secondary?: boolean }) => (
        <button
            onClick={onClick}
            className="py-2 px-1 rounded text-xs font-mono font-medium transition-all hover:opacity-80 active:scale-95"
            style={{
                gridColumn: span > 1 ? `span ${span}` : undefined,
                backgroundColor: accent ? 'var(--color-os-accent)' : secondary ? 'var(--color-os-panel)' : 'var(--color-os-header)',
                color: accent ? 'var(--color-os-canvas)' : 'var(--color-os-text-primary)',
            }}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Display */}
            <div
                className="p-4 rounded-lg text-right"
                style={{ backgroundColor: 'var(--color-os-canvas)', border: '1px solid var(--color-os-border)' }}
            >
                <div className="text-[10px] h-4" style={{ color: 'var(--color-os-text-secondary)' }}>
                    {previousValue !== null && lastOp ? `${previousValue} ${lastOp}` : ''}
                </div>
                <div
                    className="font-mono text-2xl font-bold truncate"
                    style={{ color: 'var(--color-os-accent)' }}
                >
                    {display}
                </div>
                {memory !== 0 && <div className="text-[9px] mt-1" style={{ color: 'var(--color-os-warning)' }}>M={memory}</div>}
            </div>

            {/* Scientific buttons */}
            <div className="grid grid-cols-5 gap-1">
                <Button label="sin" onClick={() => scientific('sin')} secondary />
                <Button label="cos" onClick={() => scientific('cos')} secondary />
                <Button label="tan" onClick={() => scientific('tan')} secondary />
                <Button label="ln" onClick={() => scientific('ln')} secondary />
                <Button label="log" onClick={() => scientific('log')} secondary />
                <Button label="√" onClick={() => scientific('√')} secondary />
                <Button label="x²" onClick={() => scientific('x²')} secondary />
                <Button label="x³" onClick={() => scientific('x³')} secondary />
                <Button label="yˣ" onClick={() => performOperation('yˣ')} secondary />
                <Button label="1/x" onClick={() => scientific('1/x')} secondary />
                <Button label="π" onClick={() => scientific('π')} secondary />
                <Button label="e" onClick={() => scientific('e')} secondary />
                <Button label="|x|" onClick={() => scientific('|x|')} secondary />
                <Button label="n!" onClick={() => scientific('n!')} secondary />
                <Button label="%" onClick={percent} secondary />
            </div>

            {/* Memory row */}
            <div className="grid grid-cols-4 gap-1">
                <Button label="MC" onClick={memoryClear} secondary />
                <Button label="MR" onClick={memoryRecall} secondary />
                <Button label="M+" onClick={memoryAdd} secondary />
                <Button label="MS" onClick={memoryStore} secondary />
            </div>

            {/* Main keypad */}
            <div className="grid grid-cols-4 gap-1 flex-1">
                <Button label="C" onClick={clear} />
                <Button label="CE" onClick={clearEntry} />
                <Button label="±" onClick={toggleSign} />
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
