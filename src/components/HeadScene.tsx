import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

declare global {
  interface Window {
    __heroScrollProgress?: number;
  }
}

// ─── GLOBAL MOUSE (tracked across the whole page) ──────────────────────────────
const globalMouse = { x: 0, y: 0 };

// ─── FALLING OBJECT TYPES ─────────────────────────────────────────────────────
type FallingObjectType =
  | 'kubernetes' | 'docker' | 'terraform' | 'python'
  | 'react' | 'typescript' | 'golang' | 'rust'
  | 'aws' | 'git' | 'linux' | 'redis';

const FALLING_OBJECT_SEQUENCE: FallingObjectType[] = [
  'kubernetes', 'docker', 'terraform', 'python',
  'react', 'typescript', 'golang', 'rust',
  'aws', 'git', 'linux', 'redis',
];

const TECH_PAIN_PHRASES: Record<FallingObjectType, string[]> = {
  kubernetes: [
    'YAML trauma!',
    'CrashLoopBackOff!',
    'OOMKilled again!',
    'Pod evicted!',
    'Helm chart hell!',
  ],
  docker: [
    'Works on my machine!',
    'Layer cache miss!',
    'Dangling images!',
    'Port conflict!',
    'Build context too large!',
  ],
  terraform: [
    'State file locked!',
    'Drift detected!',
    'Destroy confirmed!',
    'Provider mismatch!',
    'Cycle detected!',
  ],
  python: [
    'IndentationError!',
    'Pip broke again!',
    'GIL says no!',
    'Venv not found!',
    'Dependency conflict!',
  ],
  react: [
    'Too many re-renders!',
    'Hook order violated!',
    'Prop drilling pain!',
    'useEffect loop!',
    'Hydration mismatch!',
  ],
  typescript: [
    'Type gymnastics!',
    'any any any!',
    'Generics inception!',
    'Cannot assign to never!',
    'Declaration file missing!',
  ],
  golang: [
    'if err != nil!',
    'Nil pointer panic!',
    'Goroutine leak!',
    'Channel deadlock!',
    'No generics... wait!',
  ],
  rust: [
    'Borrow checker wins!',
    'Lifetime spaghetti!',
    'Unsafe block regret!',
    'Cargo build forever!',
    'Move semantics pain!',
  ],
  aws: [
    'Bill shock incoming!',
    'IAM policy denied!',
    'Region mismatch!',
    'Lambda cold start!',
    'S3 bucket public!',
  ],
  git: [
    'Merge conflict!',
    'Detached HEAD!',
    'Force push regret!',
    'Rebase gone wrong!',
    'Lost commits!',
  ],
  linux: [
    'Permission denied!',
    'Segfault core dump!',
    'rm -rf oops!',
    'Kernel panic!',
    'Dependency hell!',
  ],
  redis: [
    'Memory maxed out!',
    'Key evicted!',
    'Cache stampede!',
    'Pub/Sub lost msg!',
    'Cluster slot error!',
  ],
};

// ─── TECHNOLOGY LOGO BADGES ───────────────────────────────────────────────────
const TECH_BADGE_CONFIG: Record<FallingObjectType, { name: string; short: string; color: string }> = {
  kubernetes: { name: 'Kubernetes', short: 'K8s', color: '#326CE5' },
  docker: { name: 'Docker', short: 'DKR', color: '#2496ED' },
  terraform: { name: 'Terraform', short: 'TF', color: '#7B42BC' },
  python: { name: 'Python', short: 'PY', color: '#3776AB' },
  react: { name: 'React', short: 'JSX', color: '#61DAFB' },
  typescript: { name: 'TypeScript', short: 'TS', color: '#3178C6' },
  golang: { name: 'Go', short: 'GO', color: '#00ADD8' },
  rust: { name: 'Rust', short: 'RS', color: '#CE422B' },
  aws: { name: 'AWS', short: 'AWS', color: '#FF9900' },
  git: { name: 'Git', short: 'GIT', color: '#F05032' },
  linux: { name: 'Linux', short: 'LNX', color: '#FCC624' },
  redis: { name: 'Redis', short: 'RDS', color: '#DC382D' },
};

