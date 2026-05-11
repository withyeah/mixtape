const express    = require('express');
const router     = express.Router();
const Collection = require('../models/Collection');
const Mixtape    = require('../models/Mixtape');

// ── GET /api/collections/:userId ─────────────────────────────
// Get all tapes in a user's shelf, with full tape data populated
router.get('/:userId', async (req, res, next) => {
  try {
    const collection = await Collection.findOne({ userId: req.params.userId });

    if (!collection || collection.tapes.length === 0) {
      return res.json({ success: true, tapes: [] });
    }

    // Pull full tape data for each code in the collection
    const codes     = collection.tapes.map(t => t.tapeCode);
    const tapeDocs  = await Mixtape.find({ code: { $in: codes } });

    // Merge ownership metadata back in
    const tapeMap   = Object.fromEntries(tapeDocs.map(t => [t.code, t]));
    const tapes     = collection.tapes
      .filter(entry => tapeMap[entry.tapeCode])   // skip deleted tapes
      .map(entry => ({
        ...tapeMap[entry.tapeCode].toObject(),
        isOwner:  entry.isOwner,
        addedAt:  entry.addedAt
      }));

    res.json({ success: true, tapes });

  } catch (err) {
    next(err);
  }
});

// ── POST /api/collections/:userId/add ─────────────────────────
// Redeem a share code and add that tape to user's shelf
router.post('/:userId/add', async (req, res, next) => {
  try {
    const { userId }  = req.params;
    const { tapeCode } = req.body;

    if (!tapeCode) {
      return res.status(400).json({ success: false, error: 'tapeCode is required' });
    }

    const code = tapeCode.toUpperCase().trim();

    // Verify tape exists and is public
    const tape = await Mixtape.findOne({ code, isPublic: true });
    if (!tape) {
      return res.status(404).json({
        success: false,
        error: `No public tape found with code "${code}"`
      });
    }

    // Check if user already has it
    const existing = await Collection.findOne({
      userId,
      'tapes.tapeCode': code
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Already in your collection'
      });
    }

    // Add to collection
    const collection = await Collection.findOneAndUpdate(
      { userId },
      { $push: { tapes: { tapeCode: code, isOwner: false } } },
      { upsert: true, new: true }
    );

    res.json({ success: true, tape, collectionSize: collection.tapes.length });

  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/collections/:userId/:code ─────────────────────
// Remove a tape from shelf (doesn't delete the tape itself)
router.delete('/:userId/:code', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const code       = req.params.code.toUpperCase();

    await Collection.findOneAndUpdate(
      { userId },
      { $pull: { tapes: { tapeCode: code } } }
    );

    res.json({ success: true, message: `Removed ${code} from shelf` });

  } catch (err) {
    next(err);
  }
});

module.exports = router;