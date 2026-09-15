import React, { useState } from 'react';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';
import { 
  Zap, 
  Cpu, 
  X, 
  Activity, 
  Flame, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const WasmBenchmarkModal: React.FC = () => {
  const {
    isBenchmarkModalOpen,
    toggleBenchmarkModal,
    engineMode,
    setEngineMode,
    isWasmReady,
    computeDurationMs,
    benchmarkData,
    isBenchmarking,
    runEngineBenchmark
  } = usePlaygroundStore();

  const [testIterations, setTestIterations] = useState<number>(50000);

  if (!isBenchmarkModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#141822] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#141822] to-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5 fill-emerald-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">WebAssembly Engine & Benchmarking</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  WASM v1.0
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                High-performance Kendall M/M/c/K queueing solver running in background Web Worker
              </p>
            </div>
          </div>
          <button
            onClick={toggleBenchmarkModal}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-sm">
          
          {/* Active Engine Toggle */}
          <div className="bg-[#0e1118] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Active Simulation Engine</span>
                <p className="text-xs text-neutral-500">Select which engine powers the real-time simulation loop</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Tick: <strong className="text-emerald-400 font-bold">{computeDurationMs.toFixed(3)}ms</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* WASM Card */}
              <button
                onClick={() => setEngineMode('wasm')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  engineMode === 'wasm'
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'bg-[#181d2a]/60 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${engineMode === 'wasm' ? 'text-emerald-400' : 'text-neutral-400'}`} />
                    <span className="font-bold text-neutral-200">WebAssembly (WASM)</span>
                  </div>
                  {isWasmReady && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Compiled bytecode running at near-native C/WASM speeds with zero garbage-collection jitter.
                </p>
              </button>

              {/* JS Card */}
              <button
                onClick={() => setEngineMode('js')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  engineMode === 'js'
                    ? 'bg-blue-950/30 border-blue-500/50 shadow-lg shadow-blue-950/40 ring-1 ring-blue-500/30'
                    : 'bg-[#181d2a]/60 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className={`w-4 h-4 ${engineMode === 'js' ? 'text-blue-400' : 'text-neutral-400'}`} />
                    <span className="font-bold text-neutral-200">JavaScript (V8 Engine)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                    Baseline
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Standard JIT-compiled TypeScript solver executing in the Web Worker thread.
                </p>
              </button>
            </div>
          </div>

          {/* Stress Benchmark Section */}
          <div className="bg-[#0e1118] border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-200 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  M/M/c/K Queue Compute Benchmark
                </h3>
                <p className="text-xs text-neutral-400">
                  Runs identical multi-server Kendall queue calculations across both engines to measure operations per second.
                </p>
              </div>

              {/* Iteration Selector */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
                {[25000, 50000, 100000].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTestIterations(count)}
                    className={`px-2.5 py-1 rounded transition-colors font-mono ${
                      testIterations === count 
                        ? 'bg-emerald-500 text-black font-bold shadow' 
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {(count / 1000)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={() => runEngineBenchmark(testIterations)}
              disabled={isBenchmarking}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isBenchmarking
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/50'
              }`}
            >
              {isBenchmarking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
                  Running {testIterations.toLocaleString()} iterations...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run Head-to-Head Benchmark ({testIterations.toLocaleString()} Iterations)
                </>
              )}
            </button>

            {/* Benchmark Results */}
            {benchmarkData && (
              <div className="pt-3 border-t border-white/10 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-400">Benchmark Results</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 fill-emerald-400" />
                    WASM is {benchmarkData.speedupFactor}x Faster
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* WASM Result Card */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> WebAssembly
                      </span>
                      <span className="text-xs font-mono text-neutral-400">{benchmarkData.wasmDurationMs} ms</span>
                    </div>
                    <div className="text-xl font-mono font-bold text-white">
                      {benchmarkData.wasmOpsPerSec.toLocaleString()}
                      <span className="text-[10px] text-neutral-400 ml-1 font-normal">ops/sec</span>
                    </div>
                  </div>

                  {/* JS Result Card */}
                  <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" /> JavaScript V8
                      </span>
                      <span className="text-xs font-mono text-neutral-400">{benchmarkData.jsDurationMs} ms</span>
                    </div>
                    <div className="text-xl font-mono font-bold text-white">
                      {benchmarkData.jsOpsPerSec.toLocaleString()}
                      <span className="text-[10px] text-neutral-400 ml-1 font-normal">ops/sec</span>
                    </div>
                  </div>
                </div>

                {/* Relative Performance Visual Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Relative Compute Throughput</span>
                    <span>{benchmarkData.speedupFactor}x Speedup Ratio</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.round((benchmarkData.wasmOpsPerSec / (benchmarkData.wasmOpsPerSec + benchmarkData.jsOpsPerSec)) * 100))}%` 
                      }}
                    />
                    <div 
                      className="bg-blue-500/60 h-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(0, Math.round((benchmarkData.jsOpsPerSec / (benchmarkData.wasmOpsPerSec + benchmarkData.jsOpsPerSec)) * 100))}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span className="text-emerald-400">■ WebAssembly</span>
                    <span className="text-blue-400">■ JavaScript V8</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Architecture Details Banner */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-400 leading-relaxed">
              <strong className="text-neutral-200">Zero-Breakage Graceful Fallback:</strong> If WebAssembly is ever disabled or unsupported in an edge environment, the background worker automatically delegates traffic modeling to the TypeScript solver with zero frame drops.
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#11141c] flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Engine active: <strong className="text-neutral-300 uppercase">{engineMode}</strong>
          </span>
          <button
            onClick={toggleBenchmarkModal}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-100 text-xs font-semibold transition-colors"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
};
