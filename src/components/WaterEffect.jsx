import { useRef, useEffect } from 'react';
import '../styles/WaterEffect.css';

const DROPLET_COUNT = 80;

function createDroplet(canvasWidth, canvasHeight) {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * -canvasHeight,
    speed: 1 + Math.random() * 2.5,
    size: 1 + Math.random() * 2.5,
    opacity: 0.08 + Math.random() * 0.25,
    drift: (Math.random() - 0.5) * 0.3,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.005 + Math.random() * 0.01,
    swayAmp: 0.3 + Math.random() * 0.5,
  };
}

export default function WaterEffect() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const dropletsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    resize();

    // Initialize droplets
    dropletsRef.current = Array.from({ length: DROPLET_COUNT }, () =>
      createDroplet(w, h)
    );
    // Spread initial Y positions so they don't all start at top
    dropletsRef.current.forEach(d => {
      d.y = Math.random() * h;
    });

    const getWaterColor = () => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--water-color').trim() || 'rgba(0,220,255,0.25)';
    };

    // Parse rgba string to components
    const parseRGBA = (str) => {
      const match = str.match(/[\d.]+/g);
      if (!match || match.length < 4) return [0, 220, 255, 0.25];
      return match.map(Number);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const colorStr = getWaterColor();
      const [r, g, b] = parseRGBA(colorStr);

      for (const drop of dropletsRef.current) {
        // Update position
        drop.y += drop.speed;
        drop.sway += drop.swaySpeed;
        const swayX = Math.sin(drop.sway) * drop.swayAmp;
        drop.x += drop.drift + swayX * 0.1;

        // Reset when off screen
        if (drop.y > h + 10) {
          drop.y = Math.random() * -50;
          drop.x = Math.random() * w;
        }

        // Wrap horizontal
        if (drop.x < -10) drop.x = w + 10;
        if (drop.x > w + 10) drop.x = -10;

        // Draw droplet (elongated for rain feel)
        ctx.beginPath();
        ctx.ellipse(drop.x, drop.y, drop.size * 0.5, drop.size * 1.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${drop.opacity})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas className="water-effect" ref={canvasRef} />
  );
}
