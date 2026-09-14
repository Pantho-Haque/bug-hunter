import { lazy, Suspense } from 'react';

import { StarterApp } from './starter/StarterApp';

const PhaseTwoLab = import.meta.env.DEV
  ? lazy(() =>
      import('./spikes/PhaseTwoLab').then((module) => ({ default: module.PhaseTwoLab })),
    )
  : null;

const PhaseFiveTraceViewer = import.meta.env.DEV
  ? lazy(() =>
      import('./spikes/PhaseFiveTraceViewer').then((module) => ({
        default: module.PhaseFiveTraceViewer,
      })),
    )
  : null;

export function App() {
  if (PhaseTwoLab && window.location.pathname === '/spikes/phase-2') {
    return (
      <Suspense fallback={<div className="scene-loading">Loading Phase 2 evidence lab…</div>}>
        <PhaseTwoLab />
      </Suspense>
    );
  }

  if (PhaseFiveTraceViewer && window.location.pathname === '/spikes/phase-5') {
    return (
      <Suspense fallback={<div className="scene-loading">Loading Phase 5 trace viewer…</div>}>
        <PhaseFiveTraceViewer />
      </Suspense>
    );
  }

  return <StarterApp />;
}