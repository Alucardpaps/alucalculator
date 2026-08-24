const fs = require('fs');

const path = 'src/components/modules/fea/BeamCanvas3D.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add imports
const import_target = "import { SIGMA_PROFILES } from '../../../data/mechanical/profiles';";
const import_replacement = `import { SIGMA_PROFILES } from '../../../data/mechanical/profiles';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Box, Activity, Layers, MousePointer2, PlusCircle, Maximize, Trash2, Cpu, Settings2, Zap } from 'lucide-react';`;
content = content.replace(import_target, import_replacement);

// 2. Replace the main canvas and joint analyzer
const parts = content.split('// --- MAIN CANVAS COMPONENT ---');
const header_content = parts[0];

const new_components = `// --- MAIN CANVAS COMPONENT ---
const BeamCanvas3D = () => {
    // Engine Instance
    const engine = useRef(new StructuralEngine3D());
    const [tick, setTick] = useState(0);

    // Tools State
    const [interactionMode, setInteractionMode] = useState<'DRAG' | 'ADD_NODE' | 'INSPECT'>('DRAG');
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [activeMaterial, setActiveMaterial] = useState('alu_6061');
    const [activeSection, setActiveSection] = useState('IPE100');
    const [isPlaying, setIsPlaying] = useState(false); // Default Paused

    // Chassis Generator State
    const [chassisW, setChassisW] = useState(2000);
    const [chassisD, setChassisD] = useState(2000);
    const [chassisH, setChassisH] = useState(4000);

    const generateChassis = () => {
        const eng = engine.current;
        eng.nodes = [];
        eng.elements = [];

        const mat = activeMaterial;
        const sec = activeSection;

        // Base
        const n1 = eng.addNode(-chassisW / 2, 0, -chassisD / 2, true);
        const n2 = eng.addNode(chassisW / 2, 0, -chassisD / 2, true);
        const n3 = eng.addNode(chassisW / 2, 0, chassisD / 2, true);
        const n4 = eng.addNode(-chassisW / 2, 0, chassisD / 2, true);

        // Mid Deck
        const n5 = eng.addNode(-chassisW / 4, chassisH / 2, -chassisD / 4);
        const n6 = eng.addNode(chassisW / 4, chassisH / 2, -chassisD / 4);
        const n7 = eng.addNode(chassisW / 4, chassisH / 2, chassisD / 4);
        const n8 = eng.addNode(-chassisW / 4, chassisH / 2, chassisD / 4);

        // Top Apex
        const n9 = eng.addNode(0, chassisH, 0);

        // Columns
        eng.addElement(n1, n5, mat, sec);
        eng.addElement(n2, n6, mat, sec);
        eng.addElement(n3, n7, mat, sec);
        eng.addElement(n4, n8, mat, sec);

        // Mid Ring
        eng.addElement(n5, n6, mat, sec);
        eng.addElement(n6, n7, mat, sec);
        eng.addElement(n7, n8, mat, sec);
        eng.addElement(n8, n5, mat, sec);

        // Cross Bracing
        eng.addElement(n1, n6, mat, sec);
        eng.addElement(n2, n7, mat, sec);
        eng.addElement(n3, n8, mat, sec);
        eng.addElement(n4, n5, mat, sec);

        // Top Pyramid
        eng.addElement(n5, n9, mat, sec);
        eng.addElement(n6, n9, mat, sec);
        eng.addElement(n7, n9, mat, sec);
        eng.addElement(n8, n9, mat, sec);

        eng.initSimulation();
        setTick(t => t + 1);
        setSelectedNodes([]);
    };

    const clearScene = () => {
        engine.current.nodes = [];
        engine.current.elements = [];
        setTick(t => t + 1);
        setSelectedNodes([]);
    };

    // Init Scene
    useEffect(() => {
        const eng = engine.current;
        if (eng.nodes.length > 0) return; // Already init

        // Build Initial DB for Physics Engine
        const allMats = MaterialService.getAll();
        allMats.forEach(m => {
            const props = MaterialService.resolveProperties(m.id, m.treatments[0].id);
            if (props) eng.materials.push({ ...props, id: m.id });
        });

        SIGMA_PROFILES.forEach(p => {
            eng.sections.push({
                id: p.name, name: p.name,
                A: (p.weight / 2700) * 1e6, // approx Area in mm2
                I: ((p.ix + p.iy) / 2) * 10000, // cm4 to mm4
                J: (p.ix + p.iy) * 10000
            } as any);
        });
        eng.sections.push({ id: 'IPE100', name: 'IPE 100', A: 1032, I: 1710000, J: 12000 } as any);

        eng.addNode(0, 0, 0, true);
        eng.initSimulation();
        setTick(prev => prev + 1);
    }, []);

    const handleUpdate = useCallback(() => {
        setTick(t => t + 1);
    }, []);

    return (
        <div className="w-full h-full relative overflow-hidden bg-[#050505] font-mono select-none">
            {/* AMBIENT GLOW EFFECTS */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00e5ff]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#ff0055]/10 rounded-full blur-[120px] pointer-events-none" />

            {/* TOP BAR: HUD & CONTROLS */}
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none"
            >
                {/* Left: Branding & Stats */}
                <div className="flex flex-col gap-4 pointer-events-auto">
                    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                        <div className="p-3 bg-gradient-to-br from-[#00e5ff]/20 to-transparent rounded-xl border border-[#00e5ff]/30 text-[#00e5ff]">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <h1 className="text-white font-black tracking-[0.2em] text-sm flex items-center gap-2">
                                <span className={"w-2 h-2 rounded-full " + (isPlaying ? "bg-[#ff0055] animate-pulse shadow-[0_0_10px_#ff0055]" : "bg-[#00e5ff] shadow-[0_0_10px_#00e5ff]")}></span>
                                LUME ENGINE 3D
                            </h1>
                            <div className="flex gap-4 mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                <span>Nodes: <span className="text-[#00e5ff]">{engine.current.nodes.length}</span></span>
                                <span>Elems: <span className="text-[#00e5ff]">{engine.current.elements.filter(e => !e.broken).length}</span></span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Mode specific prompt */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={interactionMode}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-black/20 backdrop-blur-sm border border-white/5 py-2 px-4 rounded-xl text-[10px] text-[#00e5ff] font-bold tracking-widest uppercase flex items-center gap-2"
                        >
                            <Activity size={12} className="opacity-50" />
                            {interactionMode === 'DRAG' ? '> DRAG NODES TO APPLY FORCES' :
                                interactionMode === 'ADD_NODE' ? '> CLICK GRID TO PLACE NODE' :
                                    '> SELECT A NODE TO ANALYZE JOINT'}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right: Simulation Controls */}
                <div className="flex gap-2 pointer-events-auto">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={"flex items-center gap-2 px-6 py-3 rounded-2xl font-bold tracking-widest text-[10px] uppercase transition-all duration-300 border backdrop-blur-xl " + (isPlaying ? "bg-[#ff0055]/20 text-[#ff0055] border-[#ff0055]/50 shadow-[0_0_20px_rgba(255,0,85,0.2)]" : "bg-white/5 text-[#00e5ff] border-[#00e5ff]/30 hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]/50")}
                    >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        {isPlaying ? 'PAUSE SOLVER' : 'RUN PHYSICS'}
                    </button>
                    <button
                        onClick={clearScene}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold tracking-widest text-[10px] uppercase transition-all duration-300 bg-white/5 text-gray-400 border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                        title="Clear Scene"
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={() => {
                            engine.current.initSimulation();
                            setTick(t => t+1);
                        }}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold tracking-widest text-[10px] uppercase transition-all duration-300 bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                        title="Reset Forces"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </motion.div>

            {/* LEFT PANEL: CONFIGURATION */}
            <motion.div 
                 initial={{ x: -50, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 className="absolute left-6 top-48 bottom-32 w-[300px] z-20 pointer-events-none flex flex-col gap-6 overflow-y-auto custom-scrollbar"
            >
                 {interactionMode !== 'INSPECT' && (
                     <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 pointer-events-auto flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00e5ff] to-transparent opacity-50" />
                        
                        <div>
                            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Layers size={12} className="text-[#00e5ff]" /> Material Config
                            </h3>
                            <select
                                value={activeMaterial}
                                onChange={e => setActiveMaterial(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-[#00e5ff] outline-none transition-all cursor-pointer appearance-none"
                            >
                                {engine.current.materials.map(m => (
                                    <option key={m.id} value={m.id} className="bg-[#050505]">{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Box size={12} className="text-[#00e5ff]" /> Section Profile
                            </h3>
                            <select
                                value={activeSection}
                                onChange={e => setActiveSection(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 text-white text-xs p-3 rounded-xl focus:border-[#00e5ff] outline-none transition-all cursor-pointer appearance-none"
                            >
                                {engine.current.sections.map(s => (
                                    <option key={s.id} value={s.id} className="bg-[#050505]">{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                if (selectedNodes.length === 2) {
                                    engine.current.addElement(
                                        engine.current.nodes.find(n => n.id === selectedNodes[0])!,
                                        engine.current.nodes.find(n => n.id === selectedNodes[1])!,
                                        activeMaterial,
                                        activeSection
                                    );
                                    engine.current.initSimulation();
                                    setSelectedNodes([]);
                                    setTick(t => t + 1);
                                }
                            }}
                            disabled={selectedNodes.length !== 2}
                            className={"w-full py-4 text-[10px] font-black tracking-[0.2em] rounded-xl transition-all duration-300 uppercase " + (selectedNodes.length === 2 ? "bg-[#00e5ff] text-black shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:bg-cyan-300 transform scale-[1.02]" : "bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed")}
                        >
                            Connect Beams ({selectedNodes.length}/2)
                        </button>

                        {/* CHASSIS GENERATOR */}
                        <div className="pt-6 border-t border-white/10">
                            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Settings2 size={12} className="text-[#00e5ff]" /> Auto-Generator
                            </h3>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[{l: 'W', v: chassisW, s: setChassisW}, {l: 'D', v: chassisD, s: setChassisD}, {l: 'H', v: chassisH, s: setChassisH}].map((dim, i) => (
                                    <div key={i} className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden focus-within:border-[#00e5ff]/50 transition-colors">
                                        <span className="text-[8px] text-gray-500 px-2 pt-2 text-center uppercase font-bold">{dim.l}</span>
                                        <input type="number" value={dim.v} onChange={e => dim.s(Number(e.target.value))} className="w-full bg-transparent text-[#00e5ff] text-center font-mono outline-none text-xs pb-2" />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={generateChassis}
                                className="w-full py-3 text-[10px] bg-black/50 text-[#00e5ff] border border-[#00e5ff]/30 hover:bg-[#00e5ff]/10 rounded-xl font-bold tracking-[0.2em] transition-all"
                            >
                                BUILD TOWER
                            </button>
                        </div>
                     </div>
                 )}
            </motion.div>

            {/* RIGHT PANEL: INSPECTOR */}
            <motion.div
                 initial={{ x: 50, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 className="absolute right-6 top-48 bottom-32 w-[340px] z-20 pointer-events-none flex flex-col gap-4 overflow-y-auto custom-scrollbar"
            >
                <AnimatePresence>
                    {interactionMode === 'INSPECT' && selectedNodes.length === 1 && (
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 pointer-events-auto shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-[#ff0055] to-transparent opacity-50" />
                            <JointAnalyzer
                                nodeId={selectedNodes[0]}
                                engine={engine.current}
                                activeMaterial={activeMaterial}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* BOTTOM BAR: MODE TABS */}
            <motion.div
                 initial={{ y: 50, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
            >
                 <div className="flex bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                     {[
                         { id: 'DRAG', label: 'DRAG & PULL', icon: MousePointer2, color: '#00e5ff' },
                         { id: 'ADD_NODE', label: 'BUILD NODE', icon: PlusCircle, color: '#f59e0b' },
                         { id: 'INSPECT', label: 'INSPECT', icon: Maximize, color: '#ff0055' }
                     ].map(mode => (
                         <button
                             key={mode.id}
                             onClick={() => { setInteractionMode(mode.id as any); setSelectedNodes([]); }}
                             className="flex items-center gap-2 px-8 py-3.5 rounded-[1.8rem] text-[10px] font-black tracking-widest uppercase transition-all duration-300 relative overflow-hidden group"
                         >
                             {interactionMode === mode.id && (
                                 <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-[1.8rem] shadow-inner" />
                             )}
                             <mode.icon size={16} className="relative z-10 transition-transform group-hover:scale-110" style={{ color: interactionMode === mode.id ? mode.color : '#64748b' }} />
                             <span className="relative z-10" style={{ color: interactionMode === mode.id ? '#ffffff' : '#64748b' }}>{mode.label}</span>
                         </button>
                     ))}
                 </div>
            </motion.div>

            {/* 3D SCENE OVERLAY */}
            <div className="absolute inset-0 z-0 opacity-90">
                <Canvas shadows dpr={[1, 2]} camera={{ position: [8, 6, 8], fov: 45 }}>
                    <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={45} />
                    <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} enableDamping dampingFactor={0.05} />

                    <ambientLight intensity={0.4} color="#ffffff" />
                    <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} />
                    
                    {/* Atmospheric Spotlights */}
                    <spotLight position={[-10, 10, -10]} intensity={2} color="#00e5ff" angle={0.8} penumbra={1} castShadow />
                    <spotLight position={[10, 5, 10]} intensity={1.5} color="#ff0055" angle={0.8} penumbra={1} />
                    
                    <Environment preset="night" />

                    {/* Avant-Garde Grid Floor */}
                    <Grid 
                        infiniteGrid 
                        fadeDistance={60} 
                        cellColor={'#334155'} 
                        sectionColor={'#00e5ff'} 
                        sectionThickness={1.5}
                        cellThickness={0.5}
                        position={[0, -0.05, 0]}
                    />

                    {/* Ground plane for raycasting Add Node */}
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, -0.01, 0]}
                        receiveShadow
                        onPointerDown={(e) => {
                            if (interactionMode === 'ADD_NODE') {
                                const point = e.point;
                                const snap = 0.5;
                                const sx = Math.round(point.x / snap) * snap;
                                const sz = Math.round(point.z / snap) * snap;

                                engine.current.addNode(sx * 1000, 0, sz * 1000, true);
                                engine.current.initSimulation();
                                setTick(t => t + 1);
                            }
                        }}
                    >
                        <planeGeometry args={[200, 200]} />
                        <shadowMaterial transparent opacity={0.6} />
                    </mesh>

                    <SceneContent
                        engine={engine.current}
                        onUpdate={handleUpdate}
                        interactionMode={interactionMode}
                        selectedNodes={selectedNodes}
                        setSelectedNodes={setSelectedNodes}
                        isPlaying={isPlaying}
                    />

                </Canvas>
            </div>
        </div>
    );
};

// --- JOINT ANALYZER COMPONENT ---
const JointAnalyzer = ({ nodeId, engine, activeMaterial }: { nodeId: string, engine: StructuralEngine3D, activeMaterial: string }) => {
    const node = engine.nodes.find(n => n.id === nodeId);
    const [jointType, setJointType] = useState<'BOLT' | 'WELD' | 'KEY' | 'PIN'>('BOLT');

    // Inputs
    const [forceN, setForceN] = useState(5000); // N
    const [torqueNm, setTorqueNm] = useState(500); // Nm

    // Geometric Params
    const [boltDia, setBoltDia] = useState(12); // mm M12
    const [boltCount, setBoltCount] = useState(4);
    const [weldS, setWeldS] = useState(5); // mm
    const [weldL, setWeldL] = useState(50); // mm
    const [shaftDia, setShaftDia] = useState(50); // mm
    const [keyW, setKeyW] = useState(14); // mm
    const [keyH, setKeyH] = useState(9); // mm
    const [keyL, setKeyL] = useState(40); // mm
    const [pinDia, setPinDia] = useState(10); // mm
    const [pinT, setPinT] = useState(5); // mm

    if (!node) return null;

    const matProps = MATERIALS.find(m => m.id === activeMaterial);
    const yieldStress = matProps?.yieldStrength || 250;

    let result = { stress: 0, sf: 0, status: 'UNKNOWN' };

    switch (jointType) {
        case 'BOLT':
            const areaBolt = (Math.PI * Math.pow(boltDia, 2)) / 4;
            const tauBolt = forceN / (boltCount * areaBolt);
            result.stress = tauBolt;
            result.sf = yieldStress / (tauBolt || 1);
            break;
        case 'WELD':
            const tauWeld = forceN / (0.707 * weldS * weldL);
            result.stress = tauWeld;
            result.sf = yieldStress / (tauWeld || 1);
            break;
        case 'KEY':
            const torqueNmm = torqueNm * 1000;
            const tauKey = (2 * torqueNmm) / (shaftDia * keyW * keyL);
            const sigmaKey = (4 * torqueNmm) / (shaftDia * keyH * keyL);
            result.stress = Math.max(tauKey, sigmaKey);
            result.sf = yieldStress / (result.stress || 1);
            break;
        case 'PIN':
            const areaPin = (Math.PI * Math.pow(pinDia, 2)) / 4;
            const tauPin = forceN / areaPin;
            const sigmaBearing = forceN / (pinDia * pinT);
            result.stress = Math.max(tauPin, sigmaBearing);
            result.sf = yieldStress / (result.stress || 1);
            break;
    }

    if (result.sf < 1.0) result.status = 'FAIL';
    else if (result.sf < 1.5) result.status = 'MARGINAL';
    else result.status = 'SAFE';

    const statusColor = result.status === 'SAFE' ? 'text-emerald-400' : result.status === 'MARGINAL' ? 'text-amber-400' : 'text-[#ff0055]';
    const statusGlow = result.status === 'SAFE' ? 'shadow-[0_0_15px_rgba(52,211,153,0.3)] border-emerald-500/50' : result.status === 'MARGINAL' ? 'shadow-[0_0_15px_rgba(251,191,36,0.3)] border-amber-500/50' : 'shadow-[0_0_15px_rgba(255,0,85,0.3)] border-[#ff0055]/50';

    return (
        <div className="flex flex-col gap-5">
            <h3 className="text-[#ff0055] text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2">
                <Zap size={12} />
                Joint Analyzer
                <span className="ml-auto text-gray-500 font-normal">NODE: {node.id.substring(0, 4)}</span>
            </h3>

            {/* Type Selector */}
            <div className="flex bg-black/50 border border-white/10 rounded-xl p-1">
                {['BOLT', 'WELD', 'KEY', 'PIN'].map(type => (
                    <button
                        key={type}
                        onClick={() => setJointType(type as any)}
                        className={"flex-1 py-1.5 text-[9px] font-bold tracking-widest rounded-lg transition-colors " + (jointType === type ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Config Form */}
            <div className="grid grid-cols-2 gap-2">
                {jointType !== 'KEY' && (
                    <div className="col-span-2 flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-3 pt-2 pb-2">
                        <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1 text-center">Load Force (N)</span>
                        <input type="number" value={forceN} onChange={e => setForceN(Number(e.target.value))} className="w-full bg-transparent text-[#ff0055] text-center font-mono outline-none text-xs" />
                    </div>
                )}
                {jointType === 'KEY' && (
                    <div className="col-span-2 flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-3 pt-2 pb-2">
                        <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1 text-center">Torque (Nm)</span>
                        <input type="number" value={torqueNm} onChange={e => setTorqueNm(Number(e.target.value))} className="w-full bg-transparent text-[#ff0055] text-center font-mono outline-none text-xs" />
                    </div>
                )}

                {/* Specific Fields */}
                {jointType === 'BOLT' && (
                    <>
                        <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Bolt M(d)</span><input type="number" value={boltDia} onChange={e => setBoltDia(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                        <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Count (n)</span><input type="number" value={boltCount} onChange={e => setBoltCount(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                    </>
                )}
                {jointType === 'WELD' && (
                    <>
                        <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Size (s)</span><input type="number" value={weldS} onChange={e => setWeldS(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                        <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Length (l)</span><input type="number" value={weldL} onChange={e => setWeldL(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                    </>
                )}
                {jointType === 'KEY' && (
                    <>
                        <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Shaft Dia</span><input type="number" value={shaftDia} onChange={e => setShaftDia(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                        <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Key Len</span><input type="number" value={keyL} onChange={e => setKeyL(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                        <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Key W</span><input type="number" value={keyW} onChange={e => setKeyW(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                        <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Key H</span><input type="number" value={keyH} onChange={e => setKeyH(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                    </>
                )}
                {jointType === 'PIN' && (
                    <>
                         <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Pin Dia</span><input type="number" value={pinDia} onChange={e => setPinDia(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                         <div className="flex flex-col bg-black/50 border border-white/10 rounded-xl overflow-hidden px-2 pt-2 pb-2"><span className="text-[8px] text-gray-500 text-center uppercase tracking-widest mb-1">Plate Thk</span><input type="number" value={pinT} onChange={e => setPinT(Number(e.target.value))} className="w-full bg-transparent text-white text-center font-mono outline-none text-xs" /></div>
                    </>
                )}
            </div>

            {/* Results Block */}
            <div className={"mt-2 bg-black/50 p-4 rounded-2xl border transition-all duration-500 " + statusGlow}>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Calculated Stress</span>
                    <span className="text-xs text-white font-mono">{result.stress.toFixed(2)} MPa</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Base Yield ({matProps?.name || activeMaterial})</span>
                    <span className="text-xs text-white font-mono">{yieldStress.toFixed(2)} MPa</span>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">FoS Factor</span>
                        <span className={"text-[10px] font-black tracking-widest " + statusColor}>{result.status}</span>
                    </div>
                    <span className={"text-3xl font-black font-mono leading-none " + statusColor}>
                        {isFinite(result.sf) ? result.sf.toFixed(2) : 'INF'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BeamCanvas3D;`

fs.writeFileSync(path, header_content + new_components);
