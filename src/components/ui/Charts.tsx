import React from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps {
  data: any[];
  height?: number;
}

export function RevenueAreaChart({ data, height = 280 }: ChartProps) {
  return (
    <div style={{ width: '100%', height }} className="no-scrollbar">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
          />
          <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentMethodPieChart({ data, height = 280 }: ChartProps) {
  // Vibrant theme colors
  const COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa'];
  
  return (
    <div style={{ width: '100%', height }} className="no-scrollbar">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
