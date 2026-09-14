import React from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';
import { auditArchitecture } from '../../simulation/architectureLinter';

export const HealthAuditModal: React.FC = () => {
  const { isAuditModalOpen, toggleAuditModal, nodes, edges, updateNodeData, setSelectedNodeId } = usePlaygroundStore();

  if (!isAuditModalOpen) return null;

  const result = auditArchitecture(nodes, edges);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
      case 'B': return 'text-blue-400 border-blue-500/50 bg-blue-950/40';
      case 'C': return 'text-amber-400 border-amber-500/50 bg-amber-950/40';
      default: return 'text-red-400 border-red-500/50 bg-red-950/40';
    }
  };

  const handleFixSpof = (affectedNodeId?: string) => {
    if (!affectedNodeId) return;
    updateNodeData(affectedNodeId, { instanceCount: 2 });
    setSelectedNodeId(affectedNodeId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#161922] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#11141c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">System Architecture Health Audit</h2>
              <p className="text-xs text-neutral-400">Deterministic Single-Point-of-Failure & Resilience Linter</p>
            </div>
          </div>
          <button
            onClick={toggleAuditModal}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Top Score Banner */}
          <div className="bg-[#0e1117] p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-bold shadow-lg ${getGradeColor(result.grade)}`}>
                <span className="text-2xl leading-none">{result.grade}</span>
                <span className="text-[9px] font-mono uppercase mt-0.5">Rating</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Architecture Resilience Score: </span>
                  <span className="text-emerald-400 font-mono text-base">{result.score}/100</span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {result.issues.length === 0
                    ? 'Outstanding! Your distributed system adheres to all high-availability design contracts.'
                    : `Found ${result.issues.filter(i => i.severity === 'critical').length} critical risk(s) and ${result.issues.filter(i => i.severity === 'warning').length} warning(s).`}
                </p>
              </div>
            </div>
          </div>

          {/* Issues Section */}
          {result.issues.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Vulnerabilities & Architectural Gaps
              </h3>
              <div className="space-y-2.5">
                {result.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-xl border flex flex-col gap-2 ${
                      issue.severity === 'critical'
                        ? 'bg-red-950/20 border-red-500/30'
                        : issue.severity === 'warning'
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-blue-950/20 border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {issue.severity === 'critical' ? (
                          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                        ) : issue.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-neutral-100">{issue.title}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                        issue.severity === 'critical' ? 'bg-red-900/60 text-red-300' : 'bg-amber-900/60 text-amber-300'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-300 pl-6 leading-relaxed">
                      {issue.description}
                    </p>

                    <div className="pl-6 flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-neutral-400">
                        <strong className="text-neutral-200">Fix: </strong>{issue.remediation}
                      </span>
                      {issue.affectedNodeId && (
                        <button
                          onClick={() => handleFixSpof(issue.affectedNodeId)}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-200 text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1"
                        >
                          <span>Auto-Scale 2x</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passed Best Practice Rules */}
          {result.passedRules.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Passed Best Practices
              </h3>
              <div className="bg-[#0e1117] rounded-xl p-3 border border-white/5 space-y-2">
                {result.passedRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#11141c] flex items-center justify-end">
          <button
            onClick={toggleAuditModal}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-100 text-xs font-semibold transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
