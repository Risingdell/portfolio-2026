import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import '../styles/Playground.css';

const ANIMATIONS = ['Idle', 'Run'];

/* ===== Rigged stickman — drag to rotate, buttons switch animation ===== */
function StickmanModel({ currentAnim }) {
  // public/ assets are served verbatim at the site root — a plain path
  // string, not an import (unlike src/assets, which go through Vite's
  // asset pipeline and need to be imported to get a resolved URL).
  const gltf = useLoader(GLTFLoader, '/stickman.glb');
  const { gl } = useThree();
  const groupRef = useRef();
  const mixerRef = useRef(null);
  const actionsRef = useRef({});
  const dragRef = useRef({ dragging: false, lastX: 0 });

  const scene = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.4 / maxDim;
    gltf.scene.scale.setScalar(scale);
    gltf.scene.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale
    );

    return gltf.scene;
  }, [gltf]);

  // Build the mixer + actions once per loaded model.
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(scene);
    const actions = {};
    ANIMATIONS.forEach((name) => {
      const clip = gltf.animations.find((c) => c.name === name);
      if (clip) actions[name] = mixer.clipAction(clip);
    });
    mixerRef.current = mixer;
    actionsRef.current = actions;
    actions[currentAnim]?.play();

    return () => mixer.stopAllAction();
    // currentAnim intentionally excluded — the switch effect below handles it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, gltf.animations]);

  // Cross-fade whenever the selected animation changes.
  useEffect(() => {
    const actions = actionsRef.current;
    const next = actions[currentAnim];
    if (!next) return;

    next.reset().fadeIn(0.3).play();
    return () => next.fadeOut(0.3);
  }, [currentAnim]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  const onPointerDown = useCallback((e) => {
    e.stopPropagation();
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    gl.domElement.setPointerCapture?.(e.pointerId);
  }, [gl]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging || !groupRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - dragRef.current.lastX;
    dragRef.current.lastX = e.clientX;
    groupRef.current.rotation.y += dx * 0.01;
  }, []);

  const onPointerUp = useCallback((e) => {
    dragRef.current.dragging = false;
    gl.domElement.releasePointerCapture?.(e.pointerId);
  }, [gl]);

  return (
    <group
      ref={groupRef}
      position={[0, -1.1, 0]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <primitive object={scene} />
      {/* Invisible hit-cylinder — the figure's own limbs are too thin/irregular
          to grab reliably, so drag input is captured across a generous area. */}
      <mesh visible={false} position={[0, 1, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 2.4, 12]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

export default function Playground() {
  const [currentAnim, setCurrentAnim] = useState('Idle');

  return (
    <div className="playground-panel">
      <div className="playground-panel__content">
        <span className="playground-panel__label">PLAYGROUND</span>
        <h2 className="playground-panel__title">3D Playground</h2>
        <p className="playground-panel__subtitle">
          Drag to rotate the model, and switch between animations below.
        </p>

        <div className="playground-panel__stage">
          <Canvas
            camera={{ position: [0, 0.3, 4.5], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
              // Without calling preventDefault() here, a lost WebGL context
              // is treated as permanent — the browser never fires
              // 'webglcontextrestored' and the canvas stays blank forever.
              gl.domElement.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
              });
            }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 4, 5]} intensity={1.3} />
            <directionalLight position={[-3, 2, -4]} intensity={0.4} color="#00dcff" />
            <StickmanModel currentAnim={currentAnim} />
          </Canvas>
        </div>

        <div className="playground-panel__controls" role="group" aria-label="Animation controls">
          {ANIMATIONS.map((name) => (
            <button
              key={name}
              type="button"
              className="playground-panel__btn"
              aria-pressed={currentAnim === name}
              onClick={() => setCurrentAnim(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