function makeBadgeTexture(text: string, short: string, accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Card background
  ctx.fillStyle = 'rgba(16, 18, 24, 0.94)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top accent strip
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, canvas.width, 50);

  // Faux "logo mark"
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(100, 195, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f1117';
  ctx.font = '700 42px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(short, 100, 196);

  // Main technology name
  ctx.fillStyle = '#f6f8ff';
  ctx.font = '700 54px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, 180, 175);

  ctx.fillStyle = 'rgba(220, 226, 255, 0.82)';
  ctx.font = '500 30px system-ui, sans-serif';
  ctx.fillText('tech bonk', 180, 230);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function TechBadgeMesh({ type }: { type: FallingObjectType }) {
  const cfg = TECH_BADGE_CONFIG[type];

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return makeBadgeTexture(cfg.name, cfg.short, cfg.color);
  }, [cfg.color, cfg.name, cfg.short]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return (
    <group>
      <mesh>
        <planeGeometry args={[0.82, 0.52]} />
        <meshBasicMaterial
          map={texture ?? undefined}
          color={texture ? '#ffffff' : cfg.color}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[0.86, 0.56]} />
        <meshStandardMaterial color="#0a0d12" roughness={0.8} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── SINGLE FALLING OBJECT (animated) ─────────────────────────────────────────
function FallingObject({
  type,
  active,
  onImpact,
}: {
  type: FallingObjectType;
  active: boolean;
  onImpact: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const impacted = useRef(false);
  const offsetX = useRef(0);

  useEffect(() => {
    if (!active) return;
    progress.current = 0;
    impacted.current = false;
    offsetX.current = (Math.random() - 0.5) * 0.25;
    if (ref.current) {
      ref.current.visible = true;
      ref.current.scale.set(1, 1, 1);
      ref.current.rotation.set(0, 0, 0);
    }
  }, [active]);

  useFrame((_, delta) => {
    if (!ref.current || !active) return;
    progress.current += delta;
    const t = progress.current;

    // Phase 1: falling (slower for visibility)
    const fallDuration = 1.15;
    const impactDuration = 0.25;
    const bounceDuration = 1.6;

    if (t < fallDuration) {
      // Quadratic ease-in for gravity feel
      const p = t / fallDuration;
      const eased = p * p;
      const startY = 2.0;
      const endY = 0.52;  // keep badge clearly above/over face
      ref.current.position.y = THREE.MathUtils.lerp(startY, endY, eased);
      ref.current.position.x = offsetX.current;
      ref.current.position.z = 0.45; // keep in front of head mesh
      // Tumble while falling
      ref.current.rotation.z += delta * 0.9;
      ref.current.rotation.x += delta * 0.6;
    }
    // Phase 2: impact squish
    else if (t < fallDuration + impactDuration) {
      if (!impacted.current) {
        impacted.current = true;
        onImpact();
      }
      const s = (t - fallDuration) / impactDuration;
      // Squash vertically, stretch horizontally
      ref.current.scale.y = THREE.MathUtils.lerp(1, 0.6, s);
      ref.current.scale.x = THREE.MathUtils.lerp(1, 1.25, s);
      ref.current.scale.z = THREE.MathUtils.lerp(1, 1.25, s);
      ref.current.position.y = 0.52 - s * 0.05;
      ref.current.position.z = 0.45;
    }
    // Phase 3: bounce off (longer and smoother)
    else if (t < fallDuration + impactDuration + bounceDuration) {
      const bounceT = (t - fallDuration - impactDuration) / bounceDuration;
      // Unsquish
      const unsquish = Math.min(bounceT * 2.2, 1);
      ref.current.scale.y = THREE.MathUtils.lerp(0.6, 1, unsquish);
      ref.current.scale.x = THREE.MathUtils.lerp(1.25, 1, unsquish);
      ref.current.scale.z = THREE.MathUtils.lerp(1.25, 1, unsquish);
      // Arc away — parabolic trajectory
      const bounceDir = offsetX.current > 0 ? 1 : -1;
      ref.current.position.x = offsetX.current + bounceDir * bounceT * 1.25;
      ref.current.position.y = 0.48 + bounceT * 1.0 - bounceT * bounceT * 3.0;
      ref.current.position.z = 0.45 + bounceT * 0.3;
      // Tumble wildly
      ref.current.rotation.z += delta * 2.4 * bounceDir;
      ref.current.rotation.x += delta * 1.8;
    }
    // Phase 4: gone
    else {
      ref.current.visible = false;
    }
  });

  return (
    <group ref={ref} visible={false}>
      <TechBadgeMesh type={type} />
    </group>
  );
}

// ─── BONK TEXT (floating impact text) ─────────────────────────────────────────
function BonkText({ text, active }: { text: string; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      timer.current = 0;
      setVisible(true);
    }
  }, [active]);

  useFrame((_, delta) => {
    if (!visible) return;
    timer.current += delta;
    if (timer.current > 1.5) setVisible(false);
  });

  if (!visible) return null;

  return (
    <Html position={[0, -0.5, 0]} center>
      <div
        ref={ref}
        style={{
          fontSize: text.length > 16 ? '18px' : '24px',
          fontWeight: 900,
          fontFamily: 'var(--font-mono, monospace)',
          color: '#ff3d3d',
          textShadow: '2px 2px 0 #000, -1px -1px 0 #000',
          WebkitTextStroke: '1px #000',
          pointerEvents: 'none',
          userSelect: 'none',
          animation: 'bonkPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </Html>
  );
}

// ─── IMPACT STARS (cartoon star burst on impact) ──────────────────────────────
const STAR_COUNT = 6;

function ImpactStars({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const timer = useRef(0);
  const activeRef = useRef(false);

  const starData = useMemo(() =>
    Array.from({ length: STAR_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      speed: 1.5 + Math.random() * 2,
      size: 0.02 + Math.random() * 0.025,
      yOff: (Math.random() - 0.5) * 0.3,
    })), []);

  useEffect(() => {
    if (active) {
      timer.current = 0;
      activeRef.current = true;
    }
  }, [active]);

  useFrame((_, delta) => {
    if (!ref.current || !activeRef.current) return;
    timer.current += delta;
    if (timer.current > 0.8) {
      activeRef.current = false;
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    const t = timer.current;
    ref.current.children.forEach((child, i) => {
      const d = starData[i];
      const dist = t * d.speed;
      child.position.x = Math.cos(d.angle) * dist;
      child.position.y = 0.35 + Math.sin(d.angle) * dist * 0.6 + d.yOff * t;
      child.position.z = 0.4;
      child.rotation.z += delta * 12;
      const fade = Math.max(0, 1 - t / 0.8);
      const s = d.size * (1 + t * 2) * fade;
      child.scale.set(s * 10, s * 10, 1);
    });
  });

  return (
    <group ref={ref} visible={false}>
      {starData.map((d, i) => (
        <mesh key={i}>
          <circleGeometry args={[0.1, 4]} />
          <meshBasicMaterial color="#ffdd00" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ─── FALLING OBJECTS CONTROLLER ───────────────────────────────────────────────
function FallingObjects({
  active,
  onImpact,
}: {
  active: boolean;
  onImpact: (word: string) => void;
}) {
  type LandedBadge = { id: number; type: FallingObjectType; x: number; rot: number; scale: number; z: number };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [objectActive, setObjectActive] = useState(false);
  const [starsActive, setStarsActive] = useState(false);
  const [bonkText, setBonkText] = useState('');
  const [bonkTextActive, setBonkTextActive] = useState(false);
  const [landedBadges, setLandedBadges] = useState<LandedBadge[]>([]);
  const sequenceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const landedId = useRef(0);

  useEffect(() => {
    if (!active) {
      setObjectActive(false);
      return;
    }
    // Pick a random object from the sequence
    const idx = Math.floor(Math.random() * FALLING_OBJECT_SEQUENCE.length);
    setCurrentIndex(idx);
    setObjectActive(true);
  }, [active]);

  const handleImpact = useCallback(() => {
    const type = FALLING_OBJECT_SEQUENCE[currentIndex];
    const phrases = TECH_PAIN_PHRASES[type];
    const word = phrases[Math.floor(Math.random() * phrases.length)];
    setBonkText(word);
    setBonkTextActive(false);
    setTimeout(() => setBonkTextActive(true), 10);
    setStarsActive(false);
    setTimeout(() => setStarsActive(true), 10);
    onImpact(word);
    setLandedBadges((prev) => {
      const next: LandedBadge = {
        id: landedId.current++,
        type,
        x: (Math.random() - 0.5) * 1.35,
        rot: (Math.random() - 0.5) * 0.55,
        scale: 0.56 + Math.random() * 0.14,
        z: (Math.random() - 0.5) * 0.08,
      };
      return [...prev, next].slice(-12);
    });

    // Reset after animation completes
    clearTimeout(sequenceTimer.current);
    sequenceTimer.current = setTimeout(() => {
      setObjectActive(false);
    }, 3600);
  }, [currentIndex, onImpact]);

  useEffect(() => {
    return () => clearTimeout(sequenceTimer.current);
  }, []);

  const objectType = FALLING_OBJECT_SEQUENCE[currentIndex];

  return (
    <>
      <FallingObject
        type={objectType}
        active={objectActive}
        onImpact={handleImpact}
      />
      <group position={[0, -1.35, 0.35]}>
        {landedBadges.map((badge, i) => {
          const row = Math.floor(i / 6);
          const rowOffset = row * 0.17;
          return (
            <group
              key={badge.id}
              position={[
                badge.x,
                rowOffset,
                badge.z - row * 0.02,
              ]}
              rotation={[0, 0, badge.rot]}
              scale={[badge.scale, badge.scale, badge.scale]}
            >
              <TechBadgeMesh type={badge.type} />
            </group>
          );
        })}
      </group>
      <ImpactStars active={starsActive} />
      <BonkText text={bonkText} active={bonkTextActive} />
    </>
  );
}

// ─── MAIN HEAD MODEL ───────────────────────────────────────────────────────────
function HeadModel() {
  const { scene } = useGLTF('/head-opt.glb');
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  const [bonkActive, setBonkActive] = useState(false);

  // Wobble from clicks / bonk
  const wobble = useRef({ x: 0, y: 0 });
  const spinImpulse = useRef(0);

  // Head dip for bonk impacts
  const headDip = useRef(0);

  const bonkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleClick = useCallback(() => {
    // Add spin + wobble impulse
    spinImpulse.current += 6;
    wobble.current = { x: 0.12, y: 0.08 };

    // Trigger falling object
    setBonkActive(false);
    setTimeout(() => setBonkActive(true), 10);
    clearTimeout(bonkTimer.current);
    bonkTimer.current = setTimeout(() => setBonkActive(false), 3500);
  }, []);

  const handleBonkImpact = useCallback((_word: string) => {
    // Head dips down and wobbles on bonk impact
    headDip.current = 0.15;
    wobble.current = { x: 0.4, y: 0.2 };
    spinImpulse.current += 3;
  }, []);

  useEffect(() => {
    return () => clearTimeout(bonkTimer.current);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const scrollProgress = window.__heroScrollProgress ?? 0;
    const t = state.clock.elapsedTime;

    // ── Original: slow auto-rotation + amplified mouse offset ──
    const autoY = t * 0.15;
    targetRotation.current.y = autoY + globalMouse.x * 1.2;
    targetRotation.current.x = globalMouse.y * -0.6 + scrollProgress * 0.4;

    // ── Spin impulse decay (from clicks) ──
    if (Math.abs(spinImpulse.current) > 0.01) {
      targetRotation.current.y += spinImpulse.current * 0.016;
      spinImpulse.current *= 0.93;
    }

    // ── Wobble decay (from clicks / bonk) ──
    wobble.current.x *= 0.95;
    wobble.current.y *= 0.95;

    // ── Head dip recovery (from bonk impact) ──
    headDip.current *= 0.92;

    // ── Smooth damping (original) ──
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.12;
    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.12;

    // ── Add wobble on top ──
    groupRef.current.rotation.y += Math.sin(t * 10) * wobble.current.y;
    groupRef.current.rotation.x += Math.sin(t * 8)  * wobble.current.x;

    // ── Idle floating (shifted down) + bonk dip ──
    groupRef.current.position.y = -0.40 + Math.sin(t * 0.5) * 0.015 - headDip.current;
  });

  return (
    <>
      <group
        ref={groupRef}
        position={[0, -0.55, 0]}
        onClick={handleClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <primitive object={scene} />
      </group>

      <FallingObjects active={bonkActive} onImpact={handleBonkImpact} />
    </>
  );
}

// ─── SCENE READY (fades out fallback image) ────────────────────────────────────
function SceneReady() {
  useEffect(() => {
    const fallback = document.getElementById('head-fallback');
    if (fallback) fallback.style.opacity = '0';
  }, []);
  return null;
}

// ─── MAIN EXPORTED COMPONENT ───────────────────────────────────────────────────
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
    <>
      <style>{`
        @keyframes headEggFadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bonkPop { 0% { transform: scale(0) rotate(-15deg); opacity:0 } 50% { transform: scale(1.3) rotate(5deg); opacity:1 } 100% { transform: scale(1) rotate(0deg); opacity:1 } }
      `}</style>
      <Canvas
        dpr={dpr}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.8 }}
        camera={{ position: [0, 0, 2.9], fov: 40 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.2} color="#fff5ee" />
        <directionalLight position={[3, 4, 5]}   intensity={2.5} color="#ffffff" />
        <directionalLight position={[-2, 3, 1]}   intensity={1.0} color="#c44b20" />
        <directionalLight position={[-1, -1, 3]}  intensity={0.6} color="#006d6d" />
        <HeadModel />
        <SceneReady />
      </Canvas>
    </>
  );
}

useGLTF.preload('/head-opt.glb');