const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  tapes: [
    {
      tapeCode: { type: String, required: true },
      addedAt:  { type: Date, default: Date.now },
      isOwner:  { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Collection', CollectionSchema);