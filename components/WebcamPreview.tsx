
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';
import { HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { COLORS } from '../types';

interface WebcamPreviewProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    resultsRef: React.MutableRefObject<HandLandmarkerResult | null>;
    isCameraReady: boolean;
}

const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17], [0, 5], [0, 17] // Palm
];

const WebcamPreview: React.FC<WebcamPreviewProps> = ({ videoRef, resultsRef, isCameraReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isCameraReady) return;
        let animationFrameId: number;

        const render = () => {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            if (canvas && video && video.readyState >= 2) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Match canvas internal resolution to video resolution
                    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
                    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // 1. Draw Video Feed (Mirrored)
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.translate(-canvas.width, 0);
                    // Tech filter: High contrast, slight cyan tint
                    ctx.filter = 'contrast(1.2) brightness(0.8) grayscale(0.5)';
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Add color overlay for "night vision" feel
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillStyle = 'rgba(0, 50, 60, 0.5)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.filter = 'none';
                    ctx.restore();

                    // 2. Draw Landmarks
                    if (resultsRef.current && resultsRef.current.landmarks) {
                        for (let i = 0; i < resultsRef.current.landmarks.length; i++) {
                            const landmarks = resultsRef.current.landmarks[i];
                            const handInfo = resultsRef.current.handedness[i];
                            
                            // Color logic
                            let color = '#ffffff';
                            if (handInfo && handInfo[0]) {
                                const isRight = handInfo[0].categoryName === 'Right';
                                color = isRight ? COLORS.right : COLORS.left;
                            }

                            ctx.lineWidth = 2;
                            ctx.lineJoin = 'round';
                            ctx.lineCap = 'round';
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = color;

                            // Draw connections
                            ctx.strokeStyle = color; 
                            ctx.beginPath();
                            for (const [start, end] of HAND_CONNECTIONS) {
                                const p1 = landmarks[start];
                                const p2 = landmarks[end];
                                ctx.moveTo((1 - p1.x) * canvas.width, p1.y * canvas.height);
                                ctx.lineTo((1 - p2.x) * canvas.width, p2.y * canvas.height);
                            }
                            ctx.stroke();

                            // Draw joints
                            ctx.fillStyle = "#fff";
                            for (const lm of landmarks) {
                                ctx.beginPath();
                                ctx.arc((1 - lm.x) * canvas.width, lm.y * canvas.height, 2, 0, 2 * Math.PI);
                                ctx.fill();
                            }
                            
                            ctx.shadowBlur = 0;
                        }
                    }

                    // 3. Draw Confidence Indicator
                    if (resultsRef.current && resultsRef.current.handedness && resultsRef.current.handedness.length > 0) {
                        const scores = resultsRef.current.handedness.map(h => h[0]?.score || 0);
                        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

                        const barWidth = 40;
                        const barHeight = 2;
                        const padding = 20; // Ensure it doesn't hit the very edge
                        const x = padding;
                        const y = canvas.height - padding;

                        // Label
                        ctx.font = '9px monospace';
                        ctx.textAlign = 'left';
                        ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
                        ctx.fillText("SYNC", x, y - 5);

                        // Bar Background
                        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                        ctx.fillRect(x, y, barWidth, barHeight);

                        // Bar Fill
                        const color = avgScore > 0.8 ? '#00ffff' : avgScore > 0.5 ? '#ffff00' : '#ff0000';
                        ctx.fillStyle = color;
                        ctx.shadowColor = color;
                        ctx.shadowBlur = 4;
                        ctx.fillRect(x, y, barWidth * avgScore, barHeight);
                        ctx.shadowBlur = 0;
                    }
                    
                    // Add scanlines effect
                    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                    for(let i=0; i<canvas.height; i+=3) {
                        ctx.fillRect(0, i, canvas.width, 1);
                    }
                }
            }
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isCameraReady, videoRef, resultsRef]);

    if (!isCameraReady) return null;

    return (
        <canvas 
            ref={canvasRef} 
            className="w-full h-full object-cover" 
        />
    );
};

export default WebcamPreview;
