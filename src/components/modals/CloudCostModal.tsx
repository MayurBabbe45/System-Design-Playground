import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Download, 
  TrendingDown, 
  Layers, 
  Cpu, 
  Database, 
  Network, 
  HardDrive,
  Check
} from 'lucide-react';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';

export const CloudCostModal: React.FC = () => {
  const { isCostModalOpen, toggleCostModal, nodes } = usePlaygroundStore();
  const [provider, setProvider] = useState<'AWS' | 'GCP'>('AWS');
  const [useReservedInstances, setUseReservedInstances] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isCostModalOpen) return null;

  // Breakdown items based on canvas nodes
  const items = nodes.map((n) => {
    const instances = Math.max(1, n.data.instanceCount || 1);
    const hourlyRate = (n.data.costPerHour || 0) * (provider === 'GCP' ? 0.92 : 1.0);
    const baseMonthly = hourlyRate * 730 * instances;
    const effectiveMonthly = useReservedInstances ? baseMonthly * 0.65 : baseMonthly;

    let tier = 't4g.xlarge (4 vCPU, 16GB)';
    if (n.data.typeId === 'relational_db') tier = 'db.r6g.xlarge (4 vCPU, 32GB)';
    if (n.data.typeId === 'cache') tier = 'cache.r6g.large (2 vCPU, 13GB)';
    if (n.data.typeId === 'load_balancer') tier = 'Application Load Balancer (ALB + LCU)';
    if (n.data.typeId === 'message_queue') tier = 'Kafka Broker (kafka.m5.large)';
    if (n.data.typeId === 'cdn') tier = 'CloudFront Edge Distribution';

    if (provider === 'GCP') {
      if (n.data.typeId === 'web_server') tier = 'e2-standard-4 (4 vCPU, 16GB)';
      if (n.data.typeId === 'relational_db') tier = 'Cloud SQL PostgreSQL (4 vCPU, 32GB)';
      if (n.data.typeId === 'cache') tier = 'Memorystore for Redis (13GB)';
      if (n.data.typeId === 'load_balancer') tier = 'Cloud Load Balancing (Global)';
    }

    return {
      id: n.id,
      label: n.data.label,
      category: n.data.category,
      instances,
      tier,
      hourlyRate: Number(hourlyRate.toFixed(3)),
      monthlyTotal: Math.round(effectiveMonthly),
    };
  });

  const grandTotal = items.reduce((sum, it) => sum + it.monthlyTotal, 0);

  // Group by category
  const computeTotal = items.filter((i) => i.category === 'COMPUTE').reduce((s, i) => s + i.monthlyTotal, 0);
  const storageTotal = items.filter((i) => i.category === 'STORAGE').reduce((s, i) => s + i.monthlyTotal, 0);
  const networkTotal = items.filter((i) => i.category === 'NETWORK' || i.category === 'CLIENT').reduce((s, i) => s + i.monthlyTotal, 0);
  const messagingTotal = items.filter((i) => i.category === 'MESSAGING').reduce((s, i) => s + i.monthlyTotal, 0);

  const handleExportCsv = () => {
    const headers = 'Component,Category,Instances,Tier,Hourly Cost ($),Monthly Cost ($)\n';
    const rows = items.map((i) => `"${i.label}","${i.category}",${i.instances},"${i.tier}",${i.hourlyRate},${i.monthlyTotal}`).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cloud_cost_estimate_${provider.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#161922] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#11141c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Cloud Infrastructure Cost Estimator</h2>
              <p className="text-xs text-neutral-400">Itemized capacity and hosting projection</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Provider Switcher */}
            <div className="flex bg-[#0e1117] p-1 rounded-lg border border-white/10 text-xs font-semibold">
              <button
                onClick={() => setProvider('AWS')}
                className={`px-3 py-1 rounded-md transition-all ${provider === 'AWS' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm' : 'text-neutral-400 hover:text-white'}`}
              >
                AWS Cloud
              </button>
              <button
                onClick={() => setProvider('GCP')}
                className={`px-3 py-1 rounded-md transition-all ${provider === 'GCP' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm' : 'text-neutral-400 hover:text-white'}`}
              >
                Google Cloud (GCP)
              </button>
            </div>

            <button
              onClick={toggleCostModal}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-[#0e1117] p-3 rounded-xl border border-white/5">
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Compute (EC2)
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">${computeTotal.toLocaleString()}/mo</div>
            </div>

            <div className="bg-[#0e1117] p-3 rounded-xl border border-white/5">
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Storage & Cache
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">${storageTotal.toLocaleString()}/mo</div>
            </div>

            <div className="bg-[#0e1117] p-3 rounded-xl border border-white/5">
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-purple-400" />
                Network & Routing
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">${networkTotal.toLocaleString()}/mo</div>
            </div>

            <div className="bg-[#0e1117] p-3 rounded-xl border border-white/5">
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pink-400" />
                Messaging
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">${messagingTotal.toLocaleString()}/mo</div>
            </div>
          </div>

          {/* Reserved Instance Toggle */}
          <div className="bg-emerald-950/30 border border-emerald-700/50 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-emerald-300">1-Year Reserved Instance (RI) Commitment</div>
                <div className="text-[11px] text-neutral-400">Save up to 35% on compute & database baseline capacity</div>
              </div>
            </div>
            <button
              onClick={() => setUseReservedInstances(!useReservedInstances)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${useReservedInstances ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
            >
              {useReservedInstances ? '35% Discount Applied' : 'Apply RI Discount'}
            </button>
          </div>

          {/* Itemized Table */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1117] text-neutral-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Component</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Instances</th>
                  <th className="p-3">Cloud Tier</th>
                  <th className="p-3 text-right">Rate ($/hr)</th>
                  <th className="p-3 text-right">Est. Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#161922] text-neutral-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-white">{item.label}</td>
                    <td className="p-3 font-mono text-neutral-400">{item.category}</td>
                    <td className="p-3 font-mono font-bold text-blue-400">{item.instances}x</td>
                    <td className="p-3 text-neutral-300">{item.tier}</td>
                    <td className="p-3 text-right font-mono text-neutral-400">${item.hourlyRate}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">${item.monthlyTotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#11141c] flex items-center justify-between">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-200 text-xs font-semibold border border-white/10 transition-colors"
          >
            {downloaded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{downloaded ? 'Downloaded!' : 'Export CSV Bill'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono text-neutral-400">Total Estimated Cost</div>
              <div className="text-lg font-bold font-mono text-emerald-400">${grandTotal.toLocaleString()} / month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
