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
    // The source GLB uses a dark textured material that disappears against the
    // playground surface. Use a bright, double-sided material for this viewer.
    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshStandardMaterial({
        color: 0x58eaff,
        emissive: 0x083d4b,
        emissiveIntensity: 1.4,
        metalness: 0.2,
        roughness: 0.4,
        side: THREE.DoubleSide,
      });
      child.frustumCulled = false;
    });

    // The FBX-exported root already contains the model's orientation and a
    // 100x scale. Cancel that source scale directly and place the rig in the
    // camera view; this avoids mixing world-space bounds with local transforms.
    // setScalar replaces (rather than multiplies) the source 100x scale.
    // A unit-scale rig is therefore the correct visible size here.
    gltf.scene.scale.setScalar(1.2);
    gltf.scene.position.set(0, -1.05, 0);
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
      position={[0, 0, 0]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <primitive object={scene} />
      {/* Invisible hit-cylinder — the figure's own limbs are too thin/irregular
          to grab reliably, so drag input is captured across a generous area. */}
      <mesh visible={false} position={[0, 0, 0]}>
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
            // Keep this secondary viewer lightweight so it can coexist with
            // the hero point-cloud renderer during section transitions.
            gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
            dpr={1}
          >
            <ambientLight intensity={1.8} />
            <directionalLight position={[3, 4, 5]} intensity={2.8} color="#d9fbff" />
            <directionalLight position={[-3, 2, -4]} intensity={1.2} color="#00dcff" />
            <pointLight position={[0, 1, 3]} intensity={8} distance={10} color="#00dcff" />
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
