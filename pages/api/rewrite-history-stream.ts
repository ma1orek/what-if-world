import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced event generation with OpenAI integration
async function generateEnhancedEvents(prompt: string) {
  try {
    // Try to use OpenAI first
    if (process.env.OPENAI_API_KEY) {
      console.log("Using OpenAI for enhanced generation");
      
      const systemPrompt = `You are an expert historian specializing in alternative history scenarios. Generate a detailed timeline of 6-8 major events that would occur if the given scenario happened.

Format each event as JSON with: year, title, description, and geoPoints (latitude, longitude coordinates).

Rules:
- Use realistic years in chronological order
- Make descriptions engaging and historically plausible
- Include diverse geographic locations
- End with events reaching present day (2025) or near future
- Each event should have significant global impact

Return only valid JSON array, no other text.`;

      const userPrompt = `What if: "${prompt}"

Generate 6-8 major events in this alternate timeline.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        try {
          // Try to parse the response as JSON
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Transform OpenAI response to our format
            const events = parsed.map((event: any, index: number) => ({
              type: "event",
              year: event.year || 1800 + index * 50,
              title: event.title || `Event ${index + 1}`,
              description: event.description || "A significant historical event",
              geoPoints: event.geoPoints || [[51.5074, -0.1278]]
            }));

            // Add geo changes and ops
            const geoChanges = [{ type: "geoChanges", geoChanges: [] }];
            const ops = [{ type: "op", op: "focus", args: { lat: events[0].geoPoints[0][0], lon: events[0].geoPoints[0][1] } }];

            return { events, geoChanges, ops };
          }
        } catch (parseError) {
          console.log("Failed to parse OpenAI response, falling back to template");
        }
      }
    }
  } catch (error) {
    console.log("OpenAI call failed, falling back to template:", error);
  }

  // Fallback to enhanced template-based generation
  console.log("Using enhanced template generation");
  const cleanPrompt = prompt.toLowerCase();
  
  let events = [];
  
  // Enhanced template scenarios
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
  } else if (cleanPrompt.includes('ww2') || cleanPrompt.includes('world war') || cleanPrompt.includes('hitler')) {
    events = [
      { type: "event", year: 1933, title: "Hitler Never Rises", description: "The Nazi party fails to gain power, Germany remains a democratic republic", geoPoints: [[52.5200, 13.4050]] },
      { type: "event", year: 1940, title: "European Cooperation", description: "European nations form a peaceful alliance, focusing on economic cooperation", geoPoints: [[48.8566, 2.3522]] },
      { type: "event", year: 1950, title: "Space Race Begins", description: "Without war, humanity focuses on space exploration, launching first satellites", geoPoints: [[55.7558, 37.6176]] },
      { type: "event", year: 1960, title: "Moon Landing", description: "First humans reach the Moon, marking the beginning of space colonization", geoPoints: [[40.7128, -74.0060]] },
      { type: "event", year: 1980, title: "Mars Colonies", description: "Humanity establishes first permanent settlements on Mars", geoPoints: [[35.6762, 139.6503]] },
      { type: "event", year: 2025, title: "Interstellar Era", description: "Today, humanity explores distant star systems, living in a peaceful, advanced civilization", geoPoints: [[51.5074, -0.1278]] }
    ];
  } else if (cleanPrompt.includes('cold war') || cleanPrompt.includes('soviet')) {
    events = [
      { type: "event", year: 1945, title: "Allies Remain United", description: "The United States and Soviet Union maintain their wartime alliance", geoPoints: [[38.9072, -77.0369]] },
      { type: "event", year: 1950, title: "Global Cooperation", description: "World powers focus on rebuilding and advancing technology together", geoPoints: [[55.7558, 37.6176]] },
      { type: "event", year: 1960, title: "Space Alliance", description: "Joint US-Soviet space program leads to rapid space exploration", geoPoints: [[40.7128, -74.0060]] },
      { type: "event", year: 1970, title: "Moon Base", description: "International lunar base established, serving as gateway to solar system", geoPoints: [[35.6762, 139.6503]] },
      { type: "event", year: 1990, title: "Mars Mission", description: "First human mission to Mars, marking new era of exploration", geoPoints: [[51.5074, -0.1278]] },
      { type: "event", year: 2025, title: "United Earth", description: "Today, Earth is united under a single government, exploring the galaxy", geoPoints: [[41.9028, 12.4964]] }
    ];
  } else {
    // Generic alternative history with more variety
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
  const { events, geoChanges, ops } = await generateEnhancedEvents(prompt);

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
