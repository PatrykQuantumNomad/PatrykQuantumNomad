import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  composeResult,
  composeEditorViewRef,
} from '../../../stores/composeValidatorStore';
import { downloadComposeBadgePng } from '../../../lib/tools/compose-validator/badge-generator';
import {
  buildShareUrl,
  isUrlSafeLength,
} from '../../../lib/tools/compose-validator/url-state';
import { ComposePromptGenerator } from './ComposePromptGenerator';

export function ComposeShareActions() {
  const result = useStore(composeResult);
  const [copied, setCopied] = useState(false);
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (!result || !result.parseSuccess) {
    return null;
  }

  const handleDownloadBadge = async () => {
    setDownloading(true);
    try {
      await downloadComposeBadgePng(result.score);
    } catch (err) {
      console.error('Badge download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const view = composeEditorViewRef.get();
    if (!view) return;
    const content = view.state.doc.toString();
    if (!content.trim()) return;

    const { safe, length } = isUrlSafeLength(content);
    if (!safe) {
      setUrlWarning(
        `URL is ${length.toLocaleString()} chars and may be truncated on some platforms`,
      );
    } else {
      setUrlWarning(null);
    }

    const url = buildShareUrl(content);

    // Tier 1: Web Share API (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Compose Score: ${result.score.grade} (${result.score.overall}/100)`,
          url,
        });
        return;
      } catch (err) {
        // User cancelled; silently return
        if (err instanceof Error && err.name === 'AbortError') return;
        // Other error: fall through to clipboard
      }
    }

    // Tier 2: Clipboard API (desktop)
    try {
      await navigator.clipboard.writeText(url);
      history.replaceState(null, '', url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      // Clipboard unavailable: fall through to prompt
    }

    // Tier 3: Prompt fallback
    prompt('Copy this URL:', url);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
      <button
        onClick={handleDownloadBadge}
        disabled={downloading}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all
          bg-[var(--color-accent)] text-white
          hover:brightness-110 hover:shadow-lg
          active:brightness-95
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {downloading ? 'Saving...' : 'Download Badge'}
      </button>

      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all
          border border-[var(--color-border)] bg-transparent
          hover:bg-white/5
          active:bg-white/10
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {copied ? 'Copied!' : 'Share Link'}
      </button>

      <ComposePromptGenerator />

      {urlWarning && (
        <p className="w-full text-xs text-amber-400 mt-1">{urlWarning}</p>
      )}
    </div>
  );
}
