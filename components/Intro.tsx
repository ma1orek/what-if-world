import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { IntroProps } from '@/types';

const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple timeout-based animation instead of GSAP for now
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // 4 seconds total

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center bg-history-dark z-50 cursor-pointer"
      onClick={onComplete}
    >
      {/* Background overlay with subtle animation */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-gradient-radial from-history-gray via-history-dark to-black"
      />
      
      {/* Animated background particles - using fixed positions to avoid hydration mismatch */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { left: '10%', top: '20%', delay: '0s', duration: '2s' },
          { left: '80%', top: '30%', delay: '0.5s', duration: '3s' },
          { left: '60%', top: '70%', delay: '1s', duration: '2.5s' },
          { left: '20%', top: '80%', delay: '1.5s', duration: '4s' },
          { left: '90%', top: '10%', delay: '2s', duration: '3.5s' },
          { left: '40%', top: '40%', delay: '0.3s', duration: '2.8s' },
          { left: '70%', top: '60%', delay: '1.2s', duration: '3.2s' },
          { left: '30%', top: '15%', delay: '0.8s', duration: '2.3s' },
        ].map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-history-gold opacity-20 rounded-full animate-pulse"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl px-8">
        {/* Main quote */}
        <div 
          ref={textRef}
          className="mb-8 animate-fade-in"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-cinematic text-history-gold leading-tight">
            History is written by the victors...
          </h1>
        </div>

        {/* Subtitle */}
        <div 
          ref={subtitleRef}
          className="text-xl md:text-2xl lg:text-3xl font-modern text-white opacity-80 animate-fade-in"
          style={{ animationDelay: '1s' }}
        >
          <p>but what if you could change it?</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 border border-history-gold opacity-20 rounded-full animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-32 h-32 border border-history-gold opacity-10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Bottom hint text */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="flex flex-col items-center space-y-2 opacity-60">
          <div className="w-6 h-10 border-2 border-history-gold rounded-full flex justify-center">
            <div className="w-1 h-3 bg-history-gold rounded-full mt-2 animate-bounce" />
          </div>
          <p className="text-sm text-history-gold font-modern">
            Scroll to begin
          </p>
        </div>
      </div>
    </div>
  );
};

export default Intro;