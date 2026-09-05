import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface IssueDistributionChartProps {
  data?: Array<{ name: string; value: number; amount: number; color: string }>;
  className?: string;
}

export const IssueDistributionChart: React.FC<IssueDistributionChartProps> = ({
  data = [],
  className,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-white/[0.08] bg-[#12161F] text-xs text-slate-400">
        Ready for issue distribution analysis
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-md border border-white/[0.08] bg-[#171B26] p-3 shadow-md">
          <p className="text-xs font-semibold text-slate-200">{item.name}</p>
          <p className="mt-1 text-xs text-[#8eb5fd] font-medium font-mono">
            Share: {item.value}% (₹{item.amount.toLocaleString('en-IN')})
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
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#12161F" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => <span className="text-slate-300">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
