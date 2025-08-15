import { useEffect, useRef, useState } from "react";

type EventItem = { year:number; title:string; description:string; geoPoints:number[][] };

// TTS SEQUENCER - kontroluje kolejność i czeka na skończenie każdego audio
class TTSSequencer {
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private audioCache = new Map<string, string>();

  async speak(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      console.log("TTSSequencer.speak() called for:", text.substring(0, 50) + "...");
      
      // Zatrzymaj poprzednie audio jeśli gra
      if (this.currentAudio && !this.currentAudio.paused) {
        console.log("Stopping previous audio before starting new");
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }

      // Sprawdź cache
      if (this.audioCache.has(text)) {
        console.log("Using cached audio from TTSSequencer");
        const audioUrl = this.audioCache.get(text)!;
        this.playAudio(audioUrl, resolve);
        return;
      }

      // Generuj nowe audio
      console.log("Generating new audio via TTSSequencer");
      fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })
      .then(response => response.json())
      .then(data => {
        if (data.audioUrl) {
          // Cache audio
          this.audioCache.set(text, data.audioUrl);
          this.playAudio(data.audioUrl, resolve);
        } else {
          throw new Error("No audio URL received");
        }
      })
      .catch(error => {
        console.log("TTSSequencer failed, using Web Speech fallback:", error);
        // Fallback na Web Speech API - upewnij się że czeka na skończenie
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 1.0; u.lang = "en-US"; u.volume = 1.0;
        
        // Dodaj timeout dla Web Speech API
        const webSpeechTimeout = setTimeout(() => {
          console.log("Web Speech API timeout fallback");
          resolve();
        }, 8000);
        
        u.onend = () => {
          console.log("Web Speech API finished");
          clearTimeout(webSpeechTimeout);
          resolve();
        };
        
        u.onerror = () => {
          console.log("Web Speech API error");
          clearTimeout(webSpeechTimeout);
          resolve();
        };
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      });
    });
  }

  private playAudio(audioUrl: string, resolve: () => void): void {
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;
    
    // Timeout fallback - dłuższy żeby audio miało czas się skończyć
    const timeoutId = setTimeout(() => {
      console.log("TTSSequencer timeout fallback - audio took too long");
      resolve();
    }, 30000); // 30 sekund

    // Sprawdź czy audio się skończyło co 100ms - częściej ale dokładniej
    const checkInterval = setInterval(() => {
      // Sprawdź czy audio się skończyło - NIE sprawdzaj audio.paused bo to może być true zanim się skończy
      if (audio.ended || (audio.duration > 0 && audio.currentTime >= audio.duration - 0.1)) {
        console.log("TTSSequencer audio ended check - audio completed, duration:", audio.duration, "currentTime:", audio.currentTime);
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        this.currentAudio = null;
        resolve();
      } else {
        // Dodaj sprawdzenie czy audio.duration jest dostępne
        if (audio.duration === 0 || isNaN(audio.duration)) {
          console.log("TTSSequencer audio duration not ready yet - duration:", audio.duration, "currentTime:", audio.currentTime);
        } else {
          console.log("TTSSequencer audio still playing - duration:", audio.duration, "currentTime:", audio.currentTime);
        }
      }
    }, 100);

    audio.onended = () => {
      console.log("TTSSequencer audio onended");
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
      this.currentAudio = null;
      resolve();
    };

    audio.onerror = () => {
      console.log("TTSSequencer audio error");
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
      this.currentAudio = null;
      resolve();
    };

    // Start playback
    console.log("TTSSequencer starting audio playback...");
    
    audio.play().then(() => {
      console.log("TTSSequencer audio.play() started successfully");
    }).catch((error) => {
      console.log("TTSSequencer audio.play() failed:", error);
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
      this.currentAudio = null;
      resolve();
    });
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    window.speechSynthesis.cancel();
  }

  clearCache(): void {
    this.audioCache.clear();
  }

  hasCachedAudio(text: string): boolean {
    return this.audioCache.has(text);
  }

  getCachedAudio(text: string): string | undefined {
    return this.audioCache.get(text);
  }

  setCachedAudio(text: string, audioUrl: string): void {
    this.audioCache.set(text, audioUrl);
  }
}

