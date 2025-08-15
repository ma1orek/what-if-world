// generatorBus.ts
type StartDetail = { prompt: string };
type DoneDetail  = { ok: boolean };

let currentId = 0;
let currentAbort: AbortController | null = null;

export function installGenerationBus(start: (prompt:string, signal:AbortSignal, id:number)=>Promise<void>,
                                     hardReset: ()=>void) {
  const onStart = async (e: Event) => {
    const ce = e as CustomEvent<StartDetail>;
    console.log('GeneratorBus: Received start event:', ce.detail.prompt);
    
    // 1) HARD RESET frontu (czyść punkty, panel, licznik, audio)
    hardReset();

    // 2) nadaj nowe ID + abort poprzedniego
    currentAbort?.abort();
    currentAbort = new AbortController();
    const id = ++currentId;

    try {
      console.log('GeneratorBus: Starting generation with ID:', id);
      await start(ce.detail.prompt, currentAbort.signal, id);
      // sukces – powiadom Home o gotowości (chowa spinner)
      window.dispatchEvent(new CustomEvent<DoneDetail>("HISTORY_REWRITER_READY", { detail:{ok:true} }));
    } catch (err) {
      if ((err as any)?.name !== "AbortError") {
        console.error("Generation failed:", err);
        window.dispatchEvent(new CustomEvent<DoneDetail>("HISTORY_REWRITER_FAILED", { detail:{ok:false} }));
      }
    }
  };

  window.addEventListener("HISTORY_REWRITER_START", onStart as EventListener);

  // na hot-reload/odmontowanie
  return () => {
    window.removeEventListener("HISTORY_REWRITER_START", onStart as EventListener);
    currentAbort?.abort();
  };
}