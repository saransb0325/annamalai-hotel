const fs = require('fs');
const path = require('path');

// Ensure directories exist
if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });
if (!fs.existsSync('dist/assets')) fs.mkdirSync('dist/assets', { recursive: true });
if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
if (!fs.existsSync('public/assets')) fs.mkdirSync('public/assets', { recursive: true });

const filesToCopy = [
  'index.html',
  'hotel-annamalai.html',
  'ah-logo.png',
  'annamalai-branches.jpg',
  'annamalai-brand.png',
  'temple-hero-bg.jpg'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    fs.copyFileSync(file, path.join('public', file));
    console.log(`Copied ${file} to dist/ and public/`);
  }
});

// Copy assets
if (fs.existsSync('public/assets')) {
  fs.readdirSync('public/assets').forEach(file => {
    fs.copyFileSync(path.join('public/assets', file), path.join('dist/assets', file));
  });
}

console.log('Build complete! All files synchronized to root, dist, and public.');