export default function usePlayback(mapApiRef: React.RefObject<any>, events: EventItem[], muted:boolean, summary?: string|null){
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [localMuted, setLocalMuted] = useState(muted);
  const utterRef = useRef<SpeechSynthesisUtterance|null>(null);
  
  // TTS SEQUENCER - kontroluje kolejność audio
  const ttsSequencerRef = useRef<TTSSequencer>(new TTSSequencer());
  
  // helper: męski głos - poprawiony dla telefonów
  function pickMale(){
    const voices = window.speechSynthesis.getVoices();
    
    // Sprawdź czy to urządzenie mobilne
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Na obu platformach preferuj męskie głosy dla spójności
    const malePrefs = [
      /Male/i, 
      /Google UK English Male/i, 
      /Microsoft.*(Guy|Ryan|Brandon)/i,
      /en-US/i,
      /en-GB/i,
      /English/i
    ];
    
    for (const re of malePrefs) {
      const v = voices.find(v => re.test(v.name + v.voiceURI));
      if (v) {
        console.log("Male voice selected:", v.name);
        return v;
      }
    }
    
    // Fallback - pierwszy dostępny głos
    const fallback = voices[0];
    if (fallback) {
      console.log("Fallback voice selected:", fallback.name);
    }
    return fallback || null;
  }

  // PREFETCH AUDIO - generuje audio w tle bez blokowania UI
  async function prefetchAudio(text: string): Promise<string> {
    // Sprawdź cache
    if (ttsSequencerRef.current.hasCachedAudio(text)) {
      console.log("Audio prefetch: using cached audio for:", text.substring(0, 50) + "...");
      return ttsSequencerRef.current.getCachedAudio(text)!;
    }

    console.log("Audio prefetch: generating new audio for:", text.substring(0, 50) + "...");
    
    try {
      const response = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      if (data.audioUrl) {
        // Cache the audio URL
        ttsSequencerRef.current.setCachedAudio(text, data.audioUrl);
        
        console.log("Audio prefetch: successfully cached audio for:", text.substring(0, 50) + "...");
        return data.audioUrl;
      } else {
        throw new Error("No audio URL received");
      }
    } catch (error) {
      console.log("Audio prefetch failed:", error);
      throw error;
    }
  }

  // PREFETCH INTRO I PIERWSZEGO EVENTU - uruchom w tle
  useEffect(() => {
    if (summary && events.length > 0) {
      console.log("Starting audio prefetch for intro and first event...");
      
      // Prefetch intro
      prefetchAudio(summary).catch(console.error);
      
      // Prefetch first event
      const firstEvent = events[0];
      if (firstEvent) {
        // Użyj tej samej logiki co speakBlock - tytuł + opis jako jeden blok
        const firstEventText = `${firstEvent.year} — ${firstEvent.title}. ${firstEvent.description}`;
        prefetchAudio(firstEventText).catch(console.error);
      }
    }
  }, [summary, events]);

  function speak(text:string){
    if (localMuted) {
      console.log("speak() blocked - localMuted is true");
      return Promise.resolve();
    }
    
    console.log("speak() proceeding - using TTSSequencer for:", text.substring(0, 50) + "...");
    
    // Użyj TTSSequencer który kontroluje kolejność
    const speakPromise = ttsSequencerRef.current.speak(text);
    
    // Dodatkowe zabezpieczenie - upewnij się że Promise się nie rozwiązuje za wcześnie
    return new Promise<void>((resolve, reject) => {
      speakPromise.then(() => {
        console.log("TTSSequencer.speak() resolved - audio completed");
        resolve();
      }).catch((error) => {
        console.error("TTSSequencer.speak() failed:", error);
        reject(error);
      });
    });
  }

  // PREFETCH NASTĘPNEGO EVENTU - uruchom w tle podczas odtwarzania aktualnego
  async function prefetchNextEvent(currentIndex: number) {
    const nextIndex = currentIndex + 1;
    if (nextIndex < eventsRef.current.length) {
      const nextEvent = eventsRef.current[nextIndex];
      const nextEventText = `${nextEvent.year} — ${nextEvent.title}. ${nextEvent.description}`;
      
              // Sprawdź czy już nie jest w cache
        if (!ttsSequencerRef.current.hasCachedAudio(nextEventText)) {
        console.log(`Prefetching next event ${nextIndex} in background...`);
        prefetchAudio(nextEventText).catch(console.error);
      }
    }
  }

  // NOWA FUNKCJA: speakBlock - czyta tytuł + opis jako jeden blok i czeka na zakończenie
  async function speakBlock(title: string, body: string): Promise<void> {
    const fullText = `${title}. ${body}`;
    console.log(`speakBlock: reading full block - "${title.substring(0, 30)}..." + "${body.substring(0, 30)}..."`);
    
    try {
      await speak(fullText); // CZEKAJ NA SKOŃCZENIE CAŁEGO BLOKU
      console.log(`speakBlock: completed reading full block`);
    } catch (error) {
      console.error(`speakBlock: failed reading full block:`, error);
      throw error;
    }
  }

  // --- STATE MACHINE ---
  type Phase = "idle" | "intro" | "events";
  const phaseRef = useRef<Phase>("idle");
  const startedRef = useRef(false);
  const firstEventStartedRef = useRef(false);
  const eventsRef = useRef<any[]>([]);
  const playingRef = useRef(false);
  const markerIdsRef = useRef<string[]>([]);
  const lastActiveIdRef = useRef<string|null>(null);
  
  useEffect(()=>{ playingRef.current = playing; },[playing]);
  useEffect(()=>{ eventsRef.current = events; },[events]);
  
  // Synchronizuj localMuted z muted z komponentu
  useEffect(() => {
    console.log("usePlayback: muted changed to", muted, "updating localMuted");
    setLocalMuted(muted);
  }, [muted]);

  async function playIntroThenEvents() {
    console.log("playIntroThenEvents called - startedRef:", startedRef.current, "playingRef:", playingRef.current);
    if (startedRef.current && playingRef.current) {
      console.log("playIntroThenEvents - already started and playing, returning");
      return;
    }
    startedRef.current = true;
    
    // Ustaw playing na true żeby narrator działał
    setPlaying(true);
    
    phaseRef.current = "intro";
    
    // Ustaw index na -1 gdy narrator czyta intro
    setIndex(-1);
    
    // Odtwórz intro summary jeśli istnieje - CZEKAJ NA PEŁNE ZAKOŃCZENIE
    if (summary && summary.trim()) {
      console.log("=== INTRO START === Reading intro...");
      const introStartTime = Date.now();
      
      try {
        await speak(summary); // CZEKAJ NA SKOŃCZENIE INTRO PRZED PRZEJŚCIEM DALEJ
        const introDuration = Date.now() - introStartTime;
        console.log(`=== INTRO COMPLETED === Finished after ${introDuration}ms`);
        console.log("Intro finished, waiting 0.5 seconds before first event...");
        
        // Czekaj 0.5 sekundy przed pierwszym eventem
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("=== INTRO ERROR === Failed:", error);
      }
    }
    
    phaseRef.current = "events";
    
    console.log("playIntroThenEvents - events length:", eventsRef.current.length, "firstEventStarted:", firstEventStartedRef.current);
    
    // Automatycznie przejdź do pierwszego eventu po intro - CZEKAJ NA PEŁNE ZAKOŃCZENIE
    if (eventsRef.current.length > 0 && !firstEventStartedRef.current) {
      firstEventStartedRef.current = true;
      console.log("Auto-advancing to first event after intro");
      await playEvent(0); // CZEKAJ NA SKOŃCZENIE PIERWSZEGO EVENTU
    } else {
      console.log("playIntroThenEvents - no events or first event already started");
    }
  }

  async function playEvent(i: number) {
    const ev = eventsRef.current[i];
    if (!ev) return;
    
    setIndex(i);
    setPlaying(true);
    const pt = ev.geoPoints?.[0];

    // NARRATOR ZACZYNA MÓWIĆ OD RAZU - bez czekania na cokolwiek
    console.log(`Reading event ${i}: ${ev.year} — ${ev.title}. ${ev.description}`);
    console.log(`Starting to speak event ${i} - IMMEDIATELY, no delays`);
    
    // PREFETCH NASTĘPNEGO EVENTU W TLE - nie blokuje narratora
    prefetchNextEvent(i);
    
    // AKTYWUJ PUNKT RÓWNOLEGLE - nie blokuje narratora
    if (pt && mapApiRef.current){
      // utwórz marker jeśli nie istnieje (nieaktywny)
      if (!markerIdsRef.current[i]){
        const id = mapApiRef.current.marker(pt[0], pt[1], ev.title, false);
        markerIdsRef.current[i] = id;
      }
      
      // aktywuj marker bieżący i wycisz resztę (szare 20%) - OD RAZU
      mapApiRef.current.setActiveMarker(markerIdsRef.current[i]);
      
      // włącz mini-waveform na czas mówienia - OD RAZU
      mapApiRef.current.showWaveform(markerIdsRef.current[i], true);
      lastActiveIdRef.current = markerIdsRef.current[i];
      
      // fokus - równolegle z mówieniem
      mapApiRef.current.focus(pt[0], pt[1], 2.2);

      // link: poprzedni -> bieżący - równolegle z mówieniem
      const curId = markerIdsRef.current[i];
      if (lastActiveIdRef.current && lastActiveIdRef.current !== curId){
        mapApiRef.current.link(lastActiveIdRef.current, curId, { 
          fade:true, 
          dashed:true, 
          mode: "auto",
          duration: 2000 
        });
      }
    }
    
    // CZEKAJ NA SKOŃCZENIE MÓWIENIA CAŁEGO BLOKU - TO JEST KLUCZOWE!
    console.log(`=== EVENT ${i} START === Waiting for full block audio to complete...`);
    const startTime = Date.now();
    
    try {
      // Użyj speakBlock zamiast speak - czyta tytuł + opis jako jeden blok
      const eventTitle = `${ev.year} — ${ev.title}`;
      await speakBlock(eventTitle, ev.description); // CZEKAJ NA SKOŃCZENIE AUDIO PRZED PRZEJŚCIEM DALEJ
      const duration = Date.now() - startTime;
      console.log(`=== EVENT ${i} COMPLETED === Full block audio finished after ${duration}ms`);
    } catch (error) {
      console.error(`=== EVENT ${i} ERROR === Full block audio failed:`, error);
    }
    
    // wyłącz mini-waveform po zakończeniu mowy
    if (mapApiRef.current && markerIdsRef.current[i]){
      mapApiRef.current.showWaveform(markerIdsRef.current[i], false);
    }

    // Sprawdź czy nie został wciśnięty pause podczas mówienia
    if (!playingRef.current) {
      console.log("Pause detected during speech, stopping");
      setPlaying(false);
      return;
    }

    // Krótka pauza między eventami - narrator zaczyna od razu po aktywacji
    await new Promise(resolve => setTimeout(resolve, 25));

    // auto-advance, ale tylko jeśli playing jest true i kolejny istnieje:
    if (eventsRef.current[i+1] && playingRef.current) {
      // Sprawdź czy nie został wciśnięty pause podczas mówienia
      if (playingRef.current) {
        console.log(`Auto-advancing to event ${i+1}`);
        await playEvent(i+1); // CZEKAJ NA SKOŃCZENIE NASTĘPNEGO EVENTU
      } else {
        console.log("Pause detected, stopping auto-advance");
        setPlaying(false);
      }
    } else {
      console.log("No more events or playing stopped, finishing");
      setPlaying(false);
    }
    
    // Jeśli pause został wciśnięty podczas mówienia, zatrzymaj
    if (!playingRef.current) {
      setPlaying(false);
    }
  }

  function pause(){ 
    setPlaying(false); 
    ttsSequencerRef.current.stop(); // Zatrzymaj TTSSequencer
  }
  
  function stopAll(){ 
    setPlaying(false); 
    ttsSequencerRef.current.stop(); // Zatrzymaj TTSSequencer
  }
  
  // Mute function - zatrzymaj aktualne audio
  function toggleMute() {
    const newMuted = !localMuted;
    setLocalMuted(newMuted);
    console.log("toggleMute: switching from", localMuted, "to", newMuted);
    
    if (newMuted) {
      // Mute - zatrzymaj aktualne audio
      console.log("Muting - stopping current audio");
      ttsSequencerRef.current.stop();
    } else {
      // Unmute - nic nie rob, następne speak() będzie działać
      console.log("Unmuting - audio will work on next speak()");
    }
  }
  
  // Funkcja do wymuszenia aktualizacji localMuted
  function forceUpdateMuted(newMuted: boolean) {
    setLocalMuted(newMuted);
    console.log("Force updating localMuted to:", newMuted);
  }
  
  function startNewScenario(){
    console.log("startNewScenario called");
    ttsSequencerRef.current.stop(); // Zatrzymaj TTSSequencer
    ttsSequencerRef.current.clearCache(); // Wyczyść cache
    phaseRef.current = "idle";
    startedRef.current = false;
    firstEventStartedRef.current = false;
    markerIdsRef.current = [];
    lastActiveIdRef.current = null;
    eventsRef.current = [];
    
    setIndex(-1); // Ustaw index na -1 od razu żeby intro było pokazywane od początku
    setPlaying(false);
    if (mapApiRef.current){
      mapApiRef.current.clearLinks();
      mapApiRef.current.reset({ hard:true });
      mapApiRef.current.setActiveMarker(null);
    }
  }

  // Auto-start dla desktopu, na mobile zostaw PLAY button
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile && summary && events.length > 0 && !startedRef.current) {
      console.log("Desktop detected - auto-starting playIntroThenEvents with summary:", summary, "events:", events.length);
      setTimeout(() => {
        console.log("Calling playIntroThenEvents after timeout");
        playIntroThenEvents();
      }, 50);
    }
  }, [summary, events]);

  // Smart play function that resumes from current position or starts from beginning
  const smartPlay = () => {
    if (startedRef.current && index >= 0) {
      // Resume from current event
      console.log("Resuming from current event:", index);
      setPlaying(true);
      playEvent(index);
    } else {
      // Start from beginning
      console.log("Starting from beginning");
      playIntroThenEvents();
    }
  };

  return { 
    index, playing, 
    play: smartPlay,
    pause, 
    next(){pause(); if(eventsRef.current[index+1]) playEvent(index+1); else if(eventsRef.current[0]) playEvent(0);}, 
    prev(){pause(); if(index > 0) playEvent(index-1);}, 
    restart(){
      console.log("Restart called - pausing current playback");
      pause(); 
      console.log("Restart - calling startNewScenario");
      startNewScenario(); 
      console.log("Restart - setting timeout to restart playback");
             setTimeout(() => {
         console.log("Restart timeout - setting startedRef to true");
         startedRef.current = true;
         firstEventStartedRef.current = false;
         console.log("Restart - events available:", events.length, "eventsRef.current length:", eventsRef.current.length);
         console.log("Restart - calling playIntroThenEvents");
         playIntroThenEvents();
               }, 50);
    }, 
    stopAll, 
    startNewScenario,
    setIndex,
    toggleMute,
    localMuted,
    forceUpdateMuted
  };

  // po zmianie listy eventów nie auto-startuj
  useEffect(()=>{ /* no-op */ }, [events]);
}