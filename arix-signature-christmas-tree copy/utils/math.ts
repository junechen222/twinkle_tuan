import * as THREE from 'three';
import { TREE_HEIGHT, TREE_RADIUS, SCATTER_RADIUS } from '../types';

/**
 * Returns a random point inside a sphere
 */
export const getRandomSpherePos = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

/**
 * Returns a point on a conical spiral (Christmas Tree shape)
 */
export const getTreeConePos = (heightRatio: number, angleOffset: number, maxRadius: number, maxHeight: number): THREE.Vector3 => {
  // y goes from -height/2 to height/2 approximately
  const y = (heightRatio - 0.5) * maxHeight;
  
  // Radius decreases as we go up
  const r = maxRadius * (1 - heightRatio) + 0.2; // 0.2 is min radius at top
  
  const theta = heightRatio * 25 + angleOffset; // 25 is the number of windings
  
  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
};

export const normalize = (val: number, max: number, min: number) => { 
  return (val - min) / (max - min); 
};
