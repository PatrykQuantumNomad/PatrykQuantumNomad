import { useState } from 'react';
import EditorPanel from './EditorPanel';
import ResultsPanel from './ResultsPanel';

export default function DockerfileAnalyzer() {
  const [fullscreen, setFullscreen] = useState<'editor' | 'results' | null>(null);

  const toggleFullscreen = (panel: 'editor' | 'results') =>
    setFullscreen((prev) => (prev === panel ? null : panel));

  return (
    <div className={`grid grid-cols-1 ${fullscreen ? '' : 'lg:grid-cols-2'} gap-4 lg:gap-6`}>
      <div className={fullscreen === 'results' ? 'hidden' : ''}>
        <EditorPanel
          onToggleFullscreen={() => toggleFullscreen('editor')}
          isFullscreen={fullscreen === 'editor'}
        />
      </div>
      <div className={fullscreen === 'editor' ? 'hidden' : ''}>
        <ResultsPanel
          onToggleFullscreen={() => toggleFullscreen('results')}
          isFullscreen={fullscreen === 'results'}
        />
      </div>
    </div>
  );
}
