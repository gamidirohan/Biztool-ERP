"use client";

/**
 * Face Recognition Library using MediaPipe FaceMesh + TensorFlow.js
 * 
 * This module provides in-browser face embedding utilities for attendance tracking.
 * It uses MediaPipe FaceMesh for facial landmark detection and TensorFlow.js for
 * computing 512-dimensional embeddings via a fixed random projection.
 * 
 * Key Features:
 * - Client-side face detection and embedding generation
 * - No external API calls (privacy-focused)
 * - L2-normalized 512-d embeddings for efficient similarity matching
 * - Compatible with pgvector for server-side 1-NN matching
 * 
 * @module face-recognition
 */

import * as tf from "@tensorflow/tfjs";

// ============================================================================
// Types & State
// ============================================================================

type Landmark = { x: number; y: number; z: number };

let faceMeshLoaded = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MediaPipeFaceMesh: any = null;

// ============================================================================
// MediaPipe FaceMesh Initialization
// ============================================================================

/**
 * Loads MediaPipe FaceMesh library dynamically to avoid SSR issues
 * This is called automatically before face detection
 */
async function loadMediaPipeFaceMesh(): Promise<void> {
  if (faceMeshLoaded) return;
  
  const mod = await import("@mediapipe/face_mesh");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MediaPipeFaceMesh = (mod as any).FaceMesh;
  
  if (!MediaPipeFaceMesh) {
    throw new Error("Failed to load MediaPipe FaceMesh library");
  }
  
  faceMeshLoaded = true;
}

// ============================================================================
// Camera Utilities
// ============================================================================

/**
 * Requests camera access and starts video stream
 * @param video - HTMLVideoElement to attach the stream to
 * @returns MediaStream object
 * @throws Error if camera is not available or permission denied
 */
export async function ensureCamera(video: HTMLVideoElement): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera not available in this environment");
  }
  
  const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: "user" }, 
    audio: false 
  });
  
  video.srcObject = stream;
  await video.play();
  
  return stream;
}

// ============================================================================
// Landmark Normalization
// ============================================================================

/**
 * Normalizes facial landmarks to be translation and scale invariant
 * Centers the landmarks around their mean and scales by standard deviation
 * @param landmarks - Array of 3D facial landmarks from MediaPipe
 * @returns Flattened Float32Array of normalized coordinates
 */
function normalizeLandmarks(landmarks: Landmark[]): Float32Array {
  const xs = landmarks.map(p => p.x);
  const ys = landmarks.map(p => p.y);
  const zs = landmarks.map(p => p.z ?? 0);
  
  // Calculate centroid
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  const cz = zs.reduce((a, b) => a + b, 0) / zs.length;
  
  // Center landmarks
  const centered = landmarks.map(p => ({ 
    x: p.x - cx, 
    y: p.y - cy, 
    z: (p.z ?? 0) - cz 
  }));
  
  // Calculate scale (standard deviation)
  const scale = Math.sqrt(
    centered.reduce((s, p) => s + p.x * p.x + p.y * p.y, 0) / centered.length
  ) || 1;
  
  // Normalize and flatten
  const norm = new Float32Array(centered.length * 3);
  for (let i = 0; i < centered.length; i++) {
    norm[i * 3 + 0] = centered[i].x / scale;
    norm[i * 3 + 1] = centered[i].y / scale;
    norm[i * 3 + 2] = centered[i].z / scale;
  }
  
  return norm;
}

// ============================================================================
// Random Projection for Dimensionality Reduction
// ============================================================================

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 * Used for creating consistent random projections
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cache for projection matrix [inputDim, 512]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedProjectionMatrix: any = null;

/**
 * Gets or creates a fixed random projection matrix for dimensionality reduction
 * Projects high-dimensional landmark data to 512 dimensions
 * @param inputDim - Input dimension size
 * @returns TensorFlow.js tensor [inputDim, 512]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProjectionMatrix(inputDim: number): any {
  if (cachedProjectionMatrix && cachedProjectionMatrix.shape[0] === inputDim) {
    return cachedProjectionMatrix;
  }
  
  const rng = mulberry32(42); // Fixed seed for reproducibility
  const data = new Float32Array(inputDim * 512);
  const scale = Math.sqrt(1 / inputDim); // Xavier initialization
  
  for (let i = 0; i < data.length; i++) {
    data[i] = (rng() * 2 - 1) * scale;
  }
  
  cachedProjectionMatrix = tf.tensor2d(data, [inputDim, 512]);
  return cachedProjectionMatrix;
}

// ============================================================================
// Embedding Computation
// ============================================================================

/**
 * Computes a 512-dimensional L2-normalized face embedding from landmarks
 * @param landmarks - Facial landmarks from MediaPipe FaceMesh
 * @returns 512-dimensional Float32Array embedding
 */
function computeEmbedding(landmarks: Landmark[]): Float32Array {
  const normalized = normalizeLandmarks(landmarks);
  const input = tf.tensor2d(normalized, [1, normalized.length]); // [1, N]
  const projectionMatrix = getProjectionMatrix(normalized.length); // [N, 512]
  
  // Compute projected and L2-normalized embedding
  const embedding = tf.tidy(() => {
    const projected = input.matMul(projectionMatrix); // [1, 512]
    const norm = tf.norm(projected, 2, 1, true); // L2 norm
    return tf.div(projected, norm); // L2 normalize
  });
  
  const output = embedding.dataSync() as Float32Array;
  
  // Cleanup tensors
  input.dispose();
  embedding.dispose();
  
  return new Float32Array(output);
}

// ============================================================================
// Main Face Recognition API
// ============================================================================

/**
 * Extracts a face embedding from a video element using MediaPipe FaceMesh
 * 
 * Process:
 * 1. Loads MediaPipe FaceMesh if not already loaded
 * 2. Captures current video frame to canvas
 * 3. Runs face detection on the frame
 * 4. Extracts 468 facial landmarks
 * 5. Computes 512-d embedding via normalization and random projection
 * 
 * @param video - HTMLVideoElement with active camera stream
 * @returns Promise<Float32Array> - 512-dimensional face embedding
 * @throws Error if no face is detected or MediaPipe fails
 */
export async function getFaceEmbedding(video: HTMLVideoElement): Promise<Float32Array> {
  await loadMediaPipeFaceMesh();
  
  // Capture current video frame to canvas
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context not available");
  }
  
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Initialize MediaPipe FaceMesh with CDN assets
  const faceMesh = new MediaPipeFaceMesh({ 
    locateFile: (file: string) => 
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` 
  });
  
  faceMesh.setOptions({ 
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6 
  });

  // Run face detection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any = await new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    faceMesh.onResults((r: any) => resolve(r));
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (faceMesh as any).send({ image: video });
    } catch (error) {
      reject(error);
    }
  });

  // Extract landmarks from results
  const landmarks: Landmark[] | undefined = results?.multiFaceLandmarks?.[0];
  
  if (!landmarks || landmarks.length < 100) {
    throw new Error("No face detected in the frame. Please ensure your face is clearly visible.");
  }
  
  // Compute and return embedding
  return computeEmbedding(landmarks);
}

/**
 * Converts Float32Array to regular number array for JSON serialization
 * @param arr - Float32Array embedding
 * @returns number[] - Regular JavaScript array
 */
export function toArray(arr: Float32Array): number[] {
  return Array.from(arr);
}
