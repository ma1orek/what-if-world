import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { InputPromptProps } from '@/types';

const InputPrompt: React.FC<InputPromptProps> = ({ onSubmit, isVisible }) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const examplePrompts = [
    {
      text: "Napoleon wins at Waterloo",
      description: "What if the French Emperor had triumphed in his final battle?"
    },
    {
      text: "Roman Empire never falls",
      description: "Imagine Rome adapting and surviving into the modern era"
    },
    {
      text: "Cold War turns hot in 1962",
      description: "The Cuban Missile Crisis escalates into global conflict"
    }
  ];

  useEffect(() => {
    if (!containerRef.current || !isVisible) return;

    // Animate container entrance
    const tl = gsap.timeline();
    
    gsap.set(containerRef.current, { opacity: 0, scale: 0.9 });
    gsap.set([inputRef.current, examplesRef.current, submitButtonRef.current], {
      opacity: 0,
      y: 30
    });

    tl
      .to(containerRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power3.out"
      })
      .to(inputRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.4")
      .to(examplesRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3")
      .to(submitButtonRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3");

    // Focus input after animation
    setTimeout(() => {
      inputRef.current?.focus();
    }, 1000);

    return () => {
      tl.kill();
    };
  }, [isVisible]);

  const handleExampleClick = (example: string) => {
    setInputValue(example);
    
    // Animate example selection
    if (inputRef.current) {
      gsap.fromTo(inputRef.current, 
        { scale: 1 },
        { 
          scale: 1.02, 
          duration: 0.2, 
          yoyo: true, 
          repeat: 1,
          ease: "power2.inOut"
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Animate submission
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        ease: "power2.in",
        onComplete: () => {
          onSubmit(inputValue.trim());
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center bg-history-dark z-40"
    >
      {/* Background with subtle animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-history-dark via-history-gray to-history-dark opacity-50" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-20 bg-gradient-to-b from-transparent via-history-gold to-transparent opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-cinematic text-history-gold mb-4">
              Rewrite History
            </h2>
            <p className="text-lg text-white opacity-80 font-modern">
              Propose an alternate timeline and watch it unfold
            </p>
          </div>

          {/* Input field */}
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What if..."
              className="w-full h-32 px-6 py-4 bg-black bg-opacity-50 border-2 border-history-gold border-opacity-30 rounded-lg text-white text-xl placeholder-history-gold placeholder-opacity-50 font-modern resize-none focus:outline-none focus:border-opacity-100 focus:bg-opacity-70 transition-all duration-300 backdrop-blur-sm"
              maxLength={500}
              disabled={isSubmitting}
            />
            
            {/* Character counter */}
            <div className="absolute bottom-2 right-4 text-sm text-history-gold opacity-60">
              {inputValue.length}/500
            </div>
          </div>

          {/* Example prompts */}
          <div ref={examplesRef} className="space-y-4">
            <p className="text-center text-history-gold opacity-80 font-modern">
              Or try one of these scenarios:
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example.text)}
                  className="group p-4 bg-black bg-opacity-30 border border-history-gold border-opacity-20 rounded-lg hover:border-opacity-60 hover:bg-opacity-50 transition-all duration-300 text-left backdrop-blur-sm"
                  disabled={isSubmitting}
                >
                  <div className="text-history-gold font-medium mb-2 group-hover:text-yellow-300 transition-colors">
                    "{example.text}"
                  </div>
                  <div className="text-white text-sm opacity-70 group-hover:opacity-90 transition-opacity">
                    {example.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <div className="text-center">
            <button
              ref={submitButtonRef}
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="px-8 py-4 bg-history-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                'Begin Rewrite'
              )}
            </button>
            
            {/* Keyboard shortcut hint */}
            <p className="mt-3 text-sm text-white opacity-50 font-modern">
              Press Ctrl+Enter to submit
            </p>
          </div>
        </form>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-history-gold opacity-30" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-history-gold opacity-30" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-history-gold opacity-30" />
    </div>
  );
};

export default InputPrompt;