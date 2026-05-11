const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
  spotifyId:  { type: String },
  title:      { type: String, required: true },
  artist:     { type: String, required: true },
  album:      { type: String },
  albumArt:   { type: String },
  previewUrl: { type: String },
  durationMs: { type: Number }
}, { _id: false });

const MixtapeSchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true, index: true },
  title:      { type: String, required: true, trim: true, maxlength: 60 },
  design:     { type: String, enum: ['tdk','retro','clear','glitter'], default: 'tdk' },
  sides:      { type: Number, enum: [1, 2], default: 1 },
  tracksA:    { type: [TrackSchema], validate: v => v.length <= 10 },
  tracksB:    { type: [TrackSchema], validate: v => v.length <= 10 },
  createdBy:  { type: String, default: 'anonymous' },
  playCount:  { type: Number, default: 0 },
  isPublic:   { type: Boolean, default: true }
}, { timestamps: true }); // adds createdAt, updatedAt automatically

module.exports = mongoose.model('Mixtape', MixtapeSchema);