import { useEffect, useRef, useState } from "react";

type EventItem = { year:number; title:string; description:string; geoPoints:number[][] };

export default function usePlayback(mapApiRef: React.RefObject<any>, events: EventItem[], muted:boolean, summary?: string|null){
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [localMuted, setLocalMuted] = useState(muted);
  const utterRef = useRef<SpeechSynthesisUtterance|null>(null);
  // helper: męski głos
  function pickMale(){
    const voices = window.speechSynthesis.getVoices();
    const prefs = [/Male/i, /Google UK English Male/i, /Microsoft.*(Guy|Ryan|Brandon)/i, /en-US/i];
    for(const re of prefs){ const v = voices.find(v=> re.test(v.name+v.voiceURI)); if (v) return v; }
    return voices[0] || null;
  }

  function speak(text:string){
    return new Promise<void>((resolve)=>{
      console.log("speak() called with localMuted:", localMuted);
      if (localMuted) {
        console.log("speak() blocked - localMuted is true");
        return resolve();
      }
      console.log("speak() proceeding - localMuted is false");
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 0.9; u.lang = "en-US";
      const v = pickMale(); if (v) u.voice = v;
      u.onend = () => resolve();
      utterRef.current = u;
      window.speechSynthesis.cancel(); // upewnij się, że nie gada coś poprzedniego
      window.speechSynthesis.speak(u);
    });
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
    if (startedRef.current && playingRef.current) return;
    startedRef.current = true;
    
    // Ustaw playing na true żeby narrator działał
    setPlaying(true);
    
    phaseRef.current = "intro";
    
    // Ustaw index na -1 gdy narrator czyta intro
    setIndex(-1);
    
    // Odtwórz intro summary jeśli istnieje
    if (summary && summary.trim()) {
      await speak(summary);
    }
    
    phaseRef.current = "events";
    
    // Automatycznie przejdź do pierwszego eventu po intro - NAPRAWIONE
    if (eventsRef.current.length > 0 && !firstEventStartedRef.current) {
      firstEventStartedRef.current = true;
      console.log("Auto-advancing to first event after intro");
      await playEvent(0);
    }
  }

  async function playEvent(i: number) {
    const ev = eventsRef.current[i];
    if (!ev) return;
    
    setIndex(i);
    setPlaying(true);
    const pt = ev.geoPoints?.[0];

    if (pt && mapApiRef.current){
      // utwórz marker jeśli nie istnieje (nieaktywny)
      if (!markerIdsRef.current[i]){
        const id = mapApiRef.current.marker(pt[0], pt[1], ev.title, false);
        markerIdsRef.current[i] = id;
      }
      // fokus
      mapApiRef.current.focus(pt[0], pt[1], 2.2);

      // link: poprzedni -> bieżący
      const curId = markerIdsRef.current[i];
      if (lastActiveIdRef.current && lastActiveIdRef.current !== curId){
        mapApiRef.current.link(lastActiveIdRef.current, curId, { 
          fade:true, 
          dashed:true, 
          mode: "auto",
          duration: 2000 
        });
      }

      // aktywuj marker bieżący i wycisz resztę (szare 20%)
      mapApiRef.current.setActiveMarker(markerIdsRef.current[i]);

      // włącz mini-waveform na czas mówienia
      mapApiRef.current.showWaveform(markerIdsRef.current[i], true);
      lastActiveIdRef.current = markerIdsRef.current[i];
    }

    const line = `${ev.year} — ${ev.title}. ${ev.description}`;
    await speak(line);

    // wyłącz mini-waveform po zakończeniu mowy
    if (mapApiRef.current && markerIdsRef.current[i]){
      mapApiRef.current.showWaveform(markerIdsRef.current[i], false);
    }

    // auto-advance, ale tylko jeśli playing jest true i kolejny istnieje:
    if (eventsRef.current[i+1] && playingRef.current) {
      // Sprawdź czy nie został wciśnięty pause podczas mówienia
      if (playingRef.current) {
        await playEvent(i+1);
      } else {
        setPlaying(false);
      }
    } else {
      setPlaying(false);
    }
    
    // Jeśli pause został wciśnięty podczas mówienia, zatrzymaj
    if (!playingRef.current) {
      setPlaying(false);
    }
  }



  function pause(){ setPlaying(false); window.speechSynthesis.cancel(); }
  function stopAll(){ setPlaying(false); window.speechSynthesis.cancel(); }
  
  // Mute function - zatrzymaj aktualne audio
  function toggleMute() {
    const newMuted = !localMuted;
    setLocalMuted(newMuted);
    console.log("toggleMute: switching from", localMuted, "to", newMuted);
    
    if (newMuted) {
      // Mute - zatrzymaj aktualne audio
      console.log("Muting - stopping current audio");
      window.speechSynthesis.cancel();
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
    window.speechSynthesis.cancel();
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

  // Auto-start gdy mamy summary i events - NAPRAWIONE
  useEffect(() => {
    if (summary && events.length > 0 && !startedRef.current) {
      console.log("Auto-starting playIntroThenEvents with summary:", summary, "events:", events.length);
      setTimeout(() => {
        console.log("Calling playIntroThenEvents after timeout");
        playIntroThenEvents();
      }, 1000);
    }
  }, [summary, events]);

  return { 
    index, playing, 
    play: playIntroThenEvents,
    pause, 
    next(){pause(); if(eventsRef.current[index+1]) playEvent(index+1); else if(eventsRef.current[0]) playEvent(0);}, 
    prev(){pause(); if(index > 0) playEvent(index-1);}, 
    restart(){pause(); startNewScenario(); setTimeout(() => {
      startedRef.current = false;
      firstEventStartedRef.current = false;
      playIntroThenEvents();
    }, 500);}, 
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