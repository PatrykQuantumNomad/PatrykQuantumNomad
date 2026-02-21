import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  analysisResult,
  editorViewRef,
} from '../../../stores/dockerfileAnalyzerStore';
import { downloadBadgePng } from '../../../lib/tools/dockerfile-analyzer/badge-generator';
import {
  buildShareUrl,
  isUrlSafeLength,
} from '../../../lib/tools/dockerfile-analyzer/url-state';
import { PromptGenerator } from './PromptGenerator';

export function ShareActions() {
  const result = useStore(analysisResult);
  const [copied, setCopied] = useState(false);
  const [urlWarning, setUrlWarning] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Hide when no result, parse failed, or no violations data
  if (!result || !result.parseSuccess || result.violations === undefined) {
    return null;
  }

  const handleDownloadBadge = async () => {
    setDownloading(true);
    try {
      await downloadBadgePng(result.score);
    } catch (err) {
      console.error('Badge download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    const view = editorViewRef.get();
    if (!view) return;
    const content = view.state.doc.toString();
    if (!content.trim()) return;

    const { safe, length } = isUrlSafeLength(content);
    if (!safe) {
      setUrlWarning(
        `URL is ${length.toLocaleString()} chars \u2014 may be truncated on some platforms`,
      );
    } else {
      setUrlWarning(null);
    }

    const url = buildShareUrl(content);

    try {
      await navigator.clipboard.writeText(url);
      // Update the address bar without triggering navigation
      history.replaceState(null, '', url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard write failed:', err);
    }
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
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {downloading ? 'Saving...' : 'Download Badge'}
      </button>

      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all
          border border-[var(--color-border)] bg-transparent
          hover:bg-white/5
          active:bg-white/10
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {copied ? 'Copied!' : 'Copy Share Link'}
      </button>

      <PromptGenerator />

      {urlWarning && (
        <p className="w-full text-xs text-amber-400 mt-1">{urlWarning}</p>
      )}
    </div>
  );
}
