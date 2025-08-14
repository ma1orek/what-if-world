// Core data types for the History Rewriter Live application

export interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  geoPoints: [number, number][];
}

export interface HistoryRewriteResponse {
  summary: string;
  timeline: TimelineEvent[];
  geoChanges: GeoJSON.FeatureCollection;
}

export interface NarrationResponse {
  audioUrl: string;
  duration: number;
  subtitles: SubtitleEntry[];
}

export interface SubtitleEntry {
  start: number;
  end: number;
  text: string;
}

export interface AnimationState {
  phase: 'intro' | 'input' | 'generating' | 'presenting';
  mapCamera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  timelineProgress: number;
  audioCurrentTime: number;
}

export interface ErrorRecoveryConfig {
  maxRetries: number;
  fallbackMode: 'visual-only' | '2d-mode' | 'text-only';
  userNotification: boolean;
}

// Component Props Interfaces
export interface IntroProps {
  onComplete: () => void;
}

export interface InputPromptProps {
  onSubmit: (prompt: string) => void;
  isVisible: boolean;
}

export interface AnimatedMapProps {
  geoChanges: GeoJSON.FeatureCollection;
  geoPoints: [number, number][];
  activeEventIndex: number;
}

export interface TimelineProps {
  events: TimelineEvent[];
  activeIndex: number;
  onEventClick: (index: number) => void;
}

export interface NarrationProps {
  audioUrl: string;
  subtitles: SubtitleEntry[];
  onTimeUpdate: (currentTime: number) => void;
}