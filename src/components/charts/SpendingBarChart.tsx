'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { useCurrency } from '@/context/CurrencyContext';

const CustomTooltip = ({ active, payload, format }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: '#1f2937', 
        padding: '12px 16px', 
        border: '1px solid #374151', 
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
      }}>
        <p style={{ color: 'white', fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
          {payload[0].payload.name}
        </p>
        <p style={{ color: payload[0].fill, fontWeight: '700', fontSize: '16px' }}>
          {format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function SpendingBarChart({ data = [] }: { data?: any[] }) {
  const { format } = useCurrency();

  // Ensure we have colors
  const safeData = data.map((item, index) => ({
    ...item,
    name: item.name || item.label,
    value: Math.abs(item.value), // Ensure positive values for display
    color: item.color || ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ef4444', '#ec4899'][index % 6]
  }));

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center text-gray-500">
        <div>
          <p className="mb-2">No spending data yet.</p>
          <p className="text-xs opacity-50">Add expenses to see the chart.</p>
        </div>
      </div>
    );
  }

  // Calculate max value for Y-axis scale
  const maxValue = Math.max(...safeData.map(item => item.value));
  const yAxisMax = Math.ceil(maxValue * 1.1 / 100) * 100; // Round up to nearest 100

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={safeData}
          margin={{ top: 20, right: 10, left: 0, bottom: 40 }}
        >
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, yAxisMax]}
            tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
          />
          <Tooltip 
            content={<CustomTooltip format={format} />}
            cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }}
          />
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          >
            {safeData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                opacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center gap-3 mt-4 flex-wrap px-2">
        {safeData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: item.color 
              }}
            />
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}