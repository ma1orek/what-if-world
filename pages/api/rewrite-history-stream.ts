import { NextApiRequest, NextApiResponse } from 'next';

// Enhanced event generation based on prompt
function generateEnhancedEvents(prompt: string) {
  const cleanPrompt = prompt.toLowerCase();
  
  // Generate more dynamic content based on prompt
  let baseYear = 1800;
  let events = [];
  
  // Create more varied and interesting timeline
  if (cleanPrompt.includes('roman') || cleanPrompt.includes('empire')) {
    events = [
      { type: "event", year: 476, title: "Rome Never Falls", description: "The Western Roman Empire survives the barbarian invasions through strategic alliances and military reforms", geoPoints: [[41.9028, 12.4964]] },
      { type: "event", year: 800, title: "Carolingian Alliance", description: "Rome and the Frankish kingdoms form a powerful alliance, creating a unified European power", geoPoints: [[48.8566, 2.3522]] },
      { type: "event", year: 1200, title: "Mediterranean Dominance", description: "Roman naval power controls the Mediterranean, establishing trade routes to Asia and Africa", geoPoints: [[35.6762, 139.6503]] },
      { type: "event", year: 1500, title: "Age of Discovery", description: "Roman explorers reach the Americas, establishing colonies and expanding the empire globally", geoPoints: [[40.7128, -74.0060]] },
      { type: "event", year: 1800, title: "Industrial Revolution", description: "Rome leads the industrial revolution, combining ancient engineering with modern technology", geoPoints: [[51.5074, -0.1278]] },
      { type: "event", year: 1900, title: "Global Superpower", description: "The Roman Empire becomes the world's dominant superpower, influencing global politics and culture", geoPoints: [[38.9072, -77.0369]] },
      { type: "event", year: 2025, title: "Modern Rome", description: "Today, the Roman Empire spans six continents with advanced technology and cultural influence", geoPoints: [[41.9028, 12.4964]] }
    ];
  } else if (cleanPrompt.includes('napoleon') || cleanPrompt.includes('waterloo')) {
    events = [
      { type: "event", year: 1815, title: "Victory at Waterloo", description: "Napoleon's tactical brilliance secures victory over the Seventh Coalition", geoPoints: [[50.6794, 4.4125]] },
      { type: "event", year: 1820, title: "Continental Dominance", description: "French empire expands across Europe, establishing French as the continent's lingua franca", geoPoints: [[48.8566, 2.3522]] },
      { type: "event", year: 1850, title: "Industrial Expansion", description: "France leads the industrial revolution, creating the world's most advanced economy", geoPoints: [[51.5074, -0.1278]] },
      { type: "event", year: 1900, title: "Global Empire", description: "French colonies span the globe, from Africa to Asia to the Americas", geoPoints: [[35.6762, 139.6503]] },
      { type: "event", year: 1950, title: "Cold War Power", description: "France emerges as a superpower, rivaling the United States and Soviet Union", geoPoints: [[55.7558, 37.6176]] },
      { type: "event", year: 2025, title: "French Century", description: "The 21st century is known as the French Century, with French culture and technology dominating globally", geoPoints: [[40.7128, -74.0060]] }
    ];
  } else if (cleanPrompt.includes('columbus') || cleanPrompt.includes('america')) {
    events = [
      { type: "event", year: 1492, title: "New World Discovery", description: "Columbus reaches the Americas, but this time with advanced navigation and technology", geoPoints: [[25.7617, -80.1918]] },
      { type: "event", year: 1500, title: "Advanced Colonies", description: "European settlers arrive with advanced technology, creating prosperous cities from the start", geoPoints: [[40.7128, -74.0060]] },
      { type: "event", year: 1600, title: "Native Alliances", description: "Europeans form strong alliances with Native American nations, creating a hybrid culture", geoPoints: [[38.9072, -77.0369]] },
      { type: "event", year: 1700, title: "Transatlantic Power", description: "The Americas become a major power center, rivaling Europe in influence and technology", geoPoints: [[19.4326, -99.1332]] },
      { type: "event", year: 1800, title: "Industrial Revolution", description: "America leads the industrial revolution, becoming the world's first industrial superpower", geoPoints: [[51.5074, -0.1278]] },
      { type: "event", year: 2025, title: "American Century", description: "The Americas dominate global politics, economics, and culture in the 21st century", geoPoints: [[-14.2350, -51.9253]] }
    ];
  } else {
    // Generic alternative history
    events = [
      { type: "event", year: 1800, title: "Alternative Timeline Begins", description: "History takes a different turn, creating a new path for humanity", geoPoints: [[51.5074, -0.1278]] },
      { type: "event", year: 1850, title: "Major Change Occurs", description: "A pivotal moment changes everything, setting the course for a new future", geoPoints: [[48.8566, 2.3522]] },
      { type: "event", year: 1900, title: "New World Order", description: "The world transforms into something unrecognizable from our timeline", geoPoints: [[35.6762, 139.6503]] },
      { type: "event", year: 1950, title: "Technological Leap", description: "Advanced technology emerges, propelling civilization forward", geoPoints: [[40.7128, -74.0060]] },
      { type: "event", year: 2000, title: "Global Transformation", description: "The entire world has changed, creating a new reality", geoPoints: [[55.7558, 37.6176]] },
      { type: "event", year: 2025, title: "Present Day", description: "Today, we live in a world shaped by these alternative events", geoPoints: [[41.9028, 12.4964]] }
    ];
  }

  // Add geo changes for border modifications
  const geoChanges = [
    { type: "geoChanges", geoChanges: [] }
  ];

  // Add camera focus operations
  const ops = [
    { type: "op", op: "focus", args: { lat: events[0].geoPoints[0][0], lon: events[0].geoPoints[0][1] } }
  ];

  return { events, geoChanges, ops };
}

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

  // Generate enhanced content based on prompt
  const { events, geoChanges, ops } = generateEnhancedEvents(prompt);

  // Send initial summary
  res.write(`data: ${JSON.stringify({ type: "summary", summary: `Alternative history scenario: ${prompt}` })}\n\n`);

  // Send events with realistic timing
  for (let i = 0; i < events.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Faster timing
    res.write(`data: ${JSON.stringify(events[i])}\n\n`);
  }

  // Send geo changes
  for (const geoChange of geoChanges) {
    await new Promise(resolve => setTimeout(resolve, 300));
    res.write(`data: ${JSON.stringify(geoChange)}\n\n`);
  }

  // Send operations
  for (const op of ops) {
    await new Promise(resolve => setTimeout(resolve, 200));
    res.write(`data: ${JSON.stringify(op)}\n\n`);
  }

  // Send completion signal
  res.write('data: [DONE]\n\n');
  res.end();
}
