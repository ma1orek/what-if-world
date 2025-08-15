import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function SummaryReveal({ summary }:{ summary?: string | null }){
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!summary || !ref.current) return;
    ref.current.innerHTML = "";
    const chars = summary.split("");
    chars.forEach((ch,i)=>{
      const span = document.createElement("span");
      span.textContent = ch;
      span.style.opacity = "0";
      ref.current!.appendChild(span);
      gsap.to(span,{ opacity:1, delay:i*0.02, duration:0.02 });
    });
  },[summary]);
  return <div ref={ref} className="text-lg leading-relaxed whitespace-pre-wrap" />;
}