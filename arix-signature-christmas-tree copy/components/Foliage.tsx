import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FOLIAGE_COUNT, TREE_HEIGHT, TREE_RADIUS, SCATTER_RADIUS } from '../types';
import { getTreeConePos, getRandomSpherePos } from '../utils/math';

const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMorph: { value: 0 }, // 0 = Scattered, 1 = Tree
    uColorBase: { value: new THREE.Color('#004225') }, // Deep Emerald
    uColorTip: { value: new THREE.Color('#D4AF37') }, // Gold
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMorph;
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute float aRandom;
    
    varying float vAlpha;
    varying vec3 vColor;

    // Cubic easing for smoother transition
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    void main() {
      float t = easeInOutCubic(uMorph);
      
      // Interpolate position
      vec3 pos = mix(aScatterPos, aTreePos, t);
      
      // Add breathing/wind effect
      float wind = sin(uTime * 2.0 + aRandom * 10.0) * 0.1;
      pos.x += wind * (1.0 - uMorph); // More movement when scattered
      pos.y += wind * 0.5;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Size attenuation
      gl_PointSize = (4.0 + aRandom * 3.0) * (50.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      // Pass randomness to fragment - REMOVED FLICKERING (Time dependency)
      // Replaced dynamic sin(uTime) with static random value
      vAlpha = 0.7 + 0.3 * aRandom; 
    }
  `,
  fragmentShader: `
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    varying float vAlpha;
    varying vec3 vColor;

    void main() {
      // Circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      // Glow gradient: Center is bright, edge is darker
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 1.5);

      // Mix colors based on strength for a "sparkle" look
      vec3 finalColor = mix(uColorBase, uColorTip, strength * 0.5);
      
      gl_FragColor = vec4(finalColor + vec3(0.1), vAlpha * strength);
    }
  `
};

interface FoliageProps {
  progress: number;
}

const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  // Generate geometry data once
  const { positions, scatterPositions, treePositions, randoms } = useMemo(() => {
    const pos = new Float32Array(FOLIAGE_COUNT * 3);
    const scatter = new Float32Array(FOLIAGE_COUNT * 3);
    const tree = new Float32Array(FOLIAGE_COUNT * 3);
    const rnd = new Float32Array(FOLIAGE_COUNT);

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      // Tree Shape
      const hRatio = Math.random(); // 0 to 1
      const pTree = getTreeConePos(hRatio, Math.random() * Math.PI * 2, TREE_RADIUS, TREE_HEIGHT);
      
      // Scatter Shape
      const pScatter = getRandomSpherePos(SCATTER_RADIUS);

      tree[i * 3] = pTree.x;
      tree[i * 3 + 1] = pTree.y;
      tree[i * 3 + 2] = pTree.z;

      scatter[i * 3] = pScatter.x;
      scatter[i * 3 + 1] = pScatter.y;
      scatter[i * 3 + 2] = pScatter.z;

      // Initial buffer geometry needs valid numbers
      pos[i * 3] = pScatter.x;
      pos[i * 3 + 1] = pScatter.y;
      pos[i * 3 + 2] = pScatter.z;

      rnd[i] = Math.random();
    }
    return { positions: pos, scatterPositions: scatter, treePositions: tree, randoms: rnd };
  }, []);

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
      // Smoothly interpolate the morph value
      shaderRef.current.uniforms.uMorph.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uMorph.value,
        progress,
        0.05
      );
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={scatterPositions.length / 3}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[FoliageMaterial]}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;