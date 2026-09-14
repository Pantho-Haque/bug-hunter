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

const PhaseSixRunnerLab = import.meta.env.DEV
  ? lazy(() =>
      import('./spikes/PhaseSixRunnerLab').then((module) => ({
        default: module.PhaseSixRunnerLab,
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

  if (PhaseSixRunnerLab && window.location.pathname === '/spikes/phase-6') {
    return (
      <Suspense fallback={<div className="scene-loading">Loading Phase 6 runner lab…</div>}>
        <PhaseSixRunnerLab />
      </Suspense>
    );
  }

  return <StarterApp />;
}