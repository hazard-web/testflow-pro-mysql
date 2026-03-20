/**
 * AI Routes — Test case generation, bug analysis, etc.
 * Requires authentication
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  generateTestCases,
  analyzeBug,
  checkOllamaStatus,
  getAvailableModels,
} = require('../utils/ollama');
const logger = require('../utils/logger');

const router = express.Router();

// ── Middleware: Require authentication for all AI routes
router.use(authenticate);

/**
 * POST /api/ai/health
 * Check if Ollama service is available
 */
router.get('/health', async (req, res, next) => {
  try {
    const isAvailable = await checkOllamaStatus();
    const models = await getAvailableModels();

    res.json({
      status: isAvailable ? 'available' : 'unavailable',
      available: isAvailable,
      models: models,
      message: isAvailable
        ? 'Ollama is running and ready'
        : 'Ollama service not available. Please start Ollama.',
    });
  } catch (error) {
    logger.error('AI health check error:', error.message);
    next(error);
  }
});

/**
 * POST /api/ai/generate-test-cases
 * Generate test cases from a requirement description
 */
router.post(
  '/generate-test-cases',
  body('requirement')
    .trim()
    .notEmpty()
    .withMessage('Requirement is required')
    .isLength({ min: 10 })
    .withMessage('Requirement must be at least 10 characters'),
  async (req, res, next) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { requirement } = req.body;
      logger.info(`Generating test cases for requirement: ${requirement.substring(0, 50)}...`);

      // Call Ollama to generate test cases
      const result = await generateTestCases(requirement);

      if (!result.success) {
        return res.status(503).json({
          success: false,
          error: result.error,
          hint: result.hint || 'Check that Ollama is running: ollama serve',
        });
      }

      // Return generated test cases
      res.json({
        success: true,
        data: result.testCases,
        model: result.model,
        count: result.testCases.length,
      });
    } catch (error) {
      logger.error('Generate test cases error:', error.message);
      next(error);
    }
  }
);

/**
 * POST /api/ai/analyze-bug
 * Analyze a bug description and suggest severity, category, priority
 */
router.post(
  '/analyze-bug',
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Bug description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  async (req, res, next) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description } = req.body;
      logger.info(`Analyzing bug: ${description.substring(0, 50)}...`);

      // Call Ollama to analyze bug
      const result = await analyzeBug(description);

      if (!result.success) {
        return res.status(503).json({
          success: false,
          error: result.error,
          hint: 'Check that Ollama is running',
        });
      }

      // Return analysis
      res.json({
        success: true,
        data: result.analysis,
        model: result.model,
      });
    } catch (error) {
      logger.error('Analyze bug error:', error.message);
      next(error);
    }
  }
);

module.exports = router;
