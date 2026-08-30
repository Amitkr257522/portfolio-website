const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  stack: { type: [String], default: [] },
  link: { type: String, default: '' },
  // Either a pasted external image URL, or a data URI from an uploaded file — both are just strings.
  image: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
