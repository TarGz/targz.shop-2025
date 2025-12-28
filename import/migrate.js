/**
 * Shopify to GitHub Migration Script
 *
 * Reads Shopify CSV export and creates:
 * - Artwork folders in content/artworks/{slug}/
 * - index.md with metadata
 * - Downloaded images as 01.jpg, 02.jpg, etc.
 *
 * Usage: node import/migrate.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CSV_FILE = path.join(__dirname, 'products_export_1.csv');
const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'artworks');

// Editions to exclude (prints, not original pen plots)
const EXCLUDE_PATTERNS = [
  /-edition$/,
  /^copy-of-/,
];

// Sanitize slug (remove emojis and special characters)
function sanitizeSlug(slug) {
  return slug
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/^-+|-+$/g, '')                 // Leading/trailing hyphens
    .replace(/-+/g, '-');                    // Multiple hyphens
}

// Parse CSV (simple parser for Shopify format)
function parseCSV(content) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Parse header
  const header = parseCSVLine(lines[0]);

  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      header.forEach((key, idx) => {
        row[key] = values[idx] || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// Group rows by product handle
function groupByProduct(rows) {
  const products = {};

  for (const row of rows) {
    const handle = row['Handle'];
    if (!handle) continue;

    if (!products[handle]) {
      products[handle] = {
        handle,
        title: row['Title'] || '',
        body: row['Body (HTML)'] || '',
        price: row['Variant Price'] || '',
        status: row['Status'] || 'active',
        images: [],
        type: row['Type'] || '',
        tags: row['Tags'] || '',
      };
    }

    // Add image if present
    const imageSrc = row['Image Src'];
    const imagePosition = parseInt(row['Image Position']) || 999;
    if (imageSrc && !products[handle].images.find(img => img.src === imageSrc)) {
      products[handle].images.push({ src: imageSrc, position: imagePosition });
    }

    // Update title/body if empty
    if (!products[handle].title && row['Title']) {
      products[handle].title = row['Title'];
    }
    if (!products[handle].body && row['Body (HTML)']) {
      products[handle].body = row['Body (HTML)'];
    }
  }

  // Sort images by position
  for (const handle in products) {
    products[handle].images.sort((a, b) => a.position - b.position);
  }

  return products;
}

// Filter out editions
function filterProducts(products) {
  const filtered = {};

  for (const handle in products) {
    const shouldExclude = EXCLUDE_PATTERNS.some(pattern => pattern.test(handle));
    if (!shouldExclude) {
      filtered[handle] = products[handle];
    } else {
      console.log(`  Skipping edition: ${handle}`);
    }
  }

  return filtered;
}

// Download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// Extract info from HTML body
function parseBody(html) {
  const info = {
    description: '',
    dimensions: '',
    technique: '',
    materials: '',
    year: new Date().getFullYear(),
    reference: '',
  };

  // Clean HTML
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  // Extract specific fields
  const sizeMatch = text.match(/Size[:\s]+([^\n]+)/i) || text.match(/SIZE[:\s]+([^\n]+)/i);
  if (sizeMatch) info.dimensions = sizeMatch[1].trim();

  const mediumMatch = text.match(/Medium[:\s]+([^\n]+)/i);
  if (mediumMatch) info.materials = mediumMatch[1].trim();

  const techniqueMatch = text.match(/Type[:\s]+([^\n]+)/i);
  if (techniqueMatch) info.technique = techniqueMatch[1].trim();

  const refMatch = text.match(/Reference[:\s]+([^\n<]+)/i) || text.match(/REFERENCE[:\s]+([^\n<]+)/i);
  if (refMatch) info.reference = refMatch[1].trim();

  const yearMatch = text.match(/20[0-9]{2}/);
  if (yearMatch) info.year = parseInt(yearMatch[0]);

  // Clean description (first paragraph usually)
  const firstPara = text.split('\n\n')[0];
  if (firstPara && !firstPara.includes(':') && firstPara.length > 20) {
    info.description = firstPara.trim();
  }

  return info;
}

// Get file extension from URL
function getExtension(url) {
  const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  if (match) {
    const ext = match[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  return 'jpg';
}

// Create markdown file
function createMarkdown(product, slug) {
  const info = parseBody(product.body);

  // Build image list
  const images = product.images.map((img, idx) => {
    const ext = getExtension(img.src);
    return `  - ./${String(idx + 1).padStart(2, '0')}.${ext}`;
  }).join('\n');

  const markdown = `---
title: "${product.title.replace(/"/g, '\\"')}"
slug: ${slug}
price: ${parseFloat(product.price) || 0}
status: ${product.status === 'active' ? 'available' : 'sold'}
stripe_product_id: ""
stripe_price_id: ""
dimensions: "${info.dimensions}"
technique: "${info.technique}"
materials: "${info.materials}"
year: ${info.year}
reference: "${info.reference}"
featured: false
shopify_handle: "${product.handle}"
images:
${images}
tags: []
---

${info.description}
`;

  return markdown;
}

// Main migration function
async function migrate() {
  console.log('Starting Shopify migration...\n');

  // Read CSV
  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const rows = parseCSV(csvContent);
  console.log(`  Found ${rows.length} rows\n`);

  // Group by product
  console.log('Grouping by product...');
  const allProducts = groupByProduct(rows);
  console.log(`  Found ${Object.keys(allProducts).length} products\n`);

  // Filter editions
  console.log('Filtering out editions...');
  const products = filterProducts(allProducts);
  console.log(`  ${Object.keys(products).length} original pen plots to import\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Process each product
  const handles = Object.keys(products);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    const product = products[handle];
    const slug = sanitizeSlug(handle);

    console.log(`[${i + 1}/${handles.length}] ${product.title}`);
    console.log(`  Handle: ${handle} -> ${slug}`);

    // Create artwork folder
    const artworkDir = path.join(OUTPUT_DIR, slug);
    if (!fs.existsSync(artworkDir)) {
      fs.mkdirSync(artworkDir, { recursive: true });
    }

    // Create markdown
    const markdown = createMarkdown(product, slug);
    fs.writeFileSync(path.join(artworkDir, 'index.md'), markdown);
    console.log(`  Created index.md`);

    // Download images
    for (let j = 0; j < product.images.length; j++) {
      const img = product.images[j];
      const ext = getExtension(img.src);
      const filename = `${String(j + 1).padStart(2, '0')}.${ext}`;
      const filepath = path.join(artworkDir, filename);

      try {
        await downloadImage(img.src, filepath);
        console.log(`  Downloaded ${filename}`);
      } catch (err) {
        console.log(`  Failed to download ${filename}: ${err.message}`);
      }
    }

    success++;
    console.log('');
  }

  console.log('Migration complete!');
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\nArtworks saved to: ${OUTPUT_DIR}`);
}

// Run migration
migrate().catch(console.error);
