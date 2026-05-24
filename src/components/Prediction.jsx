import { useMemo, useState } from 'react';
import './Prediction.css';

function weightedPick(pool, count, hotRatio, lockedNumbers = []) {
  const locked = pool.filter((n) => lockedNumbers.includes(n.number));
  const needed = count - locked.length;
  if (needed <= 0) return locked.slice(0, count);

  const unlocked = pool.filter((n) => !lockedNumbers.includes(n.number));
  const sorted = [...unlocked].sort((a, b) => a.count - b.count);
  const hotCutoff = Math.ceil(unlocked.length * 0.3);
  const coldCutoff = Math.floor(unlocked.length * 0.7);
  const hotSet = new Set(sorted.slice(coldCutoff).map((n) => n.number));
  const coldSet = new Set(sorted.slice(0, hotCutoff).map((n) => n.number));

  const min = sorted[0]?.count ?? 0;
  const max = sorted[sorted.length - 1]?.count ?? 1;
  const range = max - min || 1;

  let eligible = unlocked;
  if (hotRatio === 100) eligible = unlocked.filter((n) => hotSet.has(n.number));
  else if (hotRatio === 0) eligible = unlocked.filter((n) => coldSet.has(n.number));

  const available = eligible.map((n) => {
    const hotScore = (n.count - min) / range;
    const coldScore = 1 - hotScore;
    return { ...n, weight: (hotRatio / 100) * hotScore + (1 - hotRatio / 100) * coldScore };
  });

  const chosen = [];
  let remaining = [...available];
  while (chosen.length < needed && remaining.length > 0) {
    const totalWeight = remaining.reduce((s, n) => s + n.weight, 0);
    let rand = Math.random() * totalWeight;
    let idx = remaining.findIndex((n) => { rand -= n.weight; return rand <= 0; });
    if (idx < 0) idx = remaining.length - 1;
    chosen.push(remaining[idx]);
    remaining = remaining.filter((_, i) => i !== idx);
  }

  return [...locked, ...chosen];
}

