import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import './FrequencyBar.css';

const COLORS = {
  hot: '#ef4444',
  warm: '#f97316',
  cold: '#3b82f6',
  normal: '#8b5cf6',
};

function getColor(value, min, max) {
  const mid = (min + max) / 2;
  const q3 = (mid + max) / 2;
  if (value >= q3) return COLORS.hot;
  if (value >= mid) return COLORS.warm;
  if (value <= (min + mid) / 2) return COLORS.cold;
  return COLORS.normal;
}

export default function FrequencyBar({ data, label, xKey = 'number', color }) {
  const counts = data.map((d) => d.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  return (
    <div className="chart-card">
      <h2>{label}</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1e1e2e', border: '1px solid #3b3b52', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
            itemStyle={{ color: '#a78bfa' }}
            formatter={(v) => [`${v} fois`, 'Tiré']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={color || getColor(entry.count, min, max)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="legend">
        <span className="legend-hot">● Très fréquent</span>
        <span className="legend-warm">● Fréquent</span>
        <span className="legend-normal">● Normal</span>
        <span className="legend-cold">● Rare</span>
      </div>
    </div>
  );
}
