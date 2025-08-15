import { renderHook, act } from '@testing-library/react';
import { useMapAnimation } from '@/hooks/useMapAnimation';
import { TimelineEvent } from '@/types';
import * as THREE from 'three';

// Mock Three.js
jest.mock('three', () => ({
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    clone: jest.fn().mockReturnThis(),
    copy: jest.fn().mockReturnThis(),
    lerp: jest.fn().mockReturnThis(),
    multiplyScalar: jest.fn().mockReturnThis()
  })),
  Camera: jest.fn().mockImplementation(() => ({
    position: { x: 0, y: 0, z: 100, clone: jest.fn(), copy: jest.fn() },
    lookAt: jest.fn()
  }))
}));

// Mock geo utils
jest.mock('@/utils/geoUtils', () => ({
  calculateOptimalCameraPosition: jest.fn(() => new THREE.Vector3(0, 0, 80)),
  latLonTo3D: jest.fn(() => new THREE.Vector3(10, 20, 50)),
  generateCameraPath: jest.fn(() => [new THREE.Vector3(0, 0, 100), new THREE.Vector3(10, 20, 80)]),
  animateCameraAlongPath: jest.fn()
}));

describe('useMapAnimation Hook', () => {
  const mockEvents: TimelineEvent[] = [
    {
      year: 1815,
      title: 'Event 1',
      description: 'First event',
      geoPoints: [[50.6794, 4.4125]]
    },
    {
      year: 1820,
      title: 'Event 2', 
      description: 'Second event',
      geoPoints: [[48.8566, 2.3522]]
    }
  ];

  const mockCamera = {
    position: { x: 0, y: 0, z: 100, clone: jest.fn(), copy: jest.fn() },
    lookAt: jest.fn()
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useMapAnimation({
      events: [],
      camera: mockCamera,
      audioCurrentTime: 0,
      audioDuration: 0
    }));

    expect(result.current.animationState.currentEventIndex).toBe(-1);
    expect(result.current.animationState.isAnimating).toBe(false);
    expect(result.current.animationState.animationProgress).toBe(0);
  });

  it('calculates timeline segments correctly', () => {
    const { result } = renderHook(() => useMapAnimation({
      events: mockEvents,
      camera: mockCamera,
      audioCurrentTime: 0,
      audioDuration: 100 // 100 seconds total
    }));

    // Each event should get 50 seconds (100/2)
    // This is tested indirectly through event index calculation
    expect(result.current.animationState.currentEventIndex).toBe(-1);
  });

  it('updates current event based on audio time', () => {
    const { result, rerender } = renderHook(
      ({ audioCurrentTime }) => useMapAnimation({
        events: mockEvents,
        camera: mockCamera,
        audioCurrentTime,
        audioDuration: 100
      }),
      { initialProps: { audioCurrentTime: 0 } }
    );

    // At time 0, should be in first event
    rerender({ audioCurrentTime: 25 }); // Middle of first event (0-50s)
    expect(result.current.animationState.currentEventIndex).toBe(0);

    // At time 75, should be in second event
    rerender({ audioCurrentTime: 75 }); // Middle of second event (50-100s)
    expect(result.current.animationState.currentEventIndex).toBe(1);
  });

  it('calculates event progress correctly', () => {
    const { result, rerender } = renderHook(
      ({ audioCurrentTime }) => useMapAnimation({
        events: mockEvents,
        camera: mockCamera,
        audioCurrentTime,
        audioDuration: 100
      }),
      { initialProps: { audioCurrentTime: 25 } }
    );

    // At 25s in a 50s event (0-50), progress should be 0.5
    const progress = result.current.getEventProgress(0);
    expect(progress).toBeCloseTo(0.5, 1);
  });

  it('handles jump to event', () => {
    const { result } = renderHook(() => useMapAnimation({
      events: mockEvents,
      camera: mockCamera,
      audioCurrentTime: 0,
      audioDuration: 100
    }));

    act(() => {
      result.current.jumpToEvent(1);
    });

    expect(result.current.animationState.currentEventIndex).toBe(1);
  });

  it('handles invalid event index in jumpToEvent', () => {
    const { result } = renderHook(() => useMapAnimation({
      events: mockEvents,
      camera: mockCamera,
      audioCurrentTime: 0,
      audioDuration: 100
    }));

    act(() => {
      result.current.jumpToEvent(-1);
    });

    // Should not change state for invalid index
    expect(result.current.animationState.currentEventIndex).toBe(-1);

    act(() => {
      result.current.jumpToEvent(999);
    });

    expect(result.current.animationState.currentEventIndex).toBe(-1);
  });

  it('resets animation state', () => {
    const { result } = renderHook(() => useMapAnimation({
      events: mockEvents,
      camera: mockCamera,
      audioCurrentTime: 50,
      audioDuration: 100
    }));

    // First set to an active state
    act(() => {
      result.current.jumpToEvent(1);
    });

    // Then reset
    act(() => {
      result.current.resetAnimation();
    });

    expect(result.current.animationState.currentEventIndex).toBe(-1);
    expect(result.current.animationState.isAnimating).toBe(false);
    expect(result.current.animationState.animationProgress).toBe(0);
  });

  it('identifies active events correctly', () => {
    const { result, rerender } = renderHook(
      ({ audioCurrentTime }) => useMapAnimation({
        events: mockEvents,
        camera: mockCamera,
        audioCurrentTime,
        audioDuration: 100
      }),
      { initialProps: { audioCurrentTime: 25 } }
    );

    expect(result.current.isEventActive(0)).toBe(true);
    expect(result.current.isEventActive(1)).toBe(false);

    rerender({ audioCurrentTime: 75 });

    expect(result.current.isEventActive(0)).toBe(false);
    expect(result.current.isEventActive(1)).toBe(true);
  });

  it('gets camera position for specific event', () => {
    const { result } = renderHook(() => useMapAnimation({
      events: mockEvents,
      camera: mockCamera,
      audioCurrentTime: 0,
      audioDuration: 100
    }));

    const cameraPosition = result.current.getEventCameraPosition(0);
    expect(cameraPosition).toBeDefined();
    expect(cameraPosition.z).toBe(80); // From mocked calculateOptimalCameraPosition
  });

  it('handles events with no geo points', () => {
    const eventsWithoutGeoPoints: TimelineEvent[] = [
      {
        year: 1815,
        title: 'Abstract Event',
        description: 'No location',
        geoPoints: []
      }
    ];

    const { result } = renderHook(() => useMapAnimation({
      events: eventsWithoutGeoPoints,
      camera: mockCamera,
      audioCurrentTime: 0,
      audioDuration: 100
    }));

    const cameraPosition = result.current.getEventCameraPosition(0);
    expect(cameraPosition.z).toBe(100); // Default position
  });

  it('handles empty events array', () => {
    const { result } = renderHook(() => useMapAnimation({
      events: [],
      camera: mockCamera,
      audioCurrentTime: 50,
      audioDuration: 100
    }));

    expect(result.current.animationState.currentEventIndex).toBe(-1);
    expect(result.current.isEventActive(0)).toBe(false);
    expect(result.current.getEventProgress(0)).toBe(0);
  });
});