import K8sEditorPanel from './K8sEditorPanel';
import K8sResultsPanel from './K8sResultsPanel';

/**
 * Root React island composing K8sEditorPanel + K8sResultsPanel in a responsive grid.
 * UI-11: grid-cols-1 stacks on mobile, lg:grid-cols-2 goes side-by-side on desktop.
 */
export default function K8sAnalyzer() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <div className="min-h-[350px] lg:min-h-[500px]">
        <K8sEditorPanel />
      </div>
      <div className="min-h-[200px] lg:min-h-[500px]">
        <K8sResultsPanel />
      </div>
    </div>
  );
}
