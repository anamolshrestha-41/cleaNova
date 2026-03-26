const fs = require('fs');
const path = require('path');

const MIN_SIZE_BYTES = 1024; // 1 KB — just enough to reject empty/corrupt files

// Magic bytes for JPEG, PNG, WebP
const MAGIC = [
  { ext: '.jpg',  bytes: [0xFF, 0xD8, 0xFF] },
  { ext: '.jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { ext: '.png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { ext: '.webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

const validateImage = (filePath) => {
  let stat;
  try { stat = fs.statSync(filePath); } catch {
    return { valid: false, reason: 'Image file could not be read.' };
  }

  if (stat.size < MIN_SIZE_BYTES)
    return { valid: false, reason: 'Image file appears to be empty. Please upload a real photo.' };

  // Magic-byte check — confirms file is actually the image type it claims to be
  let header;
  try {
    const buf = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    header = buf;
  } catch {
    return { valid: false, reason: 'Could not read image header.' };
  }

  const ext = path.extname(filePath).toLowerCase();
  const magic = MAGIC.find(m => m.ext === ext);
  if (magic && !magic.bytes.every((b, i) => header[i] === b))
    return { valid: false, reason: 'File does not appear to be a valid image.' };

  return { valid: true, reason: 'OK' };
};

module.exports = validateImage;
