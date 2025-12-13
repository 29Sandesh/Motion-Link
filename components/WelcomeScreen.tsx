/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ScanFace, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden font-sans select-none">
        
        {/* Background Grid Effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
                 backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                 backgroundSize: '40px 40px',
                 maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
             }} 
        />

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center gap-10 max-w-md text-center p-8 animate-in fade-in zoom-in duration-700">
            
            {/* Logo / Icon */}
            <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                <div className="w-24 h-24 border border-white/10 rounded-2xl flex items-center justify-center bg-white/5 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <ScanFace size={48} className="text-emerald-400 relative z-10" />
                    
                    {/* Tech Corners */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/50" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500/50" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500/50" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/50" />
                </div>
            </div>

            {/* Title Block */}
            <div className="space-y-3">
                <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl">
                    MOTION LINK
                </h1>
                <div className="flex items-center justify-center gap-3">
                     <div className="h-[1px] w-8 bg-emerald-500/50" />
                     <p className="text-emerald-400/80 font-mono text-xs tracking-[0.2em] uppercase">
                        Neural Interface v1.0
                    </p>
                    <div className="h-[1px] w-8 bg-emerald-500/50" />
                </div>
            </div>

            {/* Description */}
            <p className="text-white/50 leading-relaxed text-sm max-w-sm">
                Real-time avatar synthesis using computer vision. 
                <br/>
                <span className="text-white/30 text-xs">Camera access required for neural mapping.</span>
            </p>

            {/* Start Button */}
            <button 
                onClick={onStart}
                className="group relative px-10 py-4 bg-white text-black font-bold tracking-widest text-xs uppercase hover:bg-emerald-400 transition-all duration-300 mt-4 overflow-hidden"
            >
                <span className="relative z-10 flex items-center gap-2">
                    Initialize System
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            </button>
        </div>

        {/* Footer Credit */}
        <div className="absolute bottom-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <p className="text-white/20 text-[10px] font-mono tracking-widest mb-2 uppercase">
                Developed By
            </p>
            <div className="flex items-center justify-center gap-2 text-white/60 hover:text-emerald-400 transition-colors cursor-default">
                <span className="font-medium tracking-wide">Samcodes</span>
            </div>
        </div>
    </div>
  );
};

export default WelcomeScreen;