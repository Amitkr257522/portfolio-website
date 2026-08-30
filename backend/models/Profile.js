const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: { type: String, default: 'Your Name' },
  role: { type: String, default: 'Full-Stack Developer' },
  bio: { type: String, default: "I design, build, and ship web applications." },
  skills: { type: [String], default: [] },
  email: { type: String, default: '' },
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  // If set and syncProjectsFromGithub is true, the public site's Projects
  // section is populated live from this GitHub account's public repos
  // instead of the manually-added Project documents.
  githubUsername: { type: String, default: '' },
  syncProjectsFromGithub: { type: Boolean, default: false },
  // Photo and resume are stored as data URIs (data:<mimetype>;base64,<data>)
  // so the frontend can use them directly as <img src> / <a href> with no extra file routes.
  photo: { type: String, default: '' },
  resume: { type: String, default: '' },
  resumeFilename: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
