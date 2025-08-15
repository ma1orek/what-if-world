import { useEffect, useState } from "react";

export type StreamEvent =
  | { type:"summary"; summary:string }
  | { type:"event"; year:number; title:string; description:string; geoPoints:number[][] }
  | { type:"geoChanges"; geoChanges:any[] }
  | { type:"op"; op:string; args:any }
  | { type:"error"; message:string };

export default function useHistoryStream(prompt?: string | null) {
  const [summary, setSummary] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [geo, setGeo] = useState<any[] | null>(null);

  useEffect(() => {
    console.log("useHistoryStream effect, prompt:", prompt);
    
    // Zawsze resetuj state na początku
    setSummary(null);
    setEvents([]);
    setOps([]);
    setGeo(null);
    
    if (!prompt) {
      console.log("No prompt - staying in reset state");
      return;
    }
    
    // Wyczyść prompt z prefiksu "What if" jeśli jest
    const cleanPrompt = prompt.replace(/^What if\s*/i, '').trim();
    
    console.log("Starting new stream for:", cleanPrompt);
    
    // Use fetch with streaming instead of EventSource for better CORS support
    const timestamp = Date.now();
    const abortController = new AbortController();
    
    console.log("=== STARTING FETCH STREAM ===");
    
    fetch(`/api/rewrite-history-stream?prompt=${encodeURIComponent(cleanPrompt)}&t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors',
      signal: abortController.signal
    })
    .then(response => {
      console.log("=== FETCH RESPONSE RECEIVED ===", response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      function readStream(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) {
            console.log("=== STREAM COMPLETED ===");
            return;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          console.log("Raw chunk:", chunk);
          
          // Parse SSE format: "data: {...}\n\n"
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remove "data: "
              
              if (data === '[DONE]') {
                console.log("Stream completed with [DONE]");
                return;
              }
              
              if (data.trim()) {
                try {
                  const parsed: StreamEvent = JSON.parse(data);
                  console.log("Parsed chunk:", parsed.type, parsed);
                  
                  if (parsed.type === "summary") {
                    console.log("Setting summary:", parsed.summary);
                    // Sprawdź czy summary nie jest domyślne
                    if (parsed.summary && parsed.summary !== "Alternative history scenario") {
                      setSummary(parsed.summary);
                    }
                  }
                  if (parsed.type === "event") {
                    console.log("Adding event:", parsed);
                    // Sprawdź czy event nie ma domyślnych wartości
                    if (parsed.year && 
                        parsed.year !== 1800 && 
                        parsed.title && 
                        parsed.title !== "Event" && 
                        parsed.description && 
                        parsed.description !== "A significant historical event") {
                      setEvents(prev => {
                        const newEvents = [...prev, parsed];
                        console.log("Events array now has", newEvents.length, "items");
                        return newEvents;
                      });
                    } else {
                      console.log("Skipping event with default values:", parsed);
                    }
                  }
                  if (parsed.type === "geoChanges") {
                    console.log("Setting geo changes:", parsed.geoChanges);
                    setGeo(parsed.geoChanges);
                  }
                  if (parsed.type === "op") {
                    console.log("Adding op:", parsed);
                    setOps(prev => [...prev, parsed]);
                  }
                } catch (err) {
                  console.error("Parse error:", err, "Raw data:", data);
                }
              }
            }
          }
          
          return readStream();
        });
      }
      
      return readStream();
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error("=== FETCH STREAM ERROR ===", err);
      }
    });
    
    return () => {
      console.log("Cleaning up fetch stream");
      abortController.abort();
    };
  }, [prompt]);

  return { summary, events, ops, geo };
}