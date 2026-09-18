import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  snippetCompletion,
  type Completion,
  type CompletionContext,
} from '@codemirror/autocomplete';
import '@fontsource/fira-code/latin-400.css';
import '@fontsource/fira-code/latin-500.css';
import { javascript } from '@codemirror/lang-javascript';
import {
  bracketMatching,
  defaultHighlightStyle,
  ensureSyntaxTree,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
  syntaxTree,
} from '@codemirror/language';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  type Panel,
  showPanel,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
// minimalSetup is kept on purpose: it is the only installed source of history
// plus the default/history keymaps (@codemirror/commands is not a direct
// dependency), and it never binds Tab, so Tab stays a focus key. Everything
// else below is added explicitly.
import { minimalSetup } from 'codemirror';
import { useEffect, useMemo, useRef } from 'react';

interface MissionCodeEditorProps {
  readonly source: string;
  readonly commands: readonly string[];
  readonly predicates: readonly string[];
  readonly onChange: (source: string) => void;
  readonly label: string;
}

const monospace = '"Fira Code", "Cascadia Code", ui-monospace, monospace';

// Field order: `${}` is where the cursor lands after the named fields.
const snippets: readonly Completion[] = [
  snippetCompletion('for (let i = 0; i < ${times}; i++) {\n\t${}\n}', {
    detail: 'Repeat a set number of times',
    label: 'for',
    type: 'keyword',
  }),
  snippetCompletion('while (${condition}) {\n\t${}\n}', {
    detail: 'Keep going while something is true',
    label: 'while',
    type: 'keyword',
  }),
  snippetCompletion('if (${condition}) {\n\t${}\n}', {
    detail: 'Only do this when something is true',
    label: 'if',
    type: 'keyword',
  }),
  snippetCompletion('if (${condition}) {\n\t${}\n} else {\n\t${}\n}', {
    detail: 'Do one thing, or else another',
    label: 'if / else',
    type: 'keyword',
  }),
  snippetCompletion('function ${name}() {\n\t${}\n}', {
    detail: 'Make your own command',
    label: 'function',
    type: 'keyword',
  }),
  snippetCompletion('const ${name} = ${value};', {
    detail: 'Remember a value that never changes',
    label: 'const',
    type: 'keyword',
  }),
  snippetCompletion('let ${name} = ${value};', {
    detail: 'Remember a value you can change',
    label: 'let',
    type: 'keyword',
  }),
];

// @lezer/highlight is not resolvable from this package (pnpm keeps it private
// to @codemirror/language), so the Tag objects are recovered by name from the
// default style's specs instead of imported.
const tagsByName = new Map(
  defaultHighlightStyle.specs
    .flatMap((spec) => spec.tag)
    .flatMap((tag) => tag.set)
    .map((tag) => [String(tag), tag] as const),
);
const tag = (name: string) => {
  const found = tagsByName.get(name);
  if (!found) throw new Error(`Unknown highlight tag: ${name}`);
  return found;
};

const draculaHighlight = HighlightStyle.define([
  { tag: tag('keyword'), color: '#ff79c6' },
  // Numbers are literals; strings are matched by their own rule first.
  { tag: [tag('atom'), tag('literal')], color: '#bd93f9' },
  { tag: tag('string'), color: '#f1fa8c' },
  { tag: tag('comment'), color: '#6272a4', fontStyle: 'italic' },
  { tag: tag('propertyName'), color: '#8be9fd' },
  { tag: [tag('typeName'), tag('className')], color: '#8be9fd', fontStyle: 'italic' },
  { tag: tag('invalid'), color: '#ff5555' },
]);

// `function(variableName)` and `operator` tags are not reachable through the
// specs above, so called functions and operators are marked from the syntax
// tree by node name instead.
const callMark = Decoration.mark({ class: 'cm-mission-call' });
const operatorMark = Decoration.mark({ class: 'cm-mission-operator' });
const isOperator = /Op$|^Equals$|^Arrow$/;

function markCallsAndOperators(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        const parent = node.node.parent?.name;
        if (
          (node.name === 'VariableName' && parent === 'CallExpression') ||
          (node.name === 'VariableDefinition' && parent === 'FunctionDeclaration')
        ) {
          builder.add(node.from, node.to, callMark);
        } else if (isOperator.test(node.name)) {
          builder.add(node.from, node.to, operatorMark);
        }
      },
    });
  }
  return builder.finish();
}

