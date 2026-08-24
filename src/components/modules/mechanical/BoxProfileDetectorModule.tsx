import { useState } from 'react';
import { useCADCanvasStore } from '@/store/CADCanvasStore';
import { Upload, FileImage, Scan, AlertCircle, Plus } from 'lucide-react';

export default function BoxProfileDetectorModule() {
    const { addShape } = useCADCanvasStore();
    const [image, setImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<null | {
        type: string;
        dimensions: string;
        confidence: number;
    }>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage(e.target?.result as string);
                setResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = () => {
        if (!image) return;
        setAnalyzing(true);
        // Simulate AI analysis
        setTimeout(() => {
            setAnalyzing(false);
            setResult({
                type: 'Rectangular Hollow Section (RHS)',
                dimensions: '100 x 50 x 3.0 mm',
                confidence: 94.5
            });
        }, 2000);
    };

    const exportToCAD = () => {
        if (!result) return;

        // Mock dimensions parsing "100 x 50..."
        // In real app, AI would return structured data
        const dims = result.dimensions.match(/(\d+)/g);
        const w = dims ? parseInt(dims[0]) : 100;
        const h = dims ? parseInt(dims[1]) : 50;

        addShape({
            type: 'rectangle',
            points: [{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }], // Centered
            style: { strokeColor: '#00e5ff', strokeWidth: 2, fillOpacity: 0.1, fillColor: '#00e5ff' },
            visible: true, layer: 'ai-detection', locked: false
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-200 p-4 gap-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-[#252525] transition-colors relative">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {image ? (
                    <img src={image} alt="Uploaded" className="max-h-64 object-contain rounded shadow-lg" />
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                            <Upload size={32} />
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-slate-300">Click or Drag to Upload</div>
                            <div className="text-xs text-slate-500 mt-1">Supports JPG, PNG (Max 5MB)</div>
                        </div>
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center">
                <button
                    onClick={analyzeImage}
                    disabled={!image || analyzing}
                    className={`
                        flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg
                        ${!image || analyzing
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:scale-105 hover:shadow-cyan-500/25'}
                    `}
                >
                    {analyzing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Scan size={18} />
                            Detect Profile
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {result && (
                <div className="bg-[#252525] border border-slate-700 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                            <FileImage size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-green-500 mb-1 uppercase tracking-wider">Detection Successful</div>
                            <h3 className="text-xl font-bold text-white mb-2">{result.type}</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#1a1a1a] p-3 rounded-lg">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Estimated Dimensions</div>
                                    <div className="font-mono text-cyan-400 font-bold">{result.dimensions}</div>
                                </div>
                                <div className="bg-[#1a1a1a] p-3 rounded-lg">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">AI Confidence</div>
                                    <div className="font-mono text-cyan-400 font-bold">{result.confidence}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <div className="flex-1 p-3 bg-yellow-500/10 text-yellow-500 rounded-lg text-xs flex items-center gap-2">
                            <AlertCircle size={14} />
                            <span>AI estimations are for reference only.</span>
                        </div>
                        <button
                            onClick={exportToCAD}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} /> CAD
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
