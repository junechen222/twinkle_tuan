import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import { TreeState } from '../types';

interface ExperienceProps {
  treeState: TreeState;
}

const SceneContent: React.FC<{ treeState: TreeState }> = ({ treeState }) => {
  const { camera } = useThree();
  const starRef = useRef<THREE.Group>(null);
  
  // Internal spring value for smooth physics-like interpolation
  const [visualProgress, setVisualProgress] = useState(0);

  // Generate Star Shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.9;
    const innerRadius = 0.45;
    const angleOffset = Math.PI / 2; // Point up

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points + angleOffset;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  useFrame((state, delta) => {
    const target = treeState === TreeState.TREE_SHAPE ? 1 : 0;
    // Simple lerp for smoothness
    const speed = 2.0; 
    const diff = target - visualProgress;
    
    if (Math.abs(diff) > 0.001) {
        setVisualProgress(visualProgress + diff * speed * delta);
    }
    
    // Gentle camera rotation
    const time = state.clock.getElapsedTime();
    if(treeState === TreeState.SCATTERED) {
         camera.position.x += Math.sin(time * 0.1) * 0.02;
         camera.position.z += Math.cos(time * 0.1) * 0.02;
    }

    // Rotate the Star
    if (starRef.current) {
        starRef.current.rotation.y = time * 0.4;
    }
  });

  return (
    <>
        <group position={[0, -4, 0]}>
            <Foliage progress={visualProgress} />
            <Ornaments progress={visualProgress} />
            
            {/* The Star on Top */}
            <group ref={starRef} position={[0, 6.5, 0]} scale={visualProgress}>
                <Center>
                    <mesh>
                        <extrudeGeometry 
                            args={[
                                starShape, 
                                { 
                                    depth: 0.3, 
                                    bevelEnabled: true, 
                                    bevelThickness: 0.1, 
                                    bevelSize: 0.05, 
                                    bevelSegments: 3 
                                }
                            ]} 
                        />
                        <meshStandardMaterial 
                            color="#FFD700" 
                            emissive="#FFD700"
                            emissiveIntensity={0.8}
                            roughness={0.1} 
                            metalness={1} 
                        />
                    </mesh>
                </Center>
            </group>
            
             {/* Floor Reflection - Moved to bottom (y = -7) to be below all gifts */}
             <ContactShadows 
                position={[0, -7, 0]}
                opacity={0.5 * visualProgress} 
                scale={40} 
                blur={2.5} 
                far={10} 
                resolution={512} 
                color="#000000" 
             />
        </group>
    </>
  );
};

const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 18], fov: 45 }}
      gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
    >
      <color attach="background" args={['#020617']} />
      
      {/* Lighting System */}
      <ambientLight intensity={0.2} color="#004225" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={200} 
        color="#FCD34D" 
        castShadow 
      />
      <pointLight position={[-10, -5, -10]} intensity={10} color="#064e3b" />
      <pointLight position={[0, 5, 5]} intensity={5} color="#fff" distance={10} decay={2} />

      {/* Environment for shiny reflections */}
      <Environment preset="city" />

      <SceneContent treeState={treeState} />

      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        minDistance={8} 
        maxDistance={25} 
        autoRotate={treeState === TreeState.TREE_SHAPE}
        autoRotateSpeed={0.5}
      />

      {/* Cinematic Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.5} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};

export default Experience;