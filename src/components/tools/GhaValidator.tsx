import { useState } from 'react';
import GhaEditorPanel from './GhaEditorPanel';
import GhaResultsPanel from './GhaResultsPanel';

export default function GhaValidator() {
  const [fullscreen, setFullscreen] = useState<'editor' | 'results' | null>(null);

  const toggleFullscreen = (panel: 'editor' | 'results') =>
    setFullscreen((prev) => (prev === panel ? null : panel));

  return (
    <div className={`grid grid-cols-1 ${fullscreen ? '' : 'lg:grid-cols-2'} gap-4 lg:gap-6`}>
      <div className={fullscreen === 'results' ? 'hidden' : ''}>
        <GhaEditorPanel
          onToggleFullscreen={() => toggleFullscreen('editor')}
          isFullscreen={fullscreen === 'editor'}
        />
      </div>
      <div className={fullscreen === 'editor' ? 'hidden' : ''}>
        <GhaResultsPanel
          onToggleFullscreen={() => toggleFullscreen('results')}
          isFullscreen={fullscreen === 'results'}
        />
      </div>
    </div>
  );
}
