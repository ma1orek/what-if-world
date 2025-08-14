import '@testing-library/jest-dom';

// Mock Three.js for testing
jest.mock('three', () => ({
  Scene: jest.fn(),
  PerspectiveCamera: jest.fn(),
  WebGLRenderer: jest.fn(),
  OrbitControls: jest.fn(),
  BufferGeometry: jest.fn(),
  Material: jest.fn(),
  Mesh: jest.fn(),
}));

// Mock GSAP for testing
jest.mock('gsap', () => ({
  timeline: jest.fn(() => ({
    to: jest.fn(),
    from: jest.fn(),
    set: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    reverse: jest.fn(),
  })),
  to: jest.fn(),
  from: jest.fn(),
  set: jest.fn(),
}));

// Mock Web Audio API
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    createBufferSource: jest.fn(),
    createGain: jest.fn(),
    destination: {},
  })),
});

// Mock fetch for API calls
global.fetch = jest.fn();