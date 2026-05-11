const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const Mixtape  = require('../models/Mixtape');

const EXPORT_DIR = path.join(__dirname, '../exports');
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR);

// ── POST /api/exports/:code ───────────────────────────────────
// Receives base64 PNG from frontend, saves to disk, returns URL
router.post('/:code', async (req, res, next) => {
  try {
    const { imageData, type } = req.body;   // type: 'square' | 'story'
    const code = req.params.code.toUpperCase();

    if (!imageData) {
      return res.status(400).json({ success: false, error: 'No image data' });
    }

    const tape = await Mixtape.findOne({ code });
    if (!tape) {
      return res.status(404).json({ success: false, error: 'Tape not found' });
    }

    // Strip the data:image/png;base64, header
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    const filename = `${code}-${type}-${Date.now()}.png`;
    const filepath = path.join(EXPORT_DIR, filename);
    fs.writeFileSync(filepath, buffer);

    const imageUrl = `/exports/${filename}`;
    res.json({ success: true, imageUrl });

  } catch (err) {
    next(err);
  }
});

module.exports = router;