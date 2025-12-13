/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Grid, ContactShadows, SoftShadows } from '@react-three/drei';
import { useMediaPipe } from './hooks/useMediaPipe';
import WebcamPreview from './components/WebcamPreview';
import RiggedAvatar from './components/RiggedAvatar';
import WelcomeScreen from './components/WelcomeScreen';
import { VideoOff, Loader, ScanFace, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Pass hasStarted as the 'enabled' flag to useMediaPipe
  const { isCameraReady, lastResultsRef, lastPoseRef, error } = useMediaPipe(videoRef, hasStarted);
  const [showSkeleton, setShowSkeleton] = useState(false);

  return (
    <div className="relative w-full h-screen bg-[#111] overflow-hidden font-sans select-none">
      
      {/* Welcome Screen Overlay */}
      {!hasStarted && (
        <WelcomeScreen onStart={() => setHasStarted(true)} />
      )}

      {/* 1. Main 3D Scene */}
      <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 1.2, 3.5], fov: 40 }} shadows>
              <color attach="background" args={['#1a1a1a']} />
              <fog attach="fog" args={['#1a1a1a', 5, 15]} />
              
              <SoftShadows size={10} samples={16} />

              {/* Studio Lighting Setup for Skin */}
              <ambientLight intensity={0.6} />
              
              {/* Key Light */}
              <spotLight 
                position={[2, 4, 3]} 
                angle={0.5} 
                penumbra={1} 
                intensity={3} 
                castShadow 
                shadow-bias={-0.0001}
                color="#fff0e0"
              />

              {/* Fill Light */}
              <spotLight 
                position={[-2, 2, 4]} 
                angle={0.6} 
                penumbra={1} 
                intensity={1.5} 
                color="#d0e0ff"
              />
              
              {/* Back Light (Rim) */}
              <spotLight position={[0, 4, -4]} intensity={2} color="#ffffff" angle={1} />
              
              <Environment preset="studio" blur={0.8} />
              
              <Grid 
                position={[0, 0.01, 0]} 
                args={[30, 30]} 
                cellColor="#444" 
                sectionColor="#666" 
                fadeDistance={20} 
              />
              <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.5} far={10} color="#000000" />

              {/* Pass both Hand and Pose results */}
              <RiggedAvatar 
                  handResultsRef={lastResultsRef} 
                  poseResultsRef={lastPoseRef}
                  showSkeleton={showSkeleton}
              />
              
              {/* Target torso height */}
              <OrbitControls 
                target={[0, 1.0, 0]} 
                maxPolarAngle={Math.PI / 1.8} 
                minPolarAngle={Math.PI / 3}
                minDistance={2} 
                maxDistance={6}
                enablePan={false}
              />
          </Canvas>
      </div>

      {/* 2. Hidden Processing Video */}
      <video 
        ref={videoRef} 
        className="absolute opacity-0 pointer-events-none"
        playsInline
        muted
        autoPlay
        style={{ width: '640px', height: '480px' }}
      />

      {/* 3. UI Layer (Only show if started) */}
      {hasStarted && (
        <div className="absolute inset-0 pointer-events-none z-10 p-8 flex flex-col justify-between animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-5xl font-bold text-white tracking-tight opacity-90">
                    MOTION LINK
                </h1>
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm tracking-wide uppercase">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Live Twin Capture
                </div>
            </div>

            {/* Controls / Instructions */}
            <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-6 opacity-60 pointer-events-auto">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 border border-white/10 rounded-full flex items-center justify-center bg-white/5 backdrop-blur">
                        <ScanFace size={24} className="text-emerald-400" />
                    </div>
                    <div className="text-white/80 text-sm max-w-[200px] leading-tight font-light">
                        Capture is active.<br/>
                        <span className="text-emerald-400 font-medium">1:1 Motion Mapping</span>
                    </div>
                </div>

                {/* Toggle Skeleton Button */}
                <button 
                    onClick={() => setShowSkeleton(prev => !prev)}
                    className={`flex items-center gap-4 group transition-all duration-300 ${showSkeleton ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                    <div className={`w-14 h-14 border rounded-full flex items-center justify-center backdrop-blur transition-all duration-300 ${
                        showSkeleton 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                            : 'bg-white/5 border-white/10 text-white/50 group-hover:bg-white/10 group-hover:text-white'
                    }`}>
                        <Activity size={24} />
                    </div>
                    <div className="text-left">
                        <div className={`text-sm font-medium transition-colors ${showSkeleton ? 'text-emerald-400' : 'text-white/80'}`}>
                            SKELETON OVERLAY
                        </div>
                        <div className="text-xs text-white/40 font-mono">
                            {showSkeleton ? 'VISIBLE' : 'HIDDEN'}
                        </div>
                    </div>
                </button>
            </div>

            {/* Footer & Webcam */}
            <div className="flex items-end justify-between w-full">
                {/* Status */}
                <div className="flex gap-4">
                    {!isCameraReady && !error && (
                        <div className="px-6 py-3 bg-white/5 backdrop-blur border border-white/10 rounded-full text-white/70 flex items-center gap-3">
                            <Loader className="animate-spin w-4 h-4" />
                            <span className="font-mono text-xs">CALIBRATING SENSORS...</span>
                        </div>
                    )}
                    {error && (
                        <div className="px-6 py-3 bg-red-900/40 backdrop-blur border border-red-500/30 rounded-lg text-red-200 font-mono text-xs">
                            ERROR: {error}
                        </div>
                    )}
                </div>

                {/* Large Webcam Preview */}
                <div className="relative pointer-events-auto group mr-4 mb-4">
                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl opacity-20 blur-md transition group-hover:opacity-40"></div>
                  {/* Reduced size from 480x360 to 320x240 */}
                  <div className="relative w-[320px] h-[240px] bg-black/80 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                      {error ? (
                          <div className="w-full h-full flex items-center justify-center text-red-500 bg-red-950/20">
                              <VideoOff size={48} />
                          </div>
                      ) : !isCameraReady ? (
                          <div className="w-full h-full flex flex-col gap-3 items-center justify-center text-emerald-400 bg-black">
                              <Loader className="animate-spin" size={48} />
                              <span className="text-sm font-mono uppercase tracking-widest mt-4">Initializing Vision...</span>
                          </div>
                      ) : (
                          <>
                              <WebcamPreview 
                                  videoRef={videoRef} 
                                  resultsRef={lastResultsRef} 
                                  isCameraReady={isCameraReady} 
                              />
                              {/* HUD Overlay */}
                              <div className="absolute bottom-4 left-4 flex gap-2">
                                  <div className="text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-1 rounded border border-emerald-900/50">
                                      HIGH_SENSITIVITY
                                  </div>
                              </div>
                          </>
                      )}
                  </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;