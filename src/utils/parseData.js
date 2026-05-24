import Papa from 'papaparse';

const BASE = import.meta.env.BASE_URL;
const CSV_FILES = [
  `${BASE}data/euromillions_202002.csv`,
  `${BASE}data/euromillions_201902.csv`,
  `${BASE}data/euromillions_4.csv`,
  `${BASE}data/euromillions_3.csv`,
  `${BASE}data/euromillions_2.csv`,
  `${BASE}data/euromillions.csv`,
];

async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
    });
  });
}

export async function loadAllDraws() {
  const all = await Promise.all(CSV_FILES.map(loadCSV));
  const rows = all.flat();

  return rows
    .filter((r) => r.boule_1 && r.boule_2)
    .map((r) => ({
      date: r['date_de_tirage'],
      day: r['jour_de_tirage'],
      numbers: [
        parseInt(r.boule_1),
        parseInt(r.boule_2),
        parseInt(r.boule_3),
        parseInt(r.boule_4),
        parseInt(r.boule_5),
      ].filter(Boolean),
      stars: [
        parseInt(r['etoile_1']),
        parseInt(r['etoile_2']),
      ].filter(Boolean),
    }))
    .filter((d) => d.numbers.length === 5 && d.stars.length === 2);
}

export function computeNumberFreq(draws, count = 50) {
  const freq = Array.from({ length: count }, (_, i) => ({ number: i + 1, count: 0 }));
  draws.forEach((d) => {
    d.numbers.forEach((n) => {
      if (n >= 1 && n <= count) freq[n - 1].count++;
    });
  });
  return freq;
}

export function computeStarFreq(draws, count = 12) {
  const freq = Array.from({ length: count }, (_, i) => ({ number: i + 1, count: 0 }));
  draws.forEach((d) => {
    d.stars.forEach((n) => {
      if (n >= 1 && n <= count) freq[n - 1].count++;
    });
  });
  return freq;
}

export function computeDayFreq(draws) {
  const order = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
  const map = {};
  draws.forEach((d) => {
    const day = (d.day || '').toUpperCase().trim();
    map[day] = (map[day] || 0) + 1;
  });
  return order
    .filter((d) => map[d])
    .map((d) => ({ day: d[0] + d.slice(1).toLowerCase(), count: map[d] }));
}

// Split draws into chronological windows, return frequency per window per number
export function computeWindowedFreq(draws, windowSize = 50, maxNumbers = 50) {
  // draws are newest-first from CSV, reverse for chronological order
  const chrono = [...draws].reverse();
  const windows = [];
  for (let i = 0; i < chrono.length; i += windowSize) {
    const slice = chrono.slice(i, i + windowSize);
    if (slice.length < windowSize * 0.5) break; // skip tiny last window
    const freq = Array(maxNumbers).fill(0);
    slice.forEach((d) => d.numbers.forEach((n) => { if (n >= 1 && n <= maxNumbers) freq[n - 1]++; }));
    const label = slice[0].date?.slice(6) ?? String(i); // year label
    windows.push({ label, freq, size: slice.length });
  }
  return windows;
}

export function computeWindowedStarFreq(draws, windowSize = 50) {
  const chrono = [...draws].reverse();
  const windows = [];
  for (let i = 0; i < chrono.length; i += windowSize) {
    const slice = chrono.slice(i, i + windowSize);
    if (slice.length < windowSize * 0.5) break;
    const freq = Array(12).fill(0);
    slice.forEach((d) => d.stars.forEach((n) => { if (n >= 1 && n <= 12) freq[n - 1]++; }));
    windows.push({ freq, size: slice.length });
  }
  return windows;
}

// Linear regression: returns { slope, intercept, r2 } for a series of y values
export function linearRegression(ys) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 };
  const xs = ys.map((_, i) => i);
  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;
  const ssXX = xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const ssXY = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const ssYY = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = meanY - slope * meanX;
  const r2 = ssYY === 0 ? 0 : (ssXY ** 2) / (ssXX * ssYY);
  return { slope, intercept, r2, predicted: intercept + slope * n };
}

// Compute regression for every number across windows
export function computeRegressionStats(windows, count) {
  return Array.from({ length: count }, (_, i) => {
    const ys = windows.map((w) => (w.freq[i] / w.size) * 100); // % per draw
    const reg = linearRegression(ys);
    return { number: i + 1, ...reg, series: ys };
  });
}

export function computePairFreq(draws, topN = 20) {
  const map = {};
  draws.forEach((d) => {
    const nums = [...d.numbers].sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        map[key] = (map[key] || 0) + 1;
      }
    }
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([pair, count]) => ({ pair, count }));
}
