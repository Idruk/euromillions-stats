#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');

const ARCHIVES = [
  {
    label: 'Fév 2020 → aujourd\'hui',
    url: 'https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afe6',
    out: 'euromillions_202002.csv',
  },
  {
    label: 'Mar 2019 → Fév 2020',
    url: 'https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afd6',
    out: 'euromillions_201902.csv',
  },
  {
    label: 'Sep 2016 → Fév 2019',
    url: 'https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afc6',
    out: 'euromillions_4.csv',
  },
  {
    label: 'Fév 2014 → Sep 2016',
    url: 'https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afb6',
    out: 'euromillions_3.csv',
  },
  {
    label: 'Mai 2011 → Fév 2014',
    url: 'https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afa9',
    out: 'euromillions_2.csv',
  },
  {
    label: 'Fév 2004 → Mai 2011',
    url: 'https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afa8',
    out: 'euromillions.csv',
  },
];

const latestOnly = process.argv.includes('--latest');
const archives = latestOnly ? [ARCHIVES[0]] : ARCHIVES;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    };
    request(url);
  });
}

function extractZip(zipPath, outFile) {
  const tmp = path.join(DATA_DIR, '_tmp_extract');
  fs.mkdirSync(tmp, { recursive: true });
  execSync(`unzip -o "${zipPath}" -d "${tmp}"`, { stdio: 'pipe' });
  const files = fs.readdirSync(tmp).filter((f) => f.endsWith('.csv'));
  if (!files.length) throw new Error('No CSV found in ZIP');
  fs.renameSync(path.join(tmp, files[0]), path.join(DATA_DIR, outFile));
  fs.rmSync(tmp, { recursive: true, force: true });
}

async function run() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpZip = path.join(DATA_DIR, '_download.zip');

  console.log(`\n📥 Mise à jour des données EuroMillions (${latestOnly ? 'dernier tirage uniquement' : 'toutes les archives'})\n`);

  for (const archive of archives) {
    process.stdout.write(`  • ${archive.label} ... `);
    try {
      await download(archive.url, tmpZip);
      extractZip(tmpZip, archive.out);
      fs.unlinkSync(tmpZip);

      // Count rows
      const content = fs.readFileSync(path.join(DATA_DIR, archive.out), 'utf8');
      const rows = content.split('\n').filter((l) => l.trim() && !l.startsWith('annee')).length;
      console.log(`✅ ${rows} tirages`);
    } catch (err) {
      console.log(`❌ Erreur: ${err.message}`);
    }
  }

  // Print most recent draw info from latest file
  try {
    const latest = fs.readFileSync(path.join(DATA_DIR, 'euromillions_202002.csv'), 'utf8');
    const lines = latest.split('\n').filter((l) => l.trim());
    const lastLine = lines[1]; // first data row = most recent draw
    const cols = lastLine.split(';');
    const date = cols[2];
    const numbers = [cols[5], cols[6], cols[7], cols[8], cols[9]].join(' - ');
    const stars = [cols[10], cols[11]].join(' - ');
    console.log(`\n🎯 Dernier tirage : ${date}`);
    console.log(`   Numéros : ${numbers}`);
    console.log(`   Étoiles : ${stars}\n`);
  } catch {}
}

run();
