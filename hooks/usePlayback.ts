import { useEffect, useRef, useState } from "react";

type EventItem = { year:number; title:string; description:string; geoPoints:number[][] };

export default function usePlayback(mapApiRef: React.RefObject<any>, events: EventItem[], muted:boolean, summary?: string|null){
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [localMuted, setLocalMuted] = useState(muted);
  const utterRef = useRef<SpeechSynthesisUtterance|null>(null);
  // helper: męski głos - poprawiony dla telefonów
  function pickMale(){
    const voices = window.speechSynthesis.getVoices();
    
    // Sprawdź czy to urządzenie mobilne
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Na telefonie preferuj głosy systemowe
      const mobilePrefs = [
        /en-US/i,
        /en-GB/i, 
        /English/i,
        /Samantha/i,  // iOS
        /Google UK English/i,
        /Microsoft.*/i
      ];
      
      for (const re of mobilePrefs) {
        const v = voices.find(v => re.test(v.name + v.voiceURI));
        if (v) {
          console.log("Mobile voice selected:", v.name);
          return v;
        }
      }
    } else {
      // Na desktopie preferuj męskie głosy
      const desktopPrefs = [/Male/i, /Google UK English Male/i, /Microsoft.*(Guy|Ryan|Brandon)/i, /en-US/i];
      for (const re of desktopPrefs) {
        const v = voices.find(v => re.test(v.name + v.voiceURI));
        if (v) {
          console.log("Desktop voice selected:", v.name);
          return v;
        }
      }
    }
    
    // Fallback - pierwszy dostępny głos
    const fallback = voices[0];
    if (fallback) {
      console.log("Fallback voice selected:", fallback.name);
    }
    return fallback || null;
  }

  function speak(text:string){
    return new Promise<void>((resolve)=>{
      console.log("speak() called with localMuted:", localMuted);
      if (localMuted) {
        console.log("speak() blocked - localMuted is true");
        return resolve();
      }
      console.log("speak() proceeding - localMuted is false");
      
      // Używaj ElevenLabs na obu platformach dla spójności głosu
      console.log("Using ElevenLabs API for consistent voice across platforms");
      
      fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })
      .then(response => response.json())
      .then(data => {
        if (data.audioUrl) {
          console.log("ElevenLabs audio received, playing");
          const audio = new Audio(data.audioUrl);
          
          // Timeout fallback dla auto-advance
          const timeoutId = setTimeout(() => {
            console.log("ElevenLabs timeout fallback - continuing to next event");
            resolve();
          }, 5000); // 5 sekund timeout
          
          audio.onended = () => {
            console.log("ElevenLabs audio finished");
            clearTimeout(timeoutId);
            resolve(); // To pozwoli na auto-advance
          };
          
          audio.onpause = () => {
            console.log("ElevenLabs audio paused");
            clearTimeout(timeoutId);
            resolve(); // Resolve when audio is paused
          };
          audio.onerror = () => {
            console.log("ElevenLabs failed, using Web Speech fallback");
            clearTimeout(timeoutId);
            // Fallback na Web Speech API
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.9; u.pitch = 1.0; u.lang = "en-US"; u.volume = 1.0;
            const v = pickMale(); if (v) u.voice = v;
            u.onend = () => resolve();
            utterRef.current = u;
            window.speechSynthesis.cancel();
            setTimeout(() => window.speechSynthesis.speak(u), 100);
          };
          audio.play().catch(() => {
            console.log("Audio.play() failed, using Web Speech fallback");
            clearTimeout(timeoutId);
            // Fallback na Web Speech API
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.9; u.pitch = 1.0; u.lang = "en-US"; u.volume = 1.0;
            const v = pickMale(); if (v) u.voice = v;
            u.onend = () => resolve();
            utterRef.current = u;
            window.speechSynthesis.cancel();
            setTimeout(() => window.speechSynthesis.speak(u), 100);
          });
        } else {
          throw new Error("No audio URL received");
        }
      })
      .catch(error => {
        console.log("ElevenLabs API failed, using Web Speech fallback:", error);
        // Fallback na Web Speech API
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9; u.pitch = 1.0; u.lang = "en-US"; u.volume = 1.0;
        const v = pickMale(); if (v) u.voice = v;
        u.onend = () => resolve();
        utterRef.current = u;
        window.speechSynthesis.cancel();
        setTimeout(() => window.speechSynthesis.speak(u), 100);
      });
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
      console.log("Reading intro...");
      await speak(summary);
      console.log("Intro finished, waiting 2 seconds before first event...");
      
      // Czekaj 2 sekundy przed pierwszym eventem
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    phaseRef.current = "events";
    
    // Automatycznie przejdź do pierwszego eventu po intro
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
    console.log(`Reading event ${i}: ${line}`);
    
    // Speak and wait for completion
    await speak(line);
    console.log(`Event ${i} finished speaking`);
    
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

    // Krótka pauza między eventami dla lepszego flow
    await new Promise(resolve => setTimeout(resolve, 500));

    // auto-advance, ale tylko jeśli playing jest true i kolejny istnieje:
    if (eventsRef.current[i+1] && playingRef.current) {
      // Sprawdź czy nie został wciśnięty pause podczas mówienia
      if (playingRef.current) {
        console.log(`Auto-advancing to event ${i+1}`);
        await playEvent(i+1);
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
    window.speechSynthesis.cancel(); 
    
    // Stop any currently playing ElevenLabs audio
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }
  
  function stopAll(){ 
    setPlaying(false); 
    window.speechSynthesis.cancel(); 
    
    // Stop any currently playing ElevenLabs audio
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }
  
  // Mute function - zatrzymaj aktualne audio
  function toggleMute() {
    const newMuted = !localMuted;
    setLocalMuted(newMuted);
    console.log("toggleMute: switching from", localMuted, "to", newMuted);
    
    if (newMuted) {
      // Mute - zatrzymaj aktualne audio
      console.log("Muting - stopping current audio");
      window.speechSynthesis.cancel();
      
      // Stop any currently playing ElevenLabs audio
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause();
        }
      });
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

  // Auto-start dla desktopu, na mobile zostaw PLAY button
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile && summary && events.length > 0 && !startedRef.current) {
      console.log("Desktop detected - auto-starting playIntroThenEvents with summary:", summary, "events:", events.length);
      setTimeout(() => {
        console.log("Calling playIntroThenEvents after timeout");
        playIntroThenEvents();
      }, 1000);
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