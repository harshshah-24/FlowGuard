import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/editor/contrib/suggest/browser/suggestController';
import 'monaco-editor/editor/contrib/wordHighlighter/browser/wordHighlighter';
import 'monaco-editor/editor/contrib/find/browser/findController';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import { registerLanguage } from './language.js';
let registered=false;
const workers=new Set<Worker>();
self.MonacoEnvironment={getWorker(){const worker=new EditorWorker();workers.add(worker);return worker;}};
export function editorApi(){if(!registered){registerLanguage(monaco);registered=true;}return monaco;}
export function releaseEditorWorkers(){for(const worker of workers)worker.terminate();workers.clear();}
