'use client';
import {useEffect,useRef,useState} from 'react';
import {Store} from '@/types';
import {StoreThemeId,ThemeCustomization} from '@/lib/store-themes';
interface Props{store:Store;previewTheme:StoreThemeId;previewCustomization:ThemeCustomization;mode:'mobile'|'desktop';onClose?:()=>void;}
/** Real iframe viewports exercise the same CSS/media queries as a customer browser. */
export default function StorePreviewFrame({store,previewTheme,previewCustomization,mode,onClose}:Props){
 const host=useRef<HTMLDivElement>(null),frame=useRef<HTMLIFrameElement>(null),[size,setSize]=useState({width:390,height:600});
 const latest=useRef({previewTheme,previewCustomization,onClose});latest.current={previewTheme,previewCustomization,onClose};
 const width=mode==='desktop'?1280:Math.min(390,Math.max(200,Math.floor(size.width))),scale=Math.min(1,size.width/width),height=Math.max(220,Math.floor(size.height/scale));
 function send(){frame.current?.contentWindow?.postMessage({type:'watsstore:preview-design',theme:latest.current.previewTheme,customization:latest.current.previewCustomization},location.origin);}
 useEffect(()=>{const node=host.current;if(!node)return;const observer=new ResizeObserver(entries=>{const rect=entries[0].contentRect;setSize({width:Math.max(1,rect.width),height:Math.max(1,rect.height)})});observer.observe(node);return()=>observer.disconnect()},[]);
 useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;if(event.data?.type==='watsstore:preview-ready')send();if(event.data?.type==='watsstore:preview-close')latest.current.onClose?.()};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[]);
 useEffect(()=>send(),[previewTheme,previewCustomization]);
 return <div ref={host} data-testid="store-preview-frame" data-preview-width={width} style={{position:'relative',width:'100%',height:'100%',minHeight:220,overflow:'hidden',direction:'ltr'}}><iframe ref={frame} title="معاينة المتجر / Store preview" src={`/theme-preview/${encodeURIComponent(store.slug)}?embed=1&theme=${previewTheme}`} onLoad={send} sandbox="allow-scripts allow-same-origin" style={{position:'absolute',top:0,left:0,width,height,border:0,transform:`scale(${scale})`,transformOrigin:'top left',background:'white'}}/></div>;
}
