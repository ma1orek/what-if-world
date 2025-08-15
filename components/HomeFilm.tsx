import React, { useEffect, useRef, useState } from "react";
import AnimatedMapSVG from "./AnimatedMapSVG";

/* SVG filter do ziarna (feTurbulence) */
const GrainDefs = () => (
  <svg className="absolute w-0 h-0" aria-hidden>
    <filter id="homeGrain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.25" /></feComponentTransfer>
    </filter>
  </svg>
);



export default function HomeFilm() {
  // wymuś czarny background
  useEffect(() => { 
    document.body.classList.add("home-root"); 
    return () => document.body.classList.remove("home-root"); 
  }, []);

  const mapRef = useRef<HTMLDivElement>(null);
  // delikatny auto-drift mapy (logo BEZ parallaxu)
  useEffect(() => {
    let raf = 0, t = 0;
    const loop = () => {
      t += 0.0025;
      const dx = Math.sin(t) * 10, dy = Math.cos(t * 0.8) * 6;
      if (mapRef.current) mapRef.current.style.transform = `translate3d(${dx}px,${dy}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);

  const run = (tail?: string) => {
    const input = document.getElementById("home-q") as HTMLInputElement | null;
    const txt = (tail ?? input?.value ?? "").trim();
    if (!txt || isGenerating) return;
    
    console.log("HomeFilm: Starting generation for:", txt);
    setIsGenerating(true);
    
    // Wyczyść input po kliknięciu
    if (input && !tail) input.value = "";
    
    // sygnał startu do systemu z unikalnym ID
    const event = new CustomEvent("HISTORY_REWRITER_START", { 
      detail: { 
        prompt: `What if ${txt}`,
        id: Date.now() + Math.random() // unikalny ID dla każdej generacji
      }
    });
    window.dispatchEvent(event);
    console.log("HomeFilm: Event dispatched");
  };

  // gdy backend/generator gotowy -> ukryj spinner
  useEffect(() => {
    const ok = () => {
      console.log("HomeFilm: Received ready/failed event");
      setIsGenerating(false);
    };
    window.addEventListener("HISTORY_REWRITER_READY", ok as EventListener);
    window.addEventListener("HISTORY_REWRITER_FAILED", ok as EventListener);
    return () => {
      window.removeEventListener("HISTORY_REWRITER_READY", ok as EventListener);
      window.removeEventListener("HISTORY_REWRITER_FAILED", ok as EventListener);
    };
  }, []);

  // Reset generating state when component mounts
  useEffect(() => {
    setIsGenerating(false);
  }, []);

  const samples = [
    "the Roman Empire never fell?",
    "Hitler was a woman?",
    "World War II never started?",
    "Napoleon won at Waterloo?",
    "dinosaurs never went extinct?",
    "the Wright brothers never flew?",
    "Mickey Mouse takes over the world?"
  ];

  return (
    <main className="home--film">
      <GrainDefs />

      <div ref={mapRef} className="home-map">
        <AnimatedMapSVG />
      </div>
      <div className="home-film__grain" />
      <div className="home-film__scratches" />
      <div className="home-film__flicker" />
      <div className="home-film__particles" />
      <div className="home-film__vignette" />

      <section className="hero-wrap">
        <div className="hero-inner">
          <div className="hero-logo-container">
            <img src="/whatlogo.svg" alt="What If World" className="hero-logo-svg" />
          </div>
          <p className="hero-sub">Rewrite a pivotal moment in history — then watch an AI-narrated alternate timeline unfold on a living map.</p>

          <div className="hero-input" role="search" aria-label="What if">
            <div className="hero-input-row">
              <span className="hero-input__prefix">What if</span>
                             <input id="home-q" placeholder="the Roman Empire never fell?"
                 onKeyDown={e => { if (e.key === "Enter") run(); }} />
            </div>
            <button onClick={() => run()}>Generate Timeline</button>
          </div>

          <div className="hints" aria-label="Examples">
            {samples.map(s => <button key={s} className="chip" onClick={() => run(s)}>{s}</button>)}
          </div>

          {isGenerating && (
            <div style={{marginTop:12}}>
              <div className="generating-text generating-pulse">
                Generating alternate timeline<span className="dots" />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}