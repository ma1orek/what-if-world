import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.query;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  // Send initial data
  res.write(`data: ${JSON.stringify({ type: "summary", summary: `Alternative history scenario: ${prompt}` })}\n\n`);

  // Simulate streaming data (replace with actual AI processing)
  const events = [
    { type: "event", year: 1800, title: "Alternative Timeline Begins", description: "History takes a different turn", geoPoints: [[51.5074, -0.1278]] },
    { type: "event", year: 1850, title: "Major Change Occurs", description: "A pivotal moment changes everything", geoPoints: [[48.8566, 2.3522]] },
    { type: "geoChanges", geoChanges: [] },
    { type: "op", op: "focus", args: { lat: 51.5074, lon: -0.1278 } }
  ];

  for (let i = 0; i < events.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    res.write(`data: ${JSON.stringify(events[i])}\n\n`);
  }

  // Send completion signal
  res.write('data: [DONE]\n\n');
  res.end();
}
