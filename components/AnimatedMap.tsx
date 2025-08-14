import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnimatedMapProps } from '@/types';
import { 
  geoJsonToGeometry, 
  createMorphingGeometry, 
  animateGeometryMorph,
  latLonTo3D,
  generateCameraPath,
  animateCameraAlongPath,
  createPulsingPoint,
  calculateOptimalCameraPosition
} from '@/utils/geoUtils';

const AnimatedMap: React.FC<AnimatedMapProps> = ({ 
  geoChanges, 
  geoPoints, 
  activeEventIndex 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const worldGroupRef = useRef<THREE.Group>();
  const pointsGroupRef = useRef<THREE.Group>();
  const animationFrameRef = useRef<number>();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xd4af37, 1.0);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Add rim lighting for dramatic effect
    const rimLight = new THREE.DirectionalLight(0x0066ff, 0.3);
    rimLight.position.set(-50, 30, -50);
    scene.add(rimLight);

    // Create world group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    worldGroupRef.current = worldGroup;

    // Create points group
    const pointsGroup = new THREE.Group();
    scene.add(pointsGroup);
    pointsGroupRef.current = pointsGroup;

    // Create world outline
    createWorldOutline();

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start render loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Subtle rotation for dynamic feel
      if (worldGroup) {
        worldGroup.rotation.y += 0.001;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    setIsLoading(false);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Create world outline using realistic country shapes
  const createWorldOutline = () => {
    if (!worldGroupRef.current) return;

    // More realistic world countries with better shapes
    const countries = [
      // United States
      { 
        points: [
          [-125, 49], [-125, 32], [-117, 32], [-111, 31], [-108, 31], 
          [-108, 25], [-93, 25], [-82, 24], [-80, 25], [-75, 35], 
          [-70, 41], [-70, 45], [-83, 45], [-95, 49], [-125, 49]
        ],
        name: 'United States',
        color: 0x2a2a2a
      },
      // Canada
      { 
        points: [
          [-141, 69], [-141, 49], [-95, 49], [-83, 45], [-70, 45], 
          [-70, 47], [-65, 47], [-60, 50], [-60, 60], [-70, 68], 
          [-80, 72], [-110, 72], [-141, 69]
        ],
        name: 'Canada',
        color: 0x252525
      },
      // Brazil
      { 
        points: [
          [-74, 5], [-60, 5], [-50, 0], [-35, -5], [-35, -20], 
          [-40, -25], [-50, -25], [-60, -15], [-70, -10], [-74, 5]
        ],
        name: 'Brazil',
        color: 0x2a2a2a
      },
      // Russia
      { 
        points: [
          [20, 70], [180, 70], [180, 50], [130, 50], [100, 55], 
          [80, 55], [60, 50], [40, 50], [30, 60], [20, 70]
        ],
        name: 'Russia',
        color: 0x252525
      },
      // China
      { 
        points: [
          [75, 50], [135, 50], [135, 20], [100, 20], [90, 25], 
          [80, 30], [75, 40], [75, 50]
        ],
        name: 'China',
        color: 0x2a2a2a
      },
      // Europe (simplified)
      { 
        points: [
          [-10, 60], [30, 60], [40, 50], [30, 40], [10, 35], 
          [-5, 35], [-10, 45], [-10, 60]
        ],
        name: 'Europe',
        color: 0x252525
      },
      // Africa
      { 
        points: [
          [-20, 35], [50, 35], [50, 20], [45, 10], [40, -10], 
          [30, -25], [20, -35], [10, -35], [-10, -20], [-15, 0], 
          [-20, 20], [-20, 35]
        ],
        name: 'Africa',
        color: 0x2a2a2a
      },
      // Australia
      { 
        points: [
          [110, -10], [155, -10], [155, -25], [145, -40], 
          [135, -35], [115, -35], [110, -25], [110, -10]
        ],
        name: 'Australia',
        color: 0x252525
      },
      // India
      { 
        points: [
          [68, 35], [88, 35], [88, 20], [80, 8], [70, 8], [68, 20], [68, 35]
        ],
        name: 'India',
        color: 0x2a2a2a
      }
    ];

    countries.forEach((country, index) => {
      const shape = new THREE.Shape();
      
      country.points.forEach((point, i) => {
        const x = point[0] * 0.4; // Scale down
        const y = point[1] * 0.4;
        
        if (i === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      });

      // Create extruded geometry with more realistic settings
      const extrudeSettings = {
        depth: 1.5,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.2,
        bevelThickness: 0.2
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      // Enhanced material with better contrast
      const material = new THREE.MeshPhongMaterial({
        color: country.color,
        emissive: 0x0a0a0a,
        shininess: 30,
        transparent: true,
        opacity: 0.95,
        // Add subtle outline effect
        wireframe: false
      });

      // Add outline for better definition
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xf4f4f4,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Add subtle random rotation for more organic look
      mesh.rotation.z = (Math.random() - 0.5) * 0.02;
      
      worldGroupRef.current?.add(mesh);
    });

    // Add ocean/water plane
    const oceanGeometry = new THREE.PlaneGeometry(200, 100);
    const oceanMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      transparent: true,
      opacity: 0.3,
      shininess: 100
    });
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.position.z = -2;
    worldGroupRef.current?.add(ocean);
  };

  // Update geo points when activeEventIndex changes
  useEffect(() => {
    if (!pointsGroupRef.current || !sceneRef.current || !geoPoints.length) return;

    // Clear existing points
    pointsGroupRef.current.clear();

    // Add points for current event
    geoPoints.forEach((point, index) => {
      const [lat, lon] = point;
      
      // Convert lat/lon to 3D coordinates using utility function
      const position = latLonTo3D(lat, lon, 52); // Slightly above surface
      
      // Create pulsing point for active event
      if (index === activeEventIndex) {
        createPulsingPoint(position, 0xd4af37, pointsGroupRef.current!);
      } else {
        // Create static point for inactive events
        const geometry = new THREE.SphereGeometry(0.8, 12, 12);
        const material = new THREE.MeshPhongMaterial({
          color: 0xff6b6b,
          emissive: 0x331111,
          transparent: true,
          opacity: 0.6
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        pointsGroupRef.current?.add(sphere);
      }
    });
  }, [geoPoints, activeEventIndex]);

  // Handle camera movement for active events
  useEffect(() => {
    if (!cameraRef.current || !geoPoints.length || activeEventIndex < 0) return;

    const activePoint = geoPoints[activeEventIndex];
    if (!activePoint) return;

    const [lat, lon] = activePoint;
    const currentPos = { lat: 0, lon: 0 }; // This would be tracked in a real implementation
    const targetPos = { lat, lon };

    // Generate smooth camera path
    const cameraPath = generateCameraPath(currentPos, targetPos, 30);
    const lookAtTarget = latLonTo3D(lat, lon, 50);

    // Animate camera along path
    animateCameraAlongPath(
      cameraRef.current,
      cameraPath,
      lookAtTarget,
      2000 // 2 second animation
    );
  }, [activeEventIndex, geoPoints]);

  return (
    <div className="relative w-full h-full">
      {/* Three.js mount point */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-history-dark bg-opacity-75 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-history-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-history-gold font-modern">Loading World Map...</p>
          </div>
        </div>
      )}

      {/* Map controls hint */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3 text-white text-sm font-modern">
        <div className="space-y-1">
          <div>🖱️ Drag to rotate</div>
          <div>🔍 Scroll to zoom</div>
        </div>
      </div>

      {/* Active event indicator */}
      {activeEventIndex >= 0 && geoPoints[activeEventIndex] && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-history-gold text-black px-4 py-2 rounded-lg font-medium">
          Event {activeEventIndex + 1} Active
        </div>
      )}
    </div>
  );
};

export default AnimatedMap;