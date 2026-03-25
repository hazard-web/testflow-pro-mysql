// ─────────────────────────────────────────────
//  Workflow State Routes — GET/POST/PUT
// ─────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');

// Middleware to check project access
const checkProjectAccess = async (req, res, next) => {
  const { projectId } = req.params;
  if (!projectId) return res.status(400).json({ error: 'Project ID required' });
  const project = await db('projects').where('id', projectId).first();
  if (!project) return res.status(404).json({ error: 'Project not found' });
  next();
};

// ─────────────────────────────────────────────
// GET /workflow/states/:projectId
// Fetch all workflow states for a project
// ─────────────────────────────────────────────
router.get('/states/:projectId', authenticate, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const states = await db('workflow_states')
      .where('project_id', projectId)
      .orderBy('order', 'asc');
    res.json(states);
  } catch (err) {
    console.error('❌ Fetch workflow states error:', err.message);
    res.status(500).json({ error: 'Failed to fetch workflow states' });
  }
});

// ─────────────────────────────────────────────
// POST /workflow/states/:projectId
// Create new workflow state
// ─────────────────────────────────────────────
router.post('/states/:projectId', authenticate, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, color, order, isDefault, isFinal } = req.body;

    if (!name) return res.status(400).json({ error: 'State name is required' });

    // Check if state already exists
    const existing = await db('workflow_states')
      .where('project_id', projectId)
      .where('name', name)
      .first();
    if (existing) return res.status(409).json({ error: 'State already exists' });

    const id = uuidv4();
    await db('workflow_states').insert({
      id,
      project_id: projectId,
      name,
      color: color || '#5B8DEE',
      order: order || 0,
      is_default: isDefault || false,
      is_final: isFinal || false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({ id, message: 'Workflow state created' });
  } catch (err) {
    console.error('❌ Create workflow state error:', err.message);
    res.status(500).json({ error: 'Failed to create workflow state' });
  }
});

// ─────────────────────────────────────────────
// PUT /workflow/states/:stateId
// Update workflow state
// ─────────────────────────────────────────────
router.put('/states/:stateId', authenticate, async (req, res) => {
  try {
    const { stateId } = req.params;
    const { name, color, order, isDefault, isFinal } = req.body;

    const state = await db('workflow_states').where('id', stateId).first();
    if (!state) return res.status(404).json({ error: 'Workflow state not found' });

    await db('workflow_states').where('id', stateId).update({
      name: name || state.name,
      color: color || state.color,
      order: order !== undefined ? order : state.order,
      is_default: isDefault !== undefined ? isDefault : state.is_default,
      is_final: isFinal !== undefined ? isFinal : state.is_final,
      updated_at: new Date(),
    });

    res.json({ message: 'Workflow state updated' });
  } catch (err) {
    console.error('❌ Update workflow state error:', err.message);
    res.status(500).json({ error: 'Failed to update workflow state' });
  }
});

// ─────────────────────────────────────────────
// DELETE /workflow/states/:stateId
// Delete workflow state
// ─────────────────────────────────────────────
router.delete('/states/:stateId', authenticate, async (req, res) => {
  try {
    const { stateId } = req.params;

    const state = await db('workflow_states').where('id', stateId).first();
    if (!state) return res.status(404).json({ error: 'Workflow state not found' });

    // Prevent deletion if test cases use this state
    const count = await db('test_cases').where('workflow_state', state.name).count('* as cnt').first();
    if (count.cnt > 0) {
      return res.status(400).json({ error: 'Cannot delete state that is in use' });
    }

    await db('workflow_states').where('id', stateId).delete();
    res.json({ message: 'Workflow state deleted' });
  } catch (err) {
    console.error('❌ Delete workflow state error:', err.message);
    res.status(500).json({ error: 'Failed to delete workflow state' });
  }
});

// ─────────────────────────────────────────────
// PUT /workflow/transition/:testcaseId
// Transition test case to new workflow state
// ─────────────────────────────────────────────
router.put('/transition/:testcaseId', authenticate, async (req, res) => {
  try {
    const { testcaseId } = req.params;
    const { toState, notes } = req.body;

    if (!toState) return res.status(400).json({ error: 'Target state is required' });

    const tc = await db('test_cases').where('id', testcaseId).first();
    if (!tc) return res.status(404).json({ error: 'Test case not found' });

    const fromState = tc.workflow_state;

    // Update test case
    await db('test_cases').where('id', testcaseId).update({
      workflow_state: toState,
      updated_at: new Date(),
    });

    // Record in workflow history
    const historyId = uuidv4();
    await db('testcase_workflow_history').insert({
      id: historyId,
      tc_id: testcaseId,
      from_state: fromState || null,
      to_state: toState,
      changed_by: req.user?.name || 'System',
      notes: notes || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.json({ message: 'Test case transitioned', historyId });
  } catch (err) {
    console.error('❌ Workflow transition error:', err.message);
    res.status(500).json({ error: 'Failed to transition workflow state' });
  }
});

// ─────────────────────────────────────────────
// GET /workflow/history/:testcaseId
// Get workflow history for test case
// ─────────────────────────────────────────────
router.get('/history/:testcaseId', authenticate, async (req, res) => {
  try {
    const { testcaseId } = req.params;

    const history = await db('testcase_workflow_history')
      .where('tc_id', testcaseId)
      .orderBy('created_at', 'desc');

    res.json(history);
  } catch (err) {
    console.error('❌ Fetch workflow history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch workflow history' });
  }
});

module.exports = router;
