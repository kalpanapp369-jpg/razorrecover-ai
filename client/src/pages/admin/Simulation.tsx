import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import {
  Play,
  CheckCircle,
  Sliders,
  TrendingUp,
} from 'lucide-react';

interface SimulationRun {
  id: string;
  name: string;
  scenario_type: string;
  total_cases: number;
  total_risk_amount: number;
  simulated_recovery_rate: number;
  simulated_recovered_amount: number;
  status: string;
  created_at: string;
}

export const Simulation: React.FC = () => {
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('Q4 Revenue Recovery Stress Test');
  const [scenarioType, setScenarioType] = useState('HISTORICAL_PLAYBACK');
  const [sampleSize, setSampleSize] = useState(250);
  const [discountPct, setDiscountPct] = useState(5);

  const loadRuns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getSimulationRuns();
      if (res.success) {
        setRuns(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load simulations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setError(null);
    try {
      const res = await api.runSimulation({
        name,
        scenario_type: scenarioType,
        sample_size: sampleSize,
        discount_strategy_pct: discountPct,
      });

      if (res.success) {
        await loadRuns();
      }
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const columns: Column<SimulationRun>[] = [
    {
      key: 'name',
      header: 'Simulation Scenario',
      render: (item) => (
        <div>
          <div className="font-bold text-[#0C2651]">{item.name}</div>
          <div className="font-mono text-[10px] text-slate-500">{formatDateTime(item.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'scenario_type',
      header: 'Archetype',
      render: (item) => (
        <span className="rounded-[4px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-700 font-mono font-semibold">
          {item.scenario_type}
        </span>
      ),
    },
    {
      key: 'total_cases',
      header: 'Volume',
      render: (item) => <span className="font-mono text-slate-700 font-bold">{item.total_cases} cases</span>,
    },
    {
      key: 'total_risk_amount',
      header: 'Simulated Risk',
      render: (item) => (
        <span className="font-mono font-bold text-slate-900">{formatCurrency(item.total_risk_amount)}</span>
      ),
    },
    {
      key: 'simulated_recovery_rate',
      header: 'Projected Yield',
      render: (item) => (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-[#0D94FB]">
          <TrendingUp className="h-3 w-3" />
          <span>{item.simulated_recovery_rate}%</span>
        </span>
      ),
    },
    {
      key: 'simulated_recovered_amount',
      header: 'ARR Saved',
      render: (item) => (
        <span className="font-mono font-bold text-emerald-700">{formatCurrency(item.simulated_recovered_amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          <span>{item.status}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recovery Simulation Engine"
        subtitle="Backtest intelligent recovery policies against synthetic & historical transaction streams"
        badge="Blade What-If Engine"
      />

      {/* Simulator Control Card */}
      <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-blue-50 text-[#0D94FB] border border-blue-200">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0C2651] font-heading">Configure Scenario Playbook</h3>
            <p className="text-xs text-slate-500">Tweak recovery discount incentives and failure cohort sizes</p>
          </div>
        </div>

        <form onSubmit={handleRunSimulation} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Scenario Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Scenario Archetype</label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="mt-1.5 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
            >
              <option value="HISTORICAL_PLAYBACK">Historical Playback</option>
              <option value="STRESS_TEST">High-Volume Stress Test</option>
              <option value="HIGH_CHURN_SURGE">High Churn Surge</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Sample Cohort Size</label>
            <input
              type="number"
              min="10"
              max="2000"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="mt-1.5 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Settlement Discount (%)</label>
            <input
              type="number"
              min="0"
              max="25"
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value))}
              className="mt-1.5 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSimulating}
              className="inline-flex items-center gap-2 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isSimulating ? 'Backtesting Scenario...' : 'Execute Policy Simulation'}</span>
            </button>
          </div>
        </form>
      </div>

      {error && <ErrorState message={error} onRetry={loadRuns} />}

      {/* Historical Simulation Runs Table */}
      <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm">
        <h3 className="text-sm font-bold text-[#0C2651] font-heading mb-4">Historical Simulation Runs</h3>
        <DataTable
          columns={columns}
          data={runs}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
