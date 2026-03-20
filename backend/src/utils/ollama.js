/**
 * Ollama AI Integration
 * Connects to local Ollama instance for test case generation and bug analysis
 */

const axios = require('axios');
const logger = require('./logger');

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'mistral';

/**
 * Generate test cases using Ollama
 * @param {string} requirement - Test case requirement/description
 * @returns {Promise<Object>} Generated test cases
 */
async function generateTestCases(requirement) {
  try {
    const prompt = `Generate 3 test cases as JSON:
[{"title":"Test","steps":[{"action":"action","expected":"expected"}],"priority":"high|medium|low"}]
Requirement: ${requirement}
Return ONLY JSON.`;

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: DEFAULT_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.3,
      },
      {
        timeout: 30000, // 30 second timeout for faster response
      }
    );

    if (!response.data || !response.data.response) {
      throw new Error('Invalid response from Ollama');
    }

    // Parse the response text to extract JSON
    const jsonResponse = response.data.response.trim();

    // Try to extract JSON from the response
    const jsonMatch = jsonResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.warn('Could not find JSON in Ollama response:', jsonResponse);
      return {
        success: false,
        error: 'Could not parse AI response',
        rawResponse: jsonResponse,
      };
    }

    const testCases = JSON.parse(jsonMatch[0]);

    // Validate test cases structure
    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new Error('Invalid test cases format');
    }

    logger.info(`Generated ${testCases.length} test cases for requirement`);

    return {
      success: true,
      testCases: testCases,
      model: DEFAULT_MODEL,
    };
  } catch (error) {
    logger.error('Ollama test case generation error:', error.message);

    // Check if Ollama is not running
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Ollama service is not running. Please start Ollama first.',
        hint: 'Run: ollama serve',
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Analyze bug description using Ollama
 * @param {string} bugDescription - Bug description
 * @returns {Promise<Object>} Bug analysis with severity and category
 */
async function analyzeBug(bugDescription) {
  try {
    const prompt = `You are a QA expert. Analyze this bug report and provide:
1. Severity level (critical, high, medium, low)
2. Category (UI, Performance, Functional, Database, Security, Other)
3. Suggested priority (highest, high, medium, low)
4. Root cause hypothesis

Bug Report: "${bugDescription}"

Format as JSON:
{
  "severity": "string",
  "category": "string",
  "priority": "string",
  "rootCauseHypothesis": "string"
}`;

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: DEFAULT_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.7,
      },
      {
        timeout: 30000,
      }
    );

    const jsonResponse = response.data.response.trim();
    const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        success: false,
        error: 'Could not parse AI analysis',
      };
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      analysis: analysis,
      model: DEFAULT_MODEL,
    };
  } catch (error) {
    logger.error('Ollama bug analysis error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if Ollama service is available
 * @returns {Promise<boolean>} True if Ollama is running
 */
async function checkOllamaStatus() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    logger.warn('Ollama status check failed:', error.message);
    return false;
  }
}

/**
 * Get available models from Ollama
 * @returns {Promise<Array>} List of available models
 */
async function getAvailableModels() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000,
    });

    if (response.data && response.data.models) {
      return response.data.models.map(m => m.name);
    }
    return [];
  } catch (error) {
    logger.warn('Could not fetch available models:', error.message);
    return [];
  }
}

module.exports = {
  generateTestCases,
  analyzeBug,
  checkOllamaStatus,
  getAvailableModels,
  OLLAMA_BASE_URL,
  DEFAULT_MODEL,
};
