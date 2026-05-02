import fs from 'fs';

const files = ['index.html', 'services.html', 'fleet.html', 'about.html', 'contact.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
        /<script type="module" crossorigin src="\/assets\/[^"]+"><\/script>\s*<link rel="stylesheet" crossorigin href="\/assets\/[^"]+">/g,
        '<script type="module" src="/src/main.js"></script>'
    );
    fs.writeFileSync(file, content);
    console.log(`Fixed assets in ${file}`);
});