const extraHighlights = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = markCallsAndOperators(view);
    }
    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.state) !== syntaxTree(update.startState)
      ) {
        this.decorations = markCallsAndOperators(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

// Lezer keeps parsing past mistakes and marks each one with an error node.
// A zero-width node means a token is missing; a wider one is text the parser
// could not place.
const friendlyDiagnostics = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  const tree = ensureSyntaxTree(view.state, view.state.doc.length, 200) ?? syntaxTree(view.state);
  tree.cursor().iterate((node) => {
    if (!node.type.isError) return;
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: 'error',
      message:
        node.from === node.to
          ? 'Something is missing here — maybe a ) or a ; ?'
          : 'I am not sure what this part means — check the spelling and the brackets.',
    });
  });
  return diagnostics;
});

const statusLine = showPanel.of((view): Panel => {
  const dom = document.createElement('div');
  dom.className = 'cm-mission-status';
  const render = (state: EditorState) => {
    const line = state.doc.lineAt(state.selection.main.head).number;
    dom.textContent = `Line ${line} · ${state.doc.lines} lines`;
  };
  render(view.state);
  return {
    dom,
    update: (update) => {
      if (update.docChanged || update.selectionSet) render(update.state);
    },
  };
});

const draculaTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#282a36',
      color: '#f8f8f2',
      height: '100%',
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-content': {
      caretColor: '#50fa7b',
      fontFamily: monospace,
      fontSize: '0.94rem',
      lineHeight: '1.75',
      padding: '16px 20px 16px 8px',
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#50fa7b', borderLeftWidth: '2px' },
    '.cm-selectionBackground, ::selection': { backgroundColor: '#44475a !important' },
    '.cm-activeLine': { backgroundColor: '#303241' },
    '.cm-scroller': { fontFamily: monospace, overflow: 'auto' },
    '.cm-gutters': {
      backgroundColor: '#282a36',
      borderRight: '1px solid #343746',
      color: '#6272a4',
      paddingLeft: '8px',
    },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '2.5ch', padding: '0 6px 0 0' },
    '.cm-activeLineGutter': { backgroundColor: '#303241', color: '#f8f8f2' },
    '.cm-gutter-lint': { width: '14px' },
    '.cm-lint-marker-error': {
      content: '""',
      background: '#ff5555',
      borderRadius: '50%',
      height: '8px',
      width: '8px',
      marginTop: '9px',
    },
    '.cm-lintRange-error': {
      backgroundImage: 'none',
      borderBottom: '2px wavy #ff5555',
      textDecoration: 'underline wavy #ff5555',
      textUnderlineOffset: '3px',
    },
    '.cm-diagnostic-error': { borderLeftColor: '#ff5555' },
    '.cm-tooltip': {
      backgroundColor: '#282a36',
      border: '1px solid #6272a4',
      borderRadius: '6px',
      color: '#f8f8f2',
      fontFamily: monospace,
    },
    '.cm-tooltip .cm-diagnostic': { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif', padding: '6px 10px' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#44475a', color: '#50fa7b' },
    '.cm-completionLabel': { color: '#8be9fd' },
    '.cm-completionDetail': { color: '#bd93f9', marginLeft: '0.75ch' },
    '.cm-matchingBracket': { backgroundColor: '#44475a', outline: '1px solid #bd93f9' },
    '.cm-nonmatchingBracket': { color: '#ff5555' },
    '.cm-mission-call': { color: '#50fa7b' },
    '.cm-mission-operator': { color: '#ff79c6' },
    '.cm-snippetField': { backgroundColor: '#44475a', outline: '1px dashed #bd93f9' },
    '.cm-panels': { backgroundColor: '#21222c', color: '#6272a4' },
    '.cm-panels-bottom': { borderTop: '1px solid #343746' },
    '.cm-mission-status': { fontFamily: monospace, fontSize: '0.75rem', padding: '3px 12px', textAlign: 'right' , color: '#aab6da' },
  },
  { dark: true },
);

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
      // boost keeps mission commands above predicates, and both above snippets.
      ...commands.map((command) => ({
        apply: `${command}();`,
        boost: 2,
        detail: 'Mission command',
        label: command,
        type: 'function' as const,
      })),
      // A predicate is used inside a condition, so it completes without the
      // trailing semicolon a command gets.
      ...predicates.map((predicate) => ({
        apply: `${predicate}()`,
        boost: 1,
        detail: 'Question: yes or no',
        label: predicate,
        type: 'function' as const,
      })),
      ...snippets,
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
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          dropCursor(),
          bracketMatching(),
          closeBrackets(),
          keymap.of(closeBracketsKeymap),
          indentOnInput(),
          syntaxHighlighting(draculaHighlight),
          extraHighlights,
          friendlyDiagnostics,
          lintGutter(),
          statusLine,
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
