const express = require('express');
const router = express.Router();
const { streamHistoryScenario } = require('../services/openaiService');
const { tts } = require('../services/ttsService');

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true, service: "History Rewriter Live" });
});

// Handle OPTIONS preflight for CORS
router.options('/rewrite-history-stream', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Cache-Control');
  res.sendStatus(200);
});

// Handle OPTIONS preflight
router.options('/rewrite-history-stream', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Accept, Cache-Control');
  res.status(200).end();
});

// Streaming history generation (SSE format)
router.get('/rewrite-history-stream', (req, res) => {
  const prompt = String(req.query.prompt || "").trim();
  console.log("=== REWRITE HISTORY STREAM REQUEST ===");
  console.log("Received request for prompt:", prompt);
  console.log("Headers:", req.headers);
  
  if (!prompt) {
    console.log("No prompt provided, returning 400");
    return res.status(400).send("Missing prompt");
  }
  
  // Check Accept header to determine response format
  const acceptHeader = req.headers.accept || '';
  const isNDJSON = acceptHeader.includes('application/x-ndjson');
  
  if (isNDJSON) {
    // NDJSON format for the new frontend
    res.set({ 
      "Content-Type": "application/x-ndjson", 
      "Cache-Control": "no-cache", 
      "Connection": "keep-alive" 
    });
    res.flushHeaders();
    
    let introSent = false;
    
    const onChunk = (evt) => {
      console.log("Sending NDJSON chunk:", evt.type);
      
      // Transform the chunk format to match what the frontend expects
      if (evt.type === 'summary' && !introSent) {
        res.write(JSON.stringify({ type: 'intro', text: evt.summary }) + '\n');
        introSent = true;
      } else if (evt.type === 'event') {
        res.write(JSON.stringify({ 
          type: 'event', 
          event: {
            id: evt.id || crypto.randomUUID(),
            title: evt.title,
            year: evt.year,
            lat: evt.geoPoints?.[0]?.[0],
            lon: evt.geoPoints?.[0]?.[1]
          },
          narration: evt.description
        }) + '\n');
      } else {
        res.write(JSON.stringify(evt) + '\n');
      }
    };
    
    console.log("Starting streamHistoryScenario (NDJSON)");
    streamHistoryScenario(prompt, onChunk)
      .then(() => { 
        console.log("NDJSON stream completed successfully");
        res.write(JSON.stringify({ type: 'done' }) + '\n');
        res.end(); 
      })
      .catch(err => { 
        onChunk({ type: "error", message: String(err) }); 
        res.end(); 
      });
  } else {
    // SSE format for backward compatibility
    console.log("Using SSE format");
    res.set({ 
      "Content-Type": "text/event-stream", 
      "Cache-Control": "no-cache", 
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Cache-Control"
    });
    console.log("Headers set, flushing...");
    res.flushHeaders();
    
    const onChunk = (evt) => {
      console.log("=== SENDING SSE CHUNK ===", evt.type, evt);
      const data = `data: ${JSON.stringify(evt)}\n\n`;
      console.log("Writing data:", data);
      res.write(data);
    };
    

    
    console.log("=== STARTING STREAM HISTORY SCENARIO ===");
    streamHistoryScenario(prompt, onChunk)
      .then(() => { 
        console.log("=== SSE STREAM COMPLETED SUCCESSFULLY ===");
        res.write("data: [DONE]\n\n"); 
        res.end(); 
      })
      .catch(err => { 
        console.log("=== SSE STREAM ERROR ===", err);
        onChunk({ type: "error", message: String(err) }); 
        res.end(); 
      });
  }
});

// TTS narration
router.post('/narrate', (req, res) => {
  const { text } = req.body || {};
  tts(String(text || ""))
    .then(audioUrl => res.json({ audioUrl }))
    .catch(() => res.json({ audioUrl: null }));
});

// TTS endpoint for ElevenLabs (proxy to avoid exposing API key)
router.post('/tts', async (req, res) => {
  const { text, voice = 'narrator_male_deep' } = req.body || {};
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    // Use existing TTS service
    const audioUrl = await tts(String(text));
    
    if (audioUrl) {
      // If we have a URL, fetch the audio and return as blob
      const audioResponse = await fetch(audioUrl);
      const audioBuffer = await audioResponse.arrayBuffer();
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioBuffer));
    } else {
      res.status(500).json({ error: 'TTS generation failed' });
    }
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

module.exports = router;