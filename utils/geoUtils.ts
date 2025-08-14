import * as d3 from 'd3';
import * as THREE from 'three';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface MorphingGeometry {
  original: THREE.BufferGeometry;
  target: THREE.BufferGeometry;
  current: THREE.BufferGeometry;
}

/**
 * Convert latitude/longitude to 3D coordinates
 */
export function latLonTo3D(lat: number, lon: number, radius: number = 50): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Convert 3D coordinates back to lat/lon
 */
export function vector3ToLatLon(vector: THREE.Vector3, radius: number = 50): GeoPoint {
  const phi = Math.acos(vector.y / radius);
  const theta = Math.atan2(vector.z, -vector.x);

  const lat = 90 - (phi * 180 / Math.PI);
  const lon = (theta * 180 / Math.PI) - 180;

  return { lat, lon };
}

/**
 * Create Three.js geometry from GeoJSON polygon
 */
export function geoJsonToGeometry(feature: GeoJSON.Feature): THREE.ExtrudeGeometry | null {
  if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
    return null;
  }

  const coordinates = feature.geometry.type === 'Polygon' 
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;

  const shapes: THREE.Shape[] = [];

  coordinates.forEach(polygon => {
    polygon.forEach((ring, ringIndex) => {
      const shape = new THREE.Shape();
      
      ring.forEach((coord, coordIndex) => {
        const [lon, lat] = coord;
        // Scale coordinates for better visualization
        const x = (lon / 180) * 50;
        const y = (lat / 90) * 25;
        
        if (coordIndex === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      });

      if (ringIndex === 0) {
        shapes.push(shape);
      } else {
        // Handle holes in polygons
        if (shapes.length > 0) {
          shapes[shapes.length - 1].holes.push(shape);
        }
      }
    });
  });

  if (shapes.length === 0) return null;

  // Combine all shapes into one geometry
  const extrudeSettings = {
    depth: 2,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 2,
    bevelSize: 0.3,
    bevelThickness: 0.3
  };

  // For multiple shapes, we'll use the first one
  // In a more complex implementation, you'd merge geometries
  return new THREE.ExtrudeGeometry(shapes[0], extrudeSettings);
}

/**
 * Create morphing animation between two geometries
 */
export function createMorphingGeometry(
  originalGeometry: THREE.BufferGeometry,
  targetGeometry: THREE.BufferGeometry
): MorphingGeometry {
  // Clone the original geometry for morphing
  const currentGeometry = originalGeometry.clone();
  
  return {
    original: originalGeometry,
    target: targetGeometry,
    current: currentGeometry
  };
}

/**
 * Animate geometry morphing using D3 transitions
 */
export function animateGeometryMorph(
  morphingGeometry: MorphingGeometry,
  duration: number = 2000,
  onUpdate?: (progress: number) => void,
  onComplete?: () => void
): void {
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use D3 easing function for smooth animation
    const easedProgress = d3.easeQuadInOut(progress);
    
    // Interpolate between original and target geometries
    interpolateGeometries(
      morphingGeometry.original,
      morphingGeometry.target,
      morphingGeometry.current,
      easedProgress
    );
    
    // Update geometry
    morphingGeometry.current.attributes.position.needsUpdate = true;
    morphingGeometry.current.computeVertexNormals();
    
    if (onUpdate) {
      onUpdate(easedProgress);
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };
  
  animate();
}

/**
 * Interpolate between two geometries
 */
function interpolateGeometries(
  geometryA: THREE.BufferGeometry,
  geometryB: THREE.BufferGeometry,
  target: THREE.BufferGeometry,
  t: number
): void {
  const positionA = geometryA.attributes.position;
  const positionB = geometryB.attributes.position;
  const targetPosition = target.attributes.position;
  
  if (!positionA || !positionB || !targetPosition) return;
  
  const count = Math.min(positionA.count, positionB.count, targetPosition.count);
  
  for (let i = 0; i < count; i++) {
    const x = positionA.getX(i) + (positionB.getX(i) - positionA.getX(i)) * t;
    const y = positionA.getY(i) + (positionB.getY(i) - positionA.getY(i)) * t;
    const z = positionA.getZ(i) + (positionB.getZ(i) - positionA.getZ(i)) * t;
    
    targetPosition.setXYZ(i, x, y, z);
  }
}

/**
 * Generate smooth camera path between points
 */
export function generateCameraPath(
  startPoint: GeoPoint,
  endPoint: GeoPoint,
  steps: number = 50
): THREE.Vector3[] {
  const path: THREE.Vector3[] = [];
  
  // Create great circle path between points
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    
    // Spherical interpolation
    const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * t;
    const lon = startPoint.lon + (endPoint.lon - startPoint.lon) * t;
    
    // Add some height variation for cinematic effect
    const height = 80 + Math.sin(t * Math.PI) * 20;
    
    const position = latLonTo3D(lat, lon, height);
    path.push(position);
  }
  
  return path;
}

/**
 * Animate camera along a path
 */
export function animateCameraAlongPath(
  camera: THREE.Camera,
  path: THREE.Vector3[],
  lookAtTarget: THREE.Vector3,
  duration: number = 3000,
  onComplete?: () => void
): void {
  if (path.length === 0) return;
  
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use smooth easing
    const easedProgress = d3.easeCubicInOut(progress);
    
    // Calculate current position along path
    const pathIndex = easedProgress * (path.length - 1);
    const lowerIndex = Math.floor(pathIndex);
    const upperIndex = Math.ceil(pathIndex);
    const t = pathIndex - lowerIndex;
    
    if (lowerIndex < path.length && upperIndex < path.length) {
      const currentPosition = path[lowerIndex].clone().lerp(path[upperIndex], t);
      camera.position.copy(currentPosition);
      camera.lookAt(lookAtTarget);
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };
  
  animate();
}

/**
 * Create pulsing point animation
 */
export function createPulsingPoint(
  position: THREE.Vector3,
  color: number = 0xd4af37,
  scene: THREE.Scene
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 16, 16);
  const material = new THREE.MeshPhongMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.8
  });
  
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.copy(position);
  scene.add(sphere);
  
  // Animate pulsing
  const animate = () => {
    const time = Date.now() * 0.003;
    const scale = 1 + Math.sin(time) * 0.3;
    const opacity = 0.5 + Math.sin(time * 1.5) * 0.3;
    
    sphere.scale.setScalar(scale);
    material.opacity = opacity;
    
    requestAnimationFrame(animate);
  };
  animate();
  
  return sphere;
}

/**
 * Calculate optimal camera position for viewing multiple points
 */
export function calculateOptimalCameraPosition(
  points: GeoPoint[],
  padding: number = 1.5
): THREE.Vector3 {
  if (points.length === 0) {
    return new THREE.Vector3(0, 0, 100);
  }
  
  if (points.length === 1) {
    const point3D = latLonTo3D(points[0].lat, points[0].lon);
    return point3D.clone().multiplyScalar(1.5);
  }
  
  // Calculate bounding box of all points
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLon = points[0].lon;
  let maxLon = points[0].lon;
  
  points.forEach(point => {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
  });
  
  // Calculate center point
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  
  // Calculate distance needed to view all points
  const latRange = maxLat - minLat;
  const lonRange = maxLon - minLon;
  const maxRange = Math.max(latRange, lonRange);
  
  // Calculate camera distance based on range
  const distance = Math.max(80, maxRange * padding * 2);
  
  return latLonTo3D(centerLat, centerLon, distance);
}