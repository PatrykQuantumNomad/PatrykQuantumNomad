import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

declare global {
  interface Window {
    __heroScrollProgress?: number;
  }
}

// Global mouse position normalized to -1..1, tracked across the whole page
const globalMouse = { x: 0, y: 0 };

function HeadModel() {
  const { scene } = useGLTF('/head-opt.glb');
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!groupRef.current) return;

    const scrollProgress = window.__heroScrollProgress ?? 0;

    // Slow auto-rotation + amplified mouse offset
    const autoY = state.clock.elapsedTime * 0.15;
    targetRotation.current.y = autoY + globalMouse.x * 1.2;
    targetRotation.current.x = globalMouse.y * -0.6 + scrollProgress * 0.4;

    // Smooth damping
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.12;
    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.12;

    // Idle floating
    groupRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.015;
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function SceneReady() {
  useEffect(() => {
    const fallback = document.getElementById('head-fallback');
    if (fallback) fallback.style.opacity = '0';
  }, []);
  return null;
}

export default function HeadScene() {
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const isMobile = window.innerWidth < 768;
    setDpr(isMobile ? Math.min(pixelRatio, 1.5) : pixelRatio);

    // Track mouse globally across the whole page
    const onMove = (e: MouseEvent) => {
      globalMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      globalMouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.8 }}
      camera={{ position: [0, 0.2, 2.2], fov: 35 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={1.2} color="#fff5ee" />
      <directionalLight position={[3, 4, 5]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-2, 3, 1]} intensity={1.0} color="#c44b20" />
      <directionalLight position={[-1, -1, 3]} intensity={0.6} color="#006d6d" />
      <HeadModel />
      <SceneReady />
    </Canvas>
  );
}

useGLTF.preload('/head-opt.glb');
