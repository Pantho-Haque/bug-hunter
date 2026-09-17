import { useEffect, useRef } from 'react';

export interface OnboardingDialogProps {
  readonly open: boolean;
  readonly agentName: string;
  readonly onStart: () => void;
  readonly onSkip: () => void;
}

const steps: readonly { readonly title: string; readonly body: string }[] = [
  { title: 'You write the code', body: 'Type commands like moveForward() and press Run. Your code moves the character.' },
  { title: 'Watch what happens', body: 'The world shows every command in order. Pause or Step to take it one command at a time.' },
  { title: 'Try again as often as you like', body: 'Nothing breaks. Reset scene puts the world back, Reset code puts your code back.' },
];

/**
 * Shown once, before a child has played anything. It teaches the three things
 * a first-time player has to believe: you are in control, the world shows your
 * code, and mistakes are free.
 */
export function OnboardingDialog({ open, agentName, onStart, onSkip }: OnboardingDialogProps) {
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
      aria-labelledby="onboarding-title"
      className="settings-dialog onboarding-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onSkip();
      }}
    >
      <div className="settings-dialog__content">
        <header className="settings-dialog__header">
          <div>
            <p className="eyebrow">Welcome</p>
            <h2 id="onboarding-title">Hello! I am {agentName}.</h2>
          </div>
        </header>
        <p className="onboarding-dialog__lead">
          You are going to write real JavaScript to move {agentName} through the Spark Isles. Here
          is everything you need to know.
        </p>
        <ol className="onboarding-steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span aria-hidden="true">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="onboarding-dialog__actions">
          <button className="primary-button" onClick={onStart} type="button">
            Start the first mission
          </button>
          <button className="text-button" onClick={onSkip} type="button">
            Look at the map first
          </button>
        </div>
      </div>
    </dialog>
  );
}
