import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useTheme } from '../context/ThemeContext';
import profileImg from '../assets/profile.png';
import '../styles/Portrait.css';

/* ===== Pixel Sampling — 3D Point Cloud Style ===== */
function sampleImagePixels(image) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Higher resolution for denser point cloud
  const maxDim = 580;
  const aspect = image.naturalWidth / image.naturalHeight;
  const w = aspect >= 1 ? maxDim : Math.round(maxDim * aspect);
  const h = aspect >= 1 ? Math.round(maxDim / aspect) : maxDim;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(image, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const particles = [];
  // Dense sampling (every 2px) for that PCD point cloud density
  const step = 2;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 25) continue;

      const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

      // Skip pure background (very bright, nearly white)
      if (brightness > 0.97) continue;

      // Normalized XY centered at origin
      const nx = x / w - 0.5;
      const ny = -(y / h - 0.5);

      // 3D DEPTH: brightness drives Z significantly
      // Bright areas (forehead, nose tip, cheeks) push forward
      // Dark areas (eye sockets, under chin, hair) recede
      // This creates the 3D sculpted bust effect
      const depthBase = brightness * 0.55;
      // Add subtle noise for organic feel
      const noise = (Math.random() - 0.5) * 0.03;
      const nz = depthBase + noise;

      particles.push({
        x: nx,
        y: ny,
        z: nz,
        brightness,
        alpha: a / 255,
      });
    }
  }
  return particles;
}

/* ===== 3D Point Cloud with Hover Scatter ===== */
function PointCloud({ particles, isDark }) {
  const pointsRef = useRef();
  const groupRef = useRef();
  const { viewport, raycaster, camera } = useThree();

  // Mouse tracking for scatter
  const mouse3D = useRef(new THREE.Vector3(9999, 9999, 0));
  const isHovering = useRef(false);
  const rayPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  // Mouse tracking for rotation parallax
  const mouseRotTarget = useRef({ x: 0, y: 0 });
  const mouseRotCurrent = useRef({ x: 0, y: 0 });

  const count = particles.length;
  const scale = Math.min(viewport.width * 0.7, 10);

  // Original positions (rest state)
  const origPositions = useMemo(() => {
    const orig = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      orig[i * 3] = p.x * scale;
      orig[i * 3 + 1] = p.y * scale;
      orig[i * 3 + 2] = p.z * scale;
    }
    return orig;
  }, [particles, scale, count]);

  // Velocity buffer for scatter physics
  const velocities = useMemo(() => new Float32Array(count * 3).fill(0), [count]);

  // Build geometry + material
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(origPositions);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      alphas[i] = Math.min(p.alpha * 0.9, 0.92);

      if (isDark) {
        // PCD style: uniform white/light cyan dots
        // Slightly vary intensity by brightness for subtle contrast
        const intensity = 0.65 + p.brightness * 0.35;
        colors[i * 3]     = intensity * 0.9;   // R — slightly less for cyan tint
        colors[i * 3 + 1] = intensity * 0.95;  // G
        colors[i * 3 + 2] = intensity;          // B — full
      } else {
        // Light mode: dark dots
        const val = 0.05 + (1 - p.brightness) * 0.35;
        colors[i * 3]     = val;
        colors[i * 3 + 1] = val;
        colors[i * 3 + 2] = val + 0.02;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 1.0 },
      },
      vertexShader: `
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uPixelRatio;
        uniform float uSize;

        void main() {
          vColor = color;
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Uniform small dot size — like PCD viewer
          gl_PointSize = uSize * uPixelRatio * (250.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 5.0);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular dot with crisp edge
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          // Slight softness at the very edge for anti-aliasing
          float aa = 1.0 - smoothstep(0.4, 0.5, d);

          gl_FragColor = vec4(vColor, vAlpha * aa);
        }
      `,
      transparent: true,
      depthWrite: true,
      depthTest: true,
      blending: THREE.NormalBlending,
      vertexColors: true,
    });

    return { geometry: geo, material: mat };
  }, [particles, isDark, count, origPositions]);

  // Pointer events for scatter
  const onPointerMove = useCallback((e) => {
    isHovering.current = true;
    const rect = e.target.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const target = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(rayPlane, target)) {
      mouse3D.current.copy(target);
    }
  }, [raycaster, camera, rayPlane]);

  const onPointerLeave = useCallback(() => {
    isHovering.current = false;
    mouse3D.current.set(9999, 9999, 0);
  }, []);

  // Attach pointer events to the canvas element
  useEffect(() => {
    const el = document.querySelector('.portrait__canvas canvas');
    if (!el) return;
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);
    return () => {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [onPointerMove, onPointerLeave]);

  // Global mouse for rotation parallax
  useEffect(() => {
    const onMove = (e) => {
      mouseRotTarget.current.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
      mouseRotTarget.current.y = -(e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Per-frame: scatter physics + rotation
  useFrame((state, delta) => {
    if (!pointsRef.current || !groupRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position;
    const pos = posAttr.array;
    const dt = Math.min(delta, 0.04);

    const mx = mouse3D.current.x;
    const my = mouse3D.current.y;
    const scatterRadius = 1.8;
    const scatterForce = 28.0;
    const springStrength = 14.0;
    const damping = 0.88;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;

      // Scatter from cursor
      const dx = pos[ix] - mx;
      const dy = pos[iy] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < scatterRadius && isHovering.current) {
        const force = (1 - dist / scatterRadius) * scatterForce;
        const angle = Math.atan2(dy, dx);
        velocities[ix] += Math.cos(angle) * force * dt;
        velocities[iy] += Math.sin(angle) * force * dt;
        velocities[iz] += (Math.random() - 0.5) * force * dt * 1.2;
      }

      // Spring back to rest position
      velocities[ix] += (origPositions[ix] - pos[ix]) * springStrength * dt;
      velocities[iy] += (origPositions[iy] - pos[iy]) * springStrength * dt;
      velocities[iz] += (origPositions[iz] - pos[iz]) * springStrength * dt;

      // Damping
      velocities[ix] *= damping;
      velocities[iy] *= damping;
      velocities[iz] *= damping;

      // Integrate
      pos[ix] += velocities[ix] * dt;
      pos[iy] += velocities[iy] * dt;
      pos[iz] += velocities[iz] * dt;
    }

    posAttr.needsUpdate = true;

    // Smooth rotation parallax — reveals the 3D depth
    const rt = mouseRotTarget.current;
    const rc = mouseRotCurrent.current;
    rc.x += (rt.x - rc.x) * 2.5 * dt;
    rc.y += (rt.y - rc.y) * 2.5 * dt;
    groupRef.current.rotation.y = rc.x;
    groupRef.current.rotation.x = rc.y;

    // Gentle float
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 0.35) * 0.03;
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={geometry} material={material} />
    </group>
  );
}

/* ===== Main Portrait Component ===== */
export default function Portrait() {
  const wrapperRef = useRef(null);
  const [particles, setParticles] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sampled = sampleImagePixels(img);
      setParticles(sampled);
    };
    img.src = profileImg;
  }, []);

  useEffect(() => {
    if (!wrapperRef.current || !particles) return;
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 1.4, ease: 'power3.out', delay: 0.2 }
    );
  }, [particles]);

  return (
    <div className="portrait" ref={wrapperRef}>
      {particles && (
        <Canvas
          className="portrait__canvas"
          camera={{ position: [0, 0, 6], fov: 55 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <PointCloud
            key={theme}
            particles={particles}
            isDark={isDark}
          />
        </Canvas>
      )}
    </div>
  );
}
