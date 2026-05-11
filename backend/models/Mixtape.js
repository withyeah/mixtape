const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
  itunesTrackId: { type: Number  },           // iTunes numeric track ID
  title:         { type: String, required: true },
  artist:        { type: String, required: true },
  album:         { type: String, default: '' },
  albumArtUrl:   { type: String, default: null }, // 300×300 artwork URL
  previewUrl:    { type: String, default: null }, // 30-sec AAC preview
  trackViewUrl:  { type: String, default: null }, // itunes.apple.com link
  durationMs:    { type: Number, default: 0 }
}, { _id: false });

const MixtapeSchema = new mongoose.Schema({
  code:      { type: String,  required: true, unique: true, index: true },
  title:     { type: String,  required: true, trim: true, maxlength: 60 },
  design:    { type: String,  enum: ['tdk','retro','clear','glitter'], default: 'tdk' },
  sides:     { type: Number,  enum: [1, 2], default: 1 },
  tracksA:   {
    type: [TrackSchema],
    validate: { validator: v => v.length <= 10, message: 'Side A max 10 tracks' }
  },
  tracksB:   {
    type: [TrackSchema],
    validate: { validator: v => v.length <= 10, message: 'Side B max 10 tracks' }
  },
  createdBy: { type: String, default: 'anonymous' },
  playCount: { type: Number, default: 0 },
  isPublic:  { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Mixtape', MixtapeSchema);