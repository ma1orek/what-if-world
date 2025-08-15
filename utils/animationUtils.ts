import { gsap } from 'gsap';

/**
 * GSAP animation presets for consistent animations across the app
 */

export const ANIMATION_DURATIONS = {
  fast: 0.3,
  normal: 0.6,
  slow: 1.2,
  cinematic: 2.0
};

export const EASING_FUNCTIONS = {
  smooth: "power2.out",
  bounce: "back.out(1.7)",
  elastic: "elastic.out(1, 0.3)",
  cinematic: "power3.inOut"
};

/**
 * Fade in animation with optional delay and stagger
 */
export function fadeIn(
  elements: gsap.TweenTarget,
  options: {
    duration?: number;
    delay?: number;
    stagger?: number;
    ease?: string;
    y?: number;
    scale?: number;
    onComplete?: () => void;
  } = {}
): gsap.core.Timeline {
  const {
    duration = ANIMATION_DURATIONS.normal,
    delay = 0,
    stagger = 0,
    ease = EASING_FUNCTIONS.smooth,
    y = 30,
    scale = 1,
    onComplete
  } = options;

  const tl = gsap.timeline({ onComplete });

  // Set initial state
  gsap.set(elements, {
    opacity: 0,
    y: y,
    scale: scale * 0.9
  });

  // Animate to visible state
  tl.to(elements, {
    opacity: 1,
    y: 0,
    scale: scale,
    duration,
    ease,
    delay,
    stagger
  });

  return tl;
}

/**
 * Fade out animation
 */
export function fadeOut(
  elements: gsap.TweenTarget,
  options: {
    duration?: number;
    delay?: number;
    ease?: string;
    y?: number;
    scale?: number;
    onComplete?: () => void;
  } = {}
): gsap.core.Timeline {
  const {
    duration = ANIMATION_DURATIONS.normal,
    delay = 0,
    ease = EASING_FUNCTIONS.smooth,
    y = -30,
    scale = 1.1,
    onComplete
  } = options;

  const tl = gsap.timeline({ onComplete });

  tl.to(elements, {
    opacity: 0,
    y: y,
    scale: scale,
    duration,
    ease,
    delay
  });

  return tl;
}

/**
 * Scale animation for emphasis
 */
export function scaleEmphasis(
  elements: gsap.TweenTarget,
  options: {
    scale?: number;
    duration?: number;
    ease?: string;
    yoyo?: boolean;
    repeat?: number;
  } = {}
): gsap.core.Timeline {
  const {
    scale = 1.05,
    duration = ANIMATION_DURATIONS.fast,
    ease = EASING_FUNCTIONS.smooth,
    yoyo = true,
    repeat = 1
  } = options;

  const tl = gsap.timeline();

  tl.to(elements, {
    scale,
    duration,
    ease,
    yoyo,
    repeat
  });

  return tl;
}

/**
 * Slide in from direction
 */
export function slideIn(
  elements: gsap.TweenTarget,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
  options: {
    duration?: number;
    delay?: number;
    stagger?: number;
    distance?: number;
    ease?: string;
    onComplete?: () => void;
  } = {}
): gsap.core.Timeline {
  const {
    duration = ANIMATION_DURATIONS.normal,
    delay = 0,
    stagger = 0,
    distance = 100,
    ease = EASING_FUNCTIONS.smooth,
    onComplete
  } = options;

  const tl = gsap.timeline({ onComplete });

  // Determine initial position based on direction
  const initialProps: any = { opacity: 0 };
  const finalProps: any = { opacity: 1 };

  switch (direction) {
    case 'left':
      initialProps.x = -distance;
      finalProps.x = 0;
      break;
    case 'right':
      initialProps.x = distance;
      finalProps.x = 0;
      break;
    case 'top':
      initialProps.y = -distance;
      finalProps.y = 0;
      break;
    case 'bottom':
      initialProps.y = distance;
      finalProps.y = 0;
      break;
  }

  // Set initial state
  gsap.set(elements, initialProps);

  // Animate to final state
  tl.to(elements, {
    ...finalProps,
    duration,
    ease,
    delay,
    stagger
  });

  return tl;
}

/**
 * Typewriter text animation
 */
