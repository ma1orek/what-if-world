// useTimelineStream.ts
import { useEffect, useRef } from "react";
import { NarrationQueue } from "../utils/narrationQueue";

type EventPoint = { id: string; title: string; year?: number; lat?: number; lon?: number };
type OnIntro = (text: string) => void;
type OnEvent = (ev: EventPoint) => void;
type OnDone  = () => void;

export function useTimelineStream(opts: {
  onIntro: OnIntro;
  onEvent: OnEvent;
  onDone: OnDone;
  onResetUI: () => void;
  setGenerating: (v:boolean)=>void;
  elevenLabsKey?: string | null;
}) {
  const acRef = useRef<AbortController | null>(null);
  const qRef  = useRef<NarrationQueue | null>(null);

  useEffect(() => {
    qRef.current = new NarrationQueue(opts.elevenLabsKey);
    return () => { qRef.current?.reset(); };
  }, []);

  function hardReset() {
    console.log("useTimelineStream: Hard reset initiated");
    // 1) przerwij fetch i TTS
    acRef.current?.abort();
    acRef.current = null;
    qRef.current?.reset();
    // 2) wyczyść UI (punkty, indeksy, highlighty, licznik, audio)
    opts.onResetUI();
    // 3) wyczyść wszystkie highlighty
    document.querySelectorAll('.is-speaking').forEach(el => {
      el.classList.remove('is-speaking');
    });
    // 4) reset generating state
    opts.setGenerating(false);
  }

  async function start(prompt: string) {
    console.log("useTimelineStream: Starting generation for:", prompt);
    hardReset();
    opts.setGenerating(true);
    acRef.current = new AbortController();
    
    // Dodaj małe opóźnienie żeby UI się zresetowało
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // spróbuj trybu stream (NDJSON)
      const res = await fetch(`/api/rewrite-history-stream?prompt=${encodeURIComponent(prompt)}`, {
        signal: acRef.current.signal,
        headers: { Accept: "application/x-ndjson" }
      });
      if (!res.ok) throw new Error("stream not ok");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          const msg = JSON.parse(line);
          if (msg.type === "intro") {
            opts.onIntro(msg.text);
            // **WCZESNY START LEKTORA**:
            qRef.current?.enqueue({ text: msg.text });
            // chowamy spinner, bo user już coś słyszy
            opts.setGenerating(false);
          } else if (msg.type === "event") {
            const ev: EventPoint = { id: msg.event?.id ?? crypto.randomUUID(), ...msg.event };
            opts.onEvent(ev);
            // enqueuj kwestie dla eventu, jeśli jest
            if (msg.narration) {
              qRef.current?.enqueue({
                id: ev.id,
                text: msg.narration,
                onStart: () => highlight(ev.id, true),
                onDone : () => highlight(ev.id, false)
              });
            }
          } else if (msg.type === "done") {
            opts.onDone();
          }
        }
      }
    } catch (err) {
      // fallback – zwykłe API (bez streamu)
      try {
        const res = await fetch(`/api/rewrite-history`, {
          method: "POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({ prompt }),
          signal: acRef.current?.signal
        });
        if (!res.ok) throw new Error("api failed");
        const json = await res.json();
        // json: { intro: string, events: [{... , narration: string}] }
        opts.onIntro(json.intro);
        qRef.current?.enqueue({ text: json.intro });
        opts.setGenerating(false);

        for (const e of json.events ?? []) {
          const ev: EventPoint = { id: e.id ?? crypto.randomUUID(), title: e.title, year: e.year, lat: e.lat, lon: e.lon };
          opts.onEvent(ev);
          if (e.narration) {
            qRef.current?.enqueue({
              id: ev.id,
              text: e.narration,
              onStart: () => highlight(ev.id, true),
              onDone : () => highlight(ev.id, false)
            });
          }
        }
        opts.onDone();
      } catch (e2) {
        console.error("generation error:", e2);
      } finally {
        // jeśli nic nie przyszło we streamie – schowaj spinner tu
        opts.setGenerating(false);
      }
    }
  }

  function highlight(id: string, on: boolean) {
    // zaświeć/wyłącz znacznik na mapie i w panelu (napis podświetlony)
    const el = document.querySelector(`[data-ev="${id}"]`);
    if (el) el.classList.toggle("is-speaking", on);
  }

  return { start, hardReset };
}