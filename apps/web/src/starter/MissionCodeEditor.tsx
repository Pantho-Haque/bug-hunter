import {
  autocompletion,
  type Completion,
  type CompletionContext,
} from '@codemirror/autocomplete';
import '@fontsource/fira-code/latin-400.css';
import '@fontsource/fira-code/latin-500.css';
import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
// minimalSetup carries history + the default/history keymaps, so undo, redo,
// and Enter behave the way a child expects. basicSetup would also add gutters
// and a second autocompletion source that fights the mission command list.
import { minimalSetup } from 'codemirror';
import { useEffect, useMemo, useRef } from 'react';

interface MissionCodeEditorProps {
  readonly source: string;
  readonly commands: readonly string[];
  readonly predicates: readonly string[];
  readonly onChange: (source: string) => void;
  readonly label: string;
}

const javascriptKeywords: readonly Completion[] = [
  { label: 'const', type: 'keyword' },
  { label: 'let', type: 'keyword' },
  { label: 'if', type: 'keyword' },
  { label: 'else', type: 'keyword' },
  { label: 'for', type: 'keyword' },
  { label: 'while', type: 'keyword' },
];

const draculaTheme = EditorView.theme({
  '&': {
    backgroundColor: '#282a36',
    color: '#f8f8f2',
    height: '100%',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': {
    caretColor: '#50fa7b',
    fontFamily: '"Fira Code", "Cascadia Code", ui-monospace, monospace',
    fontSize: '0.94rem',
    lineHeight: '1.75',
    padding: '16px 20px',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#50fa7b' },
  '.cm-selectionBackground, ::selection': { backgroundColor: '#44475a !important' },
  '.cm-activeLine': { backgroundColor: '#303241' },
  '.cm-scroller': { fontFamily: '"Fira Code", "Cascadia Code", ui-monospace, monospace', overflow: 'auto' },
  '.cm-gutters': { display: 'none' },
  '.cm-tooltip-autocomplete': {
    backgroundColor: '#282a36',
    border: '1px solid #6272a4',
    color: '#f8f8f2',
    fontFamily: '"Fira Code", "Cascadia Code", ui-monospace, monospace',
  },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#44475a', color: '#50fa7b' },
  '.cm-completionLabel': { color: '#8be9fd' },
  '.cm-completionDetail': { color: '#bd93f9' },
});

export function MissionCodeEditor({
  source,
  commands,
  predicates,
  onChange,
  label,
}: MissionCodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const completions = useMemo<readonly Completion[]>(
    () => [
      ...commands.map((command) => ({
        apply: `${command}();`,
        detail: 'Mission command',
        label: command,
        type: 'function' as const,
      })),
      // A predicate is used inside a condition, so it completes without the
      // trailing semicolon a command gets.
      ...predicates.map((predicate) => ({
        apply: `${predicate}()`,
        detail: 'Question: yes or no',
        label: predicate,
        type: 'function' as const,
      })),
      ...javascriptKeywords,
    ],
    [commands, predicates],
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) return;

    const completeMissionCode = (context: CompletionContext) => {
      const word = context.matchBefore(/[\w.]*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;
      return { from: word.from, options: completions };
    };
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: source,
        extensions: [
          minimalSetup,
          javascript(),
          // The accessible name has to sit on CodeMirror's contenteditable,
          // which is the element carrying role="textbox"; on the wrapper div it
          // is both unnamed and a prohibited attribute.
          EditorView.contentAttributes.of({ 'aria-label': label }),
          autocompletion({ activateOnTyping: true, override: [completeMissionCode] }),
          EditorView.lineWrapping,
          draculaTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;

    return () => {
      viewRef.current = null;
      view.destroy();
    };
  }, [completions, label]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === source) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: source } });
  }, [source]);

  return <div className="mission-code-editor" ref={hostRef} />;
}
