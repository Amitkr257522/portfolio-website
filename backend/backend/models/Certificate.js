const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  issuer: { type: String, default: '' },
  date: { type: String, default: '' },
  // Data URI of the uploaded image/PDF (data:<mimetype>;base64,<data>)
  file: { type: String, default: '' },
  fileType: { type: String, default: '' } // 'image' or 'pdf', used to decide how to render it
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