function NumberGrid({ freq, locked, excluded, onToggleLock, onToggleExclude, label, max }) {
  return (
    <div className="number-grid-section">
      <div className="grid-legend">
        <span className="grid-legend-item"><span className="dot dot-locked" />Fixé</span>
        <span className="grid-legend-item"><span className="dot dot-excluded" />Exclu</span>
        <span className="grid-legend-item"><span className="dot dot-free" />Libre</span>
      </div>
      <p className="grid-hint">Clic gauche = fixer · Clic droit = exclure</p>
      <div className="number-grid">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
          const entry = freq.find((f) => f.number === n);
          const sorted = [...freq].sort((a, b) => b.count - a.count);
          const rank = sorted.findIndex((s) => s.number === n);
          const isHot = rank < Math.ceil(freq.length * 0.3);
          const isCold = rank >= Math.floor(freq.length * 0.7);
          const isLocked = locked.includes(n);
          const isExcluded = excluded.includes(n);

          return (
            <button
              key={n}
              className={[
                'grid-num',
                isHot && !isLocked && !isExcluded ? 'grid-hot' : '',
                isCold && !isLocked && !isExcluded ? 'grid-cold' : '',
                isLocked ? 'grid-locked' : '',
                isExcluded ? 'grid-excluded' : '',
              ].join(' ')}
              onClick={() => onToggleLock(n)}
              onContextMenu={(e) => { e.preventDefault(); onToggleExclude(n); }}
              title={`${label} ${n} — tiré ${entry?.count ?? 0} fois (rang #${rank + 1})`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Prediction({ numberFreq, starFreq }) {
  const [pick, setPick] = useState(null);
  const [hotRatio, setHotRatio] = useState(60);
  const [lockedNumbers, setLockedNumbers] = useState([]);
  const [excludedNumbers, setExcludedNumbers] = useState([]);
  const [lockedStars, setLockedStars] = useState([]);
  const [excludedStars, setExcludedStars] = useState([]);
  const [showConfig, setShowConfig] = useState(true);

  const numberPool = useMemo(() => numberFreq.filter((n) => !excludedNumbers.includes(n.number)), [numberFreq, excludedNumbers]);
  const starPool = useMemo(() => starFreq.filter((n) => !excludedStars.includes(n.number)), [starFreq, excludedStars]);

  const sortedNumbers = useMemo(() => [...numberFreq].sort((a, b) => b.count - a.count), [numberFreq]);
  const sortedStars = useMemo(() => [...starFreq].sort((a, b) => b.count - a.count), [starFreq]);

  function toggleLock(n, locked, setLocked, excluded, setExcluded) {
    setExcluded(excluded.filter((x) => x !== n));
    setLocked(locked.includes(n) ? locked.filter((x) => x !== n) : [...locked, n]);
  }

  function toggleExclude(n, excluded, setExcluded, locked, setLocked) {
    setLocked(locked.filter((x) => x !== n));
    setExcluded(excluded.includes(n) ? excluded.filter((x) => x !== n) : [...excluded, n]);
  }

  function reset() {
    setLockedNumbers([]);
    setExcludedNumbers([]);
    setLockedStars([]);
    setExcludedStars([]);
    setHotRatio(60);
    setPick(null);
  }

  function generate() {
    const canPickNumbers = numberPool.filter((n) => !lockedNumbers.includes(n.number)).length;
    const neededNumbers = 5 - lockedNumbers.length;
    if (neededNumbers > canPickNumbers) {
      alert(`Pas assez de numéros disponibles. Déverrouillez ou déexcluez des numéros.`);
      return;
    }
    const canPickStars = starPool.filter((n) => !lockedStars.includes(n.number)).length;
    const neededStars = 2 - lockedStars.length;
    if (neededStars > canPickStars) {
      alert(`Pas assez d'étoiles disponibles.`);
      return;
    }

    const numbers = weightedPick(numberPool, 5, hotRatio, lockedNumbers)
      .map((n) => n.number)
      .sort((a, b) => a - b);
    const stars = weightedPick(starPool, 2, hotRatio, lockedStars)
      .map((n) => n.number)
      .sort((a, b) => a - b);
    setPick({ numbers, stars });
  }

  const modeLabel =
    hotRatio === 100 ? '🔥 100% chaud' :
    hotRatio >= 75  ? '🌶️ Majorité chaud' :
    hotRatio === 50 ? '⚖️ Équilibré' :
    hotRatio > 0    ? '❄️ Majorité froid' :
    '🧊 100% froid';

  return (
    <div className="chart-card prediction">
      <div className="pred-header">
        <h2>Prédiction de tirage</h2>
        <button className="toggle-config-btn" onClick={() => setShowConfig((v) => !v)}>
          {showConfig ? 'Masquer les réglages ▲' : 'Réglages ▼'}
        </button>
      </div>
      <p className="pred-disclaimer">
        Basée sur les fréquences historiques — le loto reste aléatoire, ceci est purement statistique.
      </p>

      {showConfig && (
        <div className="pred-config">
          <div className="config-section">
            <label className="config-label">
              Ratio chaud / froid
              <span className="mode-badge">{modeLabel}</span>
            </label>
            <div className="slider-row">
              <span className="pred-method-cold">❄️ Froid</span>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={hotRatio}
                onChange={(e) => setHotRatio(Number(e.target.value))}
                className="hot-cold-slider"
              />
              <span className="pred-method-hot">🔥 Chaud</span>
            </div>
            <div className="slider-presets">
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  className={`preset-btn ${hotRatio === v ? 'active' : ''}`}
                  onClick={() => setHotRatio(v)}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <label className="config-label">
              Numéros (1–50)
              <span className="config-sub">
                {lockedNumbers.length > 0 && `${lockedNumbers.length} fixé(s)`}
                {excludedNumbers.length > 0 && ` · ${excludedNumbers.length} exclu(s)`}
              </span>
            </label>
            <NumberGrid
              freq={numberFreq}
              locked={lockedNumbers}
              excluded={excludedNumbers}
              onToggleLock={(n) => toggleLock(n, lockedNumbers, setLockedNumbers, excludedNumbers, setExcludedNumbers)}
              onToggleExclude={(n) => toggleExclude(n, excludedNumbers, setExcludedNumbers, lockedNumbers, setLockedNumbers)}
              label="Numéro"
              max={50}
            />
          </div>

          <div className="config-section">
            <label className="config-label">
              Étoiles (1–12)
              <span className="config-sub">
                {lockedStars.length > 0 && `${lockedStars.length} fixée(s)`}
                {excludedStars.length > 0 && ` · ${excludedStars.length} exclue(s)`}
              </span>
            </label>
            <NumberGrid
              freq={starFreq}
              locked={lockedStars}
              excluded={excludedStars}
              onToggleLock={(n) => toggleLock(n, lockedStars, setLockedStars, excludedStars, setExcludedStars)}
              onToggleExclude={(n) => toggleExclude(n, excludedStars, setExcludedStars, lockedStars, setLockedStars)}
              label="Étoile"
              max={12}
            />
          </div>

          <button className="reset-btn" onClick={reset}>Réinitialiser tout</button>
        </div>
      )}

      <div className="pred-actions">
        <button className="generate-btn" onClick={generate}>
          {pick ? '🔄 Régénérer' : '✨ Générer ma prédiction'}
        </button>
      </div>

      {pick && (
        <div className="pred-result">
          <div className="pred-section">
            <h3>Numéros</h3>
            <div className="ball-row pred-balls">
              {pick.numbers.map((n) => {
                const rank = sortedNumbers.findIndex((s) => s.number === n);
                const isLocked = lockedNumbers.includes(n);
                return (
                  <div key={n} className={`ball ${rank < 10 ? 'hot' : 'cold'} ${isLocked ? 'ball-locked' : ''}`}>
                    <span className="ball-num">{n}</span>
                    <span className="ball-count">{isLocked ? '🔒' : `#${rank + 1}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pred-section">
            <h3>Étoiles</h3>
            <div className="ball-row pred-balls">
              {pick.stars.map((n) => {
                const rank = sortedStars.findIndex((s) => s.number === n);
                const isLocked = lockedStars.includes(n);
                return (
                  <div key={n} className={`ball ball-star ${isLocked ? 'ball-locked' : ''}`}>
                    <span className="ball-num">{n}</span>
                    <span className="ball-count">{isLocked ? '🔒' : `#${rank + 1}`}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pred-method">
            <h3>Paramètres utilisés</h3>
            <ul>
              <li><span className="pred-method-hot">Chaud</span> {hotRatio}% · <span className="pred-method-cold">Froid</span> {100 - hotRatio}%</li>
              {lockedNumbers.length > 0 && <li>Numéros fixés : {lockedNumbers.sort((a,b)=>a-b).join(', ')}</li>}
              {excludedNumbers.length > 0 && <li>Numéros exclus : {excludedNumbers.sort((a,b)=>a-b).join(', ')}</li>}
              {lockedStars.length > 0 && <li>Étoiles fixées : {lockedStars.sort((a,b)=>a-b).join(', ')}</li>}
              <li>Analyse sur {numberFreq.reduce((s, d) => s + d.count, 0).toLocaleString('fr-FR')} occurrences</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
