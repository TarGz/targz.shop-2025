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

  // Skip if already has cover_image
  if (content.includes('cover_image:')) {
    console.log(`Skipping ${folder} - already has cover_image`);
    continue;
  }

  // Find the first image in the images array
  const imagesMatch = content.match(/images:\n([\s\S]*?)(?=\n\w|---)/);
  if (!imagesMatch) {
    console.log(`Skipping ${folder} - no images found`);
    continue;
  }

  const firstImageMatch = imagesMatch[1].match(/-\s*\.\/(\S+)/);
  if (!firstImageMatch) {
    console.log(`Skipping ${folder} - couldn't parse first image`);
    continue;
  }

  const firstImage = firstImageMatch[1];

  // Add cover_image after the frontmatter opening
  content = content.replace(
    /^---\n/,
    `---\ncover_image: ./${firstImage}\n`
  );

  fs.writeFileSync(indexPath, content);
  console.log(`Updated ${folder} with cover_image: ./${firstImage}`);
}

console.log('Done!');
