import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ORNAMENT_COUNT, GIFT_COUNT, TREE_HEIGHT, TREE_RADIUS, SCATTER_RADIUS, DualPosition } from '../types';
import { getTreeConePos, getRandomSpherePos } from '../utils/math';

interface OrnamentsProps {
  progress: number;
}

const tempObject = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();

// Define a local type for the shader object passed to onBeforeCompile
type ThreeShader = {
  uniforms: { [key: string]: { value: any } };
  vertexShader: string;
  fragmentShader: string;
};

// --- SHADER PATCHING FOR TWINKLE EFFECT ---
// Modified to accept configuration for intensity control
const patchMaterial = (
  shader: ThreeShader, 
  uniforms: { uTime: { value: number } },
  config: { intensity: number; mix: number } = { intensity: 2.0, mix: 0.1 }
) => {
  shader.uniforms.uTime = uniforms.uTime;
  
  // Add uniform definition
  shader.fragmentShader = `
    uniform float uTime;
  ` + shader.fragmentShader;

  // Inject logic before the final color output (dithering chunk)
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <dithering_fragment>',
    `
    #include <dithering_fragment>
    
    // Twinkle/Breathing Logic
    float offset = vColor.r * 10.0 + vColor.g * 20.0 + vColor.b * 30.0;
    
    // Slow sine wave (frequency 1.0)
    float sine = sin(uTime * 1.0 + offset);
    
    // Map -1..1 to 0..1
    float breath = (sine + 1.0) * 0.5;
    
    // Smooth curve
    float strength = pow(breath, 2.0);
    
    // Configurable Intensity (injected as float string)
    vec3 glowColor = vec3(1.0, 0.85, 0.6) * ${config.intensity.toFixed(1)}; 
    
    // Configurable Mix Factor
    gl_FragColor.rgb += glowColor * strength * vColor * ${config.mix.toFixed(2)}; 
    `
  );
};

