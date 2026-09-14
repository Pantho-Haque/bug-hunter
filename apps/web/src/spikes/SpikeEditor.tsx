import {
  autocompletion,
  type CompletionContext,
} from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxTree } from '@codemirror/language';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

interface SpikeEditorProps {
  onChange: (source: string) => void;
  source: string;
}

const apiCompletions = [
  {
    apply: 'moveForward();',
    detail: 'Move the avatar forward one grid cell',
    label: 'moveForward',
    type: 'function',
  },
  {
    apply: 'console.log();',
    detail: 'Print a value to the safe output list',
    label: 'console.log',
    type: 'function',
  },
];

function completeGameApi(context: CompletionContext) {
  const word = context.matchBefore(/[\w.]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return { from: word.from, options: apiCompletions };
}

const syntaxLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name === '⚠') {
        diagnostics.push({
          from: node.from,
          message: 'JavaScript syntax is incomplete near this point.',
          severity: 'error',
          to: Math.max(node.from, node.to),
        });
      }
    });
  return diagnostics;
});

export function SpikeEditor({ onChange, source }: SpikeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: source,
        extensions: [
          basicSetup,
          javascript(),
          autocompletion({ override: [completeGameApi] }),
          syntaxLinter,
          lintGutter(),
          EditorView.lineWrapping,
          EditorView.theme({
            '&': {
              backgroundColor: '#07152f',
              color: '#eef7ff',
              height: '100%',
            },
            '.cm-content': {
              caretColor: '#ffe166',
              fontFamily: 'ui-monospace, monospace',
            },
            '.cm-cursor': { borderLeftColor: '#ffe166' },
            '.cm-gutters': {
              backgroundColor: '#0b1c38',
              border: 'none',
              color: '#83a2c8',
            },
            '.cm-activeLine': { backgroundColor: '#17396688' },
            '.cm-activeLineGutter': { backgroundColor: '#173966' },
            '.cm-scroller': {
              fontSize: '0.9rem',
              lineHeight: '1.65',
              overflow: 'auto',
            },
            '&.cm-focused': {
              outline: '3px solid #ffe166',
              outlineOffset: '2px',
            },
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged)
              onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;

    return () => {
      viewRef.current = null;
      view.destroy();
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === source) return;
    view.dispatch({
      changes: { from: 0, insert: source, to: view.state.doc.length },
    });
  }, [source]);

  return (
    <div
      aria-label="Phase 2 JavaScript editor"
      className="spike-editor"
      ref={hostRef}
    />
  );
}
