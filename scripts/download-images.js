#!/usr/bin/env node
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'JKCarTravelsImageFetcher/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function followDownload(url, dest, attempt = 0) {
  return new Promise((resolve, reject) => {
    if (attempt > 10) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'JKCarTravelsImageFetcher/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(followDownload(res.headers.location, dest, attempt + 1));
      }
      if (res.statusCode !== 200) return reject(new Error('Download failed: ' + res.statusCode));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', (err) => reject(err));
    });
    req.on('error', reject);
  });
}

async function searchAndDownload(query, outPath) {
  console.log('Searching Wikimedia Commons for:', query);
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=' +
    encodeURIComponent(query) +
    '&gsrlimit=50&prop=imageinfo&iiprop=url|extmetadata';
  const j = await httpGetJson(api);
  if (!j.query || !j.query.pages) throw new Error('No results for: ' + query);

  const pages = Object.values(j.query.pages || {});
  for (const p of pages) {
    if (!p.imageinfo) continue;
    for (const ii of p.imageinfo) {
      const url = ii.url;
      if (!url) continue;
      if (!url.match(/\.(jpg|jpeg|png|webp)$/i)) continue;
      const meta = ii.extmetadata || {};
      const license =
        (meta.LicenseShortName && meta.LicenseShortName.value) || (meta.License && meta.License.value) || '';
      const allowed = /Creative Commons|CC0|CC BY|Public domain|Public Domain|CC-BY/i.test(license);
      if (!allowed) {
        console.log('Skipping candidate due to license:', url, '->', license || '(no license metadata)');
        continue;
      }
      console.log('Selected candidate:', url);
      const tmp = outPath + '.tmp';
      await followDownload(url, tmp);
      const stats = fs.statSync(tmp);
      if (stats.size < 1024 * 5) {
        fs.unlinkSync(tmp);
        console.log('Downloaded file too small, skipping.');
        continue;
      }
      fs.renameSync(tmp, outPath);
      console.log('Saved image to', outPath);
      return true;
    }
  }
  throw new Error('No suitable images found for: ' + query);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.length % 2 === 1) {
    console.error('Usage: node scripts/download-images.js "search query" "output/path" ["query2" "output2"]');
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, '..');
  const publicDir = path.join(repoRoot, 'public');
  const backupDir = path.join(publicDir, 'backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  // Pre-backup originals if they exist in the public folder
  for (let i = 1; i < args.length; i += 2) {
    const outRel = args[i];
    const fileName = path.basename(outRel);
    const origPath = path.join(publicDir, fileName);
    if (fs.existsSync(origPath)) {
      const bakName = fileName + '.' + Date.now();
      const bakPath = path.join(backupDir, bakName);
      try {
        fs.copyFileSync(origPath, bakPath);
        console.log('Backed up', origPath, '->', bakPath);
      } catch (e) {
        console.warn('Backup failed for', origPath, e.message);
      }
    }
  }

  for (let i = 0; i < args.length; i += 2) {
    const query = args[i];
    const outRel = args[i + 1];
    const outFull = path.resolve(outRel);
    try {
      await searchAndDownload(query, outFull);
    } catch (e) {
      console.error('Failed to fetch for', query + ':', e.message);
    }
  }
  console.log('All done. Check public/ for downloaded images and public/backup for originals.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
