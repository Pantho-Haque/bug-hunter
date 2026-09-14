import { useCallback, useEffect, useRef, useState } from 'react';

import { PhaseTwoArena, type ArenaMetrics } from './PhaseTwoArena';
import { SpikeEditor } from './SpikeEditor';
import {
  clearSpikeDatabase,
  corruptCurrentSnapshot,
  loadSpikeSnapshot,
  saveSpikeSnapshot,
} from './indexedDbSpike';
import { isRunnerResponse, type RunnerRequest } from './runnerProtocol';
import './phaseTwo.css';

const initialSource = `// This runs inside QuickJS, not the browser page.
for (let step = 0; step < 7; step += 1) {
  moveForward();
}
console.log("Route planned");`;

interface RunnerViewState {
  commands: number;
  durationMs: number | null;
  logs: string[];
  message: string;
  state:
    | 'booting'
    | 'cancelled'
    | 'complete'
    | 'fault'
    | 'ready'
    | 'running'
    | 'timeout';
}

const initialRunnerState: RunnerViewState = {
  commands: 0,
  durationMs: null,
  logs: [],
  message: 'Loading the isolated QuickJS runtime…',
  state: 'booting',
};

function useRunnerSpike() {
  const [viewState, setViewState] = useState(initialRunnerState);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const runIdRef = useRef(0);

  const clearRunTimeout = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const createWorker = useCallback(() => {
    clearRunTimeout();
    workerRef.current?.terminate();
    setViewState(initialRunnerState);

    const worker = new Worker(new URL('./runner.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (!isRunnerResponse(event.data)) return;

      if (event.data.type === 'ready') {
        setViewState((current) =>
          current.state === 'booting'
            ? {
                ...current,
                message:
                  'QuickJS is ready. Each Run gets a fresh limited runtime.',
                state: 'ready',
              }
            : current,
        );
        return;
      }

      if (event.data.runId !== runIdRef.current) return;
      clearRunTimeout();

      if (event.data.type === 'fault') {
        const timedOut = event.data.message
          .toLowerCase()
          .includes('interrupted');
        setViewState({
          commands: 0,
          durationMs: event.data.durationMs,
          logs: [],
          message: timedOut
            ? 'The program exceeded its 750 ms budget. The page stayed responsive.'
            : event.data.message,
          state: timedOut ? 'timeout' : 'fault',
        });
        return;
      }

      setViewState({
        commands: event.data.commands.length,
        durationMs: event.data.durationMs,
        logs: event.data.logs,
        message: `Accepted ${event.data.commands.length} command${event.data.commands.length === 1 ? '' : 's'}.`,
        state: 'complete',
      });
    });
    worker.addEventListener('error', () => {
      clearRunTimeout();
      worker.terminate();
      workerRef.current = null;
      setViewState({
        commands: 0,
        durationMs: null,
        logs: [],
        message: 'The worker failed. Restart the runner before trying again.',
        state: 'fault',
      });
    });
    workerRef.current = worker;
  }, [clearRunTimeout]);

  useEffect(() => {
    createWorker();
    return () => {
      clearRunTimeout();
      workerRef.current?.terminate();
    };
  }, [clearRunTimeout, createWorker]);

  const run = useCallback(
    (source: string) => {
      const worker = workerRef.current;
      if (!worker || viewState.state === 'booting') return;

      runIdRef.current += 1;
      const request: RunnerRequest = {
        runId: runIdRef.current,
        source,
        type: 'run',
      };
      setViewState({
        commands: 0,
        durationMs: null,
        logs: [],
        message:
          'Running in the worker with time, memory, stack, and command limits…',
        state: 'running',
      });
      worker.postMessage(request);
      timeoutRef.current = window.setTimeout(() => {
        worker.terminate();
        workerRef.current = null;
        setViewState({
          commands: 0,
          durationMs: 1200,
          logs: [],
          message:
            'The host terminated an unresponsive worker after 1.2 seconds.',
          state: 'timeout',
        });
      }, 1200);
    },
    [viewState.state],
  );

  const cancel = useCallback(() => {
    clearRunTimeout();
    workerRef.current?.terminate();
    workerRef.current = null;
    setViewState({
      commands: 0,
      durationMs: null,
      logs: [],
      message:
        'Run cancelled by terminating its worker. Restart to create a clean worker.',
      state: 'cancelled',
    });
  }, [clearRunTimeout]);

  const canRun =
    workerRef.current !== null &&
    viewState.state !== 'booting' &&
    viewState.state !== 'running';

  return { cancel, canRun, restart: createWorker, run, viewState };
}

