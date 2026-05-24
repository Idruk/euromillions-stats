import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function PairChart({ data }) {
  return (
    <div className="chart-card">
      <h2>Top 20 paires de numéros les plus tirées ensemble</h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="pair"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            width={48}
          />
          <Tooltip
            contentStyle={{ background: '#1e1e2e', border: '1px solid #3b3b52', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(v) => [`${v} fois`, 'Apparus ensemble']}
          />
          <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
