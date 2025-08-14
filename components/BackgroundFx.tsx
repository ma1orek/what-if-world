import { useEffect } from "react";
import gsap from "gsap";

export default function BackgroundFx(){
  useEffect(()=>{
    gsap.to(".bg-noise",{ opacity:0.18, duration:2, repeat:-1, yoyo:true, ease:"sine.inOut" });
    gsap.to(".bg-glow",{ scale:1.06, duration:6, repeat:-1, yoyo:true, ease:"sine.inOut" });
  },[]);
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="bg-noise absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
      <div className="bg-glow absolute inset-0 bg-gradient-radial from-white/6 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
    </div>
  );
}