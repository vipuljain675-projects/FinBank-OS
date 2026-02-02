'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCurrency } from '@/context/CurrencyContext'; // 1. Import Hook

// Default data in case nothing is passed
const defaultData = [
  { name: 'Bills', value: 1400, color: '#8b5cf6' },
  { name: 'Food', value: 150, color: '#3b82f6' },
  { name: 'Shopping', value: 120, color: '#10b981' },
  { name: 'Transport', value: 45, color: '#f59e0b' },
];

// 2. Update Tooltip to accept a 'format' function prop
const CustomTooltip = ({ active, payload, format }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1f2937', padding: '10px', border: '1px solid #374151', borderRadius: '8px' }}>
        <p style={{ color: 'white' }}>
          {/* 3. Use the dynamic formatter here */}
          {`${payload[0].name} : ${format(payload[0].value)}`}
        </p>
      </div>
    );
  }
  return null;
};

// 4. Accept 'data' prop so the Dashboard can pass real values
export default function SpendingPie({ data = defaultData }: { data?: any[] }) {
  const { format } = useCurrency(); // 5. Get the formatter

  // Ensure data has colors (assign fallback colors if missing)
  const safeData = data.map((item, index) => ({
    ...item,
    color: item.color || ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ef4444'][index % 5]
  }));

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={safeData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value" // Make sure your data uses 'value' or 'amount'
          >
            {safeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          {/* 6. Pass the format function to the tooltip */}
          <Tooltip content={<CustomTooltip format={format} />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4" style={{ flexWrap: 'wrap' }}>
        {safeData.map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}