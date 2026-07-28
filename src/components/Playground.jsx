import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import '../styles/Playground.css';

const ANIMATIONS = ['Idle', 'Run'];

function Rock({ isJumping, onCrash, onPassed }) {
  const rockRef = useRef();
  const xRef = useRef(2.5);
  const crashedRef = useRef(false);

  useFrame((_, delta) => {
    if (!rockRef.current) return;
    xRef.current -= delta * 2.5;
    rockRef.current.position.x = xRef.current;
    rockRef.current.rotation.y += delta * 2.5;

    if (!crashedRef.current && xRef.current < 0.3 && xRef.current > -0.3 && !isJumping) {
      crashedRef.current = true;
      onCrash();
    }

    if (xRef.current < -2.2) onPassed();
  });

  return (
    <mesh ref={rockRef} position={[2.5, -1.0, 0]} castShadow>
      <dodecahedronGeometry args={[0.22, 1]} />
      <meshStandardMaterial
        color="#6f7b86"
        emissive="#101820"
        emissiveIntensity={0.8}
        roughness={0.85}
        metalness={0.1}
      />
    </mesh>
  );
}

/* ===== Rigged stickman — drag to rotate, buttons switch animation ===== */
// A single cinematic projectile drops from directly above the character,
// then hands the impact to the existing crash animation.
function CinematicArrow({ start, onHit }) {
  const arrowRef = useRef();
  const progressRef = useRef(0);
  const hitRef = useRef(false);
  const startVector = useMemo(() => new THREE.Vector3(...start), [start]);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((_, delta) => {
    if (!arrowRef.current) return;
    progressRef.current = Math.min(1, progressRef.current + delta / 0.7);
    const progress = progressRef.current;
    const position = startVector.clone().lerp(origin, progress);
    arrowRef.current.position.copy(position);
    const direction = origin.clone().sub(position).normalize();
    arrowRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    if (progress >= 1 && !hitRef.current) {
      hitRef.current = true;
      onHit();
    }
  });

  return (
    <group ref={arrowRef} position={startVector}>
      <mesh castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.7, 8]} />
        <meshStandardMaterial color="#28d7ff" emissive="#007bba" emissiveIntensity={2.6} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <coneGeometry args={[0.07, 0.18, 4]} />
        <meshStandardMaterial color="#9cf2ff" emissive="#008dcc" emissiveIntensity={2.2} />
      </mesh>
    </group>
  );
}

