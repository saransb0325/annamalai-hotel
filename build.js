const fs = require('fs');
const path = require('path');
const { injectMotion } = require('./inject-motion');

// Ensure directories exist
for (const dir of ['dist', 'dist/assets', 'public', 'public/assets']) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const filesToCopy = [
  'index.html',
  'hotel-annamalai.html',
  'admin.html',
  'ah-logo.png',
  'annamalai-branches.jpg',
  'annamalai-brand.png',
  'temple-hero-bg.jpg',
  'arunachala-bg.jpg',
  'ui-motion.css',
  'ui-motion.js'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    fs.copyFileSync(file, path.join('public', file));
    console.log(`Copied ${file} to dist/ and public/`);
  }
});

// Copy existing public assets for builds that use dist.
if (fs.existsSync('public/assets')) {
  fs.readdirSync('public/assets').forEach(file => {
    fs.copyFileSync(path.join('public/assets', file), path.join('dist/assets', file));
  });
}

// Inject only into build output; tracked source HTML remains untouched.
// The operation is idempotent so repeated builds do not duplicate tags.
for (const outputDir of ['dist', 'public']) {
  for (const file of ['index.html', 'hotel-annamalai.html', 'admin.html']) {
    const target = path.join(outputDir, file);
    if (!fs.existsSync(target)) continue;
    const html = fs.readFileSync(target, 'utf8');
    const enhanced = injectMotion(html);
    if (enhanced !== html) fs.writeFileSync(target, enhanced, 'utf8');
  }
}

console.log('Build complete! HTML output includes optional accessible motion assets.');
