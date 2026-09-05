import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface RecoveryFunnelChartProps {
  data?: Array<{ stage: string; count: number; dropPct: number }>;
  className?: string;
}

export const RecoveryFunnelChart: React.FC<RecoveryFunnelChartProps> = ({
  data = [],
  className,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-white/[0.08] bg-[#12161F] text-xs text-slate-400">
        Ready for funnel telemetry
      </div>
    );
  }

  const colors = ['#3568F0', '#598ef8', '#8eb5fd', '#f59e0b', '#10b981'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-md border border-white/[0.08] bg-[#171B26] p-3 shadow-md">
          <p className="text-xs font-semibold text-slate-200">{item.stage}</p>
          <p className="mt-1 text-xs text-[#8eb5fd] font-medium font-mono">
            Active Cases: {item.count}
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
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
          >
            <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="stage"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
