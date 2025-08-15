import { useEffect, useRef } from "react";
import gsap from "gsap";
import IntroHeroScene from "./IntroHeroScene";

export default function CinematicIntro({ onStart, prompt, setPrompt }:{
  onStart: ()=>void; prompt:string; setPrompt:(s:string)=>void;
}){
  const root = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Dodaj klasę do body dla czarnego tła
    document.body.classList.add("home-root");
    console.log("Added home-root class to body");
    
    // subtelny auto-drift + parallax
    let raf=0, t=0;
    const drift = () => { 
      t+=0.0025; 
      const dx=Math.sin(t)*10, dy=Math.cos(t*0.8)*6; 
      const mapEl = document.querySelector('.home-map');
      if(mapEl) (mapEl as HTMLElement).style.transform=`translate3d(${dx}px,${dy}px,0)`; 
      raf=requestAnimationFrame(drift); 
    };
    raf=requestAnimationFrame(drift);
    
    const onMove = (e:MouseEvent)=>{ 
      const rx=(e.clientX/window.innerWidth - .5)*8, ry=(e.clientY/window.innerHeight - .5)*6; 
      if(titleRef.current) titleRef.current.style.transform=`translate3d(${rx}px,${ry}px,0)`; 
    };
    window.addEventListener("mousemove", onMove);
    
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power4.out" });
      gsap.fromTo(inputRef.current, { opacity: 0 }, { opacity: 1, delay: 0.8, duration: 0.8 });
    }, root);
    
    return () => { 
      document.body.classList.remove("home-root");
      cancelAnimationFrame(raf); 
      window.removeEventListener("mousemove", onMove);
      ctx.revert(); 
    };
  }, []);

  return (
    <main className="home--film">
      {/* Film grain SVG filter */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <filter id="homeGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.25" /></feComponentTransfer>
        </filter>
      </svg>

      {/* MAPA w tle (bez szarych veilów) */}
      <div className="home-map parallax">
        <IntroHeroScene />
      </div>

      {/* Artefakty taśmy + winieta (czarna) */}
      <div className="home-film__grain" />
      <div className="home-film__scratches" />
      <div className="home-film__vignette" />

      {/* HERO */}
      <section className="hero-wrap">
        <div className="hero-inner parallax">
          {/* Stare logo/typo */}
          <h1 ref={titleRef} className="hero-logo">HISTORY&nbsp;REWRITER</h1>
          <p className="hero-sub">
            Rewrite a pivotal moment in history — then watch an AI-narrated alternate
            timeline unfold on a living map.
          </p>

          <div className="hero-input">
            <span className="hero-input__prefix">What if</span>
                         <input 
               ref={inputRef}
               placeholder="the Roman Empire never fell?" 
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               onKeyDown={e=>{ if(e.key==="Enter") onStart(); }} 
             />
            <button onClick={onStart} disabled={!prompt.trim()}>Generate Timeline</button>
          </div>

                     <div className="hints">
             {[
               "the Roman Empire never fell?",
               "Hitler was a woman?",
               "World War II never started?",
               "Harry Potter joined Voldemort?",
               "dinosaurs never went extinct?",
               "the Wright brothers never flew?",
               "Mickey Mouse takes over the world?"
             ].map(s=> (
              <button key={s} className="chip" onClick={()=>{setPrompt(s.replace('?','')); onStart();}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}