import { useEffect, useRef } from 'react';
export function ReplaceSourceDialog({filename,onSave,onDiscard,onCancel}:{filename:string;onSave:()=>void;onDiscard:()=>void;onCancel:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),cancel=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current!.showModal();cancel.current?.focus();return ()=>{dialog.current?.close();if(previous?.isConnected)previous.focus();};},[]);
 return <dialog ref={dialog} aria-labelledby="replace-title" onCancel={event=>{event.preventDefault();onCancel();}}><h2 id="replace-title">Replace unsaved source?</h2><p>Loading {filename} replaces your current draft. Saving starts a browser download; it cannot confirm the file was written to disk.</p><div className="dialog-actions"><button onClick={onSave}>Save and replace</button><button onClick={onDiscard}>Discard and replace</button><button ref={cancel} onClick={onCancel}>Cancel</button></div></dialog>;
}
