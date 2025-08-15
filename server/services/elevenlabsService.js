const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;
const path = require('path');
const { APIError } = require('../middleware/errorHandler');

class ElevenLabsService {
  constructor() {
    if (!process.env.ELEVENLABS_API_KEY) {
      console.warn('ELEVENLABS_API_KEY not found, TTS will use fallback mode');
    }
    
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'; // Default narrator voice
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    // Ensure audio directory exists
    this.audioDir = path.join(__dirname, '../audio');
    this.ensureAudioDirectory();
  }

  async ensureAudioDirectory() {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create audio directory:', error);
    }
  }

  async generateNarration(text, options = {}) {
    if (!this.apiKey) {
      console.log('ElevenLabs not configured, generating mock narration');
      return this.generateMockNarration(text);
    }

    try {
      const audioBuffer = await this.textToSpeech(text, options);
      const filename = this.generateFilename();
      const filepath = path.join(this.audioDir, filename);
      
      await fs.writeFile(filepath, audioBuffer);
      
      const audioUrl = `/audio/${filename}`;
      const duration = this.estimateAudioDuration(text);
      const subtitles = this.generateSubtitles(text, duration);
      
      console.log(`✅ Generated narration: ${filename} (${duration}s)`);
      
      return {
        audioUrl,
        duration,
        subtitles
      };
    } catch (error) {
      console.error('ElevenLabs TTS failed, using fallback:', error.message);
      return this.generateMockNarration(text);
    }
  }

  async textToSpeech(text, options = {}, retryCount = 0) {
    const url = `${this.baseUrl}/text-to-speech/${this.voiceId}`;
    
    const requestBody = {
      text: text,
      model_id: options.model || 'eleven_monolingual_v1',
      voice_settings: {
        stability: options.stability || 0.75,
        similarity_boost: options.similarity_boost || 0.75,
        style: options.style || 0.5,
        use_speaker_boost: options.use_speaker_boost || true
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      return await response.buffer();
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.warn(`ElevenLabs request failed, retrying (${retryCount + 1}/${this.maxRetries}):`, error.message);
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.textToSpeech(text, options, retryCount + 1);
      }
      throw error;
    }
  }

  generateMockNarration(text) {
    const duration = this.estimateAudioDuration(text);
    const subtitles = this.generateSubtitles(text, duration);
    
    return {
      audioUrl: '/audio/mock-narration.mp3', // This would need to be a real mock file
      duration,
      subtitles
    };
  }

  generateSubtitles(text, totalDuration) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const subtitles = [];
    const avgWordsPerMinute = 150; // Documentary pace
    
    let currentTime = 0;
    
    sentences.forEach((sentence, index) => {
      const words = sentence.trim().split(/\s+/);
      const sentenceDuration = (words.length / avgWordsPerMinute) * 60;
      
      if (sentence.trim().length > 0) {
        subtitles.push({
          start: Math.round(currentTime * 100) / 100,
          end: Math.round((currentTime + sentenceDuration) * 100) / 100,
          text: sentence.trim()
        });
        
        currentTime += sentenceDuration + 0.5; // Small pause between sentences
      }
    });
    
    // Adjust timing to fit total duration
    if (subtitles.length > 0) {
      const actualDuration = subtitles[subtitles.length - 1].end;
      const scaleFactor = totalDuration / actualDuration;
      
      subtitles.forEach(subtitle => {
        subtitle.start *= scaleFactor;
        subtitle.end *= scaleFactor;
        subtitle.start = Math.round(subtitle.start * 100) / 100;
        subtitle.end = Math.round(subtitle.end * 100) / 100;
      });
    }
    
    return subtitles;
  }

  estimateAudioDuration(text) {
    const words = text.split(/\s+/).length;
    const avgWordsPerMinute = 150; // Documentary narration pace
    return Math.round((words / avgWordsPerMinute) * 60);
  }

  generateFilename() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `narration_${timestamp}_${random}.mp3`;
  }

  isRetryableError(error) {
    if (error.message.includes('429')) return true; // Rate limit
    if (error.message.includes('500')) return true; // Server error
    if (error.message.includes('502')) return true; // Bad gateway
    if (error.message.includes('503')) return true; // Service unavailable
    if (error.code === 'ECONNRESET') return true;
    if (error.code === 'ETIMEDOUT') return true;
    return false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAvailableVoices() {
    if (!this.apiKey) {
      return this.getMockVoices();
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        description: voice.description || 'No description available',
        language: voice.labels?.language || 'en'
      }));
    } catch (error) {
      console.error('Failed to fetch voices:', error.message);
      return this.getMockVoices();
    }
  }

  getMockVoices() {
    return [
      {
        id: 'narrator-documentary',
        name: 'Documentary Narrator',
        description: 'Professional documentary-style voice',
        language: 'en'
      },
      {
        id: 'narrator-dramatic',
        name: 'Dramatic Narrator',
        description: 'Cinematic and engaging voice for storytelling',
        language: 'en'
      }
    ];
  }

  async healthCheck() {
    if (!this.apiKey) {
      return { status: 'fallback', message: 'API key not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (response.ok) {
        return { status: 'healthy', service: 'elevenlabs' };
      } else {
        return { status: 'unhealthy', error: `API returned ${response.status}` };
      }
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Clean up old audio files
  async cleanupOldFiles(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.audioDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        if (file.startsWith('narration_') && file.endsWith('.mp3')) {
          const filepath = path.join(this.audioDir, file);
          const stats = await fs.stat(filepath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filepath);
            console.log(`🗑️ Cleaned up old audio file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up audio files:', error);
    }
  }
}

module.exports = ElevenLabsService;