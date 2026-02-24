import { useState } from 'react';
import ComposeEditorPanel from './ComposeEditorPanel';
import ComposeResultsPanel from './ComposeResultsPanel';

export default function ComposeValidator() {
  const [fullscreen, setFullscreen] = useState<'editor' | 'results' | null>(null);

  const toggleFullscreen = (panel: 'editor' | 'results') =>
    setFullscreen((prev) => (prev === panel ? null : panel));

  return (
    <div className={`grid grid-cols-1 ${fullscreen ? '' : 'lg:grid-cols-2'} gap-4 lg:gap-6`}>
      <div className={fullscreen === 'results' ? 'hidden' : ''}>
        <ComposeEditorPanel
          onToggleFullscreen={() => toggleFullscreen('editor')}
          isFullscreen={fullscreen === 'editor'}
        />
      </div>
      <div className={fullscreen === 'editor' ? 'hidden' : ''}>
        <ComposeResultsPanel
          onToggleFullscreen={() => toggleFullscreen('results')}
          isFullscreen={fullscreen === 'results'}
        />
      </div>
    </div>
  );
}
