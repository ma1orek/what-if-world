# Design Document

## Overview

History Rewriter Live to fullstack aplikacja webowa składająca się z Next.js frontendu z zaawansowanymi animacjami 3D oraz Express.js backendu zintegrowanego z AI services. Aplikacja wykorzystuje Three.js do renderowania 3D, GSAP do animacji UI, D3.js do manipulacji danych geograficznych oraz OpenAI i ElevenLabs do generowania treści.

## Architecture

### Frontend Architecture
```
Next.js App
├── pages/
│   └── index.tsx (Main app entry point)
├── components/
│   ├── Intro.tsx (Landing screen with fade-in text)
│   ├── InputPrompt.tsx (User input with examples)
│   ├── AnimatedMap.tsx (Three.js 3D world map)
│   ├── Timeline.tsx (Vertical event timeline)
│   └── Narration.tsx (Audio player with subtitles)
├── hooks/
│   ├── useAudioSync.ts (Audio-timeline synchronization)
│   └── useMapAnimation.ts (Map morphing logic)
└── utils/
    ├── geoUtils.ts (GeoJSON processing)
    └── animationUtils.ts (GSAP animation presets)
```

### Backend Architecture
```
Express.js Server
├── server.js (Main server file)
├── routes/
│   ├── rewrite-history.js (LLM integration endpoint)
│   └── narrate.js (TTS integration endpoint)
├── services/
│   ├── openaiService.js (GPT-4 integration)
│   └── elevenlabsService.js (TTS integration)
└── utils/
    └── promptTemplates.js (LLM prompt engineering)
```

## Components and Interfaces

### 1. Intro Component
**Purpose:** Kinematograficzny ekran powitalny
**Technologies:** GSAP, Tailwind CSS
**Key Features:**
- Fullscreen black background
- Fade-in text animation z delay
- Smooth transition do głównego interfejsu

```typescript
interface IntroProps {
  onComplete: () => void;
}
```

### 2. InputPrompt Component
**Purpose:** Interfejs do wprowadzania scenariuszy alternatywnej historii
**Technologies:** React, Tailwind CSS, GSAP
**Key Features:**
- Duże, wycentrowane pole tekstowe
- 3 predefiniowane przykłady
- Smooth hide animation po submit

```typescript
interface InputPromptProps {
  onSubmit: (prompt: string) => void;
  isVisible: boolean;
}
```

### 3. AnimatedMap Component
**Purpose:** Interaktywna mapa 3D z morfowaniem granic
**Technologies:** Three.js, D3.js, OrbitControls
**Key Features:**
- World outline rendering z GeoJSON
- Smooth camera movements
- Border morphing animations
- Zoom to specific coordinates

```typescript
interface AnimatedMapProps {
  geoChanges: GeoJSON.FeatureCollection;
  geoPoints: [number, number][];
  activeEventIndex: number;
}
```

### 4. Timeline Component
**Purpose:** Pionowy timeline wydarzeń zsynchronizowany z narracją
**Technologies:** GSAP, React
**Key Features:**
- Vertical layout po lewej stronie
- Event highlighting z animacjami
- Click-to-seek functionality

```typescript
interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  geoPoints: [number, number][];
}

interface TimelineProps {
  events: TimelineEvent[];
  activeIndex: number;
  onEventClick: (index: number) => void;
}
```

### 5. Narration Component
**Purpose:** Audio player z synchronizowanymi napisami
**Technologies:** Web Audio API, React
**Key Features:**
- Audio playback control
- Subtitle synchronization
- Timeline event triggering

```typescript
interface NarrationProps {
  audioUrl: string;
  subtitles: SubtitleEntry[];
  onTimeUpdate: (currentTime: number) => void;
}
```

## Data Models

### LLM Response Model
```typescript
interface HistoryRewriteResponse {
  summary: string; // 2-3 sentence cinematic intro
  timeline: TimelineEvent[];
  geoChanges: GeoJSON.FeatureCollection;
}
```

### Audio Response Model
```typescript
interface NarrationResponse {
  audioUrl: string;
  duration: number;
  subtitles: SubtitleEntry[];
}

interface SubtitleEntry {
  start: number;
  end: number;
  text: string;
}
```

### Animation State Model
```typescript
interface AnimationState {
  phase: 'intro' | 'input' | 'generating' | 'presenting';
  mapCamera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  timelineProgress: number;
  audioCurrentTime: number;
}
```

## Error Handling

### Frontend Error Handling
1. **Network Errors:** Graceful fallback z retry mechanism
2. **Audio Loading Errors:** Silent fallback z visual-only mode
3. **3D Rendering Errors:** Fallback do 2D map view
4. **Animation Errors:** Skip problematic animations, continue flow

### Backend Error Handling
1. **LLM API Errors:** Retry logic z exponential backoff
2. **TTS API Errors:** Fallback do text-only mode
3. **Rate Limiting:** Queue system z user feedback
4. **Invalid Input:** Sanitization i validation

### Error Recovery Strategies
```typescript
interface ErrorRecoveryConfig {
  maxRetries: number;
  fallbackMode: 'visual-only' | '2d-mode' | 'text-only';
  userNotification: boolean;
}
```

## Testing Strategy

### Unit Testing
- **Components:** React Testing Library dla każdego komponentu
- **Hooks:** Custom hooks testing z renderHook
- **Utils:** Jest dla utility functions
- **Services:** Mock API responses

### Integration Testing
- **API Endpoints:** Supertest dla Express routes
- **Frontend-Backend:** End-to-end API communication
- **Animation Sequences:** Puppeteer dla complex user flows

### Performance Testing
- **3D Rendering:** Frame rate monitoring
- **Audio Sync:** Timing accuracy tests
- **Memory Usage:** Leak detection dla long sessions
- **Bundle Size:** Webpack bundle analyzer

### Visual Testing
- **Animation Smoothness:** Visual regression testing
- **Responsive Design:** Cross-device screenshot comparison
- **Loading States:** Skeleton screen validation

## Technical Implementation Details

### 3D Map Rendering Pipeline
1. **GeoJSON Processing:** Convert world data do Three.js geometry
2. **Mesh Generation:** Create extruded country borders
3. **Material Setup:** PBR materials z subtle lighting
4. **Animation System:** Morph targets dla border changes

### Audio-Visual Synchronization
1. **Timeline Parsing:** Extract event timestamps z audio duration
2. **Event Triggering:** Web Audio API currentTime monitoring
3. **Visual Updates:** GSAP timeline synchronization
4. **Subtitle Rendering:** Text overlay z fade transitions

### Performance Optimizations
1. **Lazy Loading:** Components i assets on-demand
2. **Texture Compression:** Optimized map textures
3. **Animation Batching:** GSAP timeline optimization
4. **Memory Management:** Proper cleanup dla 3D objects

### Responsive Design Strategy
1. **Breakpoints:** Mobile-first approach
2. **Layout Adaptation:** CSS Grid z dynamic areas
3. **Touch Interactions:** Mobile-optimized controls
4. **Performance Scaling:** Reduced effects na mobile

## Security Considerations

### API Security
- Rate limiting dla AI endpoints
- Input sanitization dla user prompts
- API key protection w environment variables
- CORS configuration dla frontend-backend communication

### Content Security
- Prompt injection prevention
- Generated content moderation
- Audio file validation
- XSS protection w subtitle rendering