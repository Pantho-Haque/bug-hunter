import { lazy, Suspense } from 'react';

import { StarterApp } from './starter/StarterApp';

const PhaseTwoLab = import.meta.env.DEV
  ? lazy(() =>
      import('./spikes/PhaseTwoLab').then((module) => ({ default: module.PhaseTwoLab })),
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

  return <StarterApp />;
}