export const Ornaments: React.FC<OrnamentsProps> = ({ progress }) => {
  const baubleMeshRef = useRef<THREE.InstancedMesh>(null);
  const giftMeshRef = useRef<THREE.InstancedMesh>(null);

  // Shared uniforms for time synchronization
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  // --- MATERIALS ---
  const baubleMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      metalness: 1.0, 
      roughness: 0.15,
      envMapIntensity: 2.0,
    });
    // Keep baubles subtle: Intensity 2.0, Mix 0.1
    mat.onBeforeCompile = (shader) => patchMaterial(shader, uniforms, { intensity: 2.0, mix: 0.1 });
    return mat;
  }, [uniforms]);

  const giftMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#ffffff", 
      // Increased metalness and reduced roughness for more shine
      metalness: 0.6, 
      roughness: 0.25,
      // Boost environment reflections
      envMapIntensity: 1.5 
    });
    // Boosted glow for gifts: Intensity 4.0, Mix 0.35
    mat.onBeforeCompile = (shader) => patchMaterial(shader, uniforms, { intensity: 4.0, mix: 0.35 });
    return mat;
  }, [uniforms]);

  // --- BAUBLES DATA ---
  const baubles = useMemo<DualPosition[]>(() => {
    const data: DualPosition[] = [];
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      const hRatio = Math.pow(Math.random(), 1.8) * 0.95; 
      const offset = 0.5 + Math.random() * 0.5;
      const treePos = getTreeConePos(hRatio, Math.random() * Math.PI * 2, TREE_RADIUS + offset, TREE_HEIGHT);
      const scatterPos = getRandomSpherePos(SCATTER_RADIUS);
      
      const r = Math.random();
      let colorHex = "#FCD34D"; // Default Gold
      if (r < 0.12) colorHex = "#22c55e"; // Bright Green
      else if (r < 0.24) colorHex = "#ef4444"; // Bright Red

      const color = new THREE.Color(colorHex);

      data.push({
        treePos,
        scatterPos,
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale: 0.2 + Math.random() * 0.25,
        color: color,
        speed: 0.5 + Math.random(),
      });
    }
    return data;
  }, []);

  // --- GIFTS DATA ---
  const gifts = useMemo<DualPosition[]>(() => {
    const data: DualPosition[] = [];
    for (let i = 0; i < GIFT_COUNT; i++) {
      const isHanging = Math.random() < 0.6;
      let hRatio, rOffset, yOffset, scale;

      if (isHanging) {
        hRatio = Math.random() * 0.8; 
        rOffset = 0.3 + Math.random() * 0.6; 
        yOffset = 0;
        scale = 0.25 + Math.random() * 0.25; 
      } else {
        hRatio = Math.random() * 0.2; 
        rOffset = 0.8 + Math.random() * 2.5; 
        yOffset = -0.5; 
        scale = 0.4 + Math.random() * 0.5; 
      }

      const treePos = getTreeConePos(hRatio, Math.random() * Math.PI * 2, TREE_RADIUS + rOffset, TREE_HEIGHT);
      treePos.y += yOffset;

      const scatterPos = getRandomSpherePos(SCATTER_RADIUS);

      const r = Math.random();
      let colorHex;
      
      // 35% Red, 25% Deep Green, 25% Bright Green, 15% Gold
      if (r < 0.35) colorHex = "#be123c"; // Rich Red
      else if (r < 0.60) colorHex = "#047857"; // Deep Emerald Green
      else if (r < 0.85) colorHex = "#10b981"; // Vibrant Emerald Green
      else colorHex = "#FCD34D"; // Gold

      const color = new THREE.Color(colorHex);

      data.push({
        treePos,
        scatterPos,
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale: scale,
        color: color,
        speed: 0.3 + Math.random() * 0.5,
      });
    }
    return data;
  }, []);

  // Initialize Instance Colors for Gifts
  useLayoutEffect(() => {
    if (giftMeshRef.current) {
        gifts.forEach((data, i) => {
            giftMeshRef.current!.setColorAt(i, data.color);
        });
        if (giftMeshRef.current.instanceColor) {
            giftMeshRef.current.instanceColor.needsUpdate = true;
        }
    }
  }, [gifts]);

  // Initialize Instance Colors for Baubles
  useLayoutEffect(() => {
    if (baubleMeshRef.current) {
        baubles.forEach((data, i) => {
            baubleMeshRef.current!.setColorAt(i, data.color);
        });
        if (baubleMeshRef.current.instanceColor) {
            baubleMeshRef.current.instanceColor.needsUpdate = true;
        }
    }
  }, [baubles]);

  // --- ANIMATION LOOP ---
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Update Shader Uniform
    uniforms.uTime.value = t;

    // Animate Baubles
    if (baubleMeshRef.current) {
      for (let i = 0; i < ORNAMENT_COUNT; i++) {
        const item = baubles[i];
        
        tempVec3.lerpVectors(item.scatterPos, item.treePos, progress);
        
        if (progress < 0.9) {
          tempVec3.y += Math.sin(t * item.speed + i) * 0.05 * (1 - progress);
          tempVec3.x += Math.cos(t * item.speed * 0.5) * 0.05 * (1 - progress);
        }

        tempObject.position.copy(tempVec3);
        tempObject.rotation.x = item.rotation.x + t * 0.1;
        tempObject.rotation.y = item.rotation.y + t * 0.2;
        tempObject.scale.setScalar(item.scale * (0.5 + 0.5 * progress));
        
        tempObject.updateMatrix();
        baubleMeshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      baubleMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Animate Gifts
    if (giftMeshRef.current) {
      for (let i = 0; i < GIFT_COUNT; i++) {
        const item = gifts[i];
        
        tempVec3.lerpVectors(item.scatterPos, item.treePos, progress);
        
        if (progress < 0.9) {
             tempObject.rotation.x = item.rotation.x + t * item.speed;
             tempObject.rotation.y = item.rotation.y + t * item.speed;
        } else {
             tempObject.rotation.x = THREE.MathUtils.lerp(tempObject.rotation.x, 0, 0.1);
             tempObject.rotation.z = THREE.MathUtils.lerp(tempObject.rotation.z, 0, 0.1);
        }

        tempObject.position.copy(tempVec3);
        tempObject.scale.setScalar(item.scale);
        tempObject.updateMatrix();
        giftMeshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      giftMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Baubles - Spheres */}
      <instancedMesh ref={baubleMeshRef} args={[undefined, undefined, ORNAMENT_COUNT]} material={baubleMaterial}>
        <sphereGeometry args={[1, 32, 32]} />
      </instancedMesh>

      {/* Gifts - Boxes */}
      <instancedMesh ref={giftMeshRef} args={[undefined, undefined, GIFT_COUNT]} material={giftMaterial}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
};

export default Ornaments;