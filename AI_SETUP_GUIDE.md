# AI Test Case Generation Integration - Setup Guide

## Overview

Your TestFlow Pro application now has AI-powered test case generation using **Ollama** - a completely free, private, on-device AI service.

## Architecture

```
Frontend (React)
    ↓
/api/ai/generate-test-cases (POST)
    ↓
Backend (Express)
    ↓
Ollama API (localhost:11434)
    ↓
Local LLM (Mistral 7B)
```

## Features Implemented

### 1. **Backend AI Service** (`/backend/src/utils/ollama.js`)

- `generateTestCases(requirement)` - Generate test cases from requirements
- `analyzeBug(bugDescription)` - Analyze bugs and suggest severity/category
- `checkOllamaStatus()` - Verify Ollama is running
- `getAvailableModels()` - List available AI models

### 2. **AI Routes** (`/backend/src/routes/ai.routes.js`)

- `GET /api/ai/health` - Check Ollama service status
- `POST /api/ai/generate-test-cases` - Generate test cases
- `POST /api/ai/analyze-bug` - Analyze bug descriptions

### 3. **Frontend Component** (`AITestCaseGenerator` in shared.jsx)

- Modal for entering requirements
- Real-time test case generation
- Preview generated test cases before inserting
- Auto-fills test case form with generated data

## Getting Started

### Step 1: Install Ollama

```bash
# Download from ollama.ai and install
# macOS: brew install ollama
# or download from https://ollama.ai
```

### Step 2: Start Ollama

```bash
# Terminal 1: Start Ollama service
ollama serve

# In another terminal, pull a model (one-time)
ollama pull mistral
```

### Step 3: Test Backend Connection

```bash
# Check if Ollama is connected
curl -X GET http://localhost:5000/api/ai/health
```

Expected response:

```json
{
  "status": "available",
  "available": true,
  "models": ["mistral:latest"]
}
```

### Step 4: Use in Frontend

1. **Navigate to Test Cases page** → Click "🤖 AI Generate" button
2. **Enter Requirement** → Describe what you want to test:
   ```
   User should be able to login with email and password,
   with validation for empty fields and incorrect credentials
   ```
3. **Click Generate** → Wait for AI to generate test cases
4. **Review Generated Test Cases** → See 5 test cases with steps
5. **Click Insert** → Auto-fills first test case into the form
6. **Customize & Save** → Edit as needed and save

## API Usage Examples

### Generate Test Cases

```javascript
const response = await fetch('/api/ai/generate-test-cases', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    requirement: 'User registration with email validation',
  }),
});

const { data } = await response.json();
// data = [
//   {
//     "title": "Valid email registration",
//     "steps": [
//       { "action": "...", "expected": "..." }
//     ],
//     "priority": "high"
//   },
//   ...
// ]
```

### Analyze Bug

```javascript
const response = await fetch('/api/ai/analyze-bug', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    description: 'Login button not responding to clicks',
  }),
});

const { data } = await response.json();
// data = {
//   "severity": "high",
//   "category": "Functional",
//   "priority": "high",
//   "rootCauseHypothesis": "..."
// }
```

## Configuration

### Environment Variables (Optional)

```bash
# .env file
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

### Supported Models

```bash
ollama pull mistral       # 4GB - Fast, balanced (default)
ollama pull llama2        # 3.8GB - Slightly slower, good quality
ollama pull neural-chat   # 4GB - Optimized for chat
```

## Troubleshooting

### "Ollama service is not running"

```bash
# Make sure Ollama is running
ollama serve

# Check status
curl http://localhost:11434/api/tags
```

### Slow Response (First Time)

- First request downloads the model (~4GB)
- Subsequent requests will be faster
- Disable timeout if needed in `ollama.js`

### Model Not Found

```bash
# List available models
ollama list

# Pull mistral if missing
ollama pull mistral
```

### Port Already in Use

```bash
# Change Ollama port in environment
OLLAMA_URL=http://localhost:11435
```

## Performance Notes

| Metric                    | Value              |
| ------------------------- | ------------------ |
| First Request (new model) | ~30-60 seconds     |
| Subsequent Requests       | 10-20 seconds      |
| Memory Usage              | ~8GB (for Mistral) |
| CPU Usage                 | 50-70%             |
| Cost                      | Free forever       |

## Next Steps

1. ✅ AI Test Case Generation (Done)
2. 🔄 AI Bug Analysis (Ready to use)
3. 📋 Suggested features:
   - Test case similarity detection
   - Automated test documentation
   - Performance test suggestions
   - Security test recommendations

## Files Created/Modified

**New Files:**

- `/backend/src/utils/ollama.js` - Ollama integration service
- `/backend/src/routes/ai.routes.js` - AI API endpoints

**Modified Files:**

- `/backend/src/server.js` - Added AI routes registration
- `/frontend/src/components/shared.jsx` - Added AITestCaseGenerator component
- `/frontend/src/pages/index.jsx` - Added AI button and modal to TestCases

## Support

If you encounter issues:

1. Check Ollama is running: `curl http://localhost:11434/api/tags`
2. Review backend logs for errors
3. Ensure model is downloaded: `ollama list`
4. Check network connection if running Ollama remotely

---

**Happy AI-powered testing!** 🚀
