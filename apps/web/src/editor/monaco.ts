import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/editor/contrib/suggest/browser/suggestController';
import 'monaco-editor/editor/contrib/wordHighlighter/browser/wordHighlighter';
import 'monaco-editor/editor/contrib/find/browser/findController';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import { registerLanguage } from './language.js';
let registered=false;
const workers=new Set<Worker>();
self.MonacoEnvironment={getWorker(){const worker=new EditorWorker();workers.add(worker);return worker;}};
export function editorApi(){if(!registered){registerLanguage(monaco);monaco.editor.defineTheme('flowguard-dark',{base:'vs-dark',inherit:true,rules:[],colors:{'editor.background':'#131416','editor.foreground':'#f2efdf','editorLineNumber.foreground':'#777973','editorLineNumber.activeForeground':'#48dbc6','editor.lineHighlightBackground':'#1c2729','editor.selectionBackground':'#48dbc635','editor.inactiveSelectionBackground':'#48dbc620','editorCursor.foreground':'#48dbc6','editorWidget.background':'#1b1d1f','editorWidget.border':'#51524b'}});registered=true;}return monaco;}
export function releaseEditorWorkers(){for(const worker of workers)worker.terminate();workers.clear();}
