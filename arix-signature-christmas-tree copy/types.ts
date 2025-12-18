import * as THREE from 'three';

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface DualPosition {
  treePos: THREE.Vector3;
  scatterPos: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  color: THREE.Color;
  speed: number; // Random variation for movement
}

// Config constants
export const FOLIAGE_COUNT = 15000;
export const ORNAMENT_COUNT = 500; // Decreased from 600 to 500
export const GIFT_COUNT = 400; // Increased to add more gift boxes
export const TREE_HEIGHT = 12;
export const TREE_RADIUS = 5;
export const SCATTER_RADIUS = 15;