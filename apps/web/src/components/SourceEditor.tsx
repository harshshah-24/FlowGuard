import { useEffect, useRef, useState } from 'react';
import type * as Monaco from 'monaco-editor';
import type { Diagnostic } from '@flowguard/core';
import { editorApi, releaseEditorWorkers } from '../editor/monaco.js';
import { applyEditorChanges, markerData } from '../editor/text.js';
export function SourceEditor({source,onChange,diagnostics=[]}:{source:string;onChange:(source:string)=>void;diagnostics?:readonly Diagnostic[]}){
 const container=useRef<HTMLDivElement>(null),editor=useRef<Monaco.editor.IStandaloneCodeEditor|null>(null),raw=useRef(source),callback=useRef(onChange),updating=useRef(false);const [failure,setFailure]=useState<string|null>(null);
 callback.current=onChange;
 useEffect(()=>{
  let instance:Monaco.editor.IStandaloneCodeEditor|undefined,model:Monaco.editor.ITextModel|undefined,listener:Monaco.IDisposable|undefined;
  try{const api=editorApi();model=api.editor.createModel(raw.current,'flowguard');instance=api.editor.create(container.current!,{model,theme:'vs-dark',automaticLayout:true,minimap:{enabled:false},fontSize:13,lineNumbers:'on',wordWrap:'on',ariaLabel:'Write a FlowGuard program',scrollBeyondLastLine:false,tabSize:2,accessibilitySupport:'on',unicodeHighlight:{ambiguousCharacters:false,invisibleCharacters:false},renderValidationDecorations:'on'});editor.current=instance;
   listener=model.onDidChangeContent(event=>{if(updating.current)return;const next=applyEditorChanges(raw.current,event.changes);raw.current=next;callback.current(next);});
  }catch{setFailure('Editor could not load. You can continue editing in the text area.');}
  return ()=>{listener?.dispose();instance?.dispose();model?.dispose();editor.current=null;releaseEditorWorkers();};
 },[]);
 useEffect(()=>{if(raw.current!==source){raw.current=source;const model=editor.current?.getModel();if(model){updating.current=true;try{model.setValue(source);}finally{updating.current=false;}}}},[source]);
 useEffect(()=>{const model=editor.current?.getModel();if(model)editorApi().editor.setModelMarkers(model,'flowguard',markerData(diagnostics,source));},[source,diagnostics]);
 return <><div className="source-editor" ref={container} hidden={failure!==null}/>{failure&&<><p role="alert">{failure}</p><textarea aria-label="Write a FlowGuard program" value={source} onChange={e=>onChange(e.target.value)}/></>}</>;
}
