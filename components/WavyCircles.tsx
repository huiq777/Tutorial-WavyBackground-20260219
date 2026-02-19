import React, { useEffect, useRef } from 'react';

interface WavyCirclesProps {
  lineColor?: string;
  isPlaying?: boolean;
  speed?: number; // Controls wave speed
  interactionStrength?: number; // Controls physics intensity
}

interface Point {
  x: number;
  y: number;
  cursor: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
}

interface Wave {
  radius: number;
  id: number;
}

const WavyCircles: React.FC<WavyCirclesProps> = ({
  lineColor = 'rgba(255, 255, 255, 0.3)',
  isPlaying = true,
  speed = 2,
  interactionStrength = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const state = useRef({
    mouse: { x: 0, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0 },
    lines: [] as Point[][], // Grid of points (Columns)
    paths: [] as SVGPathElement[],
    waves: [] as Wave[],
    bounding: { width: 0, height: 0, left: 0, top: 0 },
    animationId: 0,
    lineSpeeds: [] as number[],
    lineOffsets: [] as number[],
  });

  // Initialization and Resize Logic
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const init = () => {
      const { current: s } = state;
      const rect = containerRef.current!.getBoundingClientRect();
      s.bounding = rect;
      
      // Update SVG size
      if (svgRef.current) {
        svgRef.current.style.width = `${rect.width}px`;
        svgRef.current.style.height = `${rect.height}px`;
      }

      setLines();
    };

    const setLines = () => {
      const { current: s } = state;
      const { width, height } = s.bounding;
      
      // Clear existing paths
      s.paths.forEach(p => p.remove());
      s.paths = [];
      s.lines = [];
      s.waves = []; // Reset waves
      s.lineSpeeds = [];
      s.lineOffsets = [];

      // Grid Config
      const xGap = 10;
      const yGap = 32;

      // Add some buffer to ensure coverage
      const oWidth = width + 200;
      const oHeight = height + 30;

      const totalLines = Math.ceil(oWidth / xGap);
      const totalPoints = Math.ceil(oHeight / yGap);

      const xStart = (width - xGap * totalLines) / 2;
      const yStart = (height - yGap * totalPoints) / 2;

      for (let i = 0; i <= totalLines; i++) {
        const points: Point[] = [];
        for (let j = 0; j <= totalPoints; j++) {
          points.push({
            x: xStart + xGap * i,
            y: yStart + yGap * j,
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          });
        }
        s.lines.push(points);
        
        // Initialize motion for this line (falling effect)
        // Speed: 0.5 to 2.0 pixels per frame
        s.lineSpeeds.push(Math.random() * 1.5 + 0.5); 
        s.lineOffsets.push(Math.random() * 1000); // Random start phase

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', lineColor);
        path.setAttribute('stroke-width', '1');
        path.setAttribute('stroke-opacity', '0.5'); 
        
        // Generate randomized noise texture (gaps)
        let dashArray = '';
        let currentLen = 0;
        // Generate pattern to cover height + buffer for wave distortion
        const targetLen = oHeight * 1.5;
        
        while (currentLen < targetLen) {
            // Long drawn segment (50px - 300px)
            const segment = Math.random() * 250 + 50;
            // Short gap (2px - 15px)
            const gap = Math.random() * 13 + 2;
            
            dashArray += `${segment.toFixed(0)} ${gap.toFixed(0)} `;
            currentLen += segment + gap;
        }
        path.setAttribute('stroke-dasharray', dashArray);

        if (svgRef.current) {
          svgRef.current.appendChild(path);
        }
        s.paths.push(path);
      }
    };

    window.addEventListener('resize', init);
    init();

    return () => {
      window.removeEventListener('resize', init);
      state.current.paths.forEach(p => p.remove());
    };
  }, [lineColor]);

  // Mouse Tracking
  useEffect(() => {
    const updateMouse = (x: number, y: number) => {
      const { current: s } = state;
      s.mouse.x = x - s.bounding.left;
      s.mouse.y = y - s.bounding.top; 
    };

    const handleMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
        updateMouse(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Animation Loop
  useEffect(() => {
    const { current: s } = state;
    
    // Clear waves on start to avoid duplicates from strict mode
    s.waves = [];

    // Helper to calculate final point position
    const moved = (point: Point, withCursorForce = true) => {
      return {
        x: point.x + (withCursorForce ? point.cursor.x : 0),
        y: point.y + (withCursorForce ? point.cursor.y : 0),
      };
    };

    const movePoints = () => {
      const centerX = s.bounding.width / 2;
      const centerY = s.bounding.height / 2;
      const strength = interactionStrength / 100;

      s.lines.forEach((points) => {
        points.forEach((p, i) => {
          // --- MOUSE PHYSICS ---
          const dx = p.x - s.mouse.sx;
          const dy = p.y - s.mouse.sy;
          const d = Math.hypot(dx, dy);
          const l = Math.max(175, s.mouse.vs);

          if (d < l) {
            const f = 1 - d / l;
            p.cursor.vx += Math.cos(s.mouse.a) * f * s.mouse.vs * 0.08 * strength;
            p.cursor.vy += Math.sin(s.mouse.a) * f * s.mouse.vs * 0.08 * strength;
          }

          // --- WAVE PHYSICS ---
          s.waves.forEach(wave => {
             const wx = p.x - centerX;
             const wy = p.y - centerY;
             const wd = Math.hypot(wx, wy);
             
             // The wave is a ring of force
             const waveDiff = wd - wave.radius;
             
             // Increased width for a much smoother, subtle ripple (Image 2 style)
             const waveWidth = 250; 

             if (Math.abs(waveDiff) < waveWidth) {
                 // Force falls off as you move away from the wavefront center
                 // f goes from 0 (at edge) to 1 (at center)
                 const f = 1 - Math.abs(waveDiff) / waveWidth;
                 
                 // Use a quadratic curve for smoother onset/falloff than linear
                 const profile = f * f;
                 
                 // Direction away from center
                 const angle = Math.atan2(wy, wx);
                 
                 // Ramp up force as wave expands from center to avoid center explosion
                 // 0 at radius 0, full strength at radius 300
                 const growthFactor = Math.min(1, Math.max(0, wave.radius / 300));

                 // Significantly reduced force to prevent "jagged" distortion
                 const waveForce = 5 * strength * profile * growthFactor;
                 
                 // Apply gentle push
                 p.cursor.vx += Math.cos(angle) * waveForce * 0.2;
                 p.cursor.vy += Math.sin(angle) * waveForce * 0.2;
             }
          });


          // --- SPRING PHYSICS ---
          // Tension: return to origin
          p.cursor.vx += (0 - p.cursor.x) * 0.005;
          p.cursor.vy += (0 - p.cursor.y) * 0.005;

          // Friction
          p.cursor.vx *= 0.925;
          p.cursor.vy *= 0.925;

          // Velocity application
          p.cursor.x += p.cursor.vx * 2;
          p.cursor.y += p.cursor.vy * 2;

          // Clamping
          p.cursor.x = Math.min(100, Math.max(-100, p.cursor.x));
          p.cursor.y = Math.min(100, Math.max(-100, p.cursor.y));
        });
      });
    };

    const drawLines = () => {
      s.lines.forEach((points, lIndex) => {
        if (!s.paths[lIndex]) return;

        // Pin the first point 
        let p1 = moved(points[0], false);
        let d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;

        points.forEach((p, pIndex) => {
          // Pin the last point
          const isLast = pIndex === points.length - 1;
          const mp = moved(p, !isLast);
          d += `L ${mp.x.toFixed(1)} ${mp.y.toFixed(1)}`;
        });

        s.paths[lIndex].setAttribute('d', d);
        
        // Update noise animation (moving gaps)
        s.paths[lIndex].style.strokeDashoffset = `${s.lineOffsets[lIndex].toFixed(1)}px`;
      });
    };

    const tick = () => {
      // --- MOUSE UPDATES ---
      s.mouse.sx += (s.mouse.x - s.mouse.sx) * 0.1;
      s.mouse.sy += (s.mouse.y - s.mouse.sy) * 0.1;

      const dx = s.mouse.x - s.mouse.lx;
      const dy = s.mouse.y - s.mouse.ly;
      const d = Math.hypot(dx, dy);

      s.mouse.v = d;
      s.mouse.vs += (d - s.mouse.vs) * 0.1;
      s.mouse.vs = Math.min(100, s.mouse.vs);

      s.mouse.lx = s.mouse.x;
      s.mouse.ly = s.mouse.y;

      s.mouse.a = Math.atan2(dy, dx);

      // --- NOISE UPDATE ---
      // Move each line's gap pattern down
      for(let i = 0; i < s.lineOffsets.length; i++) {
          s.lineOffsets[i] -= s.lineSpeeds[i];
      }

      // --- WAVE MANAGEMENT ---
      if (isPlaying) {
          const diagonal = Math.hypot(s.bounding.width, s.bounding.height);
          const maxRadius = diagonal / 2 + 300; // Allow wave to fully exit
          
          // Spawn logic
          // Ensure extremely distinct spacing so only one wave is ever acting primarily on the grid
          const waveGap = Math.max(s.bounding.width, s.bounding.height) * 1.5; 
          
          if (s.waves.length === 0) {
              // Start a wave immediately
               s.waves.push({ radius: -200, id: Date.now() }); // Start slightly offscreen/center for smooth entry
          } else {
              const lastWave = s.waves[s.waves.length - 1];
              if (lastWave.radius > waveGap) {
                  s.waves.push({ radius: -200, id: Date.now() });
              }
          }
          
          // Update and cull waves
          s.waves.forEach(w => w.radius += speed);
          s.waves = s.waves.filter(w => w.radius < maxRadius);
      } 

      movePoints();
      drawLines();

      s.animationId = requestAnimationFrame(tick);
    };

    cancelAnimationFrame(s.animationId);
    tick();

    return () => {
      cancelAnimationFrame(s.animationId);
    };
  }, [isPlaying, speed, interactionStrength]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      <svg 
        ref={svgRef} 
        className="block w-full h-full touch-none"
        style={{ pointerEvents: 'none' }}
      ></svg>
    </div>
  );
};

export default WavyCircles;