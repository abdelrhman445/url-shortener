const mongoose = require('mongoose');
const shortid = require('shortid');

const linkSchema = new mongoose.Schema({
  shortId: {
    type: String,
    unique: true,
    default: shortid.generate
  },
  originalUrl: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastClicked: Date
}, {
  timestamps: true
});

linkSchema.index({ shortId: 1 });
linkSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Link', linkSchema);