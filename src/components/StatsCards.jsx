export default function StatsCards({ draws, numberFreq, starFreq }) {
  const totalDraws = draws.length;
  const mostNumber = [...numberFreq].sort((a, b) => b.count - a.count)[0];
  const leastNumber = [...numberFreq].sort((a, b) => a.count - b.count)[0];
  const mostStar = [...starFreq].sort((a, b) => b.count - a.count)[0];

  const cards = [
    { label: 'Total tirages', value: totalDraws.toLocaleString('fr-FR'), sub: 'depuis 2004' },
    { label: 'Numéro le + tiré', value: mostNumber?.number, sub: `${mostNumber?.count} fois` },
    { label: 'Numéro le - tiré', value: leastNumber?.number, sub: `${leastNumber?.count} fois` },
    { label: 'Étoile la + tirée', value: mostStar?.number, sub: `${mostStar?.count} fois` },
  ];

  return (
    <div className="stats-cards">
      {cards.map((c) => (
        <div key={c.label} className="stat-card">
          <div className="stat-value">{c.value}</div>
          <div className="stat-label">{c.label}</div>
          <div className="stat-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
