import { useRef, useMemo, useCallback } from 'react';
import { useLoader, useThree, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { prefersReducedMotion } from '../utils/motion';
import spaceModelUrl from '../assets/models/space-model.glb';

/**
 * Geode/space model rendered as a second depth layer inside Portrait's
 * shared canvas (see Portrait.jsx). Two independent <Canvas> elements each
 * opening their own WebGL context reliably triggered "Context Lost" —
 * one shared context is both the fix and the more honest depth composition.
 */
export default function SpaceModel() {
  const gltf = useLoader(GLTFLoader, spaceModelUrl);
  const { gl, viewport } = useThree();
  const groupRef = useRef();
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const velocityRef = useRef({ x: 0, y: 0.08 });
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);

  // Same formula Portrait.jsx's PointCloud uses for its own scale — deriving
  // the geode's size/depth as a fraction of it (rather than fixed constants)
  // keeps the geode → occluder → portrait depth ordering correct at any
  // viewport size instead of just the one it was tuned against.
  const portraitScale = Math.min(viewport.width * 0.7, 10);
  const geodeRadius = portraitScale * 0.65;
  const geodeZ = -(portraitScale * 0.6);

  // The source asset is a 50k-vertex colored point cloud (glTF primitive mode
  // POINTS, KHR_materials_unlit) — a photogrammetry-style scan, not a solid
  // mesh. Rebuild it as THREE.Points with an explicit vertex-colored material
  // rather than trusting the loader's default point material/size.
  const points = useMemo(() => {
    let sourcePoints = null;
    gltf.scene.traverse((obj) => {
      if (obj.isPoints && !sourcePoints) sourcePoints = obj;
    });
    if (!sourcePoints) {
      console.warn('SpaceModel: no THREE.Points found in space-model.glb — nothing to render.');
      return null;
    }

    const geometry = sourcePoints.geometry.clone();

    // This is a raw photogrammetry-style scan: a handful of stray outlier
    // points sit far from the main cluster (confirmed via debug — the AABB
    // was wildly asymmetric), which inflated a naive bounding-box/sphere
    // normalization and left the visually-dense core tiny on screen. Instead,
    // scale from the centroid using a percentile distance so the dense
    // cluster reaches the target size and outliers become sparse wisps.
    const pos = geometry.attributes.position.array;
    const count = geometry.attributes.position.count;
    const centroid = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      centroid.x += pos[i * 3];
      centroid.y += pos[i * 3 + 1];
      centroid.z += pos[i * 3 + 2];
    }
    centroid.divideScalar(count);

    const distances = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const dx = pos[i * 3] - centroid.x;
      const dy = pos[i * 3 + 1] - centroid.y;
      const dz = pos[i * 3 + 2] - centroid.z;
      distances[i] = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    const sorted = Array.from(distances).sort((a, b) => a - b);
    const p90Distance = sorted[Math.floor(count * 0.9)] || 1;

    const scale = geodeRadius / p90Distance;
    geometry.translate(-centroid.x, -centroid.y, -centroid.z);
    geometry.scale(scale, scale, scale);

    geometry.computeBoundingSphere();

    // THREE.PointsMaterial's gl_PointSize scaling proved unreliable in testing
    // (the WebGL spec only guarantees point size 1 — anything larger is
    // best-effort and was getting silently clamped near-invisible). Portrait's
    // own point cloud sidesteps this with a custom shader; do the same here.

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute vec4 color;
        varying vec4 vColor;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uPixelRatio * (280.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 6.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec4 vColor;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float aa = 1.0 - smoothstep(0.4, 0.5, d);
          gl_FragColor = vec4(vColor.rgb, vColor.a * aa * 0.8);
        }
      `,
      transparent: true,
      depthWrite: true,
      depthTest: true,
    });

    return new THREE.Points(geometry, material);
  }, [gltf, geodeRadius]);

  const onPointerDown = useCallback((e) => {
    e.stopPropagation();
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    gl.domElement.setPointerCapture?.(e.pointerId);
  }, [gl]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    e.stopPropagation();
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    velocityRef.current.x = dy * 0.006;
    velocityRef.current.y = dx * 0.006;
  }, []);

  const onPointerUp = useCallback((e) => {
    dragRef.current.dragging = false;
    gl.domElement.releasePointerCapture?.(e.pointerId);
  }, [gl]);

  useFrame(() => {
    if (!groupRef.current) return;
    if (reduceMotion) return;

    if (!dragRef.current.dragging) {
      // Settle toward a gentle idle spin once released
      velocityRef.current.x += (0 - velocityRef.current.x) * 0.05;
      velocityRef.current.y += (0.08 - velocityRef.current.y) * 0.02;
    }

    groupRef.current.rotation.x += velocityRef.current.x * 0.05;
    groupRef.current.rotation.y += velocityRef.current.y * 0.05;
  });

  return (
    <group
      ref={groupRef}
      position={[0, 0, geodeZ]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {points && <primitive object={points} />}
      {/* Invisible hit-sphere — the geode's own geometry is too irregular to
          grab reliably, so drag input is captured across a generous radius. */}
      <mesh visible={false}>
        <sphereGeometry args={[geodeRadius * 1.5, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
