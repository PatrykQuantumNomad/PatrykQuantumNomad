/**
 * TerminalPlayer — React island for asciinema-player.
 *
 * Lazy-loaded in MDX via `client:visible` to keep initial bundle small.
 * Mounts the asciinema-player into a container div and handles theme
 * matching, accessibility, and prefers-reduced-motion.
 */
import { useEffect, useRef, useState } from 'react';

interface TerminalPlayerProps {
  src: string;
  cols?: number;
  rows?: number;
  speed?: number;
  idleTimeLimit?: number;
  poster?: string;
  loop?: boolean;
  fit?: 'width' | 'height' | 'both' | 'none';
  transcript?: string;
  ariaLabel?: string;
}

export default function TerminalPlayer({
  src,
  cols = 80,
  rows = 20,
  speed = 1,
  idleTimeLimit = 2,
  poster,
  loop = false,
  fit = 'width',
  transcript,
  ariaLabel,
}: TerminalPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    async function init() {
      const AsciinemaPlayer = await import('asciinema-player');
      // @ts-expect-error - CSS import for side effects
      await import('asciinema-player/dist/bundle/asciinema-player.css');

      if (disposed || !containerRef.current) return;

      // Clear any previous player instance
      containerRef.current.innerHTML = '';

      playerRef.current = AsciinemaPlayer.create(src, containerRef.current, {
        cols,
        rows,
        speed,
        idleTimeLimit,
        poster: poster || 'npt:0:02',
        loop,
        fit,
        // Don't autoplay — especially important for reduced-motion users
        autoPlay: false,
        terminalFontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
        terminalFontSize: '14px',
      });
    }

    init();

    return () => {
      disposed = true;
      if (playerRef.current?.dispose) {
        playerRef.current.dispose();
      }
    };
  }, [src, cols, rows, speed, idleTimeLimit, poster, loop, fit]);

  return (
    <div
      className="terminal-player-wrapper"
      role="region"
      aria-label={ariaLabel || 'Terminal recording'}
    >
      {prefersReducedMotion && (
        <div className="terminal-player-reduced-motion-notice">
          Reduced motion enabled. Click play to start the recording.
        </div>
      )}
      <div
        ref={containerRef}
        className="terminal-player-container"
        style={{
          minHeight: '120px',
        }}
      />
      {transcript && (
        <details className="terminal-player-transcript">
          <summary>View as text (accessible transcript)</summary>
          <pre><code>{transcript}</code></pre>
        </details>
      )}
    </div>
  );
}
