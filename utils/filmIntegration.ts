// filmIntegration.ts - Bridge between new film system and existing scenario controller
import { SC } from './scenarioController';
import { installGenerationBus } from './generatorBus';

let cleanupBus: (() => void) | null = null;

export function initializeFilmIntegration() {
  if (cleanupBus) {
    console.log('Film integration already initialized');
    return; // Already initialized
  }

  console.log('Initializing film integration...');
  cleanupBus = installGenerationBus(
    async (prompt: string, signal: AbortSignal, id: number) => {
      console.log('Film integration: Starting generation for:', prompt);
      
      const { token } = SC.beginNewScenario();
      
      try {
        const response = await fetch('/api/rewrite-history-stream?' + new URLSearchParams({ prompt }), {
          signal,
          headers: { Accept: 'application/x-ndjson' }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let summary = '';
        const events: any[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Check if this generation is still current
          if (!SC.isCurrent(token)) {
            console.log('Generation cancelled - newer request started');
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line) continue;
            
            try {
              const event = JSON.parse(line);
              
              switch (event.type) {
                case 'intro':
                case 'summary':
                  summary = event.text || event.summary;
                  // Emit UI update for intro
                  window.dispatchEvent(new CustomEvent('HRL_INTRO_READY', { 
                    detail: { summary } 
                  }));
                  break;
                
                case 'event':
                  const eventData = event.event || event;
                  const processedEvent = {
                    id: eventData.id || crypto.randomUUID(),
                    title: eventData.title,
                    year: eventData.year,
                    description: event.narration || eventData.description,
                    lat: eventData.lat || eventData.geoPoints?.[0]?.[0],
                    lon: eventData.lon || eventData.geoPoints?.[0]?.[1],
                  };
                  events.push(processedEvent);
                  
                  // Emit UI update for new event
                  window.dispatchEvent(new CustomEvent('HRL_EVENT_ADDED', { 
                    detail: { event: processedEvent, index: events.length - 1 } 
                  }));
                  break;
                
                case 'done':
                  // Final update to scenario controller
                  if (SC.isCurrent(token)) {
                    SC.setData(summary, events);
                    window.dispatchEvent(new CustomEvent('HRL_GENERATION_COMPLETE', { 
                      detail: { summary, events } 
                    }));
                  }
                  return;
                
                case 'error':
                  console.error('Stream error:', event.message);
                  throw new Error(event.message);
              }
            } catch (e) {
              console.warn('Failed to parse stream event:', line);
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Generation aborted');
        } else {
          console.error('Generation failed:', error);
          throw error;
        }
      }
    },
    () => {
      // Hard reset callback
      console.log('Film integration: Hard reset triggered');
      SC.hardReset();
    }
  );

  console.log('Film integration initialized');
}

export function cleanupFilmIntegration() {
  if (cleanupBus) {
    cleanupBus();
    cleanupBus = null;
  }
}