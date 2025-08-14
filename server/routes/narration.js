const express = require('express');
const router = express.Router();
const ElevenLabsService = require('../services/elevenlabsService');
const { asyncHandler } = require('../middleware/errorHandler');

// Validation middleware for narration requests
const validateNarrationRequest = (req, res, next) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Text is required for narration',
      field: 'text'
    });
  }
  
  if (typeof text !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Text must be a string',
      field: 'text'
    });
  }
  
  if (text.trim().length < 10) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Text must be at least 10 characters long',
      field: 'text'
    });
  }
  
  if (text.length > 5000) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Text must be less than 5000 characters',
      field: 'text'
    });
  }
  
  // Sanitize the text
  req.body.text = text.trim();
  next();
};

// Rate limiting for narration (more restrictive due to TTS costs)
const narrationRateLimitMap = new Map();
const NARRATION_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const NARRATION_RATE_LIMIT_MAX_REQUESTS = 5;

const narrationRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!narrationRateLimitMap.has(clientIP)) {
    narrationRateLimitMap.set(clientIP, { count: 1, resetTime: now + NARRATION_RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = narrationRateLimitMap.get(clientIP);
  
  if (now > clientData.resetTime) {
    narrationRateLimitMap.set(clientIP, { count: 1, resetTime: now + NARRATION_RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (clientData.count >= NARRATION_RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many narration requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

// Helper function to generate mock subtitles
const generateMockSubtitles = (text) => {
  const words = text.split(' ');
  const subtitles = [];
  const wordsPerSubtitle = 8;
  const secondsPerWord = 0.5;
  
  for (let i = 0; i < words.length; i += wordsPerSubtitle) {
    const subtitleWords = words.slice(i, i + wordsPerSubtitle);
    const start = i * secondsPerWord;
    const end = (i + subtitleWords.length) * secondsPerWord;
    
    subtitles.push({
      start,
      end,
      text: subtitleWords.join(' ')
    });
  }
  
  return subtitles;
};

// Initialize ElevenLabs service
let elevenlabsService;
try {
  elevenlabsService = new ElevenLabsService();
} catch (error) {
  console.warn('⚠️ ElevenLabs service not available:', error.message);
}

// POST /api/narrate
router.post('/narrate', narrationRateLimit, validateNarrationRequest, asyncHandler(async (req, res) => {
  const { text, options = {} } = req.body;
  const startTime = Date.now();
  
  console.log(`🎙️ Processing narration request: ${text.length} characters`);
  
  let response;
  
  if (elevenlabsService) {
    try {
      response = await elevenlabsService.generateNarration(text, options);
    } catch (error) {
      console.error('ElevenLabs generation failed:', error.message);
      response = generateFallbackNarration(text);
    }
  } else {
    console.log('Using fallback narration (ElevenLabs not configured)');
    response = generateFallbackNarration(text);
  }
  
  const processingTime = Date.now() - startTime;
  console.log(`✅ Narration processing completed in ${processingTime}ms`);
  
  res.json({
    ...response,
    metadata: {
      processingTime,
      timestamp: new Date().toISOString(),
      textLength: text.length,
      subtitleCount: response.subtitles.length,
      source: elevenlabsService && elevenlabsService.apiKey ? 'elevenlabs' : 'fallback'
    }
  });
}));

// Fallback narration generator
function generateFallbackNarration(text) {
  const duration = estimateAudioDuration(text);
  const subtitles = generateMockSubtitles(text);
  
  return {
    audioUrl: '/audio/mock-narration.mp3',
    duration,
    subtitles
  };
}

function estimateAudioDuration(text) {
  const words = text.split(/\s+/).length;
  const avgWordsPerMinute = 150;
  return Math.round((words / avgWordsPerMinute) * 60);
}

// GET /api/narrate/voices - List available voices
router.get('/narrate/voices', asyncHandler(async (req, res) => {
  let voices;
  
  if (elevenlabsService) {
    try {
      voices = await elevenlabsService.getAvailableVoices();
    } catch (error) {
      console.error('Failed to fetch voices:', error.message);
      voices = elevenlabsService.getMockVoices();
    }
  } else {
    voices = [
      {
        id: 'narrator-documentary',
        name: 'Documentary Narrator',
        description: 'Professional documentary-style voice',
        language: 'en'
      }
    ];
  }
  
  res.json({
    voices,
    count: voices.length,
    service: elevenlabsService && elevenlabsService.apiKey ? 'elevenlabs' : 'fallback'
  });
}));

module.exports = router;