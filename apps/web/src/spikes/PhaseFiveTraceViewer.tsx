import { useMemo, useState } from 'react';

import { contentRegistry, m01FirstSteps } from '@codequest/content';
import {
  createSnapshotStore,
  replayCommands,
  validateMissionObjectives,
  type CommandInput,
  type RunTrace,
} from '@codequest/simulation';

import './phaseFive.css';

interface ReplayBundle {
  readonly label: string;
  readonly source: string;
  readonly commands: readonly CommandInput[];
}

const KNOWN_SCRIPT_STRAIGHT = `moveForward();
moveForward();
moveForward();`;

const KNOWN_SCRIPT_FAN = `turnLeft();
moveForward();
turnRight();
moveForward();
turnRight();
moveForward();
moveForward();`;

const KNOWN_SCRIPT_FAILURE_TOO_FEW = `moveForward();`;

const KNOWN_SCRIPT_FAILURE_WRONG_FACING = `turnRight();
moveForward();`;

const KNOWN_SCRIPT_FAILURE_RUNAWAY = `while (true) { moveForward(); }`;

const buildCommands = (source: string): CommandInput[] => {
  const lines = source.split('\n').filter((line) => line.trim().length > 0);
  let counter = 0;
  const commands: CommandInput[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('//')) continue;
    const count = (line.match(/moveForward|turnLeft|turnRight|collect|interact/g) ?? []).length;
    for (let i = 0; i < count; i++) {
      counter += 1;
      const kindMatch = /moveForward|turnLeft|turnRight|collect|interact/.exec(line);
      const kind = (kindMatch?.[0] ?? 'moveForward') as CommandInput['kind'];
      commands.push({ commandId: `c-${counter}`, sourceLine: counter, kind });
    }
  }
  return commands;
};

const REPLAYS: readonly ReplayBundle[] = [
  { label: 'sol-m01-straight', source: KNOWN_SCRIPT_STRAIGHT, commands: buildCommands(KNOWN_SCRIPT_STRAIGHT) },
  { label: 'sol-m01-fan', source: KNOWN_SCRIPT_FAN, commands: buildCommands(KNOWN_SCRIPT_FAN) },
  { label: 'fixture-too-few', source: KNOWN_SCRIPT_FAILURE_TOO_FEW, commands: buildCommands(KNOWN_SCRIPT_FAILURE_TOO_FEW) },
  { label: 'fixture-wrong-facing', source: KNOWN_SCRIPT_FAILURE_WRONG_FACING, commands: buildCommands(KNOWN_SCRIPT_FAILURE_WRONG_FACING) },
  { label: 'fixture-runaway-loop', source: KNOWN_SCRIPT_FAILURE_RUNAWAY, commands: buildCommands(KNOWN_SCRIPT_FAILURE_RUNAWAY) },
];

export function PhaseFiveTraceViewer() {
  const [selected, setSelected] = useState<string>(REPLAYS[0].label);
  const replay = useMemo(
    () => REPLAYS.find((bundle) => bundle.label === selected) ?? REPLAYS[0],
    [selected],
  );

  const store = useMemo(() => {
    const snapshot = createSnapshotStore({ mission: m01FirstSteps });
    for (const command of replay.commands) {
      snapshot.push(command);
    }
    return snapshot;
  }, [replay]);

  const replayResult = useMemo(() => {
    const result = replayCommands(m01FirstSteps, replay.commands, { maxSteps: 64 });
    return result;
  }, [replay]);

  const objective = useMemo(
    () => validateMissionObjectives(m01FirstSteps, replayResult.finalState),
    [replayResult],
  );

  const registryEntry = useMemo(
    () => contentRegistry.getMission('m01' as never),
    [],
  );

  return (
    <div className="phase-five-viewer">
      <header className="phase-five-header">
        <h1>Phase 5 — Headless Trace Viewer</h1>
        <p>
          Mission <code>m01</code> ({m01FirstSteps.identity.title}) — replays run through the deterministic
          simulation reducer. The renderer is intentionally absent.
        </p>
      </header>

      <section className="phase-five-controls">
        <label htmlFor="replay-select">Replay bundle</label>
        <select
          id="replay-select"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {REPLAYS.map((bundle) => (
            <option key={bundle.label} value={bundle.label}>
              {bundle.label}
            </option>
          ))}
        </select>
        <pre className="phase-five-script">{replay.source}</pre>
      </section>

      <section className="phase-five-summary">
        <div>
          <span className="phase-five-label">Applied</span>
          <span className="phase-five-value">{replayResult.appliedCount}</span>
        </div>
        <div>
          <span className="phase-five-label">Rejected</span>
          <span className="phase-five-value">{replayResult.rejectedCount}</span>
        </div>
        <div>
          <span className="phase-five-label">Truncated</span>
          <span className="phase-five-value">{String(replayResult.truncated)}</span>
        </div>
        <div>
          <span className="phase-five-label">Objectives OK</span>
          <span className={`phase-five-value ${objective.ok ? 'ok' : 'fail'}`}>
            {String(objective.ok)}
          </span>
        </div>
      </section>

      <section className="phase-five-trace">
        <h2>Trace</h2>
        <ol>
          {store.traces().map((trace, index) => (
            <TraceRow key={`${trace.command.commandId}-${index}`} trace={trace} />
          ))}
        </ol>
      </section>

      <section className="phase-five-objectives">
        <h2>Objective issues</h2>
        {objective.issues.length === 0 ? (
          <p>No issues — every invariant passes.</p>
        ) : (
          <ul>
            {objective.issues.map((issue, index) => (
              <li key={`${issue.path}-${index}`}>
                <code>{issue.code}</code> at <code>{issue.path}</code>: {issue.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="phase-five-meta">
        <h2>Registry</h2>
        <p>
          contentRegistry.getMission(&apos;m01&apos;) returned{' '}
          <code>{registryEntry ? 'a MissionPackageSchema' : 'undefined'}</code>.
        </p>
      </section>
    </div>
  );
}

interface TraceRowProps {
  readonly trace: RunTrace;
}

function TraceRow({ trace }: TraceRowProps) {
  const before = trace.stateBefore.avatar;
  const after = trace.stateAfter.avatar;
  const reason = trace.event.type === 'commandApplied' ? trace.event.reasonKey : trace.event.reasonKey;
  return (
    <li className={`phase-five-row ${trace.applied ? 'applied' : 'rejected'}`}>
      <span className="phase-five-row-line">L{trace.command.sourceLine}</span>
      <span className="phase-five-row-kind">{trace.command.kind}</span>
      <span className="phase-five-row-cells">
        ({before.cellX},{before.cellZ},{before.facing[0]!}) → ({after.cellX},{after.cellZ},{after.facing[0]!})
      </span>
      <span className="phase-five-row-reason">{reason}</span>
      <span className="phase-five-row-status">{trace.applied ? 'applied' : 'rejected'}</span>
    </li>
  );
}