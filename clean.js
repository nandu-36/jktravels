import fs from 'fs';
import path from 'path';

const files = ['index.html', 'services.html', 'fleet.html', 'about.html', 'contact.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Remove pattern: start of line (optional spaces) digits: (space)
    content = content.replace(/^\s*\d+:\s*/gm, '');
    fs.writeFileSync(file, content);
    console.log(`Cleaned ${file}`);
});
