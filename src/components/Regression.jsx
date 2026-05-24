import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, Cell,
} from 'recharts';
import {
  computeWindowedFreq,
  computeWindowedStarFreq,
  computeRegressionStats,
} from '../utils/parseData';
import './Regression.css';

const WINDOW_OPTIONS = [
  { label: '20 tirages', value: 20 },
  { label: '50 tirages', value: 50 },
  { label: '100 tirages', value: 100 },
  { label: 'Tous', value: Infinity },
];

function slopeColor(slope, maxSlope) {
  const t = slope / maxSlope; // -1 to 1
  if (t > 0.3) return '#ef4444';
  if (t > 0.1) return '#f97316';
  if (t < -0.3) return '#3b82f6';
  if (t < -0.1) return '#60a5fa';
  return '#8b5cf6';
}

function TrendBadge({ slope }) {
  if (slope > 0.05) return <span className="badge badge-up">↑ Hausse</span>;
  if (slope < -0.05) return <span className="badge badge-down">↓ Baisse</span>;
  return <span className="badge badge-flat">→ Stable</span>;
}

function NumberDetail({ stat, windows }) {
  const chartData = stat.series.map((y, i) => ({
    window: `P${i + 1}`,
    freq: parseFloat(y.toFixed(2)),
    trend: parseFloat((stat.intercept + stat.slope * i).toFixed(2)),
  }));
  const next = parseFloat(stat.predicted.toFixed(2));

  return (
    <div className="reg-detail">
      <div className="reg-detail-header">
        <div className={`reg-ball ${stat.slope > 0.05 ? 'reg-ball-hot' : stat.slope < -0.05 ? 'reg-ball-cold' : 'reg-ball-flat'}`}>
          {stat.number}
        </div>
        <div className="reg-detail-info">
          <div className="reg-detail-title">Numéro {stat.number}</div>
          <TrendBadge slope={stat.slope} />
          <div className="reg-detail-stats">
            Pente : <strong>{stat.slope > 0 ? '+' : ''}{stat.slope.toFixed(4)}</strong> %/période ·
            R² : <strong>{stat.r2.toFixed(3)}</strong> ·
            Prédiction prochaine période : <strong className={stat.predicted > stat.series.at(-1) ? 'text-hot' : 'text-cold'}>{next}%</strong>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis dataKey="window" tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" />
          <Tooltip
            contentStyle={{ background: '#1e1e2e', border: '1px solid #3b3b52', borderRadius: 8 }}
            formatter={(v, name) => [`${v}%`, name === 'freq' ? 'Fréquence réelle' : 'Tendance']}
          />
          <Line type="monotone" dataKey="freq" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="freq" />
          <Line type="monotone" dataKey="trend" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="trend" />
          <ReferenceLine y={stat.predicted} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Préd. ${next}%`, fill: '#ef4444', fontSize: 10 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Regression({ draws }) {
  const [windowSize, setWindowSize] = useState(50);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('numbers'); // 'numbers' | 'stars'
  const [topN, setTopN] = useState(10);

  const effectiveWindowSize = windowSize === Infinity ? Math.ceil(draws.length / 20) : windowSize;

  const windows = useMemo(() => computeWindowedFreq(draws, effectiveWindowSize), [draws, effectiveWindowSize]);
  const starWindows = useMemo(() => computeWindowedStarFreq(draws, effectiveWindowSize), [draws, effectiveWindowSize]);

  const numberStats = useMemo(() => computeRegressionStats(windows, 50), [windows]);
  const starStats = useMemo(() => computeRegressionStats(starWindows, 12), [starWindows]);

  const stats = mode === 'numbers' ? numberStats : starStats;
  const maxSlope = Math.max(...stats.map((s) => Math.abs(s.slope)), 0.001);

  const sorted = [...stats].sort((a, b) => b.slope - a.slope);
  const topRising = sorted.slice(0, topN);
  const topFalling = sorted.slice(-topN).reverse();
  const prediction = sorted.slice(0, mode === 'numbers' ? 5 : 2);

  const scatterData = stats.map((s) => ({
    number: s.number,
    slope: parseFloat(s.slope.toFixed(5)),
    r2: parseFloat(s.r2.toFixed(3)),
  }));

  return (
    <div className="chart-card regression">
      <h2>Régression linéaire</h2>
      <p className="reg-disclaimer">
        Pour chaque numéro, on calcule une régression linéaire sur sa fréquence d'apparition par période.
        Une pente positive = tendance à la hausse. La prédiction extrapole la droite à la prochaine période.
      </p>

      {/* Controls */}
      <div className="reg-controls">
        <div className="control-group">
          <label>Mode</label>
          <div className="btn-group">
            <button className={mode === 'numbers' ? 'active' : ''} onClick={() => { setMode('numbers'); setSelected(null); }}>Numéros</button>
            <button className={mode === 'stars' ? 'active' : ''} onClick={() => { setMode('stars'); setSelected(null); }}>Étoiles</button>
          </div>
        </div>
        <div className="control-group">
          <label>Taille de fenêtre</label>
          <div className="btn-group">
            {WINDOW_OPTIONS.map((o) => (
              <button key={o.value} className={windowSize === o.value ? 'active' : ''} onClick={() => setWindowSize(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <label>Top N</label>
          <div className="btn-group">
            {[5, 10, 15].map((n) => (
              <button key={n} className={topN === n ? 'active' : ''} onClick={() => setTopN(n)}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Prediction box */}
      <div className="reg-prediction-box">
        <div className="reg-prediction-label">
          <span className="reg-pred-icon">📈</span>
          Prédiction — {mode === 'numbers' ? '5 numéros' : '2 étoiles'} les plus en hausse
        </div>
        <div className="reg-pred-balls">
          {prediction.map((s) => (
            <button
              key={s.number}
              className={`reg-pred-ball ${selected === s.number ? 'reg-pred-ball-active' : ''}`}
              onClick={() => setSelected(selected === s.number ? null : s.number)}
              title={`Pente: ${s.slope > 0 ? '+' : ''}${s.slope.toFixed(4)}`}
            >
              <span className="reg-pred-num">{s.number}</span>
              <span className="reg-pred-slope">{s.slope > 0 ? '+' : ''}{s.slope.toFixed(3)}</span>
            </button>
          ))}
        </div>
        <p className="reg-pred-hint">Clique sur un numéro pour voir son graphique de tendance</p>
      </div>

      {/* Detail chart for selected number */}
      {selected !== null && (() => {
        const stat = stats.find((s) => s.number === selected);
        return stat ? <NumberDetail stat={stat} windows={windows} /> : null;
      })()}

      {/* Slope ranking charts */}
      <div className="reg-rankings">
        <div className="reg-rank-section">
          <h3 className="text-hot">↑ Top {topN} en hausse</h3>
          <div className="slope-bars">
            {topRising.map((s) => (
              <button key={s.number} className={`slope-row ${selected === s.number ? 'slope-row-active' : ''}`} onClick={() => setSelected(selected === s.number ? null : s.number)}>
                <span className="slope-num">{s.number}</span>
                <div className="slope-bar-wrap">
                  <div className="slope-bar slope-bar-hot" style={{ width: `${Math.min(100, (s.slope / maxSlope) * 100)}%` }} />
                </div>
                <span className="slope-val text-hot">+{s.slope.toFixed(4)}</span>
                <span className="slope-r2">R²={s.r2.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="reg-rank-section">
          <h3 className="text-cold">↓ Top {topN} en baisse</h3>
          <div className="slope-bars">
            {topFalling.map((s) => (
              <button key={s.number} className={`slope-row ${selected === s.number ? 'slope-row-active' : ''}`} onClick={() => setSelected(selected === s.number ? null : s.number)}>
                <span className="slope-num">{s.number}</span>
                <div className="slope-bar-wrap">
                  <div className="slope-bar slope-bar-cold" style={{ width: `${Math.min(100, (Math.abs(s.slope) / maxSlope) * 100)}%` }} />
                </div>
                <span className="slope-val text-cold">{s.slope.toFixed(4)}</span>
                <span className="slope-r2">R²={s.r2.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scatter: slope vs R² */}
      <div className="reg-scatter-section">
        <h3>Pente vs R² — fiabilité de la tendance</h3>
        <p className="reg-disclaimer">Un R² élevé signifie que la droite de régression colle bien aux données.</p>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey="slope" name="Pente" type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} label={{ value: 'Pente', fill: '#64748b', fontSize: 11, position: 'insideBottom', offset: -2 }} />
            <YAxis dataKey="r2" name="R²" type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 1]} label={{ value: 'R²', fill: '#64748b', fontSize: 11, angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{ background: '#1e1e2e', border: '1px solid #3b3b52', borderRadius: 8 }}
              cursor={{ stroke: '#a78bfa', strokeWidth: 1 }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: '#1e1e2e', border: '1px solid #3b3b52', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 700 }}>{mode === 'numbers' ? 'Numéro' : 'Étoile'} {d.number}</div>
                    <div style={{ color: d.slope >= 0 ? '#ef4444' : '#3b82f6' }}>Pente: {d.slope > 0 ? '+' : ''}{d.slope}</div>
                    <div style={{ color: '#a78bfa' }}>R²: {d.r2}</div>
                  </div>
                );
              }}
            />
            <ReferenceLine x={0} stroke="#4b5563" strokeDasharray="4 2" />
            <Scatter data={scatterData} onClick={(d) => setSelected(selected === d.number ? null : d.number)}>
              {scatterData.map((d) => (
                <Cell key={d.number} fill={slopeColor(d.slope, maxSlope)} opacity={selected === null || selected === d.number ? 1 : 0.3} r={selected === d.number ? 8 : 5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <p className="reg-footer-note">
        ⚠️ La régression linéaire modélise une tendance passée. Elle ne garantit pas les résultats futurs — l'EuroMillions est un tirage aléatoire indépendant.
      </p>
    </div>
  );
}
