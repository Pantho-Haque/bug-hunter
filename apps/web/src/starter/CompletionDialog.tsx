import { useEffect, useRef } from 'react';

export interface CompletionDialogProps {
  readonly open: boolean;
  readonly agentName: string;
  readonly missionTitle: string;
  readonly rewards: readonly string[];
  readonly reflectionQuestion?: string;
  readonly nextMissionTitle?: string;
  readonly onNext?: () => void;
  readonly onReplay: () => void;
  readonly onMap: () => void;
  readonly onClose: () => void;
}

/**
 * The celebration when a goal lights up. It opens a beat after the beacon so
 * the child sees it glow, and leads with the one thing they most want next.
 */
export function CompletionDialog({
  open,
  agentName,
  missionTitle,
  rewards,
  reflectionQuestion,
  nextMissionTitle,
  onNext,
  onReplay,
  onMap,
  onClose,
}: CompletionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="completion-title"
      className="settings-dialog completion-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="settings-dialog__content completion-dialog__content">
        <div aria-hidden="true" className="confetti">
          {Array.from({ length: 18 }, (_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}
        </div>
        <p className="eyebrow">Mission complete</p>
        <h2 id="completion-title">
          <span aria-hidden="true">🎉</span> Well done, {agentName} made it!
        </h2>
        <p className="completion-dialog__mission">{missionTitle}</p>
        {rewards.length > 0 ? (
          <p className="completion-dialog__reward">
            <span aria-hidden="true">★</span> You earned {rewards.join(', ')}.
          </p>
        ) : null}
        {reflectionQuestion ? (
          <p className="completion-dialog__reflection">{reflectionQuestion}</p>
        ) : null}
        <div className="completion-dialog__actions">
          {nextMissionTitle && onNext ? (
            <button className="primary-button" onClick={onNext} type="button">
              Next mission: {nextMissionTitle} <span aria-hidden="true">→</span>
            </button>
          ) : (
            <p className="completion-dialog__finale">
              You finished every mission. You are a coder now.
            </p>
          )}
          <button className="secondary-button" onClick={onReplay} type="button">
            Play this one again
          </button>
          <button className="text-button" onClick={onMap} type="button">
            Back to the map
          </button>
        </div>
      </div>
    </dialog>
  );
}
