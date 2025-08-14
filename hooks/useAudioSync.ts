import { useState, useEffect, useRef, useCallback } from 'react';
import { SubtitleEntry, TimelineEvent } from '@/types';

export interface AudioSyncState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  currentSubtitle: SubtitleEntry | null;
  currentEventIndex: number;
  progress: number;
}

export interface UseAudioSyncProps {
  audioElement: HTMLAudioElement | null;
  subtitles: SubtitleEntry[];
  events: TimelineEvent[];
  onEventChange?: (eventIndex: number) => void;
  onSubtitleChange?: (subtitle: SubtitleEntry | null) => void;
}

export function useAudioSync({
  audioElement,
  subtitles,
  events,
  onEventChange,
  onSubtitleChange
}: UseAudioSyncProps) {
  const [syncState, setSyncState] = useState<AudioSyncState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    currentSubtitle: null,
    currentEventIndex: -1,
    progress: 0
  });

  const lastSubtitleRef = useRef<SubtitleEntry | null>(null);
  const lastEventIndexRef = useRef(-1);
  const eventTimingsRef = useRef<{ start: number; end: number; index: number }[]>([]);

  // Calculate event timings based on audio duration and number of events
  useEffect(() => {
    if (!syncState.duration || !events.length) {
      eventTimingsRef.current = [];
      return;
    }

    const segmentDuration = syncState.duration / events.length;
    const timings = events.map((_, index) => ({
      start: index * segmentDuration,
      end: (index + 1) * segmentDuration,
      index
    }));

    eventTimingsRef.current = timings;
  }, [syncState.duration, events.length]);

  // Find current subtitle based on time
  const findCurrentSubtitle = useCallback((currentTime: number): SubtitleEntry | null => {
    return subtitles.find(subtitle => 
      currentTime >= subtitle.start && currentTime <= subtitle.end
    ) || null;
  }, [subtitles]);

  // Find current event based on time
  const findCurrentEvent = useCallback((currentTime: number): number => {
    const currentTiming = eventTimingsRef.current.find(timing =>
      currentTime >= timing.start && currentTime < timing.end
    );
    return currentTiming ? currentTiming.index : -1;
  }, []);

  // Update sync state when audio time changes
  const updateSyncState = useCallback((currentTime: number) => {
    const currentSubtitle = findCurrentSubtitle(currentTime);
    const currentEventIndex = findCurrentEvent(currentTime);
    const progress = syncState.duration > 0 ? currentTime / syncState.duration : 0;

    // Check if subtitle changed
    if (currentSubtitle !== lastSubtitleRef.current) {
      lastSubtitleRef.current = currentSubtitle;
      onSubtitleChange?.(currentSubtitle);
    }

    // Check if event changed
    if (currentEventIndex !== lastEventIndexRef.current) {
      lastEventIndexRef.current = currentEventIndex;
      onEventChange?.(currentEventIndex);
    }

    setSyncState(prev => ({
      ...prev,
      currentTime,
      currentSubtitle,
      currentEventIndex,
      progress
    }));
  }, [syncState.duration, findCurrentSubtitle, findCurrentEvent, onSubtitleChange, onEventChange]);

  // Set up audio event listeners
  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      updateSyncState(audioElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      setSyncState(prev => ({
        ...prev,
        duration: audioElement.duration || 0
      }));
    };

    const handlePlay = () => {
      setSyncState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setSyncState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setSyncState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        currentSubtitle: null,
        currentEventIndex: -1,
        progress: 0
      }));
    };

    const handleSeeked = () => {
      updateSyncState(audioElement.currentTime);
    };

    // Add event listeners
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('seeked', handleSeeked);

    // Initial state update
    if (audioElement.duration) {
      setSyncState(prev => ({
        ...prev,
        duration: audioElement.duration,
        currentTime: audioElement.currentTime,
        isPlaying: !audioElement.paused
      }));
    }

    // Cleanup
    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('seeked', handleSeeked);
    };
  }, [audioElement, updateSyncState]);

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    if (!audioElement) return;
    
    const clampedTime = Math.max(0, Math.min(time, syncState.duration));
    audioElement.currentTime = clampedTime;
    updateSyncState(clampedTime);
  }, [audioElement, syncState.duration, updateSyncState]);

  // Seek to specific event
  const seekToEvent = useCallback((eventIndex: number) => {
    if (eventIndex < 0 || eventIndex >= eventTimingsRef.current.length) return;
    
    const eventTiming = eventTimingsRef.current[eventIndex];
    seekTo(eventTiming.start);
  }, [seekTo]);

  // Seek to specific subtitle
  const seekToSubtitle = useCallback((subtitleIndex: number) => {
    if (subtitleIndex < 0 || subtitleIndex >= subtitles.length) return;
    
    const subtitle = subtitles[subtitleIndex];
    seekTo(subtitle.start);
  }, [subtitles, seekTo]);

  // Get progress for specific event
  const getEventProgress = useCallback((eventIndex: number): number => {
    if (eventIndex !== syncState.currentEventIndex || eventIndex < 0) return 0;
    
    const eventTiming = eventTimingsRef.current[eventIndex];
    if (!eventTiming) return 0;
    
    const eventDuration = eventTiming.end - eventTiming.start;
    const eventElapsed = syncState.currentTime - eventTiming.start;
    
    return Math.max(0, Math.min(1, eventElapsed / eventDuration));
  }, [syncState.currentEventIndex, syncState.currentTime]);

  // Get remaining time for current subtitle
  const getSubtitleTimeRemaining = useCallback((): number => {
    if (!syncState.currentSubtitle) return 0;
    return Math.max(0, syncState.currentSubtitle.end - syncState.currentTime);
  }, [syncState.currentSubtitle, syncState.currentTime]);

  // Check if specific time has subtitle
  const hasSubtitleAtTime = useCallback((time: number): boolean => {
    return subtitles.some(subtitle => 
      time >= subtitle.start && time <= subtitle.end
    );
  }, [subtitles]);

  // Get all subtitles for specific event
  const getEventSubtitles = useCallback((eventIndex: number): SubtitleEntry[] => {
    if (eventIndex < 0 || eventIndex >= eventTimingsRef.current.length) return [];
    
    const eventTiming = eventTimingsRef.current[eventIndex];
    return subtitles.filter(subtitle =>
      subtitle.start >= eventTiming.start && subtitle.end <= eventTiming.end
    );
  }, [subtitles]);

  // Format time for display
  const formatTime = useCallback((time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Get sync statistics
  const getSyncStats = useCallback(() => {
    return {
      totalSubtitles: subtitles.length,
      totalEvents: events.length,
      currentSubtitleIndex: syncState.currentSubtitle 
        ? subtitles.findIndex(sub => sub === syncState.currentSubtitle)
        : -1,
      eventTimings: eventTimingsRef.current,
      subtitleCoverage: subtitles.length > 0 
        ? (subtitles.reduce((acc, sub) => acc + (sub.end - sub.start), 0) / syncState.duration) * 100
        : 0
    };
  }, [subtitles, events, syncState.currentSubtitle, syncState.duration]);

  return {
    syncState,
    seekTo,
    seekToEvent,
    seekToSubtitle,
    getEventProgress,
    getSubtitleTimeRemaining,
    hasSubtitleAtTime,
    getEventSubtitles,
    formatTime,
    getSyncStats
  };
}