// ─────────────────────────────────────────────
//  Custom Fields Routes — GET/POST/PUT/DELETE
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
// GET /custom-fields/:projectId
// Fetch all custom fields for a project
// ─────────────────────────────────────────────
router.get('/:projectId', authenticate, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const fields = await db('custom_fields')
      .where('project_id', projectId)
      .orderBy('order', 'asc');
    res.json(fields);
  } catch (err) {
    console.error('❌ Fetch custom fields error:', err.message);
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
});

// ─────────────────────────────────────────────
// POST /custom-fields/:projectId
// Create new custom field
// ─────────────────────────────────────────────
router.post('/:projectId', authenticate, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { fieldName, fieldType, fieldOptions, isRequired, helpText } = req.body;

    if (!fieldName || !fieldType) {
      return res.status(400).json({ error: 'Field name and type are required' });
    }

    // Validate field type
    const validTypes = ['text', 'select', 'multiselect', 'number', 'date', 'checkbox'];
    if (!validTypes.includes(fieldType)) {
      return res.status(400).json({ error: 'Invalid field type' });
    }

    // Check if field already exists
    const existing = await db('custom_fields')
      .where('project_id', projectId)
      .where('field_name', fieldName)
      .first();
    if (existing) return res.status(409).json({ error: 'Field already exists' });

    const id = uuidv4();
    const maxOrder = await db('custom_fields')
      .where('project_id', projectId)
      .max('order as maxOrder')
      .first();

    await db('custom_fields').insert({
      id,
      project_id: projectId,
      field_name: fieldName,
      field_type: fieldType,
      field_options: fieldOptions ? JSON.stringify(fieldOptions) : null,
      is_required: isRequired || false,
      help_text: helpText || null,
      order: (maxOrder?.maxOrder || 0) + 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({ id, message: 'Custom field created' });
  } catch (err) {
    console.error('❌ Create custom field error:', err.message);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

// ─────────────────────────────────────────────
// PUT /custom-fields/:fieldId
// Update custom field
// ─────────────────────────────────────────────
router.put('/:fieldId', authenticate, async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { fieldName, fieldType, fieldOptions, isRequired, helpText, order } = req.body;

    const field = await db('custom_fields').where('id', fieldId).first();
    if (!field) return res.status(404).json({ error: 'Custom field not found' });

    await db('custom_fields').where('id', fieldId).update({
      field_name: fieldName || field.field_name,
      field_type: fieldType || field.field_type,
      field_options: fieldOptions ? JSON.stringify(fieldOptions) : field.field_options,
      is_required: isRequired !== undefined ? isRequired : field.is_required,
      help_text: helpText !== undefined ? helpText : field.help_text,
      order: order !== undefined ? order : field.order,
      updated_at: new Date(),
    });

    res.json({ message: 'Custom field updated' });
  } catch (err) {
    console.error('❌ Update custom field error:', err.message);
    res.status(500).json({ error: 'Failed to update custom field' });
  }
});

// ─────────────────────────────────────────────
// DELETE /custom-fields/:fieldId
// Delete custom field
// ─────────────────────────────────────────────
router.delete('/:fieldId', authenticate, async (req, res) => {
  try {
    const { fieldId } = req.params;

    const field = await db('custom_fields').where('id', fieldId).first();
    if (!field) return res.status(404).json({ error: 'Custom field not found' });

    // Delete associated values
    await db('custom_field_values').where('field_id', fieldId).delete();

    // Delete the field
    await db('custom_fields').where('id', fieldId).delete();

    res.json({ message: 'Custom field deleted' });
  } catch (err) {
    console.error('❌ Delete custom field error:', err.message);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
});

// ─────────────────────────────────────────────
// GET /custom-fields/values/:testcaseId
// Get all custom field values for a test case
// ─────────────────────────────────────────────
router.get('/values/:testcaseId', authenticate, async (req, res) => {
  try {
    const { testcaseId } = req.params;

    const values = await db('custom_field_values')
      .where('tc_id', testcaseId)
      .join('custom_fields', 'custom_fields.id', '=', 'custom_field_values.field_id')
      .select('custom_field_values.*', 'custom_fields.field_name', 'custom_fields.field_type');

    res.json(values);
  } catch (err) {
    console.error('❌ Fetch custom field values error:', err.message);
    res.status(500).json({ error: 'Failed to fetch custom field values' });
  }
});

// ─────────────────────────────────────────────
// POST /custom-fields/values/:testcaseId
// Set custom field value for test case
// ─────────────────────────────────────────────
router.post('/values/:testcaseId', authenticate, async (req, res) => {
  try {
    const { testcaseId } = req.params;
    const { fieldId, value } = req.body;

    if (!fieldId || value === undefined) {
      return res.status(400).json({ error: 'Field ID and value are required' });
    }

    const tc = await db('test_cases').where('id', testcaseId).first();
    if (!tc) return res.status(404).json({ error: 'Test case not found' });

    const field = await db('custom_fields').where('id', fieldId).first();
    if (!field) return res.status(404).json({ error: 'Custom field not found' });

    // Check if value already exists
    const existing = await db('custom_field_values')
      .where('tc_id', testcaseId)
      .where('field_id', fieldId)
      .first();

    if (existing) {
      // Update existing value
      await db('custom_field_values')
        .where('tc_id', testcaseId)
        .where('field_id', fieldId)
        .update({
          value: value ? JSON.stringify(value) : null,
          updated_at: new Date(),
        });
    } else {
      // Create new value
      const id = uuidv4();
      await db('custom_field_values').insert({
        id,
        tc_id: testcaseId,
        field_id: fieldId,
        value: value ? JSON.stringify(value) : null,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    res.json({ message: 'Custom field value saved' });
  } catch (err) {
    console.error('❌ Save custom field value error:', err.message);
    res.status(500).json({ error: 'Failed to save custom field value' });
  }
});

// ─────────────────────────────────────────────
// DELETE /custom-fields/values/:valueId
// Delete custom field value
// ─────────────────────────────────────────────
router.delete('/values/:valueId', authenticate, async (req, res) => {
  try {
    const { valueId } = req.params;

    const value = await db('custom_field_values').where('id', valueId).first();
    if (!value) return res.status(404).json({ error: 'Custom field value not found' });

    await db('custom_field_values').where('id', valueId).delete();

    res.json({ message: 'Custom field value deleted' });
  } catch (err) {
    console.error('❌ Delete custom field value error:', err.message);
    res.status(500).json({ error: 'Failed to delete custom field value' });
  }
});

module.exports = router;
