/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, PoseLandmarker, FilesetResolver, HandLandmarkerResult, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { Vector3 } from 'three';

// Mapping 2D normalized coordinates to 3D game world.
const mapHandToWorld = (x: number, y: number): Vector3 => {
  const GAME_X_RANGE = 5; 
  const GAME_Y_RANGE = 3.5;
  const Y_OFFSET = 0.8;

  const worldX = (0.5 - x) * GAME_X_RANGE; 
  const worldY = (1.0 - y) * GAME_Y_RANGE - (GAME_Y_RANGE / 2) + Y_OFFSET;
  const worldZ = -Math.max(0, worldY * 0.2);

  return new Vector3(worldX, Math.max(0.1, worldY), worldZ);
};

export const useMediaPipe = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Raw Results Refs
  const lastResultsRef = useRef<HandLandmarkerResult | null>(null);
  const lastPoseRef = useRef<PoseLandmarkerResult | null>(null);

  const handPositionsRef = useRef<{
    left: Vector3 | null;
    right: Vector3 | null;
    leftVelocity: Vector3;
    rightVelocity: Vector3;
    lastTimestamp: number;
  }>({
    left: null,
    right: null,
    leftVelocity: new Vector3(0,0,0),
    rightVelocity: new Vector3(0,0,0),
    lastTimestamp: 0
  });

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let isActive = true;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );
        
        if (!isActive) return;

        // 1. Hand Landmarker (High fidelity fingers)
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // 2. Pose Landmarker (Full body structure)
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        if (!isActive) {
             handLandmarker.close();
             poseLandmarker.close();
             return;
        }

        handLandmarkerRef.current = handLandmarker;
        poseLandmarkerRef.current = poseLandmarker;
        startCamera();
      } catch (err: any) {
        console.error("Error initializing MediaPipe:", err);
        setError(`Failed to load tracking models: ${err.message}`);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
             if (isActive) {
                 setIsCameraReady(true);
                 predictWebcam();
             }
          };
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setError("Could not access camera.");
      }
    };

    const predictWebcam = () => {
        if (!videoRef.current || !handLandmarkerRef.current || !poseLandmarkerRef.current || !isActive) return;

        const video = videoRef.current;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
             let startTimeMs = performance.now();
             try {
                 // Run both detections
                 const handResults = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
                 const poseResults = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

                 lastResultsRef.current = handResults;
                 lastPoseRef.current = poseResults;

                 processHandForGame(handResults);
             } catch (e) {
                 console.warn("Detection failed this frame", e);
             }
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    // Helper for legacy game logic compatibility
    const processHandForGame = (results: HandLandmarkerResult) => {
        // ... (Existing logic for game velocity, kept for compatibility if needed later)
    };

    setupMediaPipe();

    return () => {
      isActive = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
      if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
    };
  }, [videoRef]);

  return { isCameraReady, lastResultsRef, lastPoseRef, error };
};