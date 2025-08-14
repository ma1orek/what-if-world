const express = require('express');
const router = express.Router();
const { generateHistoryStream } = require('../services/openaiService');

// Stream endpoint for NDJSON response
router.get('/rewrite-history-stream', async (req, res) => {
  const { prompt } = req.query;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Set headers for NDJSON streaming
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Generate and stream the response
    await generateHistoryStream(prompt, (chunk) => {
      res.write(JSON.stringify(chunk) + '\n');
    });

    // End the stream
    res.write(JSON.stringify({ type: 'done' }) + '\n');
    res.end();
  } catch (error) {
    console.error('Stream generation error:', error);
    res.write(JSON.stringify({ 
      type: 'error', 
      message: error.message 
    }) + '\n');
    res.end();
  }
});

// Fallback non-streaming endpoint
router.post('/rewrite-history', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const result = await generateHistoryStream(prompt);
    res.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;