export function typewriterText(
  element: HTMLElement,
  text: string,
  options: {
    duration?: number;
    delay?: number;
    cursor?: boolean;
    onComplete?: () => void;
  } = {}
): gsap.core.Timeline {
  const {
    duration = text.length * 0.05,
    delay = 0,
    cursor = true,
    onComplete
  } = options;

  const tl = gsap.timeline({ onComplete });

  // Clear initial text
  element.textContent = '';

  // Add cursor if requested
  if (cursor) {
    element.innerHTML = '<span class="cursor">|</span>';
    
    // Animate cursor blinking
    gsap.to(element.querySelector('.cursor'), {
      opacity: 0,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
  }

  // Animate text appearing
  tl.to({}, {
    duration,
    delay,
    ease: "none",
    onUpdate: function() {
      const progress = this.progress();
      const currentLength = Math.floor(progress * text.length);
      const currentText = text.substring(0, currentLength);
      
      if (cursor) {
        element.innerHTML = currentText + '<span class="cursor">|</span>';
      } else {
        element.textContent = currentText;
      }
    },
    onComplete: () => {
      if (cursor) {
        // Remove cursor after typing is complete
        setTimeout(() => {
          const cursorElement = element.querySelector('.cursor');
          if (cursorElement) {
            gsap.to(cursorElement, {
              opacity: 0,
              duration: 0.3,
              onComplete: () => cursorElement.remove()
            });
          }
        }, 1000);
      }
    }
  });

  return tl;
}

/**
 * Staggered reveal animation for lists
 */
export function staggeredReveal(
  elements: gsap.TweenTarget,
  options: {
    duration?: number;
    stagger?: number;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number;
    ease?: string;
    onComplete?: () => void;
  } = {}
): gsap.core.Timeline {
  const {
    duration = ANIMATION_DURATIONS.normal,
    stagger = 0.1,
    delay = 0,
    direction = 'up',
    distance = 50,
    ease = EASING_FUNCTIONS.smooth,
    onComplete
  } = options;

  const tl = gsap.timeline({ onComplete });

  // Determine animation properties based on direction
  const fromProps: any = { opacity: 0 };
  const toProps: any = { opacity: 1 };

  switch (direction) {
    case 'up':
      fromProps.y = distance;
      toProps.y = 0;
      break;
    case 'down':
      fromProps.y = -distance;
      toProps.y = 0;
      break;
    case 'left':
      fromProps.x = distance;
      toProps.x = 0;
      break;
    case 'right':
      fromProps.x = -distance;
      toProps.x = 0;
      break;
  }

  // Set initial state
  gsap.set(elements, fromProps);

  // Animate with stagger
  tl.to(elements, {
    ...toProps,
    duration,
    ease,
    delay,
    stagger
  });

  return tl;
}

/**
 * Glow effect animation
 */
export function glowEffect(
  elements: gsap.TweenTarget,
  options: {
    color?: string;
    intensity?: number;
    duration?: number;
    repeat?: number;
    yoyo?: boolean;
  } = {}
): gsap.core.Timeline {
  const {
    color = '#d4af37',
    intensity = 20,
    duration = ANIMATION_DURATIONS.slow,
    repeat = -1,
    yoyo = true
  } = options;

  const tl = gsap.timeline();

  tl.to(elements, {
    textShadow: `0 0 ${intensity}px ${color}`,
    duration,
    ease: EASING_FUNCTIONS.smooth,
    repeat,
    yoyo
  });

  return tl;
}

/**
 * Loading spinner animation
 */
export function spinnerAnimation(
  element: gsap.TweenTarget,
  options: {
    duration?: number;
    ease?: string;
  } = {}
): gsap.core.Timeline {
  const {
    duration = 1,
    ease = "none"
  } = options;

  const tl = gsap.timeline({ repeat: -1 });

  tl.to(element, {
    rotation: 360,
    duration,
    ease
  });

  return tl;
}

/**
 * Parallax scroll effect
 */
export function parallaxScroll(
  elements: { element: gsap.TweenTarget; speed: number }[],
  scrollY: number
): void {
  elements.forEach(({ element, speed }) => {
    gsap.set(element, {
      y: scrollY * speed
    });
  });
}

/**
 * Cinematic zoom effect
 */
export function cinematicZoom(
  element: gsap.TweenTarget,
  options: {
    scale?: number;
    duration?: number;
    ease?: string;
    onComplete?: () => void;
  } = {}
): gsap.core.Timeline {
  const {
    scale = 1.1,
    duration = ANIMATION_DURATIONS.cinematic,
    ease = EASING_FUNCTIONS.cinematic,
    onComplete
  } = options;

  const tl = gsap.timeline({ onComplete });

  tl.to(element, {
    scale,
    duration,
    ease
  });

  return tl;
}