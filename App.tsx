import React, { useState } from 'react';
import WavyCircles from './components/WavyCircles';
import { Settings, Play, Pause, Info, MousePointer2 } from 'lucide-react';

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [interactionStrength, setInteractionStrength] = useState(100);
  const [showUI, setShowUI] = useState(true);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans selection:bg-cyan-500/30">
      {/* Background Effect */}
      <WavyCircles 
        isPlaying={isPlaying} 
        speed={speed} 
        interactionStrength={interactionStrength} 
      />

      {/* Main Content Overlay */}
      <div className={`absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-6 text-center drop-shadow-2xl">
          WARP
          <span className="block text-2xl md:text-3xl font-light tracking-widest text-white/60 mt-2">INTERACTIVE FLOW</span>
        </h1>
        <p className="text-white/40 max-w-md text-center px-4 leading-relaxed">
          A physics-based background simulation. Move your cursor to disturb the flow.
        </p>
      </div>

      {/* Control Panel */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ${showUI ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl w-[90vw] max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Settings className="w-4 h-4" />
              <span>Simulation Config</span>
            </div>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-wider text-white/40">
                <span>Flow Speed</span>
                <span>{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 transition-colors [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-wider text-white/40">
                <span>Cursor Force</span>
                <span>{interactionStrength}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                value={interactionStrength}
                onChange={(e) => setInteractionStrength(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 transition-colors [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle UI Button */}
      <button 
        onClick={() => setShowUI(!showUI)}
        className="absolute top-6 right-6 z-30 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full text-white/60 hover:text-white transition-all"
        title="Toggle UI"
      >
        <Info className="w-5 h-5" />
      </button>
      
       {/* Interaction Hint */}
       <div className={`absolute top-6 left-6 z-30 flex items-center gap-2 text-white/30 text-xs font-mono transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
          <MousePointer2 className="w-4 h-4" />
          <span>INTERACT WITH CURSOR</span>
       </div>
    </div>
  );
};

export default App;