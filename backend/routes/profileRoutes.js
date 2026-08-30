const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, fileToDataUri } = require('../middleware/upload');

// Ensure there's always exactly one profile document
async function getOrCreateProfile() {
  let profile = await Profile.findOne();
  if (!profile) profile = await Profile.create({});
  return profile;
}

// @route   GET /api/profile — public
router.get('/', async (req, res) => {
  try {
    const profile = await getOrCreateProfile();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

// @route   PUT /api/profile — admin only
// Accepts multipart/form-data: text fields + optional "photo" and "resume" files
router.put(
  '/',
  authMiddleware,
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'resume', maxCount: 1 }]),
  async (req, res) => {
    try {
      const profile = await getOrCreateProfile();
      

      const { name, role, bio, skills, email, github, linkedin, githubUsername, syncProjectsFromGithub } = req.body;
      if (name !== undefined) profile.name = name;
      if (role !== undefined) profile.role = role;
      if (bio !== undefined) profile.bio = bio;
      if (skills !== undefined) {
        profile.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (email !== undefined) profile.email = email;
      if (phone !== undefined) profile.phone = phone;
      if (github !== undefined) profile.github = github;
      if (linkedin !== undefined) profile.linkedin = linkedin;
      if (githubUsername !== undefined) profile.githubUsername = githubUsername.trim();
      if (syncProjectsFromGithub !== undefined) {
        profile.syncProjectsFromGithub = syncProjectsFromGithub === 'true' || syncProjectsFromGithub === true;
      }

      if (req.files?.photo?.[0]) {
        profile.photo = fileToDataUri(req.files.photo[0]);
      }
      if (req.files?.resume?.[0]) {
        profile.resume = fileToDataUri(req.files.resume[0]);
        profile.resumeFilename = req.files.resume[0].originalname;
      }

      await profile.save();
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: err.message || 'Could not update profile' });
    }
  }
);

module.exports = router;
