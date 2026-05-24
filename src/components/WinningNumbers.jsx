import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import './FrequencyBar.css';

const GOLD = '#f59e0b';
const SILVER = '#94a3b8';

function getColor(value, min, max, isStars) {
  const mid = (min + max) / 2;
  const q3 = (mid + max) / 2;
  if (isStars) {
    if (value >= q3) return '#f59e0b';
    if (value >= mid) return '#fbbf24';
    if (value <= (min + mid) / 2) return '#78716c';
    return '#a78bfa';
  }
  if (value >= q3) return '#ef4444';
  if (value >= mid) return '#f97316';
  if (value <= (min + mid) / 2) return '#3b82f6';
  return '#8b5cf6';
}

function RankedBalls({ data, isStars, label }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const max = sorted[0]?.count || 1;

  return (
    <div className="chart-card">
      <h3 style={{ marginBottom: '1rem', color: isStars ? GOLD : '#e2e8f0' }}>{label}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
        {sorted.map((item, rank) => {
          const pct = (item.count / max) * 100;
          const bg = isStars
            ? `hsl(${38 + (rank / sorted.length) * -20}, ${90 - rank * 1.5}%, ${55 - rank * 0.6}%)`
            : `hsl(${240 - (rank / sorted.length) * 200}, 70%, ${55 - rank * 0.4}%)`;
          return (
            <div
              key={item.number}
              title={`Numéro ${item.number} — ${item.count} jackpot${item.count > 1 ? 's' : ''}`}
              style={{
                width: 44,
                height: 44,
                borderRadius: isStars ? '50%' : 8,
                background: bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 15,
                color: '#fff',
                opacity: 0.4 + (pct / 100) * 0.6,
                border: rank === 0 ? `2px solid ${isStars ? GOLD : '#ef4444'}` : '2px solid transparent',
                cursor: 'default',
              }}
            >
              {item.number}
              <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.8)' }}>
                ×{item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WinningBar({ data, label, isStars }) {
  const counts = data.map((d) => d.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  return (
    <div className="chart-card">
      <h2>{label}</h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis dataKey="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#1e1e2e', border: '1px solid #3b3b52', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
            itemStyle={{ color: isStars ? GOLD : '#a78bfa' }}
            formatter={(v) => [`${v} jackpot${v > 1 ? 's' : ''}`, 'Apparu dans']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.count, min, max, isStars)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function WinningNumbers({ numberFreq, starFreq, totalWinning }) {
  return (
    <div>
      <div className="chart-card" style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <p style={{ color: '#9ca3af', margin: 0 }}>
          Analyse basée sur{' '}
          <strong style={{ color: '#f59e0b' }}>{totalWinning}</strong>{' '}
          tirages avec au moins un gagnant au jackpot (rang 1).
        </p>
      </div>

      <RankedBalls data={numberFreq} isStars={false} label="Numéros — classement par apparitions en tirages gagnants" />
      <WinningBar data={numberFreq} label="Fréquence des numéros dans les tirages gagnants (1–50)" isStars={false} />

      <RankedBalls data={starFreq} isStars label="Étoiles — classement par apparitions en tirages gagnants" />
      <WinningBar data={starFreq} label="Fréquence des étoiles dans les tirages gagnants (1–12)" isStars />
    </div>
  );
}
