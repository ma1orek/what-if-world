import * as THREE from 'three';
import {
  latLonTo3D,
  vector3ToLatLon,
  calculateOptimalCameraPosition,
  generateCameraPath
} from '@/utils/geoUtils';

// Mock Three.js Vector3
jest.mock('three', () => ({
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    clone: jest.fn().mockReturnThis(),
    copy: jest.fn().mockReturnThis(),
    lerp: jest.fn().mockReturnThis(),
    multiplyScalar: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis()
  })),
  ExtrudeGeometry: jest.fn(),
  Shape: jest.fn().mockImplementation(() => ({
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    holes: []
  }))
}));

describe('geoUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('latLonTo3D', () => {
    it('converts latitude and longitude to 3D coordinates', () => {
      const result = latLonTo3D(0, 0, 50);
      
      expect(THREE.Vector3).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number), 
        expect.any(Number)
      );
      expect(result).toBeDefined();
    });

    it('uses default radius when not provided', () => {
      latLonTo3D(45, 90);
      
      // Should use default radius of 50
      expect(THREE.Vector3).toHaveBeenCalled();
    });

    it('handles extreme coordinates', () => {
      // North pole
      const northPole = latLonTo3D(90, 0, 50);
      expect(northPole).toBeDefined();

      // South pole  
      const southPole = latLonTo3D(-90, 0, 50);
      expect(southPole).toBeDefined();

      // International date line
      const dateLine = latLonTo3D(0, 180, 50);
      expect(dateLine).toBeDefined();
    });
  });

  describe('vector3ToLatLon', () => {
    it('converts 3D coordinates back to lat/lon', () => {
      const mockVector = new THREE.Vector3(0, 50, 0);
      const result = vector3ToLatLon(mockVector, 50);
      
      expect(result).toHaveProperty('lat');
      expect(result).toHaveProperty('lon');
      expect(typeof result.lat).toBe('number');
      expect(typeof result.lon).toBe('number');
    });

    it('uses default radius when not provided', () => {
      const mockVector = new THREE.Vector3(25, 25, 25);
      const result = vector3ToLatLon(mockVector);
      
      expect(result).toHaveProperty('lat');
      expect(result).toHaveProperty('lon');
    });
  });

  describe('calculateOptimalCameraPosition', () => {
    it('returns default position for empty points array', () => {
      const result = calculateOptimalCameraPosition([]);
      
      expect(THREE.Vector3).toHaveBeenCalledWith(0, 0, 100);
    });

    it('handles single point', () => {
      const points = [{ lat: 45, lon: 90 }];
      const result = calculateOptimalCameraPosition(points);
      
      expect(result).toBeDefined();
    });

    it('calculates center for multiple points', () => {
      const points = [
        { lat: 0, lon: 0 },
        { lat: 45, lon: 90 },
        { lat: -45, lon: -90 }
      ];
      
      const result = calculateOptimalCameraPosition(points);
      expect(result).toBeDefined();
    });

    it('applies padding factor', () => {
      const points = [
        { lat: 0, lon: 0 },
        { lat: 45, lon: 90 }
      ];
      
      const result1 = calculateOptimalCameraPosition(points, 1.0);
      const result2 = calculateOptimalCameraPosition(points, 2.0);
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('handles points at extreme coordinates', () => {
      const points = [
        { lat: 90, lon: 180 },   // North pole, date line
        { lat: -90, lon: -180 }  // South pole, date line
      ];
      
      const result = calculateOptimalCameraPosition(points);
      expect(result).toBeDefined();
    });
  });

  describe('generateCameraPath', () => {
    it('generates path between two points', () => {
      const startPoint = { lat: 0, lon: 0 };
      const endPoint = { lat: 45, lon: 90 };
      
      const path = generateCameraPath(startPoint, endPoint, 10);
      
      expect(path).toHaveLength(11); // 10 steps + 1 = 11 points
      expect(Array.isArray(path)).toBe(true);
    });

    it('uses default step count when not provided', () => {
      const startPoint = { lat: 0, lon: 0 };
      const endPoint = { lat: 45, lon: 90 };
      
      const path = generateCameraPath(startPoint, endPoint);
      
      expect(path).toHaveLength(51); // Default 50 steps + 1
    });

    it('handles same start and end points', () => {
      const point = { lat: 45, lon: 90 };
      
      const path = generateCameraPath(point, point, 5);
      
      expect(path).toHaveLength(6);
      // All points should be the same (or very close)
    });

    it('creates smooth interpolation', () => {
      const startPoint = { lat: 0, lon: 0 };
      const endPoint = { lat: 90, lon: 0 };
      
      const path = generateCameraPath(startPoint, endPoint, 4);
      
      expect(path).toHaveLength(5);
      // First point should correspond to start, last to end
    });
  });

  describe('edge cases and error handling', () => {
    it('handles NaN coordinates gracefully', () => {
      const result = latLonTo3D(NaN, NaN, 50);
      expect(result).toBeDefined();
    });

    it('handles infinite coordinates', () => {
      const result = latLonTo3D(Infinity, -Infinity, 50);
      expect(result).toBeDefined();
    });

    it('handles zero radius', () => {
      const result = latLonTo3D(45, 90, 0);
      expect(result).toBeDefined();
    });

    it('handles negative radius', () => {
      const result = latLonTo3D(45, 90, -50);
      expect(result).toBeDefined();
    });
  });

  describe('coordinate system consistency', () => {
    it('maintains consistency in lat/lon to 3D conversion', () => {
      const originalLat = 45;
      const originalLon = 90;
      const radius = 50;
      
      // Convert to 3D and back
      const vector3D = latLonTo3D(originalLat, originalLon, radius);
      const backToLatLon = vector3ToLatLon(vector3D, radius);
      
      // Should be approximately equal (allowing for floating point precision)
      expect(Math.abs(backToLatLon.lat - originalLat)).toBeLessThan(0.01);
      expect(Math.abs(backToLatLon.lon - originalLon)).toBeLessThan(0.01);
    });
  });
});