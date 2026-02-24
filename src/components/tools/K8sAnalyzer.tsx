import { useState } from 'react';
import K8sEditorPanel from './K8sEditorPanel';
import K8sResultsPanel from './K8sResultsPanel';

export default function K8sAnalyzer() {
  const [fullscreen, setFullscreen] = useState<'editor' | 'results' | null>(null);

  const toggleFullscreen = (panel: 'editor' | 'results') =>
    setFullscreen((prev) => (prev === panel ? null : panel));

  return (
    <div className={`grid grid-cols-1 ${fullscreen ? '' : 'lg:grid-cols-2'} gap-4 lg:gap-6`}>
      <div className={fullscreen === 'results' ? 'hidden' : ''}>
        <K8sEditorPanel
          onToggleFullscreen={() => toggleFullscreen('editor')}
          isFullscreen={fullscreen === 'editor'}
        />
      </div>
      <div className={fullscreen === 'editor' ? 'hidden' : ''}>
        <K8sResultsPanel
          onToggleFullscreen={() => toggleFullscreen('results')}
          isFullscreen={fullscreen === 'results'}
        />
      </div>
    </div>
  );
}
