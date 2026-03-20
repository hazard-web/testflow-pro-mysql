// ─────────────────────────────────────────────
//  Projects Routes
// ─────────────────────────────────────────────
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get all projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await db('projects').orderBy('created_at', 'desc');
    res.json({ data: projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single project with test case count
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await db('projects').where('id', req.params.id).first();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const count = await db('test_cases')
      .where('project_id', req.params.id)
      .count('* as total')
      .first();
    project.test_case_count = count?.total || 0;

    res.json({ data: project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, status, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Project name required' });

    const projectId = uuidv4();
    await db('projects').insert({
      id: projectId,
      name: name.trim(),
      description: description || null,
      status: status || 'Active',
      color: color || 'av-blue',
    });

    const project = await db('projects').where('id', projectId).first();
    res.status(201).json({ data: project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, status, color } = req.body;
    const project = await db('projects').where('id', req.params.id).first();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await db('projects')
      .where('id', req.params.id)
      .update({
        name: name !== undefined ? name : project.name,
        description: description !== undefined ? description : project.description,
        status: status !== undefined ? status : project.status,
        color: color !== undefined ? color : project.color,
        updated_at: db.fn.now(),
      });

    const updated = await db('projects').where('id', req.params.id).first();
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project (move test cases to no project)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await db('projects').where('id', req.params.id).first();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await db('test_cases').where('project_id', req.params.id).update({ project_id: null });
    await db('projects').where('id', req.params.id).del();

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
