// scenarioController.ts
type MapApi = {
  reset: (opts?: { hard?: boolean }) => void;
  clearLinks: () => void;
  setActiveMarker: (id: string | null) => void;
};

class ScenarioController {
  private map: MapApi | null = null;
  private markerIds: string[] = [];
  private playing = false;
  private introDone = false;
  private index = -1;
  private events: any[] = [];
  private summary = "";
  private abort?: AbortController;
  private genToken = 0;  // anty-wyścig (najnowsze wygrywa)

  attachMap(api: MapApi) { this.map = api; }
  get state() { return { playing: this.playing, index: this.index, introDone: this.introDone }; }

  cancelSpeech() { try { window.speechSynthesis.cancel(); } catch {} }

  /** pełne czyszczenie wszystkiego */
  hardReset() {
    this.playing = false;
    this.introDone = false;
    this.index = -1;
    this.events = [];
    this.summary = "";
    this.markerIds = [];
    this.cancelSpeech();
    if (this.abort) { this.abort.abort(); this.abort = undefined; }
    if (this.map) { this.map.clearLinks(); this.map.reset({ hard: true }); this.map.setActiveMarker(null); }
    // wyczyść UI (jeśli trzymasz w stanie aplikacji – wyemituj event)
    window.dispatchEvent(new CustomEvent("HRL_CLEAR_UI"));
  }

  /** wywołuj PRZED każdym generate i PRZY home/back */
  beginNewScenario() {
    this.genToken++;
    this.hardReset();
    this.abort = new AbortController();
    return { signal: this.abort.signal, token: this.genToken };
  }

  /** anty-wyścig: czy odpowiedź dotyczy wciąż najnowszej prośby */
  isCurrent(token: number) { return token === this.genToken; }

  setData(summary: string, events: any[]) {
    this.summary = summary;
    this.events = events;
  }

  // udostępnij tablice markerów playbackowi
  get markers() { return this.markerIds; }
  setMarker(i: number, id: string) { this.markerIds[i] = id; }

  // expose do playbacku
  getEvents() { return this.events; }
  getSummary() { return this.summary; }
  setIntroDone(v: boolean) { this.introDone = v; }
  setIndex(i: number) { this.index = i; }
  setPlaying(v: boolean) { this.playing = v; }
}

export const SC = new ScenarioController();