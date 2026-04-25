const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const tmp = dest + '.tmp';
    const file = fs.createWriteStream(tmp);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(tmp, () => {});
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          try {
            fs.renameSync(tmp, dest);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(tmp, () => {});
      reject(err);
    });
  });
}

async function main() {
  const workspaceRoot = process.cwd();
  const publicDir = path.join(workspaceRoot, 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const backupDir = path.join(publicDir, 'backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const logPath = path.join(publicDir, 'download-log.txt');
  function logToFile(...parts) {
    try { fs.appendFileSync(logPath, new Date().toISOString() + ' ' + parts.join(' ') + '\n'); } catch (e) { /* ignore */ }
  }

  const items = [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Audi_q7_front_white.jpg',
      out: path.join(publicDir, 'audi_q7.jpg')
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/ToyotaEtios-Tandil.jpg',
      out: path.join(publicDir, 'etios_xls.jpg')
    }
  ];

  for (const it of items) {
    try {
      if (fs.existsSync(it.out)) {
        const base = path.basename(it.out);
        const destBack = path.join(backupDir, base + '.' + Date.now());
        fs.copyFileSync(it.out, destBack);
        logToFile('Backed up', it.out, '->', destBack);
        console.log('Backed up', it.out, '->', destBack);
      }
    } catch (err) {
      logToFile('Backup failed for', it.out, err && err.message);
      console.error('Backup failed for', it.out, err && err.message);
    }

    logToFile('Downloading', it.url, '->', it.out);
    console.log('Downloading', it.url, '->', it.out);
    try {
      await download(it.url, it.out);
    } catch (err) {
      logToFile('Download failed for', it.url, err && err.message);
      console.error('Download failed for', it.url, err && err.message);
      continue;
    }

    try {
      const buf = fs.readFileSync(it.out);
      const size = buf.length;
      const sha = crypto.createHash('sha256').update(buf).digest('hex');
      logToFile('Saved', it.out, size + ' bytes, sha256', sha);
      console.log('Saved', it.out, size, 'bytes, sha256', sha);
    } catch (err) {
      logToFile('Post-save check failed for', it.out, err && err.message);
      console.error('Post-save check failed for', it.out, err && err.message);
    }
  }
}

main().catch(err => {
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
