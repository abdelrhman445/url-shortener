const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: String,
  details: Object,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

logSchema.index({ createdAt: -1 });
logSchema.index({ userId: 1 });

module.exports = mongoose.model('Log', logSchema);