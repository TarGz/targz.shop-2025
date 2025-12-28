import fs from 'fs';
import path from 'path';

const artworksDir = './content/artworks';

const folders = fs.readdirSync(artworksDir).filter(f => {
  const stat = fs.statSync(path.join(artworksDir, f));
  return stat.isDirectory();
});

for (const folder of folders) {
  const indexPath = path.join(artworksDir, folder, 'index.md');

  if (!fs.existsSync(indexPath)) continue;

  let content = fs.readFileSync(indexPath, 'utf-8');
  let modified = false;

  // Fix cover_image path
  const coverMatch = content.match(/cover_image:\s*\.\/(.+)/);
  if (coverMatch) {
    const newPath = `/artworks/${folder}/${coverMatch[1]}`;
    content = content.replace(/cover_image:\s*\.\/(.+)/, `cover_image: ${newPath}`);
    modified = true;
    console.log(`${folder}: cover_image -> ${newPath}`);
  }

  // Fix images array paths
  content = content.replace(/(\s+)-\s*\.\/(\S+)/g, (match, spaces, filename) => {
    const newPath = `/artworks/${folder}/${filename}`;
    modified = true;
    return `${spaces}- ${newPath}`;
  });

  if (modified) {
    fs.writeFileSync(indexPath, content);
  }
}

console.log('Done!');
