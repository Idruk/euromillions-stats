import { useMemo, useState } from 'react';
import './Prediction.css';

function weightedPick(pool, count) {
  const chosen = [];
  let remaining = [...pool];
  while (chosen.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((s, n) => s + n.weight, 0);
    let rand = Math.random() * totalWeight;
    const idx = remaining.findIndex((n) => {
      rand -= n.weight;
      return rand <= 0;
    });
    chosen.push(remaining[idx < 0 ? 0 : idx]);
    remaining = remaining.filter((_, i) => i !== (idx < 0 ? 0 : idx));
  }
  return chosen;
}

function buildPool(freq) {
  const sorted = [...freq].sort((a, b) => a.count - b.count);
  const min = sorted[0].count;
  const max = sorted[sorted.length - 1].count;
  const range = max - min || 1;
  return freq.map((d) => ({
    number: d.number,
    count: d.count,
    // balanced weight: mix hot (60%) and cold (40%) tendency
    weight: 0.6 * ((d.count - min) / range) + 0.4 * (1 - (d.count - min) / range),
  }));
}

export default function Prediction({ numberFreq, starFreq }) {
  const [pick, setPick] = useState(null);

  const numberPool = useMemo(() => buildPool(numberFreq), [numberFreq]);
  const starPool = useMemo(() => buildPool(starFreq), [starFreq]);

  function generate() {
    const numbers = weightedPick(numberPool, 5)
      .map((n) => n.number)
      .sort((a, b) => a - b);
    const stars = weightedPick(starPool, 2)
      .map((n) => n.number)
      .sort((a, b) => a - b);
    setPick({ numbers, stars });
  }

  const sortedNumbers = [...numberFreq].sort((a, b) => b.count - a.count);
  const sortedStars = [...starFreq].sort((a, b) => b.count - a.count);

  return (
    <div className="chart-card prediction">
      <h2>Prédiction de tirage</h2>
      <p className="pred-disclaimer">
        Basée sur les fréquences historiques — le loto reste aléatoire, ceci est purement statistique.
      </p>

      <button className="generate-btn" onClick={generate}>
        {pick ? '🔄 Régénérer' : '✨ Générer ma prédiction'}
      </button>

      {pick && (
        <div className="pred-result">
          <div className="pred-section">
            <h3>Numéros</h3>
            <div className="ball-row pred-balls">
              {pick.numbers.map((n) => {
                const rank = sortedNumbers.findIndex((s) => s.number === n);
                const hot = rank < 10;
                return (
                  <div key={n} className={`ball ${hot ? 'hot' : 'cold'}`}>
                    <span className="ball-num">{n}</span>
                    <span className="ball-count">#{rank + 1}</span>
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
                return (
                  <div key={n} className="ball ball-star">
                    <span className="ball-num">{n}</span>
                    <span className="ball-count">#{rank + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pred-method">
            <h3>Méthode utilisée</h3>
            <ul>
              <li>60% de pondération vers les numéros <span className="pred-method-hot">chauds</span> (fréquents)</li>
              <li>40% de pondération vers les numéros <span className="pred-method-cold">froids</span> (rares) pour l'équilibre</li>
              <li>Tirage aléatoire pondéré sur {numberFreq.reduce((s, d) => s + d.count, 0).toLocaleString('fr-FR')} occurrences analysées</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
