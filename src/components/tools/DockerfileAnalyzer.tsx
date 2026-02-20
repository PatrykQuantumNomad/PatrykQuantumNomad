import EditorPanel from './EditorPanel';
import ResultsPanel from './ResultsPanel';

/**
 * Root React island composing EditorPanel + ResultsPanel in a responsive grid.
 * EDIT-06: grid-cols-1 stacks on mobile, lg:grid-cols-2 goes side-by-side on desktop.
 */
export default function DockerfileAnalyzer() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <div className="min-h-[350px] lg:min-h-[500px]">
        <EditorPanel />
      </div>
      <div className="min-h-[200px] lg:min-h-[500px]">
        <ResultsPanel />
      </div>
    </div>
  );
}
