import { useEffect, useReducer, useRef, useState } from 'react';
import { initialWorkspace, workspaceReducer } from './reducer.js';
import { readSourceFile } from '../adapters/files.js';
import { downloadSource } from '../adapters/downloads.js';
export function useWorkspace(){
 const [state,dispatch]=useReducer(workspaceReducer,initialWorkspace),current=useRef(state),loadId=useRef(0);current.current=state;
 const [fileLoading,setFileLoading]=useState(false);
 const notice=(error:unknown)=>dispatch({type:'EXPORT_ERROR',message:error instanceof Error?error.message:'Operation failed. Please try again.'});
 const loadFile=async(file:File)=>{
  const id=++loadId.current,revision=current.current.revision;setFileLoading(true);
  try{const replacement=await readSourceFile(file);if(id!==loadId.current)return;if(current.current.revision!==revision){dispatch({type:'EXPORT_ERROR',message:'Draft changed while reading. Select the file again to load it.'});return;}dispatch({type:'REQUEST_REPLACEMENT',...replacement});}catch(error){if(id===loadId.current)notice(error);}finally{if(id===loadId.current)setFileLoading(false);}
 };
 const save=(replace=false)=>{const captured=current.current;try{downloadSource(captured.source,captured.filename);if(replace)dispatch({type:'CONFIRM_SAVE_REPLACE'});else dispatch({type:'SOURCE_SAVED',revision:captured.revision});dispatch({type:'EXPORT_SUCCESS'});}catch(error){notice(error);}};
 const replace=(source:string,filename:string)=>{++loadId.current;setFileLoading(false);dispatch({type:'REQUEST_REPLACEMENT',source,filename});};
 useEffect(()=>{const handler=(event:BeforeUnloadEvent)=>{if(current.current.dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',handler);return ()=>window.removeEventListener('beforeunload',handler);},[]);
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape'){if(current.current.pendingReplacement)dispatch({type:'CANCEL_REPLACEMENT'});else dispatch({type:'SET_PANEL',panel:'workspace'});}if((event.ctrlKey||event.metaKey)&&event.key==='Enter')event.preventDefault();};window.addEventListener('keydown',handler);return ()=>window.removeEventListener('keydown',handler);},[]);
 return {state,dispatch,loadFile,save,replace,fileLoading};
}
