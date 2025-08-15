import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // ElevenLabs API configuration - dodaj debugowanie
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
    
    console.log('=== ELEVENLABS DEBUG ===');
    console.log('ELEVENLABS_API_KEY exists:', !!ELEVENLABS_API_KEY);
    console.log('ELEVENLABS_API_KEY length:', ELEVENLABS_API_KEY?.length || 0);
    console.log('VOICE_ID:', VOICE_ID);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('========================');

    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is missing!');
      return res.status(500).json({ 
        error: 'ElevenLabs API key not configured',
        debug: {
          hasKey: !!ELEVENLABS_API_KEY,
          nodeEnv: process.env.NODE_ENV,
          availableKeys: Object.keys(process.env).filter(k => k.includes('ELEVEN'))
        }
      });
    }

    console.log('Calling ElevenLabs API...');
    
    // ElevenLabs TTS API call
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    console.log('ElevenLabs response status:', response.status);
    console.log('ElevenLabs response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error response:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    console.log('Audio generated successfully, size:', audioBuffer.byteLength);

    // Return base64 encoded audio
    res.status(200).json({
      audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
      success: true
    });

  } catch (error) {
    console.error('Narration API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate narration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
