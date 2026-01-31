// src/components/charts/SpendingPie.tsx
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Bills', value: 1400, color: '#8b5cf6' }, // Purple
  { name: 'Food', value: 150, color: '#3b82f6' },  // Blue
  { name: 'Shopping', value: 120, color: '#10b981' }, // Green
  { name: 'Transport', value: 45, color: '#f59e0b' }, // Yellow
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1f2937', padding: '10px', border: '1px solid #374151', borderRadius: '8px' }}>
        <p style={{ color: 'white' }}>{`${payload[0].name} : $${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function SpendingPie() {
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend below the chart */}
      <div className="flex justify-center gap-4 mt-4" style={{ flexWrap: 'wrap' }}>
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}