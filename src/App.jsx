import { useState, useEffect } from 'react';
import {
  loadAllDraws,
  computeNumberFreq,
  computeStarFreq,
  computeDayFreq,
  computePairFreq,
} from './utils/parseData';
import FrequencyBar from './components/FrequencyBar';
import HotCold from './components/HotCold';
import DayChart from './components/DayChart';
import PairChart from './components/PairChart';
import StatsCards from './components/StatsCards';
import Prediction from './components/Prediction';
import Regression from './components/Regression';
import './App.css';

export default function App() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('numbers');

  useEffect(() => {
    loadAllDraws().then((data) => {
      setDraws(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Chargement des données EuroMillions...</p>
      </div>
    );
  }

  const numberFreq = computeNumberFreq(draws, 50);
  const starFreq = computeStarFreq(draws, 12);
  const dayFreq = computeDayFreq(draws);
  const pairFreq = computePairFreq(draws, 20);

  const tabs = [
    { id: 'numbers', label: 'Numéros' },
    { id: 'stars', label: 'Étoiles' },
    { id: 'hotcold', label: 'Chaud / Froid' },
    { id: 'pairs', label: 'Paires' },
    { id: 'days', label: 'Jours' },
    { id: 'prediction', label: '✨ Prédiction' },
    { id: 'regression', label: '📈 Régression' },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-star">★</span>
            <h1>EuroMillions Stats</h1>
            <span className="logo-star">★</span>
          </div>
          <p className="subtitle">Analyse statistique des tirages depuis 2004</p>
        </div>
      </header>

      <main className="main">
        <StatsCards draws={draws} numberFreq={numberFreq} starFreq={starFreq} />

        <nav className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="tab-content">
          {tab === 'numbers' && (
            <FrequencyBar
              data={numberFreq}
              label="Fréquence des numéros (1–50)"
              xKey="number"
            />
          )}
          {tab === 'stars' && (
            <FrequencyBar
              data={starFreq}
              label="Fréquence des étoiles (1–12)"
              xKey="number"
              color="#f59e0b"
            />
          )}
          {tab === 'hotcold' && (
            <>
              <HotCold data={numberFreq} label="Numéros chauds & froids" />
              <HotCold data={starFreq} label="Étoiles chaudes & froides" />
            </>
          )}
          {tab === 'pairs' && <PairChart data={pairFreq} />}
          {tab === 'days' && <DayChart data={dayFreq} />}
          {tab === 'prediction' && (
            <Prediction numberFreq={numberFreq} starFreq={starFreq} />
          )}
          {tab === 'regression' && <Regression draws={draws} />}
        </div>
      </main>

      <footer className="footer">
        <p>Données officielles FDJ · {draws.length.toLocaleString('fr-FR')} tirages analysés</p>
      </footer>
    </div>
  );
}
