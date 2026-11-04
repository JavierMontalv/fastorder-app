import {useEffect,useRef} from 'react';
export default function useDialogFocus(open,selector,onClose){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{if(!open)return;const previous=document.activeElement;const root=document.querySelector(selector);if(!root)return;const controls=()=>[...root.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);controls()[0]?.focus();const handler=e=>{if(e.key==='Escape'){e.preventDefault();close.current?.();}if(e.key==='Tab'){const list=controls(),first=list[0],last=list.at(-1);if(!first)return;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};root.addEventListener('keydown',handler);return()=>{root.removeEventListener('keydown',handler);if(previous?.isConnected)previous.focus();};},[open,selector]);
}
