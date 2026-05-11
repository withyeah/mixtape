const express    = require('express');
const router     = express.Router();
const Mixtape    = require('../models/Mixtape');
const Collection = require('../models/Collection');
const { uniqueCode } = require('../utils/codeGenerator');

// ── POST /api/tapes ───────────────────────────────────────────
// Save a new tape. Returns the tape with its generated code.
router.post('/', async (req, res, next) => {
  try {
    const { title, design, sides, tracksA, tracksB, createdBy } = req.body;

    // ── Validate ──────────────────────────────────────────────
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    if (!tracksA || tracksA.length === 0) {
      return res.status(400).json({ success: false, error: 'Side A needs at least 1 track' });
    }
    if (tracksA.length > 10) {
      return res.status(400).json({ success: false, error: 'Side A max 10 tracks' });
    }
    if (tracksB && tracksB.length > 10) {
      return res.status(400).json({ success: false, error: 'Side B max 10 tracks' });
    }

    const code = await uniqueCode();

    const tape = await Mixtape.create({
      code,
      title:     title.trim(),
      design:    design    || 'tdk',
      sides:     sides     || 1,
      tracksA,
      tracksB:   tracksB   || [],
      createdBy: createdBy || 'anonymous'
    });

    // ── Auto-add to creator's collection ──────────────────────
    if (createdBy && createdBy !== 'anonymous') {
      await Collection.findOneAndUpdate(
        { userId: createdBy },
        { $push: { tapes: { tapeCode: code, isOwner: true } } },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ success: true, tape });

  } catch (err) {
    next(err);
  }
});

// ── GET /api/tapes/:code ──────────────────────────────────────
// Fetch any tape by its share code (e.g. MX-4F2K)
router.get('/:code', async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const tape = await Mixtape.findOne({ code, isPublic: true });

    if (!tape) {
      return res.status(404).json({
        success: false,
        error: `No tape found with code "${code}"`
      });
    }

    res.json({ success: true, tape });

  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/tapes/:code/play ───────────────────────────────
// Increment play count when someone loads a tape in the player
router.patch('/:code/play', async (req, res, next) => {
  try {
    const tape = await Mixtape.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      { $inc: { playCount: 1 } },
      { new: true, select: 'code title playCount' }
    );

    if (!tape) {
      return res.status(404).json({ success: false, error: 'Tape not found' });
    }

    res.json({ success: true, playCount: tape.playCount });

  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/tapes/:code ───────────────────────────────────
// Owner can delete their tape
router.delete('/:code', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const code = req.params.code.toUpperCase();

    const tape = await Mixtape.findOne({ code });

    if (!tape) {
      return res.status(404).json({ success: false, error: 'Tape not found' });
    }
    if (tape.createdBy !== userId) {
      return res.status(403).json({ success: false, error: 'Not your tape' });
    }

    await Mixtape.deleteOne({ code });

    // Also remove from all collections
    await Collection.updateMany(
      {},
      { $pull: { tapes: { tapeCode: code } } }
    );

    res.json({ success: true, message: `Tape ${code} deleted` });

  } catch (err) {
    next(err);
  }
});

module.exports = router;