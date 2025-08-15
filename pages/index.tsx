import { useRef, useState, useEffect } from "react";
import AnimatedMapSVG from "../components/AnimatedMapSVG";
import useHistoryStream from "../hooks/useHistoryStream";
import usePlayback from "../hooks/usePlayback";
import PlaybackBar from "../components/PlaybackBar";
import HomeFilm from "../components/HomeFilm";
import BackgroundFx from "../components/BackgroundFx";
import SummaryReveal from "../components/SummaryReveal";

export default function Home(){
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [resetKey, setResetKey] = useState(0);

  // MAP API ref
  const mapRef = useRef<any>(null);
  
  // Mobile refs
  const listRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLLIElement>>({});

  // Use the original working stream hook with reset key
  const streamPrompt = started && currentPrompt.trim() ? currentPrompt : null;
  const { summary, events, geo, ops } = useHistoryStream(streamPrompt);

  // PLAYBACK (narrator + kamera po eventach)
  const { index, playing, play, pause, next, prev, restart, startNewScenario, toggleMute, localMuted, forceUpdateMuted } = usePlayback(mapRef, events, muted, summary);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 980px)").matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for HomeFilm events
  useEffect(() => {
    const handleStart = (e: any) => {
      const prompt = e.detail.prompt;
      console.log("Main: Received start event:", prompt);
      
      // Immediate reset and new generation
      setCurrentPrompt("");
      setStarted(false);
      
      // Force cleanup and restart
      setTimeout(() => {
        console.log("Main: Starting new generation with prompt:", prompt);
        setResetKey(prev => prev + 1);
        setCurrentPrompt(prompt);
        setStarted(true);
        startNewScenario();
      }, 50);
    };

    window.addEventListener('HISTORY_REWRITER_START', handleStart);
    return () => window.removeEventListener('HISTORY_REWRITER_START', handleStart);
  }, [startNewScenario]);

  // Debug streamPrompt
  useEffect(() => {
    console.log("Main: streamPrompt changed to:", streamPrompt);
    console.log("Main: started:", started, "currentPrompt:", currentPrompt);
    console.log("Main: summary:", summary, "events:", events.length);
  }, [streamPrompt, started, currentPrompt, summary, events]);

  const goHome = () => {
    console.log("Main: Going home - resetting everything");
    
    // Najpierw wyczyść prompt żeby zatrzymać stream
    setCurrentPrompt("");
    
    // Potem reset UI
    setTimeout(() => {
      setStarted(false);
      setResetKey(prev => prev + 1);
      startNewScenario();
    }, 100);
  };

  // Mobile functions
  function focusEventOnMap(ev: {lat?: number; lon?: number}) {
    if (ev.lat == null || ev.lon == null) return;
    // Na mobile mocniejsze przybliżenie (zoom 5.0), na desktop standardowe (3.6)
    const zoomLevel = isMobile ? 5.0 : 3.6;
    window.dispatchEvent(new CustomEvent("MAP_FOCUS", { 
      detail: { lat: ev.lat, lon: ev.lon, zoom: zoomLevel, duration: 900 }
    }));
  }

  function scrollCardIntoView(id: string) {
    const el = cardRefs.current[id];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  // Auto-focus on active event change
  useEffect(() => {
    const ev = events[index];
    if (!ev || !isMobile) return;
    focusEventOnMap(ev);
    scrollCardIntoView(ev.id);
  }, [index, events, isMobile]);

  // Scroll to top when generation completes
  useEffect(() => {
    if (summary && events.length > 0) {
      // Generacja się skończyła - scroll do góry żeby widać było PLAY button
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 500);
    }
  }, [summary, events]);

     // Now Playing functions
   function updateNowPlaying(ev?: { year?: number|string; title?: string; description?: string }) {
     const root = document.getElementById("nowPlaying");
     if (!root) return;
     const y = root.querySelector<HTMLSpanElement>("#npYear");
     const t = root.querySelector<HTMLSpanElement>("#npTitle");
     const d = root.querySelector<HTMLSpanElement>("#npDescription");
     const expandBtn = root.querySelector<HTMLButtonElement>("#npExpand");
     
     if (!ev || !y || !t || !d || !expandBtn) { 
       if (y) y.textContent = ""; 
       if (t) t.textContent = ""; 
       if (d) d.textContent = "";
       if (expandBtn) expandBtn.style.display = "none";
       return; 
     }
     
     y.textContent = ev.year ? `${ev.year}` : "";
     t.textContent = ev.title || "";
     d.textContent = ev.description || "";
     expandBtn.style.display = "block";
    
                  // Store full data for expand - create full screen modal with ALL generation content
      expandBtn.onclick = () => {
        // Check if modal already exists
        const existingModal = document.querySelector('.expand-modal');
        if (existingModal) {
          existingModal.remove();
          return;
        }

        // Create animated modal overlay - simple dark window with blur
        const modal = document.createElement('div');
        modal.className = 'expand-modal';
        modal.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.9);
          width: 90vw;
          max-width: 500px;
          height: 80vh;
          background: rgba(0,0,0,0.95);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow-y: auto;
          backdrop-filter: blur(20px);
          border: 1px solid #333;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
        `;
        
        // Animate modal opening
        document.body.appendChild(modal);
        requestAnimationFrame(() => {
          modal.style.transform = 'translate(-50%, -50%) scale(1)';
          modal.style.opacity = '1';
        });
      
        // Dodaj event listener żeby modal wracał do generacji
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            // Animate modal closing
            modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
          }
        });
     
        const header = document.createElement('div');
        header.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #333;
          background: rgba(0,0,0,0.9);
          position: sticky;
          top: 0;
          z-index: 1001;
          border-radius: 16px 16px 0 0;
        `;
    
                                   const closeBtn = document.createElement('button');
          closeBtn.style.cssText = `
            background: transparent;
            border: 1px solid #666;
            color: #fff;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-weight: 400;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            margin: 0 auto;
          `;
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => {
          // Animate modal closing
          modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
          modal.style.opacity = '0';
          setTimeout(() => modal.remove(), 300);
        };
      
        const title = document.createElement('div');
        title.style.cssText = `
          color: #fff;
          font-weight: 600;
          font-size: 16px;
          flex: 1;
          margin-right: 16px;
        `;
                 title.textContent = `What if: ${currentPrompt.replace(/^What if\s*/i, '')}`;
      
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        const content = document.createElement('div');
        content.style.cssText = `
          flex: 1;
          padding: 24px;
          color: #fff;
          line-height: 1.8;
          font-size: 16px;
          width: 100%;
          box-sizing: border-box;
        `;
             
        // Show ALL events, not just the active one - using simple dark style
        const allEventsHTML = events.map((event, idx) => `
          <div style="margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid #333; opacity: ${idx === index ? 1 : 0.7};">
            <div style="margin-bottom: 12px;">
              <div style="font-weight: 600; color: #fff; font-size: 16px; margin-bottom: 8px;">
                ${event.year ? `${event.year} — ` : ""}${event.title || 'Untitled Event'}
              </div>
              ${event.description ? `
                <div style="opacity: 0.8; margin-top: 6px; font-size: 14px; color: #ccc; line-height: 1.6;">
                  ${event.description}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('');
      
                                   // Show content based on what narrator is reading
        if (index === -1) {
          // Narrator czyta wstęp - pokaż intro NAD listą lat (nie zamiast niej)
          content.innerHTML = `
            <div style="margin-bottom: 24px; text-align: center;">
              <h2 style="color: #fff; font-size: 20px; font-weight: 600; margin-bottom: 16px;">
                What if: ${currentPrompt.replace(/^What if\s*/i, '')}
              </h2>
              ${summary ? `<div style="color: #fff; font-size: 16px; margin-bottom: 24px; line-height: 1.8; padding: 20px; background: rgba(212, 170, 39, 0.1); border: 1px solid #d4aa27; border-radius: 8px;">
                <strong style="color: #d4aa27;">Intro:</strong><br/>
                ${summary}
              </div>` : '<div style="color: #ccc; font-size: 16px; margin-bottom: 24px; text-align: center;">Generating intro...</div>'}
              ${events.length > 0 ? `<div style="color: #ccc; font-size: 14px; margin-bottom: 20px;">
                ${events.length} events
              </div>
              <div style="color: #ddd; line-height: 1.9; font-size: 16px;">
                ${allEventsHTML}
              </div>` : ''}
            </div>
          `;
        } else {
          // Narrator czyta wydarzenie - pokaż intro + wydarzenia (lista lat zawsze widoczna)
          content.innerHTML = `
            <div style="margin-bottom: 24px; text-align: center;">
              <h2 style="color: #fff; font-size: 20px; font-weight: 600; margin-bottom: 16px;">
                What if: ${currentPrompt.replace(/^What if\s*/i, '')}
              </h2>
              ${summary ? `<div style="color: #fff; font-size: 16px; margin-bottom: 24px; line-height: 1.8; padding: 20px; background: rgba(212, 170, 39, 0.1); border: 1px solid #d4aa27; border-radius: 8px;">
                <strong style="color: #d4aa27;">Intro:</strong><br/>
                ${summary}
              </div>` : ''}
              ${events.length > 0 ? `<div style="color: #ccc; font-size: 14px; margin-bottom: 20px;">
                ${events.length} events
              </div>
              <div style="color: #ddd; line-height: 1.9; font-size: 16px;">
                ${allEventsHTML}
              </div>` : ''}
            </div>
          `;
        }
    
        modal.appendChild(header);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Restore body scroll on close
        const originalRemove = modal.remove;
        modal.remove = function() {
          document.body.style.overflow = '';
          originalRemove.call(this);
        };
      };
  }

  // Update Now Playing on active event change
  useEffect(() => {
    // Czekaj aż events są załadowane (summary może być undefined na początku)
    if (events.length === 0) {
      // Jeszcze się generuje - nie pokazuj nic
      updateNowPlaying(undefined);
      return;
    }

    if (index === -1) {
      // Narrator czyta wstęp - pokaż summary w Now Playing boxie na dole
      updateNowPlaying({ 
        year: "Intro", 
        title: "Alternative History", 
        description: summary || "Generating intro..." 
      });
    } else {
      // Narrator czyta wydarzenie - pokaż wydarzenie w Now Playing boxie na dole
      const ev = events[index];
      updateNowPlaying(ev);
    }
  }, [index, events, summary]);

  // Cleanup on unmount
  useEffect(() => () => updateNowPlaying(undefined), []);

  // Tap to expand Now Playing
  useEffect(() => {
    const root = document.getElementById("nowPlaying");
    if (!root) return;

    let timer: number | undefined;

    const expandOnce = () => {
      root.classList.add("expand");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        root.classList.remove("expand");
      }, 3000);
    };

    root.addEventListener("click", expandOnce);
    return () => {
      root.removeEventListener("click", expandOnce);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {started && <BackgroundFx />}

      {!started && <HomeFilm key={resetKey} />}

      {started && (
        <div className={isMobile ? "mobile-layout" : "desktop-layout"}>
                     {/* Header */}
                                    <div className="app-header">
               <button className="back" onClick={goHome}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                   <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
               </button>
               {!isMobile && (
                 <img 
                   src="/whatlogo.svg" 
                   alt="What If World" 
                   className="logo" 
                 />
               )}
             </div>

                                                                               {/* Full screen generation overlay for mobile */}
              {isMobile && (!summary || events.length === 0) && (
                <div className="mobile-generation-overlay">
                  <div className="generation-content">
                    <div className="generation-text">
                      <div className="generation-title">Generating...</div>
                      <div className="generation-dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                                         <div className="generation-prompt">
                       <div className="what-if-label">What if:</div>
                       <div className="prompt-text">{currentPrompt.replace(/^What if\s*/i, '')}</div>
                     </div>
                  </div>
                </div>
              )}

          {/* Map Area */}
          <div className="map-area">
            <AnimatedMapSVG ref={mapRef} />
          </div>

          {/* Side Panel - Desktop Only */}
          <aside className="side-panel">
            <h1 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', fontFamily: 'Inter, sans-serif'}}>
              WHAT IF: {currentPrompt.replace(/^What if\s*/i, '')}
            </h1>
                         <div style={{
               height: '2px', 
               background: 'linear-gradient(90deg, transparent, #d4aa27, transparent)', 
               marginBottom: '24px',
               boxShadow: '0 0 20px rgba(212, 170, 39, 0.6)'
             }} />
            
            {/* Loading animation when generating */}
            {(!summary && events.length === 0) && (
              <div style={{textAlign: 'center', padding: '40px 20px'}}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '16px'
                }}>
                  Generating alternate timeline
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#d4aa27',
                    borderRadius: '50%',
                    animation: 'generationPulse 1.4s ease-in-out infinite'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#d4aa27',
                    borderRadius: '50%',
                    animation: 'generationPulse 1.4s ease-in-out infinite 0.2s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#d4aa27',
                    borderRadius: '50%',
                    animation: 'generationPulse 1.4s ease-in-out infinite 0.4s'
                  }}></div>
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#888',
                  fontStyle: 'italic'
                }}>
                  Creating your alternate history...
                </div>
              </div>
            )}
            
            {/* Intro text */}
            {summary && (
              <div style={{marginBottom: '24px', lineHeight: '1.6', color: '#ddd'}}>
                <SummaryReveal summary={summary} />
              </div>
            )}
            
            {/* ZŁOTA LINIA ODDZIELAJĄCA */}
            <div style={{
              width: '100%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #d4aa27, transparent)',
              margin: '24px auto 24px',
              boxShadow: '0 0 18px rgba(212, 170, 39, 0.4)'
            }}></div>

            {/* Events list */}
            <div>
              {events.map((e,i)=>(
                <div key={e.id || i}
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: i === index ? '1px solid #d4aa27' : '1px solid #333',
                    background: i === index ? 'rgba(212, 170, 39, 0.1)' : 'rgba(255,255,255,0.02)',
                    opacity: i === index ? 1 : 0.6
                  }}>
                  <div style={{fontWeight: '600', color: '#fff'}}>
                    {e.year ? `${e.year} — ` : ""}{e.title}
                  </div>
                  {e.description && (
                    <div style={{opacity: 0.8, marginTop: '6px', fontSize: '14px', color: '#ccc'}}>
                      {e.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

                                                                                       {/* Transport Controls - Desktop: bottom, Mobile: top-right */}
                           <div className="transport" style={{
                position: isMobile ? 'absolute' : 'fixed',
                top: isMobile ? '16px' : 'auto',
                right: isMobile ? '20px' : 'auto',
                bottom: isMobile ? 'auto' : '40px',
                left: isMobile ? 'auto' : '50%',
                transform: isMobile ? 'none' : 'translateX(-50%)',
               zIndex: 100,
               background: 'rgba(0,0,0,0.9)',
                               border: 'none',
               borderRadius: '8px',
               padding: isMobile ? '8px' : '12px',
               height: isMobile ? '40px' : 'auto',
               boxShadow: '0 0 15px rgba(0,0,0,0.5)',
               backdropFilter: 'blur(10px)',
               maxWidth: isMobile ? '200px' : '450px',
               width: 'fit-content',
               display: 'flex',
               gap: isMobile ? '4px' : '8px',
               alignItems: 'center',
               justifyContent: 'center',
               marginRight: isMobile ? '14px' : 'auto'
             }}>
                                                 <button className="btn" onClick={restart} title="Restart" style={{
               padding: isMobile ? '8px 8px 8px 8px' : '10px 16px',
               minWidth: isMobile ? '40px' : 'auto',
               height: isMobile ? '40px' : 'auto',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: isMobile ? '0' : '8px'
             }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {!isMobile && 'Restart'}
            </button>
                         <button className="btn" onClick={prev} disabled={index <= 0} title="Previous" style={{
               padding: isMobile ? '8px 8px 8px 8px' : '10px 16px',
               minWidth: isMobile ? '40px' : 'auto',
               height: isMobile ? '40px' : 'auto',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: isMobile ? '0' : '8px'
             }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {!isMobile && 'Prev'}
            </button>
                         <button className="btn btn--accent" onClick={playing ? pause : play} title={playing ? 'Pause' : 'Play'} style={{
               padding: isMobile ? '6px 6px 6px 6px' : '10px 16px',
               minWidth: isMobile ? '80px' : 'auto',
               height: isMobile ? '40px' : 'auto',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: isMobile ? '4px' : '8px',
               // Mobile: jaśniejszy kolor dla lepszej widoczności
               background: isMobile ? '#f5c84a' : undefined,
               color: isMobile ? '#000' : undefined,
               borderColor: isMobile ? '#f5c84a' : undefined,
               fontWeight: isMobile ? '800' : undefined,
               boxShadow: isMobile ? '0 0 10px rgba(245, 200, 74, 0.5)' : undefined
             }}>
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                  <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                </svg>
              )}
              {isMobile ? (playing ? '' : 'PLAY') : (playing ? 'Pause' : 'Play')}
            </button>
                         <button className="btn" onClick={next} disabled={index >= events.length - 1} title="Next" style={{
               padding: isMobile ? '8px 8px 8px 8px' : '10px 16px',
               minWidth: isMobile ? '40px' : 'auto',
               height: isMobile ? '40px' : 'auto',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: isMobile ? '0' : '8px'
             }}>
              {!isMobile && 'Next'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
                                                     <button className="btn" onClick={toggleMute} title={localMuted ? 'Unmute' : 'Mute'} style={{
                 padding: isMobile ? '8px 8px 8px 8px' : '10px 16px',
                 minWidth: isMobile ? '40px' : 'auto',
                 height: isMobile ? '40px' : 'auto',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: isMobile ? '0' : '8px'
               }}>
                 {localMuted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {!isMobile && (localMuted ? 'Unmute' : 'Mute')}
              </button>
          </div>

                     {/* Now Playing - Mobile Only */}
           <div className="now-playing" id="nowPlaying" aria-live="polite">
             <div className="np-content">
               <span className="np-year" id="npYear"></span>
               <span className="np-title" id="npTitle"></span>
               <span className="np-description" id="npDescription"></span>
             </div>
                          <button className="np-expand" id="npExpand" style={{
                background: 'rgba(212, 170, 39, 0.15)',
                border: '2px solid #d4aa27',
                color: '#d4aa27',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 15px rgba(212, 170, 39, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 170, 39, 0.25)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(212, 170, 39, 0.5)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212, 170, 39, 0.15)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(212, 170, 39, 0.3)';
              }}>Expand</button>
           </div>
        </div>
      )}
    </div>
  );
}