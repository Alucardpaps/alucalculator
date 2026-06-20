'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runGlobalDecisionFusionEngine } from '@/lib/engineering/globalDecisionFusionEngine';
import { runSovereignDecisionEngine } from '@/lib/engineering/sovereignDecisionEngine';
import { runConstraintSovereigntySystem } from '@/lib/engineering/constraintSovereigntySystem';
import { compileDefaultConstraints } from '@/lib/engineering/constraintCompiler';
import { runExecutionKernel } from '@/lib/engineering/executionKernel';
import { runMultiObjectiveSystem } from '@/lib/engineering/multiObjectiveSystem';

const IntelligenceDashboard = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [systemState, setSystemState] = useState<any>({
    weights: {
      reward: 0.3,
      objective: 0.25,
      conflict: 0.2,
      stability: 0.15,
      recursion: 0.1,
      volatility: 0.05
    },
    memory: { history: [], adaptationRate: 0.1 }
  });

  const [lastDecision, setLastDecision] = useState<any>(null);
  const [constraints, setConstraints] = useState<any>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLogs(prev => [{ id, msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

  const triggerCycle = async () => {
    setIsSimulating(true);
    addLog('Initiating Autonomy Cycle...', 'info');

    // 1. Signal Generation (Simulated Input)
    const signal = {
      rewardSignal: Math.random(),
      objectiveScore: Math.random(),
      conflictPenalty: Math.random() * 0.3,
      metaStability: 0.8 + Math.random() * 0.2,
      recursionDepth: Math.floor(Math.random() * 5)
    };
    addLog(`Signals Captured: R:${signal.rewardSignal.toFixed(2)} O:${signal.objectiveScore.toFixed(2)} C:${signal.conflictPenalty.toFixed(2)}`, 'info');

    // 2. Decision Fusion & Weight Evolution
    const { decision, state: newState } = runSovereignDecisionEngine(signal, systemState);
    setSystemState(newState);
    setLastDecision(decision);
    addLog(`Decision Nucleus: ${decision.selectedAction} (Score: ${decision.score.toFixed(2)}, Conf: ${decision.confidence.toFixed(2)})`, 'success');

    // 3. Constraint Verification
    const kernel = { constraints: compileDefaultConstraints(), violationLog: [] };
    const simulatedState = { force: 100, area: 10, mass: 5, stability: decision.confidence, recursionDepth: signal.recursionDepth };
    const constraintResult = runConstraintSovereigntySystem(simulatedState, kernel);
    setConstraints(constraintResult);
    
    if (!constraintResult.valid) {
      addLog(`REALITY VIOLATION: ${constraintResult.kernel.violationLog[0]?.constraintId}`, 'error');
    } else {
      addLog('Reality Invariants: VERIFIED', 'success');
    }

    // 4. Execution
    const execution = runExecutionKernel(decision, kernel);
    if (execution.execution.success) {
      addLog(`Execution Successful: ${JSON.stringify(execution.execution.output)}`, 'success');
    } else {
      addLog(`Execution Blocked: ${execution.execution.reason}`, 'warning');
    }

    setIsSimulating(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AluCalc Autonomous Core
            </h1>
            <p className="text-white/40 mt-1 font-medium tracking-wide">PHASE 5.4 | SELF-CONSTRUCTING ENGINEERING INTELLIGENCE</p>
          </div>
          <button 
            onClick={triggerCycle}
            disabled={isSimulating}
            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all rounded-sm font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:scale-100"
          >
            {isSimulating ? 'Processing...' : 'Trigger Autonomy Cycle'}
          </button>
        </header>

        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column: Metrics */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            
            {/* System Weights */}
            <div className="bg-white/[0.03] border border-white/10 p-6 backdrop-blur-md rounded-lg">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-6">Decision Weight Matrix (Evolving)</h3>
              <div className="space-y-4">
                {Object.entries(systemState.weights).map(([key, val]: [any, any]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="capitalize text-white/60">{key}</span>
                      <span>{(val * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${val * 100}%` }}
                        className="h-full bg-cyan-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Decision */}
            <div className="bg-white/[0.03] border border-white/10 p-6 backdrop-blur-md rounded-lg">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-6">Last Decision Output</h3>
              {lastDecision ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${lastDecision.selectedAction === 'EXECUTE' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-2xl font-bold tracking-tight">{lastDecision.selectedAction}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-tighter">Certainty Score</p>
                      <p className="text-xl font-medium">{(lastDecision.score * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-tighter">Confidence Index</p>
                      <p className="text-xl font-medium">{(lastDecision.confidence * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-white/20 italic text-sm">Waiting for system signal...</p>
              )}
            </div>
          </div>

          {/* Right Column: Execution Logs */}
          <div className="col-span-12 lg:col-span-7 bg-[#050507] border border-white/10 rounded-lg overflow-hidden flex flex-col h-[600px]">
            <div className="bg-white/[0.05] p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Autonomous Trace Engine</h3>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/40">LIVE_STREAM</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-sm">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 group"
                  >
                    <span className="text-white/20 shrink-0 select-none">[{log.time}]</span>
                    <span className={`
                      ${log.type === 'success' ? 'text-green-400' : ''}
                      ${log.type === 'warning' ? 'text-yellow-400' : ''}
                      ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
                      ${log.type === 'info' ? 'text-cyan-400/80' : ''}
                    `}>
                      <span className="mr-2 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                      {log.msg}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-white/10">
                  <p className="text-center">System idle.<br/>Awaiting cognitive trigger.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Stats */}
        <footer className="grid grid-cols-4 gap-8 pt-8 border-t border-white/10">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Reality Anchor</p>
            <p className={`font-medium ${constraints?.valid ? 'text-green-400' : 'text-red-400'}`}>
              {constraints ? (constraints.valid ? 'LOCKED & VALID' : 'VIOLATION DETECTED') : 'STABLE'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Governance Mode</p>
            <p className="font-medium text-white/80">REWARD_STABILIZATION_ACTIVE</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Conflict Engine</p>
            <p className="font-medium text-white/80">MULTI_OBJECTIVE_ARBITRATION</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Uptime Depth</p>
            <p className="font-medium text-white/80 tracking-tighter">4.209.112 OPS/S</p>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default IntelligenceDashboard;
