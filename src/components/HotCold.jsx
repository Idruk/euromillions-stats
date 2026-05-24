export default function HotCold({ data, label }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const hot = sorted.slice(0, 5);
  const cold = sorted.slice(-5).reverse();

  return (
    <div className="chart-card hotcold">
      <h2>{label}</h2>
      <div className="hotcold-grid">
        <div>
          <h3 style={{ color: '#ef4444' }}>🔥 Les plus tirés</h3>
          <div className="ball-row">
            {hot.map((d) => (
              <div key={d.number} className="ball hot">
                <span className="ball-num">{d.number}</span>
                <span className="ball-count">{d.count}x</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 style={{ color: '#3b82f6' }}>❄️ Les moins tirés</h3>
          <div className="ball-row">
            {cold.map((d) => (
              <div key={d.number} className="ball cold">
                <span className="ball-num">{d.number}</span>
                <span className="ball-count">{d.count}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
