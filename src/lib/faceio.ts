"use client";

// In-browser face embedding utilities (MediaPipe FaceMesh + TensorFlow.js)
// Provides a minimal 512-d embedding computed from normalized landmarks via a
// fixed random projection. Suitable for 1-NN matching with pgvector server-side.

import * as tf from "@tensorflow/tfjs";

type Landmark = { x: number; y: number; z: number };

let faceMeshLoaded = false;
let FaceMeshCtor: any | null = null;

async function loadFaceMesh(): Promise<void> {
  if (faceMeshLoaded) return;
  // Dynamically import MediaPipe FaceMesh to avoid SSR issues
  const mod = await import("@mediapipe/face_mesh");
  FaceMeshCtor = (mod as any).FaceMesh;
  if (!FaceMeshCtor) throw new Error("Failed to load MediaPipe FaceMesh");
  faceMeshLoaded = true;
}

export async function ensureCamera(video: HTMLVideoElement): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera not available in this environment");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
  video.srcObject = stream;
  await video.play();
  return stream;
}

function normalizeLandmarks(landmarks: Landmark[]): Float32Array {
  // Center and scale landmarks to be translation/scale invariant
  const xs = landmarks.map(p => p.x);
  const ys = landmarks.map(p => p.y);
  const zs = landmarks.map(p => p.z ?? 0);
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  const cz = zs.reduce((a, b) => a + b, 0) / zs.length;
  const centered = landmarks.map(p => ({ x: p.x - cx, y: p.y - cy, z: (p.z ?? 0) - cz }));
  const scale = Math.sqrt(centered.reduce((s, p) => s + p.x * p.x + p.y * p.y, 0) / centered.length) || 1;
  const norm = new Float32Array(centered.length * 3);
  for (let i = 0; i < centered.length; i++) {
    norm[i * 3 + 0] = centered[i].x / scale;
    norm[i * 3 + 1] = centered[i].y / scale;
    norm[i * 3 + 2] = centered[i].z / scale;
  }
  return norm;
}

// Deterministic pseudo-random generator for fixed projection
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let proj512: any | null = null; // [inputDim, 512]

function getProjection(inputDim: number): any {
  if (proj512 && proj512.shape[0] === inputDim) return proj512;
  const rng = mulberry32(42);
  const data = new Float32Array(inputDim * 512);
  const s = Math.sqrt(1 / inputDim);
  for (let i = 0; i < data.length; i++) data[i] = (rng() * 2 - 1) * s; // Xavier-like init
  proj512 = tf.tensor2d(data, [inputDim, 512]);
  return proj512;
}

function computeEmbedding(landmarks: Landmark[]): Float32Array {
  const norm = normalizeLandmarks(landmarks);
  const input = tf.tensor2d(norm, [1, norm.length]); // [1, N]
  const W = getProjection(norm.length); // [N, 512]
  const emb = tf.tidy(() => {

    const proj = input.matMul(W);

    const norm = tf.norm(proj, 2, 1, true); // L2 norm along axis 1, keep dims

    return tf.div(proj, norm); // L2 normalize

  }); // [1,512], L2 normalized
  const out = emb.dataSync() as Float32Array;
  input.dispose();
  emb.dispose();
  return new Float32Array(out);
}

export async function getFaceEmbedding(video: HTMLVideoElement): Promise<Float32Array> {
  await loadFaceMesh();
  // Draw current video frame to a canvas and run FaceMesh
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const fm = new FaceMeshCtor({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
  fm.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });

  const results: any = await new Promise((resolve, reject) => {
    fm.onResults((r: any) => resolve(r));
    // MediaPipe expects HTMLVideoElement/Canvas/ImageData; we can pass an offscreen canvas
    try {
      (fm as any).send({ image: video });
    } catch (e) {
      reject(e);
    }
  });

  const landmarks: Landmark[] | undefined = results?.multiFaceLandmarks?.[0];
  if (!landmarks || landmarks.length < 100) throw new Error("No face detected");
  return computeEmbedding(landmarks);
}

export function toArray(arr: Float32Array): number[] {
  return Array.from(arr as any as number[]);
}
