const multer = require('multer');

// Store uploads in memory (not on disk) since we convert them straight to
// base64 data URIs and save them in MongoDB — this also works on Vercel's
// read-only serverless filesystem, where writing to disk isn't reliable.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 } // 4MB per file
});

function fileToDataUri(file) {
  if (!file) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

module.exports = { upload, fileToDataUri };
