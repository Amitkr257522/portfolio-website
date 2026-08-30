const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, fileToDataUri } = require('../middleware/upload');

// @route   GET /api/certificates — public
router.get('/', async (req, res) => {
  try {
    const certs = await Certificate.find().sort({ createdAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch certificates' });
  }
});

// @route   POST /api/certificates — admin only
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, issuer, date } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!req.file) return res.status(400).json({ error: 'Please attach a certificate file (image or PDF)' });

    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    const cert = await Certificate.create({
      title,
      issuer,
      date,
      file: fileToDataUri(req.file),
      fileType
    });
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ error: 'Could not add certificate' });
  }
});

// @route   PUT /api/certificates/:id — admin only
router.put('/:id', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });

    const { title, issuer, date } = req.body;
    if (title !== undefined) cert.title = title;
    if (issuer !== undefined) cert.issuer = issuer;
    if (date !== undefined) cert.date = date;
    if (req.file) {
      cert.file = fileToDataUri(req.file);
      cert.fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
    }

    await cert.save();
    res.json(cert);
  } catch (err) {
    res.status(500).json({ error: 'Could not update certificate' });
  }
});

// @route   DELETE /api/certificates/:id — admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json({ message: 'Certificate deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete certificate' });
  }
});

module.exports = router;
