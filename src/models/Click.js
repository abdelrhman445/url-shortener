const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  link: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Link',
    required: true
  },
  ipAddress: String,
  userAgent: String,
  browser: String,
  platform: String,
  country: String,
  referrer: String
}, {
  timestamps: true
});

clickSchema.index({ link: 1, createdAt: -1 });

module.exports = mongoose.model('Click', clickSchema);