function StickmanModel({ currentAnim, jumpTrigger, crashed, onJumpStart, onJumpComplete }) {
  // public/ assets are served verbatim at the site root — a plain path
  // string, not an import (unlike src/assets, which go through Vite's
  // asset pipeline and need to be imported to get a resolved URL).
  const gltf = useLoader(GLTFLoader, '/stickman.glb');
  const { gl } = useThree();
  const groupRef = useRef();
  const mixerRef = useRef(null);
  const actionsRef = useRef({});
  const dragRef = useRef({ dragging: false, lastX: 0 });
  const jumpRef = useRef(0);
  const wasJumpingRef = useRef(false);
  const crashTimeRef = useRef(0);

  useEffect(() => {
    if (jumpTrigger > 0 && !crashed) {
      jumpRef.current = 1;
      onJumpStart();
    }
  }, [jumpTrigger, crashed, onJumpStart]);

  useEffect(() => {
    if (crashed) {
      crashTimeRef.current = 0;
      Object.values(actionsRef.current).forEach((action) => action.stop());
    } else {
      groupRef.current?.rotation.set(0, 0, 0);
      groupRef.current?.position.set(0, 0, 0);
      const action = actionsRef.current[currentAnim];
      action?.reset().fadeIn(0.3).play();
    }
  }, [crashed, currentAnim]);

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

  // Attach oversized red glove meshes to the animated hand bones so they
  // follow every pose and animation of the rig.
  useEffect(() => {
    const gloveMaterial = new THREE.MeshStandardMaterial({
      color: 0xe53935,
      emissive: 0x5c0909,
      emissiveIntensity: 0.9,
      roughness: 0.45,
      metalness: 0.05,
    });
    const gloves = [];

    ['mixamorig:LeftHand_011', 'mixamorig:RightHand_015'].forEach((name) => {
      const hand = scene.getObjectByName(name);
      if (!hand) return;
      const glove = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12), gloveMaterial);
      glove.scale.set(1, 1.15, 0.85);
      glove.position.set(0, 3.5, 0);
      hand.add(glove);
      gloves.push(glove);
    });

    return () => {
      gloves.forEach((glove) => {
        glove.parent?.remove(glove);
        glove.geometry.dispose();
      });
      gloveMaterial.dispose();
    };
  }, [scene]);

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
    if (!groupRef.current) return;

    if (crashed) {
      crashTimeRef.current += delta;
      groupRef.current.position.y = -Math.min(0.9, crashTimeRef.current * 1.5);
      groupRef.current.rotation.z = Math.min(Math.PI / 2, crashTimeRef.current * 4.5);
      return;
    }

    mixerRef.current?.update(delta);

    // Rhythmic boxing footwork while standing.
    if (currentAnim === 'Idle' && jumpRef.current === 0) {
      const now = performance.now();
      const footwork = Math.sin(now * 0.004) * 0.08;
      groupRef.current.position.x = footwork;
      groupRef.current.position.y = Math.abs(Math.sin(now * 0.006)) * 0.22;
      groupRef.current.rotation.z = footwork * 0.35;
    } else if (jumpRef.current === 0) {
      groupRef.current.position.x = 0;
      groupRef.current.rotation.z = 0;
    }

    if (jumpRef.current > 0) {
      wasJumpingRef.current = true;
      // Stay airborne long enough for the moving rock to pass underneath.
      jumpRef.current = Math.max(0, jumpRef.current - delta / 1.15);
      groupRef.current.position.y = Math.sin(jumpRef.current * Math.PI) * 0.8;
    } else {
      if (currentAnim !== 'Idle') groupRef.current.position.y = 0;
      if (wasJumpingRef.current) {
        wasJumpingRef.current = false;
        onJumpComplete?.();
      }
    }
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
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 2.4, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function Playground() {
  const [currentAnim, setCurrentAnim] = useState('Idle');
  const [jumpTrigger, setJumpTrigger] = useState(0);
  const [obstacleVisible, setObstacleVisible] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [arrowVisible, setArrowVisible] = useState(false);
  const [arrowStart, setArrowStart] = useState([0, 3.4, 0]);
  const lastTapRef = useRef(0);
  const jumpCountRef = useRef(0);
  const stageRef = useRef(null);

  const handleJumpComplete = useCallback(() => {
    setIsJumping(false);
    setObstacleVisible(false);
  }, []);

  const handleCrash = useCallback(() => {
    setIsJumping(false);
    setCrashed(true);
  }, []);

  const handleArrowHit = useCallback(() => {
    setArrowVisible(false);
    setIsJumping(false);
    setObstacleVisible(false);
    setCrashed(true);
  }, []);

  const handleJumpStart = useCallback(() => {
    setIsJumping(true);
  }, []);

  const triggerJump = useCallback(() => {
    if (crashed) {
      setCrashed(false);
      setObstacleVisible(false);
      jumpCountRef.current = 0;
      setArrowVisible(false);
    }
    jumpCountRef.current = crashed ? 1 : jumpCountRef.current + 1;
    if (jumpCountRef.current > 10) {
      setArrowStart([0, 3.4, 0]);
      setArrowVisible(true);
    }
    setJumpTrigger((value) => value + 1);
  }, [crashed]);

  const handleStagePointerUp = useCallback((event) => {
    // Use pointer capture so taps on the R3F canvas/model are still observed
    // even when a mesh stops propagation for drag-to-rotate.
    if (event.pointerType !== 'touch') return;
    const now = Date.now();
    if (now - lastTapRef.current < 340) triggerJump();
    lastTapRef.current = now;
  }, [triggerJump]);

  useEffect(() => {
    const handleOutsidePointerUp = (event) => {
      if (event.pointerType !== 'touch' || stageRef.current?.contains(event.target)) return;
      const now = Date.now();
      if (now - lastTapRef.current < 340) triggerJump();
      lastTapRef.current = now;
    };

    window.addEventListener('pointerup', handleOutsidePointerUp, true);
    return () => window.removeEventListener('pointerup', handleOutsidePointerUp, true);
  }, [triggerJump]);

  // Runner mode continuously schedules rocks at varied intervals.
  useEffect(() => {
    if (currentAnim !== 'Run' || crashed) return undefined;

    let timeoutId;
    const scheduleRock = () => {
      timeoutId = setTimeout(() => {
        setObstacleVisible(true);
        scheduleRock();
      }, 1800 + Math.random() * 2600);
    };

    scheduleRock();
    return () => clearTimeout(timeoutId);
  }, [currentAnim, crashed]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      triggerJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerJump]);

  return (
    <div className="playground-panel">
      <div className="playground-panel__content">
        <span className="playground-panel__label">PLAYGROUND</span>
        <h2 className="playground-panel__title">3D Playground</h2>
        <p className="playground-panel__subtitle">
          Drag to rotate the model, and switch between animations below.
        </p>

        <div
          ref={stageRef}
          className="playground-panel__stage"
          onPointerUpCapture={handleStagePointerUp}
        >
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
            {obstacleVisible && (
              <Rock
                isJumping={isJumping}
                onCrash={handleCrash}
                onPassed={() => setObstacleVisible(false)}
              />
            )}
            {arrowVisible && <CinematicArrow start={arrowStart} onHit={handleArrowHit} />}
            <StickmanModel
              currentAnim={currentAnim}
              jumpTrigger={jumpTrigger}
              crashed={crashed}
              onJumpStart={handleJumpStart}
              onJumpComplete={handleJumpComplete}
            />
          </Canvas>
        </div>

        <div className="playground-panel__controls" role="group" aria-label="Animation controls">
          {ANIMATIONS.map((name) => (
            <button
              key={name}
              type="button"
              className="playground-panel__btn"
              aria-pressed={currentAnim === name}
              onClick={() => {
                setCurrentAnim(name);
                if (name === 'Idle') {
                  setCrashed(false);
                  setIsJumping(false);
                  jumpCountRef.current = 0;
                  setArrowVisible(false);
                }
                if (name !== 'Run') setObstacleVisible(false);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
