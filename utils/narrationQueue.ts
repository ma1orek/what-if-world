// narrationQueue.ts
type NarrationItem = { id?: string; text: string; onStart?: () => void; onDone?: () => void };

export class NarrationQueue {
  private queue: NarrationItem[] = [];
  private speaking = false;
  private aborted = false;
  private useWebSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
  private elevenKey: string | null;

  constructor(elevenLabsApiKey?: string | null) {
    this.elevenKey = elevenLabsApiKey ?? null;
  }

  reset() {
    this.queue = [];
    this.aborted = true;
    this.stopNow();
    // nowa sesja
    this.aborted = false;
  }

  enqueue(item: NarrationItem) {
    this.queue.push(item);
    this.drain();
  }

  private async drain() {
    if (this.speaking || this.aborted) return;
    const next = this.queue.shift();
    if (!next) return;
    this.speaking = true;
    try {
      next.onStart?.();
      await this.say(next.text);
      next.onDone?.();
    } catch (_) {
      // pomiń
    } finally {
      this.speaking = false;
      if (!this.aborted) this.drain();
    }
  }

  private stopNow() {
    try {
      if (this.useWebSpeech) {
        window.speechSynthesis.cancel();
      }
      // ElevenLabs odtwarzamy przez Audio() – zatrzymanie: wymusza nową sesję
    } catch {}
  }

  private async say(text: string) {
    // Preferuj ElevenLabs, jeśli masz klucz – generuj i odtwarzaj natychmiast
    if (this.elevenKey) {
      const audio = await this.elevenTTS(text);
      await this.playAudioBlob(audio);
      return;
    }
    // Fallback: Web Speech API
    if (this.useWebSpeech) {
      await this.webSpeech(text);
      return;
    }
    // Gdy nic nie ma – „udawane" opóźnienie, żeby nie zlewać animacji
    await new Promise(r => setTimeout(r, Math.min(1200, Math.max(400, text.length * 15))));
  }

  private async webSpeech(text: string) {
    await new Promise<void>((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      u.pitch = 0.95;
      u.onend = () => resolve();
      u.onerror = () => reject(new Error("speech error"));
      window.speechSynthesis.speak(u);
    });
  }

  private async elevenTTS(text: string): Promise<Blob> {
    // Użyj swojej ścieżki proxy w backendzie, np. /api/tts (żeby nie eksponować klucza publicznie).
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "narrator_male_deep" })
    });
    if (!res.ok) throw new Error("TTS failed");
    return await res.blob();
  }

  private async playAudioBlob(blob: Blob) {
    return new Promise<void>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      a.onended = () => { URL.revokeObjectURL(url); resolve(); };
      a.onerror  = () => { URL.revokeObjectURL(url); reject(new Error("audio error")); };
      a.play().catch(reject);
    });
  }
}