export function PhaseTwoLab() {
  const [source, setSource] = useState(initialSource);
  const [arenaRunId, setArenaRunId] = useState(0);
  const [arenaMetrics, setArenaMetrics] = useState<ArenaMetrics | null>(null);
  const [quality, setQuality] = useState<'balanced' | 'low'>('low');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [storageStatus, setStorageStatus] = useState(
    'No storage test has run yet.',
  );
  const runner = useRunnerSpike();

  async function saveSnapshot(simulateQuota = false) {
    try {
      const record = await saveSpikeSnapshot(source, simulateQuota);
      setStorageStatus(
        `Saved version ${record.version} at ${new Date(record.updatedAt).toLocaleTimeString()}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Storage write failed.';
      setStorageStatus(`Write safely failed: ${message}`);
    }
  }

  async function loadSnapshot() {
    try {
      const result = await loadSpikeSnapshot();
      setSource(result.record.source);
      setStorageStatus(
        result.recovered
          ? 'The current record was invalid, so the last valid recovery snapshot was loaded.'
          : 'Loaded the current validated snapshot.',
      );
    } catch (error) {
      setStorageStatus(
        error instanceof Error
          ? error.message
          : 'No valid snapshot could be loaded.',
      );
    }
  }

  async function corruptSnapshot() {
    await corruptCurrentSnapshot();
    setStorageStatus(
      'Inserted a deliberately malformed current record. Select Load to test recovery.',
    );
  }

  async function clearStorage() {
    await clearSpikeDatabase();
    setStorageStatus('Deleted the disposable Phase 2 spike database.');
  }

  function runRouteBenchmark() {
    setArenaMetrics(null);
    setArenaRunId((current) => current + 1);
  }

  return (
    <div className="phase-two-lab">
      <a className="skip-link" href="#phase-two-main">
        Skip to Phase 2 spikes
      </a>
      <header className="phase-two-header">
        <div>
          <p className="eyebrow">Development-only evidence lab</p>
          <h1>Phase 2 proof spikes</h1>
          <p>
            Test risky foundations independently before they become production
            architecture.
          </p>
        </div>
        <a className="secondary-button phase-two-back" href="/">
          Return to starter
        </a>
      </header>

      <main id="phase-two-main" tabIndex={-1}>
        <section
          className="spike-card spike-card--arena"
          aria-labelledby="arena-spike-title"
        >
          <div className="spike-card__heading">
            <div>
              <span className="spike-number">Spike 01</span>
              <h2 id="arena-spike-title">Six by six 3D arena</h2>
              <p>
                Measure a fixed route with one articulated avatar proxy and
                deterministic cell positions.
              </p>
            </div>
            <span className="spike-state">Interactive</span>
          </div>
          <div
            className="spike-toolbar"
            role="group"
            aria-label="Arena benchmark settings"
          >
            <button
              aria-pressed={quality === 'low'}
              onClick={() => setQuality('low')}
              type="button"
            >
              Low quality
            </button>
            <button
              aria-pressed={quality === 'balanced'}
              onClick={() => setQuality('balanced')}
              type="button"
            >
              Balanced quality
            </button>
            <button
              aria-pressed={reducedMotion}
              onClick={() => setReducedMotion((current) => !current)}
              type="button"
            >
              Reduced motion
            </button>
            <button
              className="primary-button"
              onClick={runRouteBenchmark}
              type="button"
            >
              Run fixed route
            </button>
          </div>
          <PhaseTwoArena
            onComplete={setArenaMetrics}
            quality={quality}
            reducedMotion={reducedMotion}
            runId={arenaRunId}
          />
          <div aria-live="polite" className="metric-strip">
            {arenaMetrics ? (
              <>
                <span>
                  <strong>{arenaMetrics.medianFps}</strong> median FPS
                </span>
                <span>
                  <strong>{arenaMetrics.onePercentLowFps}</strong> 1% low FPS
                </span>
                <span>
                  <strong>{arenaMetrics.routeDurationMs} ms</strong> route
                </span>
                <span>
                  <strong>{arenaMetrics.frameCount}</strong> frames sampled
                </span>
              </>
            ) : (
              <span>Run the route to collect an in-browser sample.</span>
            )}
          </div>
        </section>

        <section
          className="spike-grid"
          aria-label="Editor, runner, and persistence spikes"
        >
          <article className="spike-card">
            <div className="spike-card__heading">
              <div>
                <span className="spike-number">Spike 02</span>
                <h2>CodeMirror learning editor</h2>
                <p>
                  Exercise JavaScript highlighting, history, search, brackets,
                  completion, line wrapping, and syntax diagnostics.
                </p>
              </div>
              <span className="spike-state">Live</span>
            </div>
            <SpikeEditor onChange={setSource} source={source} />
            <p className="spike-note">
              Press Ctrl-Space for game API completion. F8 moves to the next
              diagnostic.
            </p>
          </article>

          <article className="spike-card">
            <div className="spike-card__heading">
              <div>
                <span className="spike-number">Spike 03</span>
                <h2>Restricted QuickJS runner</h2>
                <p>
                  Send source into a worker and receive commands out. Each Run
                  uses a fresh memory, stack, time, and command-limited runtime.
                </p>
              </div>
              <span
                className={`spike-state spike-state--${runner.viewState.state}`}
              >
                {runner.viewState.state}
              </span>
            </div>
            <div className="spike-toolbar">
              <button
                className="primary-button"
                disabled={!runner.canRun}
                onClick={() => runner.run(source)}
                type="button"
              >
                Run source
              </button>
              <button
                disabled={runner.viewState.state !== 'running'}
                onClick={runner.cancel}
                type="button"
              >
                Cancel
              </button>
              <button onClick={runner.restart} type="button">
                Fresh worker
              </button>
              <button
                onClick={() => setSource('while (true) {}')}
                type="button"
              >
                Load infinite loop
              </button>
              <button
                onClick={() =>
                  setSource(
                    'console.log(typeof window, typeof fetch, typeof indexedDB);\nmoveForward();',
                  )
                }
                type="button"
              >
                Check blocked globals
              </button>
            </div>
            <div aria-live="polite" className="runner-result">
              <strong>{runner.viewState.message}</strong>
              {runner.viewState.durationMs !== null && (
                <span>
                  {Math.round(runner.viewState.durationMs)} ms evaluation
                </span>
              )}
              {runner.viewState.commands > 0 && (
                <span>
                  {runner.viewState.commands} validated command requests
                </span>
              )}
              {runner.viewState.logs.map((log, index) => (
                <code key={`${index}:${log}`}>{log}</code>
              ))}
            </div>
          </article>

          <article className="spike-card">
            <div className="spike-card__heading">
              <div>
                <span className="spike-number">Spike 04</span>
                <h2>IndexedDB recovery</h2>
                <p>
                  Write a validated current snapshot, retain a recovery copy,
                  reject a quota failure, and recover from malformed data.
                </p>
              </div>
              <span className="spike-state">Local only</span>
            </div>
            <div className="spike-toolbar">
              <button
                className="primary-button"
                onClick={() => saveSnapshot()}
                type="button"
              >
                Save source
              </button>
              <button onClick={loadSnapshot} type="button">
                Load
              </button>
              <button onClick={corruptSnapshot} type="button">
                Corrupt current
              </button>
              <button onClick={() => saveSnapshot(true)} type="button">
                Simulate storage full
              </button>
              <button onClick={clearStorage} type="button">
                Clear spike data
              </button>
            </div>
            <p aria-live="polite" className="storage-result">
              {storageStatus}
            </p>
          </article>
        </section>

        <aside className="spike-disclaimer">
          <strong>Proof boundary</strong>
          <p>
            These experiments produce Phase 2 evidence. They do not define
            production schemas, simulation rules, save records, or mission UI.
          </p>
        </aside>
      </main>
    </div>
  );
}
