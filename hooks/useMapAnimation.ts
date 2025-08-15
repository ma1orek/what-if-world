import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { TimelineEvent } from '@/types';
import { 
  latLonTo3D, 
  calculateOptimalCameraPosition,
  animateCameraAlongPath,
  generateCameraPath 
} from '@/utils/geoUtils';

export interface MapAnimationState {
  currentEventIndex: number;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  isAnimating: boolean;
  animationProgress: number;
}

export interface UseMapAnimationProps {
  events: TimelineEvent[];
  camera?: THREE.Camera;
  audioCurrentTime: number;
  audioDuration: number;
}

export function useMapAnimation({
  events,
  camera,
  audioCurrentTime,
  audioDuration
}: UseMapAnimationProps) {
  const [animationState, setAnimationState] = useState<MapAnimationState>({
    currentEventIndex: -1,
    cameraPosition: new THREE.Vector3(0, 0, 100),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    isAnimating: false,
    animationProgress: 0
  });

  const animationTimelineRef = useRef<{ start: number; end: number; eventIndex: number }[]>([]);
  const lastEventIndexRef = useRef(-1);
  const cameraAnimationRef = useRef<{ cancel: () => void } | null>(null);

  // Calculate timeline segments based on events and audio duration
  useEffect(() => {
    if (!events.length || !audioDuration) return;

    const segments = events.map((event, index) => {
      const segmentDuration = audioDuration / events.length;
      return {
        start: index * segmentDuration,
        end: (index + 1) * segmentDuration,
        eventIndex: index
      };
    });

    animationTimelineRef.current = segments;
  }, [events, audioDuration]);

  // Determine current event based on audio time
  const getCurrentEventIndex = useCallback(() => {
    if (!animationTimelineRef.current.length) return -1;

    const currentSegment = animationTimelineRef.current.find(
      segment => audioCurrentTime >= segment.start && audioCurrentTime < segment.end
    );

    return currentSegment ? currentSegment.eventIndex : -1;
  }, [audioCurrentTime]);

  // Calculate animation progress within current event
  const getEventProgress = useCallback((eventIndex: number) => {
    if (eventIndex < 0 || !animationTimelineRef.current[eventIndex]) return 0;

    const segment = animationTimelineRef.current[eventIndex];
    const eventDuration = segment.end - segment.start;
    const eventElapsed = audioCurrentTime - segment.start;

    return Math.max(0, Math.min(1, eventElapsed / eventDuration));
  }, [audioCurrentTime]);

  // Handle event transitions
  useEffect(() => {
    const currentEventIndex = getCurrentEventIndex();
    
    if (currentEventIndex !== lastEventIndexRef.current) {
      lastEventIndexRef.current = currentEventIndex;
      
      if (currentEventIndex >= 0 && events[currentEventIndex]) {
        animateToEvent(currentEventIndex);
      }
    }

    // Update animation progress for current event
    const progress = currentEventIndex >= 0 ? getEventProgress(currentEventIndex) : 0;
    
    setAnimationState(prev => ({
      ...prev,
      currentEventIndex,
      animationProgress: progress
    }));
  }, [audioCurrentTime]); // Remove functions from dependencies to prevent infinite loop

  // Animate camera to specific event
  const animateToEvent = useCallback((eventIndex: number) => {
    if (!camera || !events[eventIndex] || !events[eventIndex].geoPoints.length) return;

    const event = events[eventIndex];
    const [lat, lon] = event.geoPoints[0];

    // Cancel any ongoing animation
    if (cameraAnimationRef.current) {
      cameraAnimationRef.current.cancel();
    }

    setAnimationState(prev => ({ ...prev, isAnimating: true }));

    // Calculate optimal camera position for this event
    const geoPoints = event.geoPoints.map(([lat, lon]) => ({ lat, lon }));
    const targetPosition = calculateOptimalCameraPosition(geoPoints, 1.5);
    const lookAtTarget = latLonTo3D(lat, lon, 50);

    // Generate smooth camera path
    const currentPos = camera.position.clone();
    const targetPos = targetPosition;
    
    // Create path points for smooth animation
    const pathPoints: THREE.Vector3[] = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = currentPos.clone().lerp(targetPos, t);
      
      // Add some arc to the movement for cinematic effect
      const arcHeight = Math.sin(t * Math.PI) * 20;
      point.y += arcHeight;
      
      pathPoints.push(point);
    }

    // Animate camera along path
    let animationId: number;
    let startTime: number;
    const duration = 2000; // 2 seconds

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easing function for smooth animation
      const easedProgress = easeInOutCubic(progress);
      
      // Calculate current position along path
      const pathIndex = easedProgress * (pathPoints.length - 1);
      const lowerIndex = Math.floor(pathIndex);
      const upperIndex = Math.ceil(pathIndex);
      const t = pathIndex - lowerIndex;

      if (lowerIndex < pathPoints.length && upperIndex < pathPoints.length) {
        const currentPosition = pathPoints[lowerIndex].clone().lerp(pathPoints[upperIndex], t);
        camera.position.copy(currentPosition);
        camera.lookAt(lookAtTarget);
      }

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        setAnimationState(prev => ({
          ...prev,
          isAnimating: false,
          cameraPosition: camera.position.clone(),
          cameraTarget: lookAtTarget.clone()
        }));
        cameraAnimationRef.current = null;
      }
    };

    animationId = requestAnimationFrame(animate);

    // Store cancel function
    cameraAnimationRef.current = {
      cancel: () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        setAnimationState(prev => ({ ...prev, isAnimating: false }));
      }
    };
  }, [camera, events]);

  // Jump to specific event (for manual timeline clicks)
  const jumpToEvent = useCallback((eventIndex: number) => {
    if (eventIndex < 0 || eventIndex >= events.length) return;

    // Cancel current animation
    if (cameraAnimationRef.current) {
      cameraAnimationRef.current.cancel();
    }

    // Immediately animate to the event
    animateToEvent(eventIndex);
    
    // Update state
    setAnimationState(prev => ({
      ...prev,
      currentEventIndex: eventIndex,
      animationProgress: 0
    }));
  }, [events, animateToEvent]);

  // Reset animation to initial state
  const resetAnimation = useCallback(() => {
    if (cameraAnimationRef.current) {
      cameraAnimationRef.current.cancel();
    }

    if (camera) {
      camera.position.set(0, 0, 100);
      camera.lookAt(0, 0, 0);
    }

    setAnimationState({
      currentEventIndex: -1,
      cameraPosition: new THREE.Vector3(0, 0, 100),
      cameraTarget: new THREE.Vector3(0, 0, 0),
      isAnimating: false,
      animationProgress: 0
    });

    lastEventIndexRef.current = -1;
  }, [camera]);

  // Get camera position for specific event (without animating)
  const getEventCameraPosition = useCallback((eventIndex: number) => {
    if (eventIndex < 0 || !events[eventIndex] || !events[eventIndex].geoPoints.length) {
      return new THREE.Vector3(0, 0, 100);
    }

    const event = events[eventIndex];
    const geoPoints = event.geoPoints.map(([lat, lon]) => ({ lat, lon }));
    return calculateOptimalCameraPosition(geoPoints, 1.5);
  }, [events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraAnimationRef.current) {
        cameraAnimationRef.current.cancel();
      }
    };
  }, []);

  return {
    animationState,
    jumpToEvent,
    resetAnimation,
    getEventCameraPosition,
    isEventActive: (eventIndex: number) => eventIndex === animationState.currentEventIndex,
    getEventProgress: (eventIndex: number) => 
      eventIndex === animationState.currentEventIndex ? animationState.animationProgress : 0
  };
}

// Easing function for smooth animations
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}