import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../lib/utils';

interface RecoveryTrendChartProps {
  data?: Array<{ month: string; atRisk: number; recovered: number; rate: number }>;
  className?: string;
}

export const RecoveryTrendChart: React.FC<RecoveryTrendChartProps> = ({
  data = [],
  className,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-white/[0.08] bg-[#12161F] text-xs text-slate-400">
        Ready for live trend telemetry
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md border border-white/[0.08] bg-[#171B26] p-3 shadow-md">
          <p className="mb-2 text-xs font-semibold text-slate-200">{label} 2026</p>
          <p className="text-xs text-[#8eb5fd]">
            Recovered: <span className="font-semibold font-mono">{formatCurrency(payload[0]?.value)}</span>
          </p>
          <p className="text-xs text-rose-400">
            Revenue at Risk: <span className="font-semibold font-mono">{formatCurrency(payload[1]?.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3568F0" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3568F0" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2438" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => `₹${val / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
              formatter={(value) => <span className="text-slate-300">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="recovered"
              name="Recovered Revenue"
              stroke="#3568F0"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRecovered)"
            />
            <Area
              type="monotone"
              dataKey="atRisk"
              name="Revenue at Risk"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#colorAtRisk)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
