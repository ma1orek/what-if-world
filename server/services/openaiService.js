// server/services/openaiService.js
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { isValidLatLon, snapFromText } = require("./geoUtils");

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
console.log("Using OpenAI model:", MODEL);

async function findLatLonForEvent(title, description) {
  // najpierw próbujemy z listy
  const snap = snapFromText(`${title} ${description}`);
  if (snap) return snap;

  // fallback: pytamy AI
  try {
    const prompt = `You are a geocoding assistant. Event: "${title}" Description: "${description}" 

Return the most relevant latitude and longitude as JSON: {"lat": <number>, "lon": <number>}.

If location is unclear, return your best guess for a historically accurate location. Use decimal degrees format.`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 100
    });

    const text = res.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[^}]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.lat && parsed.lon && isValidLatLon([parsed.lat, parsed.lon])) {
        return [parsed.lat, parsed.lon];
      }
    }
  } catch (e) {
    console.error("AI geocoding failed", e);
  }

  return null;
}

const SYSTEM = `Generate alternate history timeline as NDJSON:
1) {"type":"summary","summary":"Brief overview"}
2) {"type":"event","year":YYYY,"title":"Event","description":"Short description","geoPoints":[[lat,lon]]}

Rules: Concise descriptions, real coordinates, one JSON per line.`;

const USER = (whatif) => `
What if: "${whatif}"

Generate a chronological list of 6–8 major events in this alternate timeline.
- Use real years in ascending order.
- If the last event is before 2000, add 1–2 extra events that reach the present day (≈2025) or near future (≤2050) and describe how the world looks now as a consequence.
- Each event: {year, title, description}. Keep descriptions concise (1–2 sentences).
- When possible, include explicit locations in text; we will geocode them.
- Include at least one 'op' with focus_camera to the first event.
- If borders change, add a minimal GeoJSON polygon in geoChanges.
`;

function tryJSON(s) {
  try { return JSON.parse(s); } catch { return null; }
}

async function streamHistoryScenario(prompt, onChunk) {
  console.log("streamHistoryScenario called with prompt:", prompt);
  console.log("Using model:", MODEL);
  console.log("API key present:", !!process.env.OPENAI_API_KEY);
  

  
  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER(prompt) }
      ],
    });
    console.log("OpenAI stream created successfully");
    
    // reassembler dla modeli, które streamują po fragmentach
    let buffer = "";
    let chunkCount = 0;
    let totalContent = "";
    for await (const part of stream) {
      chunkCount++;
      const delta = part.choices?.[0]?.delta?.content || "";
      if (delta) {
        totalContent += delta;
        console.log(`Chunk ${chunkCount}: "${delta}"`);
      }
      if (!delta) continue;
      buffer += delta;

      // próbujemy rozpoznać pełne obiekty JSON zakończone \n lub }{
      const split = buffer.split(/\n(?=\s*{)|}(?=\s*{)/g); // rozcina między obiektami
      for (let i = 0; i < split.length - 1; i++) {
        const piece = split[i].trim();
        if (!piece) continue;
        const candidate = piece.endsWith("}") ? piece : piece + "}";
        const parsed = tryJSON(candidate);
        if (parsed && parsed.type) {
          // Auto-generate ops for events
          if (parsed.type === "event") {
            let pt = parsed.geoPoints?.[0];
            if (!isValidLatLon(pt || [])) {
              pt = await findLatLonForEvent(parsed.title, parsed.description);
              if (pt) parsed.geoPoints = [pt];
            }
            onChunk(parsed);
            
            // Auto-generate map operations
            if (pt) {
              onChunk({ type: "op", op: "focus_camera", args: { lat: pt[0], lon: pt[1], scale: 2.2 } });
              onChunk({ type: "op", op: "place_marker", args: { lat: pt[0], lon: pt[1], label: parsed.title } });
            }
          } else {
            onChunk(parsed);
          }
        }
      }
      buffer = split[split.length - 1];
    }

    // ostatni fragment jeśli jest poprawny JSON
    const last = tryJSON(buffer.trim());
    if (last && last.type) {
      if (last.type === "event") {
        let pt = last.geoPoints?.[0];
        if (!isValidLatLon(pt || [])) {
          pt = await findLatLonForEvent(last.title, last.description);
          if (pt) last.geoPoints = [pt];
        }
        onChunk(last);
        if (pt) {
          onChunk({ type: "op", op: "focus_camera", args: { lat: pt[0], lon: pt[1], scale: 2.2 } });
          onChunk({ type: "op", op: "place_marker", args: { lat: pt[0], lon: pt[1], label: last.title } });
        }
      } else {
        onChunk(last);
      }
    }
    
    console.log("=== TOTAL OPENAI RESPONSE ===");
    console.log(totalContent);
    console.log("=== END RESPONSE ===");
    console.log("streamHistoryScenario completed successfully");
  } catch (error) {
    console.error("Error in streamHistoryScenario:", error);
    throw error;
  }
}

module.exports = { streamHistoryScenario };

