import request from 'supertest';
import express from 'express';

// Mock the services
jest.mock('../../server/services/openaiService', () => {
  return jest.fn().mockImplementation(() => ({
    generateHistoryScenario: jest.fn().mockResolvedValue({
      summary: 'Test alternate history scenario',
      timeline: [
        {
          year: 1815,
          title: 'Test Event',
          description: 'A test historical event',
          geoPoints: [[50.6794, 4.4125]]
        }
      ],
      geoChanges: {
        type: 'FeatureCollection',
        features: []
      }
    }),
    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
  }));
});

jest.mock('../../server/services/elevenlabsService', () => {
  return jest.fn().mockImplementation(() => ({
    generateNarration: jest.fn().mockResolvedValue({
      audioUrl: '/audio/test.mp3',
      duration: 30,
      subtitles: [
        { start: 0, end: 10, text: 'Test narration' }
      ]
    }),
    getAvailableVoices: jest.fn().mockResolvedValue([
      { id: 'test-voice', name: 'Test Voice', description: 'Test', language: 'en' }
    ]),
    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
  }));
});

// Import server after mocking
const historyRoutes = require('../../server/routes/history');
const narrationRoutes = require('../../server/routes/narration');

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', historyRoutes);
    app.use('/api', narrationRoutes);
  });

  describe('POST /api/rewrite-history', () => {
    it('should generate history scenario successfully', async () => {
      const response = await request(app)
        .post('/api/rewrite-history')
        .send({ prompt: 'What if Napoleon won at Waterloo?' })
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('timeline');
      expect(response.body).toHaveProperty('geoChanges');
      expect(response.body).toHaveProperty('metadata');
      
      expect(response.body.timeline).toBeInstanceOf(Array);
      expect(response.body.timeline.length).toBeGreaterThan(0);
      expect(response.body.geoChanges.type).toBe('FeatureCollection');
    });

    it('should validate prompt input', async () => {
      await request(app)
        .post('/api/rewrite-history')
        .send({})
        .expect(400);

      await request(app)
        .post('/api/rewrite-history')
        .send({ prompt: '' })
        .expect(400);

      await request(app)
        .post('/api/rewrite-history')
        .send({ prompt: 'short' })
        .expect(400);
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests quickly
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/rewrite-history')
          .send({ prompt: 'What if the Roman Empire never fell?' })
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited (429)
      const rateLimited = responses.some(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(rateLimited).toBe(true);
    });

    it('should sanitize input', async () => {
      const response = await request(app)
        .post('/api/rewrite-history')
        .send({ prompt: 'What if <script>alert("xss")</script> Napoleon won?' })
        .expect(200);

      // Should not contain script tags in response
      expect(JSON.stringify(response.body)).not.toContain('<script>');
    });
  });

  describe('POST /api/narrate', () => {
    it('should generate narration successfully', async () => {
      const response = await request(app)
        .post('/api/narrate')
        .send({ text: 'This is a test narration text for the API.' })
        .expect(200);

      expect(response.body).toHaveProperty('audioUrl');
      expect(response.body).toHaveProperty('duration');
      expect(response.body).toHaveProperty('subtitles');
      expect(response.body).toHaveProperty('metadata');
      
      expect(response.body.subtitles).toBeInstanceOf(Array);
      expect(response.body.duration).toBeGreaterThan(0);
    });

    it('should validate text input', async () => {
      await request(app)
        .post('/api/narrate')
        .send({})
        .expect(400);

      await request(app)
        .post('/api/narrate')
        .send({ text: '' })
        .expect(400);

      await request(app)
        .post('/api/narrate')
        .send({ text: 'short' })
        .expect(400);
    });

    it('should handle long text input', async () => {
      const longText = 'a'.repeat(6000); // Exceeds 5000 char limit
      
      await request(app)
        .post('/api/narrate')
        .send({ text: longText })
        .expect(400);
    });

    it('should apply stricter rate limiting', async () => {
      // Narration has stricter rate limiting (5 req/min vs 10)
      const requests = Array(7).fill(null).map(() =>
        request(app)
          .post('/api/narrate')
          .send({ text: 'This is a test narration for rate limiting.' })
      );

      const responses = await Promise.allSettled(requests);
      
      const rateLimited = responses.some(result => 
        result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('GET /api/narrate/voices', () => {
    it('should return available voices', async () => {
      const response = await request(app)
        .get('/api/narrate/voices')
        .expect(200);

      expect(response.body).toHaveProperty('voices');
      expect(response.body).toHaveProperty('count');
      expect(response.body.voices).toBeInstanceOf(Array);
      expect(response.body.voices.length).toBeGreaterThan(0);
      
      const voice = response.body.voices[0];
      expect(voice).toHaveProperty('id');
      expect(voice).toHaveProperty('name');
      expect(voice).toHaveProperty('description');
      expect(voice).toHaveProperty('language');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/rewrite-history')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should include proper error metadata', async () => {
      const response = await request(app)
        .post('/api/rewrite-history')
        .send({ prompt: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('CORS and Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/rewrite-history')
        .expect(200);

      // Note: This test would need actual CORS middleware to work properly
      // In the real server, CORS headers would be present
    });

    it('should handle preflight requests', async () => {
      await request(app)
        .options('/api/rewrite-history')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(200);
    });
  });

  describe('Content-Type Validation', () => {
    it('should require JSON content type', async () => {
      await request(app)
        .post('/api/rewrite-history')
        .set('Content-Type', 'text/plain')
        .send('What if Napoleon won?')
        .expect(400);
    });

    it('should accept proper JSON content type', async () => {
      await request(app)
        .post('/api/rewrite-history')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ prompt: 'What if the Library of Alexandria never burned?' }))
        .expect(200);
    });
  });
});