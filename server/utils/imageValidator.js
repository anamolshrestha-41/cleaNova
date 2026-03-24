const fs = require('fs');
const path = require('path');

const MIN_SIZE_BYTES = 10 * 1024; // 10 KB

// Magic bytes for JPEG, PNG, WebP
const MAGIC = [
  { ext: '.jpg',  bytes: [0xFF, 0xD8, 0xFF] },
  { ext: '.jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { ext: '.png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { ext: '.webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
];

const WASTE_KEYWORDS = [
  'garbage', 'waste', 'trash', 'dump', 'litter', 'rubbish', 'sewage',
  'overflow', 'bin', 'smell', 'dirty', 'filth', 'debris', 'pile',
  'plastic', 'drain', 'blocked', 'stagnant', 'rodent', 'flies',
  'construction', 'broken', 'scattered', 'spill', 'leak',
];

const validateImage = (filePath, description = '') => {
  let stat;
  try { stat = fs.statSync(filePath); } catch {
    return { valid: false, confidence: 0, reason: 'Image file could not be read.' };
  }

  if (stat.size < MIN_SIZE_BYTES)
    return { valid: false, confidence: 0.1, reason: 'Image appears to be too small or blank. Please upload a real photo.' };

  // Magic-byte check — read first 12 bytes
  let header;
  try {
    const buf = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    header = buf;
  } catch {
    return { valid: false, confidence: 0, reason: 'Could not read image header.' };
  }

  const ext = path.extname(filePath).toLowerCase();
  const magic = MAGIC.find(m => m.ext === ext);
  if (magic && !magic.bytes.every((b, i) => header[i] === b))
    return { valid: false, confidence: 0, reason: 'File does not appear to be a valid image.' };

  const descLower = description.toLowerCase();
  const matchCount = WASTE_KEYWORDS.filter(kw => descLower.includes(kw)).length;
  const keywordScore = Math.min(matchCount / 3, 1);
  const sizeScore = Math.min(stat.size / (500 * 1024), 1);
  const confidence = parseFloat((0.5 * sizeScore + 0.5 * keywordScore).toFixed(2));

  if (confidence < 0.2)
    return { valid: false, confidence, reason: 'Image does not appear to show a waste issue. Please upload a relevant photo.' };

  return { valid: true, confidence, reason: 'OK' };
};

module.exports = validateImage;
