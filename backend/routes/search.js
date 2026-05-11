const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const ITUNES_URL = 'https://itunes.apple.com/search';

// ── GET /api/search?q=<query>&limit=<1-25> ────────────────────
router.get('/', async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  // ── Validate ────────────────────────────────────────────────
  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter "q" is required'
    });
  }
  if (q.trim().length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Query too long (100 char max)'
    });
  }

  try {
    const { data } = await axios.get(ITUNES_URL, {
      params: {
        term:   q.trim(),
        media:  'music',
        entity: 'song',
        limit:  Math.min(parseInt(limit) || 10, 25)
      },
      timeout: 8000 // fail fast if iTunes is slow
    });

    if (!data.results || data.results.length === 0) {
      return res.json({ success: true, results: [] });
    }

    // ── Shape response ─────────────────────────────────────────
    const results = data.results.map(track => ({
      id:            String(track.trackId),
      itunesTrackId: track.trackId,
      title:         track.trackName,
      artist:        track.artistName,
      album:         track.collectionName  || '',
      // Swap 100x100 for 300x300 — same CDN URL, just replace the size token
      albumArtUrl:   track.artworkUrl100
                       ? track.artworkUrl100.replace('100x100bb', '300x300bb')
                       : null,
      previewUrl:    track.previewUrl    || null,
      trackViewUrl:  track.trackViewUrl  || null,
      durationMs:    track.trackTimeMillis || 0
    }));

    res.json({ success: true, results });

  } catch (err) {
    // Axios wraps HTTP errors — surface them cleanly
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ success: false, error: 'iTunes API timed out' });
    }
    next(err);
  }
});

module.exports = router;