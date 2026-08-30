const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, fileToDataUri } = require('../middleware/upload');

// @route   GET /api/projects/github/:username — admin only
// Fetches the user's public GitHub repos so they can be imported as projects
// with one click, instead of retyping everything by hand.
router.get('/github/:username', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(req.params.username)}/repos?sort=updated&per_page=100`,
      { headers: { 'User-Agent': 'portfolio-app' } }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Could not fetch repositories from GitHub. Check the username.' });
    }

    const repos = await response.json();

    const simplified = repos
      .filter(r => !r.fork) // skip forked repos, usually not "your own" projects
      .map(r => ({
        name: r.name,
        description: r.description || '',
        url: r.html_url,
        language: r.language || '',
        updatedAt: r.updated_at
      }));

    res.json(simplified);
  } catch (err) {
    res.status(500).json({ error: 'Could not reach GitHub. Try again in a moment.' });
  }
});

// @route   GET /api/projects — public
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch projects' });
  }
});

// @route   POST /api/projects — admin only
// Accepts multipart/form-data: title, description, stack (comma-separated), link,
// imageUrl (optional pasted URL) and/or an "image" file upload.
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, stack, link, imageUrl } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const project = await Project.create({
      title,
      description,
      stack: stack ? stack.split(',').map(s => s.trim()).filter(Boolean) : [],
      link,
      image: req.file ? fileToDataUri(req.file) : (imageUrl || '')
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Could not create project' });
  }
});

// @route   PUT /api/projects/:id — admin only
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { title, description, stack, link, imageUrl } = req.body;
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (stack !== undefined) project.stack = stack.split(',').map(s => s.trim()).filter(Boolean);
    if (link !== undefined) project.link = link;
    if (req.file) {
      project.image = fileToDataUri(req.file);
    } else if (imageUrl !== undefined) {
      project.image = imageUrl;
    }

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Could not update project' });
  }
});

// @route   DELETE /api/projects/:id — admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete project' });
  }
});

module.exports = router;
