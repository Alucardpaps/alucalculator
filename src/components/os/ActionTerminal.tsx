'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, ChevronRight, Activity, Cpu, Hammer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionTerminalProps {
  className?: string;
}

interface CommandLog {
  type: 'cmd' | 'resp' | 'sys' | 'action' | 'system' | 'mcp';
  text: string;
  timestamp: string;
}

export function ActionTerminal({ className }: ActionTerminalProps) {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<CommandLog[]>([
    { type: 'sys', text: 'ALUCALC OS ENGINE KERNEL v4.0.0', timestamp: new Date().toLocaleTimeString() },
    { type: 'sys', text: 'MCP ECOSYSTEM: ONLINE - [MATERIALS, PHYS, FIGMA, GIT]', timestamp: new Date().toLocaleTimeString() },
    { type: 'sys', text: 'READY FOR ENGINEERING OPERATIONS...', timestamp: new Date().toLocaleTimeString() },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const parseCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setLogs(prev => [...prev, { type: 'cmd', text: `> ${trimmed}`, timestamp: new Date().toLocaleTimeString() }]);

    // Simulate Processing Delay
    const procId = Math.random().toString(36).substr(2, 5);
    setLogs(prev => [...prev, { type: 'system', text: `[PROC:${procId}] Analyzing command integrity...`, timestamp: new Date().toLocaleTimeString() }]);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    if (trimmed.startsWith('//')) {
      const action = trimmed.substring(2).trim().toLowerCase();
      
      if (action.includes('malzeme') || action.includes('material')) {
        setLogs(prev => [...prev, { type: 'mcp', text: "Tool: MaterialsProject.search_materials({ element: 'Al', property: 'elasticity' })", timestamp: new Date().toLocaleTimeString() }]);
        await new Promise(resolve => setTimeout(resolve, 800));
        setLogs(prev => [...prev, { type: 'action', text: "Materials Project MCP bağlandı. 7075-T6 verileri çekiliyor...", timestamp: new Date().toLocaleTimeString() }]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLogs(prev => [...prev, { type: 'action', text: "Analiz Tamamlandı: Akma mukavemeti beklenti dahilinde (503 MPa).", timestamp: new Date().toLocaleTimeString() }]);
      } else if (action.includes('hesapla') || action.includes('calculate')) {
        setLogs(prev => [...prev, { type: 'mcp', text: "Tool: PhysMCP.solve_physics({ equation: 'EI(d^4y/dx^4) = q(x)', target: 'deflection' })", timestamp: new Date().toLocaleTimeString() }]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLogs(prev => [...prev, { type: 'action', text: "Phys-MCP CAS motoru başlatıldı. Sembolik türev alınıyor...", timestamp: new Date().toLocaleTimeString() }]);
        await new Promise(resolve => setTimeout(resolve, 1200));
        setLogs(prev => [...prev, { type: 'action', text: "Çözüm: EI(d^4y/dx^4) = q(x) -> Kiriş sehim denklemi valide edildi.", timestamp: new Date().toLocaleTimeString() }]);
      } else if (action.includes('vault') || action.includes('depo')) {
        setLogs(prev => [...prev, { type: 'mcp', text: "Tool: GitMCP.git_status({ path: './projects' })", timestamp: new Date().toLocaleTimeString() }]);
        await new Promise(resolve => setTimeout(resolve, 600));
        setLogs(prev => [...prev, { type: 'action', text: "Git MCP: Yerel değişiklikler taranıyor...", timestamp: new Date().toLocaleTimeString() }]);
        await new Promise(resolve => setTimeout(resolve, 800));
        setLogs(prev => [...prev, { type: 'action', text: "Durum: 3 dosya commit edilmeye hazır. Branch: main", timestamp: new Date().toLocaleTimeString() }]);
      } else {
        setLogs(prev => [...prev, { type: 'action', text: `Ottonom İşlem Başlatıldı: ${action}`, timestamp: new Date().toLocaleTimeString() }]);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLogs(prev => [...prev, { type: 'action', text: "İşlem başarıyla simüle edildi.", timestamp: new Date().toLocaleTimeString() }]);
      }
    } else if (trimmed.startsWith('/')) {
      const systemCmd = trimmed.substring(1).trim().toLowerCase();
      if (systemCmd === 'status' || systemCmd === 'durum') {
        setLogs(prev => [...prev, 
            { type: 'system', text: "--- SİSTEM DURUMU ---", timestamp: new Date().toLocaleTimeString() },
            { type: 'system', text: "Kernel: ALU-OS v2.4.0 (Stable)", timestamp: new Date().toLocaleTimeString() },
            { type: 'system', text: "MCP Bağlantıları: 5 Faal (Materials, Phys, Figma, Git, FS)", timestamp: new Date().toLocaleTimeString() },
            { type: 'system', text: "Uptime: 14:22:05", timestamp: new Date().toLocaleTimeString() }
        ]);
      } else {
        setLogs(prev => [...prev, { type: 'system', text: `Sistem Komutu: ${systemCmd} yürütülüyor...`, timestamp: new Date().toLocaleTimeString() }]);
      }
    } else {
      setLogs(prev => [...prev, { type: 'system', text: `Hata: Bilinmeyen operatör. Eylem için '//', sistem için '/' kullanın.`, timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await parseCommand(input);
    setInput('');
  };

  return (
    <div className={cn(
      "w-full h-full bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-[0_0_30px_rgba(0,229,255,0.1)] flex flex-col font-mono overflow-hidden relative",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-500/10 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <TerminalIcon size={12} className="text-cyan-400" />
          <span className="text-[10px] font-bold text-cyan-300 tracking-tighter uppercase italic">Engineering Action Terminal</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/20"></div>
        </div>
      </div>

      {/* Log Area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-1.5 scrollbar-hide"
      >
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "text-[10px] leading-tight flex gap-2",
                log.type === 'cmd' ? "text-cyan-100" : 
                log.type === 'action' ? "text-orange-400 font-black" :
                log.type === 'mcp' ? "text-purple-400 font-mono text-[9px] border-l border-purple-500/30 pl-2" :
                log.type === 'resp' ? "text-cyan-400" : "text-cyan-600/60 italic"
              )}
            >
              <span className="opacity-30">[{log.timestamp}]</span>
              <span className="flex-1 break-all">
                {log.type === 'cmd' && <span className="mr-1 text-cyan-500 font-bold">»</span>}
                {log.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleCommand}
        className="px-3 py-2 bg-black/40 border-t border-cyan-500/10 flex items-center gap-2"
      >
        <ChevronRight size={14} className="text-cyan-500 animate-pulse" />
        <input 
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Eylem yazın (// hareket, / kaz)..."
          className="bg-transparent border-none outline-none text-[10px] text-cyan-50 w-full placeholder:text-cyan-900/50"
        />
        <div className="flex gap-2 text-cyan-900">
           <Hammer size={12} className="hover:text-cyan-400 cursor-pointer transition-colors" />
           <Cpu size={12} className="hover:text-cyan-400 cursor-pointer transition-colors" />
           <Activity size={12} className="hover:text-cyan-400 cursor-pointer transition-colors" />
        </div>
      </form>

      {/* Grid Overlay for aesthetic */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(0,229,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
    </div>
  );
}
