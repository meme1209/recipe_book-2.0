const mongoose = require('mongoose');
const crypto = require('crypto');

const licenseSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  activated: { type: Boolean, default: false },
  activatedAt: { type: Date },
  expiresAt: { type: Date },
  isAdmin: { type: Boolean, default: false }
});

// check expiration
licenseSchema.methods.isExpired = function() {
  return this.expiresAt ? (this.expiresAt.getTime() < Date.now()) : false;
};

// generate a new license
licenseSchema.statics.generate = async function({ isAdmin = false, days = 365 } = {}) {
  const key = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.create({ key, isAdmin, expiresAt });
};

// optional: tidy JSON output
licenseSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('License', licenseSchema);